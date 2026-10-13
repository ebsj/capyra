"""Private Cloudflare Container job adapter with R2-only persistence."""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import math
import tempfile
from pathlib import Path
from typing import Literal
from urllib.parse import quote

import urllib3
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field, model_validator

from .application import AnalysisApplication, AnalyzeVideoCommand, translate_error
from .errors import InvalidShortVideoUrlError

MAX_SOURCE_BYTES = 200 * 1024 * 1024
ALLOWED_EXTENSIONS = {".mp4", ".mov", ".webm"}

router = APIRouter(prefix="/jobs", tags=["cloudflare-container"])


class AnalysisJobRequest(BaseModel):
    """Small queue job resolved entirely from R2 or an allowlisted public URL."""

    model_config = ConfigDict(extra="forbid")

    analysis_id: str
    source_type: Literal["owned_asset", "public_url_best_effort"]
    source_label: str
    source_object_key: str | None = None
    video_url: str | None = None
    language: str = "pt-BR"
    skills: list[str] = Field(min_length=1, max_length=4)
    catalog_version: str
    intent: str | None = None

    @model_validator(mode="after")
    def validate_source(self) -> "AnalysisJobRequest":
        if bool(self.source_object_key) == bool(self.video_url):
            raise ValueError("Exactly one source_object_key or video_url must be supplied.")
        return self


class AnalysisJobResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    report_object_key: str
    artifact_prefix: str
    artifact_files: list[str]


class BindingObjectStorage:
    """Stream objects through the Worker's private R2 outbound handler."""

    def __init__(self, base_url: str | None = None, pool: urllib3.PoolManager | None = None):
        configured_url = base_url or os.getenv("CAPYRA_R2_BINDING_BASE_URL")
        if not configured_url:
            raise RuntimeError("Missing Container variable: CAPYRA_R2_BINDING_BASE_URL")
        self.base_url = configured_url.rstrip("/")
        self.pool = pool or urllib3.PoolManager()

    def _url(self, key: str) -> str:
        if (
            not key
            or "\\" in key
            or "\0" in key
            or any(part in {"", ".", ".."} for part in key.split("/"))
        ):
            raise ValueError("Invalid object key.")
        return f"{self.base_url}/{quote(key, safe='/')}"

    @staticmethod
    def _require_success(response: urllib3.BaseHTTPResponse, key: str) -> None:
        if 200 <= response.status < 300:
            return
        if response.status == 404:
            raise FileNotFoundError(f"Object not found: {key}")
        raise RuntimeError(f"Object storage returned HTTP {response.status}.")

    def size(self, key: str) -> int:
        response = self.pool.request("HEAD", self._url(key))
        try:
            self._require_success(response, key)
            value = response.headers.get("content-length")
            if value is None:
                raise RuntimeError("Object storage did not return Content-Length.")
            return int(value)
        finally:
            response.release_conn()

    def download(self, key: str, destination: Path) -> None:
        response = self.pool.request("GET", self._url(key), preload_content=False)
        try:
            self._require_success(response, key)
            with destination.open("wb") as target:
                shutil.copyfileobj(response, target, length=1024 * 1024)
        finally:
            response.release_conn()

    def put_bytes(self, key: str, content: bytes, content_type: str, analysis_id: str) -> None:
        response = self.pool.request(
            "PUT",
            self._url(key),
            body=content,
            headers={
                "Content-Length": str(len(content)),
                "Content-Type": content_type,
                "X-Capyra-Analysis-Id": analysis_id,
            },
        )
        try:
            self._require_success(response, key)
        finally:
            response.release_conn()

    def upload(self, key: str, source: Path, content_type: str, analysis_id: str) -> None:
        with source.open("rb") as body:
            response = self.pool.request(
                "PUT",
                self._url(key),
                body=body,
                headers={
                    "Content-Length": str(source.stat().st_size),
                    "Content-Type": content_type,
                    "X-Capyra-Analysis-Id": analysis_id,
                },
            )
        try:
            self._require_success(response, key)
        finally:
            response.release_conn()


class MediaProbeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    source_object_key: str | None = None
    source_label: str | None = None
    video_url: str | None = None
    media_kind: Literal["image", "video"] = "video"

    @model_validator(mode="after")
    def validate_source(self) -> "MediaProbeRequest":
        if bool(self.source_object_key) == bool(self.video_url):
            raise ValueError("Provide exactly one source object or public URL.")
        return self


def inspect_media(path: Path, kind: str) -> dict:
    """Inspect actual streams without constructing an OpenAI client."""
    from .media import ensure_binary

    ensure_binary("ffprobe")
    if path.stat().st_size > MAX_SOURCE_BYTES:
        raise ValueError("The source exceeds 200 MB.")
    result = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-print_format",
            "json",
            "-show_streams",
            "-show_format",
            str(path),
        ],
        capture_output=True,
        text=True,
        timeout=60,
        check=False,
    )
    if result.returncode:
        raise ValueError("Invalid or unreadable media.")
    payload = json.loads(result.stdout)
    streams = payload.get("streams", [])
    stream = next((item for item in streams if item.get("codec_type") == "video"), None)
    if not stream or not stream.get("width") or not stream.get("height"):
        raise ValueError("Media has no valid visual stream.")
    fmt = payload.get("format", {})
    codec = stream.get("codec_name", "")
    formats = fmt.get("format_name", "")
    image_codecs = {"mjpeg", "png", "webp"}
    if kind == "image" and (
        codec not in image_codecs or any(s.get("codec_type") == "audio" for s in streams)
    ):
        raise ValueError("The source is not a supported image.")
    if kind == "video" and not any(
        f in formats.split(",") for f in ("mov", "mp4", "matroska", "webm")
    ):
        raise ValueError("The source is not a supported video container.")
    metadata = {
        "width": int(stream["width"]),
        "height": int(stream["height"]),
        "codec": codec,
        "format": formats,
    }
    if kind == "video":
        duration = float(fmt.get("duration") or stream.get("duration") or 0)
        if not math.isfinite(duration) or duration <= 0:
            raise ValueError("Video duration could not be verified.")
        metadata["durationSeconds"] = duration
    return metadata


@router.post("/probe")
def probe_job(request: MediaProbeRequest) -> dict:
    """Private metadata-only job, with no AI invocation or transformation."""
    try:
        with tempfile.TemporaryDirectory(prefix="capyra-probe-") as temp_dir:
            workspace = Path(temp_dir)
            if request.source_object_key:
                suffix = Path(request.source_label or "").suffix.lower()
                allowed = (
                    ALLOWED_EXTENSIONS
                    if request.media_kind == "video"
                    else {".jpg", ".jpeg", ".png", ".webp"}
                )
                if suffix not in allowed:
                    raise ValueError("Unsupported file extension.")
                storage = BindingObjectStorage()
                if storage.size(request.source_object_key) > MAX_SOURCE_BYTES:
                    raise ValueError("The source exceeds 200 MB.")
                path = workspace / f"source{suffix}"
                storage.download(request.source_object_key, path)
            else:
                from .download import ShortVideoDownloader
                from .utils import validate_short_video_url

                path = (
                    ShortVideoDownloader()
                    .download(validate_short_video_url(request.video_url), workspace)
                    .video_path
                )
            return inspect_media(path, request.media_kind)
    except (ValueError, json.JSONDecodeError, InvalidShortVideoUrlError) as exc:
        raise HTTPException(
            status_code=422, detail="Media inspection rejected the source."
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=503, detail="Media inspection is temporarily unavailable."
        ) from exc


@router.post("/analyze", response_model=AnalysisJobResponse)
def analyze_job(request: AnalysisJobRequest) -> AnalysisJobResponse:
    """Run one idempotent analysis and publish deterministic R2 objects."""

    storage = BindingObjectStorage()
    output_prefix = f"analyses/{request.analysis_id}"
    try:
        with tempfile.TemporaryDirectory(prefix=f"capyra-{request.analysis_id}-") as temp_dir:
            workspace = Path(temp_dir)
            upload_path: Path | None = None
            if request.source_object_key:
                suffix = Path(request.source_label).suffix.lower()
                if suffix not in ALLOWED_EXTENSIONS:
                    raise ValueError("Only MP4, MOV, and WEBM inputs are supported.")
                if storage.size(request.source_object_key) > MAX_SOURCE_BYTES:
                    raise ValueError("The source object exceeds 200 MB.")
                upload_path = workspace / f"source{suffix}"
                storage.download(request.source_object_key, upload_path)

            artifact_root = workspace / "artifacts"
            report = AnalysisApplication().analyze(
                AnalyzeVideoCommand(
                    source_type=request.source_type,
                    analysis_id=request.analysis_id,
                    source_label=request.source_label,
                    video_url=request.video_url,
                    upload_path=upload_path,
                    language=request.language,
                    selected_skill_ids=request.skills,
                    catalog_version=request.catalog_version,
                    intent=request.intent,
                    keep_artifacts=True,
                    artifact_root=artifact_root,
                )
            )

            report_key = f"{output_prefix}/report.json"
            storage.put_bytes(
                report_key,
                json.dumps(report.model_dump(mode="json"), ensure_ascii=False).encode(),
                "application/json",
                request.analysis_id,
            )
            artifact_files: list[str] = []
            if artifact_root.exists():
                for path in sorted(item for item in artifact_root.rglob("*") if item.is_file()):
                    relative = path.relative_to(artifact_root).as_posix()
                    artifact_files.append(relative)
                    storage.upload(
                        f"{output_prefix}/artifacts/{relative}",
                        path,
                        "application/octet-stream",
                        request.analysis_id,
                    )
            return AnalysisJobResponse(
                report_object_key=report_key,
                artifact_prefix=f"{output_prefix}/artifacts",
                artifact_files=artifact_files,
            )
    except Exception as exc:
        error = translate_error(exc)
        raise HTTPException(status_code=error.status_code, detail=error.error.model_dump()) from exc
