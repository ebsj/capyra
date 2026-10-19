"""Service layer that orchestrates the full short-video analysis workflow."""

from __future__ import annotations

import re
import shutil
import tempfile
import uuid
from dataclasses import dataclass
from pathlib import Path

from .analysis import (
    OpenAIShortVideoAnalyzer,
    build_analysis_skill_selection,
    normalize_report,
)
from .config import AppConfig
from .download import DownloadedShortVideo, ShortVideoDownloader
from .errors import InvalidUploadedVideoError, OpenAIAnalysisError, WorkspaceError
from .language import normalize_requested_language, translate_static_text
from .media import (
    build_keyframe_timestamps,
    detect_scene_timestamps,
    extract_audio,
    extract_keyframes,
    probe_video,
)
from .models import AnalysisSkillSelection, ShortVideoAnalysisReport
from .models import Transcript
from .utils import validate_short_video_url

BASELINE_WARNING = translate_static_text("pt-BR", "baseline_warning")


@dataclass(slots=True)
class Workspace:
    """Filesystem layout used while processing one short video."""

    root: Path
    download_dir: Path
    frames_dir: Path
    audio_dir: Path


class ShortVideoAnalysisService:
    """High-level orchestration for short-video analysis.

    This service owns the pipeline order and the cross-cutting domain rules:
    only supported public short-video URLs are accepted, analysis is
    constrained to media evidence, and the final report is normalized with
    warnings when confidence is limited.
    """

    def __init__(
        self,
        config: AppConfig,
        *,
        downloader: ShortVideoDownloader | None = None,
        analyzer: OpenAIShortVideoAnalyzer | None = None,
    ) -> None:
        self.config = config
        self.downloader = downloader or ShortVideoDownloader(
            cookies_file_path=config.yt_dlp_cookies_file,
            cookies_data=config.yt_dlp_cookies_data,
        )
        self.analyzer = analyzer or OpenAIShortVideoAnalyzer(config)

    def analyze(
        self,
        *,
        source_type: str = "public_url",
        source_label: str | None = None,
        video_url: str | None = None,
        upload_path: Path | None = None,
        language: str = "pt-BR",
        selected_skill_ids: list[str] | None = None,
        catalog_version: str | None = None,
        intent: str | None = None,
        keep_artifacts: bool = False,
        artifact_root: Path | None = None,
    ) -> ShortVideoAnalysisReport:
        """Run the end-to-end analysis pipeline.

        By default, artifacts live in a temporary directory so API callers get
        a clean execution workspace. `keep_artifacts=True` switches to a
        persistent workspace for inspection and debugging.
        """
        artifact_root = artifact_root or Path.cwd() / ".artifacts"
        selection = build_analysis_skill_selection(selected_skill_ids, catalog_version)
        normalized_intent = self._normalize_intent(intent)

        if source_type in {"public_url", "public_url_best_effort"}:
            validated = validate_short_video_url(video_url or "")
            workspace_key = validated.content_id

            if keep_artifacts:
                workspace = self._create_persistent_workspace(artifact_root, workspace_key)
                return self._analyze_public_url(
                    source_type=source_type,
                    validated=validated,
                    workspace=workspace,
                    selection=selection,
                    language=language,
                    intent=normalized_intent,
                    keep_artifacts=True,
                )

            with tempfile.TemporaryDirectory(prefix=f"short-video-{workspace_key}-") as temp_dir:
                workspace = self._build_workspace(Path(temp_dir))
                return self._analyze_public_url(
                    source_type=source_type,
                    validated=validated,
                    workspace=workspace,
                    selection=selection,
                    language=language,
                    intent=normalized_intent,
                    keep_artifacts=False,
                )

        uploaded_path = Path(upload_path) if upload_path is not None else None
        if uploaded_path is None or not uploaded_path.is_file():
            raise InvalidUploadedVideoError("A valid uploaded video file must be provided.")

        effective_source_label = (source_label or uploaded_path.name).strip()
        if not effective_source_label:
            raise InvalidUploadedVideoError("The uploaded video must include a source label.")

        workspace_key = self._build_upload_workspace_key(effective_source_label)
        if keep_artifacts:
            workspace = self._create_persistent_workspace(artifact_root, workspace_key)
            return self._analyze_uploaded_video(
                source_type=source_type,
                source_label=effective_source_label,
                upload_path=uploaded_path,
                workspace=workspace,
                selection=selection,
                language=language,
                intent=normalized_intent,
                keep_artifacts=True,
            )

        with tempfile.TemporaryDirectory(
            prefix=f"uploaded-short-video-{workspace_key}-"
        ) as temp_dir:
            workspace = self._build_workspace(Path(temp_dir))
            return self._analyze_uploaded_video(
                source_type=source_type,
                source_label=effective_source_label,
                upload_path=uploaded_path,
                workspace=workspace,
                selection=selection,
                language=language,
                intent=normalized_intent,
                keep_artifacts=False,
            )

    def _analyze_public_url(
        self,
        *,
        source_type: str,
        validated,
        workspace: Workspace,
        selection: AnalysisSkillSelection,
        language: str,
        intent: str | None,
        keep_artifacts: bool,
    ) -> ShortVideoAnalysisReport:
        download = self.downloader.download(validated, workspace.download_dir)
        return self._analyze_ingested_video(
            source_type=source_type,
            source_label=validated.original_url,
            source_url=validated.original_url,
            canonical_url=str(validated.canonical_url),
            platform=validated.platform,
            content_id=validated.content_id,
            ingest_status="downloaded",
            download=download,
            workspace=workspace,
            selection=selection,
            language=language,
            intent=intent,
            keep_artifacts=keep_artifacts,
        )

    def _analyze_uploaded_video(
        self,
        *,
        source_type: str,
        source_label: str,
        upload_path: Path,
        workspace: Workspace,
        selection: AnalysisSkillSelection,
        language: str,
        intent: str | None,
        keep_artifacts: bool,
    ) -> ShortVideoAnalysisReport:
        copied_video_path = self._copy_uploaded_video(
            upload_path, workspace.download_dir, source_label
        )
        download = DownloadedShortVideo(
            video_path=copied_video_path,
            info={"title": source_label},
        )
        return self._analyze_ingested_video(
            source_type=source_type,
            source_label=source_label,
            source_url=None,
            canonical_url=None,
            platform=None,
            content_id=None,
            ingest_status="uploaded",
            download=download,
            workspace=workspace,
            selection=selection,
            language=language,
            intent=intent,
            keep_artifacts=keep_artifacts,
        )

    def _analyze_ingested_video(
        self,
        *,
        source_type: str,
        source_label: str,
        source_url: str | None,
        canonical_url: str | None,
        platform: str | None,
        content_id: str | None,
        ingest_status: str,
        download: DownloadedShortVideo,
        workspace: Workspace,
        selection: AnalysisSkillSelection,
        language: str,
        intent: str | None,
        keep_artifacts: bool,
    ) -> ShortVideoAnalysisReport:
        """Execute the analysis for a locally available video."""
        normalized_language = normalize_requested_language(language)
        probe = probe_video(
            download.video_path, timeout_seconds=self.config.request_timeout_seconds
        )

        if not 0 < probe.duration_seconds <= 180:
            raise ValueError("Analysis accepts videos up to 180 seconds.")

        transcript = Transcript(text="", language=normalized_language, segments=[])
        transcription_unavailable = False
        if probe.has_audio:
            audio_stem = content_id or download.video_path.stem
            audio_path = workspace.audio_dir / f"{audio_stem}.wav"
            extract_audio(
                download.video_path,
                audio_path,
                timeout_seconds=self.config.request_timeout_seconds,
            )
            try:
                transcript = self.analyzer.transcribe_audio(audio_path, language=normalized_language)
            except OpenAIAnalysisError as exc:
                if "empty response" not in str(exc).lower():
                    raise
                transcription_unavailable = True

        scene_timestamps = detect_scene_timestamps(
            download.video_path,
            scene_threshold=self.config.scene_threshold,
            max_candidates=self.config.max_scene_candidates,
            timeout_seconds=self.config.request_timeout_seconds,
        )
        timestamps = build_keyframe_timestamps(
            probe.duration_seconds,
            scene_timestamps,
            transcript_segments=transcript.segments,
            max_keyframes=self.config.max_keyframes,
        )
        keyframes = extract_keyframes(
            download.video_path,
            timestamps,
            workspace.frames_dir,
            frame_width=self.config.frame_width,
            timeout_seconds=self.config.request_timeout_seconds,
        )

        source_context = self._build_source_context(
            source_type=source_type,
            source_label=source_label,
            source_url=source_url,
            canonical_url=canonical_url,
            platform=platform,
            content_id=content_id,
            probe=probe,
            download=download,
            keyframes=keyframes,
            language=normalized_language,
            intent=intent,
        )
        evidence = self.analyzer.extract_evidence(
            source_context=source_context,
            transcript=transcript,
            keyframes=[(frame.timestamp_seconds, frame.path) for frame in keyframes],
            language=normalized_language,
        )
        evidence = self._enrich_evidence_pack(evidence, transcript, keyframes)
        report = self.analyzer.synthesize_report(
            source_context=source_context,
            transcript=transcript,
            evidence=evidence,
            selection=selection,
            language=normalized_language,
        )
        report = normalize_report(report, selection, transcript, normalized_language)

        warnings = list(report.warnings)
        # The tool can describe content quality, but it cannot observe private
        # platform analytics such as retention, reach, saves, or conversions.
        baseline_warning = translate_static_text(normalized_language, "baseline_warning")
        if baseline_warning not in warnings:
            warnings.append(baseline_warning)
        if not probe.has_audio:
            warnings.append(translate_static_text(normalized_language, "no_audio_warning"))
        if transcription_unavailable:
            warnings.append(
                translate_static_text(normalized_language, "transcription_unavailable_warning")
            )

        artifact_directory = str(workspace.root) if keep_artifacts else None
        return report.model_copy(
            update={
                "source": report.source.model_copy(
                    update={
                        "source_type": source_type,
                        "source_label": source_label,
                        "source_url": source_url,
                        "canonical_url": canonical_url,
                        "platform": platform,
                        "content_id": content_id,
                        "duration_seconds": probe.duration_seconds,
                        "width": probe.width,
                        "height": probe.height,
                        "fps": probe.fps,
                        "has_audio": probe.has_audio,
                        "ingest_status": ingest_status,
                        "artifact_directory": artifact_directory,
                    }
                ),
                "warnings": warnings,
            }
        )

    @staticmethod
    def _enrich_evidence_pack(
        evidence,
        transcript: Transcript,
        keyframes,
    ):
        timeline_notes = list(evidence.timeline_notes)
        if transcript.segments:
            first_segment = transcript.segments[0]
            last_segment = transcript.segments[-1]
            timeline_notes.append(
                (
                    f"Transcricao com {len(transcript.segments)} segmentos; "
                    f"abertura em {first_segment.start_seconds:.1f}s e fechamento em {last_segment.end_seconds:.1f}s."
                )
            )
        else:
            timeline_notes.append(
                "Nao houve segmentos de fala detectaveis para ancorar a transcricao."
            )

        if keyframes:
            first_frame = keyframes[0].timestamp_seconds
            last_frame = keyframes[-1].timestamp_seconds
            timeline_notes.append(
                (
                    f"{len(keyframes)} keyframes distribuidos entre {first_frame:.1f}s e {last_frame:.1f}s."
                )
            )

        frame_observations = evidence.frame_observations or list(evidence.visual_observations)
        visual_observations = evidence.visual_observations or list(evidence.frame_observations)

        return evidence.model_copy(
            update={
                "transcript_segments": transcript.segments,
                "timeline_notes": timeline_notes,
                "frame_observations": frame_observations,
                "visual_observations": visual_observations,
            }
        )

    @staticmethod
    def _build_workspace(root: Path) -> Workspace:
        """Create the folder structure expected by the pipeline."""
        download_dir = root / "downloads"
        frames_dir = root / "frames"
        audio_dir = root / "audio"
        download_dir.mkdir(parents=True, exist_ok=True)
        frames_dir.mkdir(parents=True, exist_ok=True)
        audio_dir.mkdir(parents=True, exist_ok=True)
        return Workspace(
            root=root, download_dir=download_dir, frames_dir=frames_dir, audio_dir=audio_dir
        )

    def _create_persistent_workspace(self, artifact_root: Path, workspace_key: str) -> Workspace:
        """Create a stable workspace path under `.artifacts/<workspace_key>/`."""
        root = artifact_root / workspace_key
        return self._build_workspace(root)

    @staticmethod
    def _copy_uploaded_video(upload_path: Path, destination_dir: Path, source_label: str) -> Path:
        safe_name = Path(source_label).name or upload_path.name
        destination_path = destination_dir / safe_name
        try:
            shutil.copyfile(upload_path, destination_path)
        except OSError as exc:
            try:
                destination_path.unlink(missing_ok=True)
            except OSError:
                pass
            raise WorkspaceError(
                f"Uploaded video could not be copied into the analysis workspace: {exc}"
            ) from exc
        return destination_path

    @staticmethod
    def _build_upload_workspace_key(source_label: str) -> str:
        stem = Path(source_label).stem or "video"
        slug = re.sub(r"[^A-Za-z0-9._-]+", "-", stem).strip("-._").lower() or "video"
        return f"upload-{slug[:40]}-{uuid.uuid4().hex[:8]}"

    @staticmethod
    def _normalize_intent(intent: str | None) -> str | None:
        normalized = intent.strip() if intent is not None else ""
        return normalized or None

    @staticmethod
    def _build_source_context(
        *,
        source_type: str,
        source_label: str,
        source_url: str | None,
        canonical_url: str | None,
        platform: str | None,
        content_id: str | None,
        probe,
        download: DownloadedShortVideo,
        keyframes,
        language: str,
        intent: str | None,
    ) -> str:
        """Build the textual context block fed to the OpenAI prompts."""
        lines = [
            translate_static_text(language, "video_context_title"),
            translate_static_text(language, "source_type").format(value=source_type),
            translate_static_text(language, "source_label").format(value=source_label),
        ]

        if source_url:
            lines.append(translate_static_text(language, "source_url").format(value=source_url))
        if canonical_url:
            lines.append(translate_static_text(language, "canonical_url").format(value=canonical_url))
        if platform:
            lines.append(translate_static_text(language, "platform").format(value=platform))
        if content_id:
            lines.append(translate_static_text(language, "content_id").format(value=content_id))
        if intent:
            lines.append(f"- Submitted video intent: {intent}")

        lines.extend(
            [
                translate_static_text(language, "duration").format(value=probe.duration_seconds),
                translate_static_text(language, "resolution").format(width=probe.width, height=probe.height),
                translate_static_text(language, "fps").format(value=probe.fps),
                translate_static_text(language, "has_audio").format(
                    value=translate_static_text(language, "yes" if probe.has_audio else "no")
                ),
                translate_static_text(language, "keyframes_count").format(value=len(keyframes)),
                translate_static_text(language, "ingest_title").format(
                    value=download.info.get("title") or source_label
                ),
            ]
        )

        return "\n".join(lines) + "\n"
