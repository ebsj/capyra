"""Short-video download helpers."""

from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Any

from yt_dlp import YoutubeDL
from yt_dlp.utils import DownloadError as YtDlpDownloadError

from .errors import ShortVideoDownloadError
from .utils import ValidatedShortVideoUrl

VIDEO_EXTENSIONS = {".mp4", ".mov", ".mkv", ".webm", ".m4v"}
DEFAULT_SOCKET_TIMEOUT_SECONDS = 60
DEFAULT_DOWNLOAD_RETRIES = 3
DEFAULT_FRAGMENT_RETRIES = 3
DEFAULT_EXTRACTOR_RETRIES = 3
ANALYSIS_VIDEO_FORMAT = (
    "bestvideo[height<=720][fps<=30][ext=mp4]+bestaudio[ext=m4a]/"
    "best[height<=720][fps<=30][ext=mp4]/"
    "bestvideo[height<=720][fps<=30]+bestaudio/"
    "best[height<=720][fps<=30]"
)
AUTH_REQUIRED_MARKERS = (
    "login required",
    "sign in",
    "cookies-from-browser",
    "use --cookies",
    "authentication",
    "rate-limit reached",
)
PLATFORM_LABELS = {
    "instagram_reels": "Instagram",
    "youtube_shorts": "YouTube",
    "tiktok": "TikTok",
}


@dataclass(slots=True)
class DownloadedShortVideo:
    """Locally downloaded short-video media."""

    video_path: Path
    info: dict[str, Any]


class ShortVideoDownloader:
    """Download a supported public short video to local storage."""

    def __init__(
        self,
        *,
        socket_timeout_seconds: int = DEFAULT_SOCKET_TIMEOUT_SECONDS,
        retries: int = DEFAULT_DOWNLOAD_RETRIES,
        fragment_retries: int = DEFAULT_FRAGMENT_RETRIES,
        extractor_retries: int = DEFAULT_EXTRACTOR_RETRIES,
        cookies_file_path: Path | None = None,
        cookies_data: bytes | None = None,
    ) -> None:
        self.socket_timeout_seconds = socket_timeout_seconds
        self.retries = retries
        self.fragment_retries = fragment_retries
        self.extractor_retries = extractor_retries
        self.cookies_file_path = cookies_file_path
        self.cookies_data = cookies_data

    def download(
        self, short_video_url: ValidatedShortVideoUrl, destination_dir: Path
    ) -> DownloadedShortVideo:
        destination_dir.mkdir(parents=True, exist_ok=True)
        output_template = str(destination_dir / f"{short_video_url.content_id}.%(ext)s")

        try:
            with self._cookie_file() as cookie_file:
                options = self._build_options(output_template, cookie_file)
                with YoutubeDL(options) as ydl:
                    info = ydl.extract_info(str(short_video_url.canonical_url), download=True)
        except YtDlpDownloadError as exc:
            raise self._normalize_download_error(exc, platform=short_video_url.platform) from exc
        except Exception as exc:  # pragma: no cover - defensive
            raise ShortVideoDownloadError(f"Unexpected download failure: {exc}") from exc

        video_path = self._resolve_downloaded_file(
            destination_dir, short_video_url.content_id, info
        )
        return DownloadedShortVideo(video_path=video_path, info=info)

    def _build_options(self, output_template: str, cookie_file: Path | None) -> dict[str, object]:
        options: dict[str, object] = {
            "quiet": True,
            "no_warnings": True,
            "noplaylist": True,
            "outtmpl": output_template,
            # Scene detection inspects every frame. Bounding the input keeps
            # short-form analysis within the container request deadline while
            # retaining enough detail for transcription and keyframe analysis.
            "format": ANALYSIS_VIDEO_FORMAT,
            "merge_output_format": "mp4",
            "socket_timeout": self.socket_timeout_seconds,
            "retries": self.retries,
            "fragment_retries": self.fragment_retries,
            "extractor_retries": self.extractor_retries,
        }
        if cookie_file is not None:
            options["cookiefile"] = str(cookie_file)
        return options

    @contextmanager
    def _cookie_file(self):
        if self.cookies_data is not None:
            temp_path: Path | None = None
            try:
                with NamedTemporaryFile(
                    prefix="capyra-yt-dlp-cookies-",
                    suffix=".txt",
                    delete=False,
                ) as temp_file:
                    temp_file.write(self.cookies_data)
                    temp_file.flush()
                    temp_path = Path(temp_file.name)
                yield temp_path
            finally:
                if temp_path is not None:
                    temp_path.unlink(missing_ok=True)
            return

        yield self.cookies_file_path

    def _normalize_download_error(
        self, exc: YtDlpDownloadError, *, platform: str
    ) -> ShortVideoDownloadError:
        message = str(exc)
        lower_message = message.lower()
        if any(marker in lower_message for marker in AUTH_REQUIRED_MARKERS):
            return ShortVideoDownloadError(
                self._build_auth_required_message(platform, cookies_configured=self._has_cookies()),
                details={
                    "failure_kind": "authentication_required",
                    "platform": platform,
                    "cookies_configured": self._has_cookies(),
                },
            )

        return ShortVideoDownloadError(f"Unable to download the short video: {message}")

    def _has_cookies(self) -> bool:
        return self.cookies_file_path is not None or self.cookies_data is not None

    @staticmethod
    def _build_auth_required_message(platform: str, *, cookies_configured: bool) -> str:
        platform_label = PLATFORM_LABELS.get(platform, "The platform")
        if cookies_configured:
            return (
                f"Unable to download the short video because the configured yt-dlp cookies "
                f"were rejected, expired, or no longer grant access on {platform_label}. "
                "Refresh the AI service cookies or upload the video file directly."
            )

        return (
            f"Unable to download the short video because {platform_label} now requires "
            "authentication for this video URL. Configure the global yt-dlp cookies on the "
            "AI service or upload the video file directly."
        )

    @staticmethod
    def _resolve_downloaded_file(
        destination_dir: Path, content_id: str, info: dict[str, Any]
    ) -> Path:
        """Resolve the actual video file emitted by yt-dlp.

        yt-dlp may expose the final filename directly or only leave the merged
        media in the destination directory. This fallback keeps the downloader
        resilient to extractor-specific output behavior.
        """
        candidates = []
        explicit_filename = info.get("_filename")
        if explicit_filename:
            explicit_path = Path(explicit_filename)
            if explicit_path.exists():
                candidates.append(explicit_path)

        candidates.extend(
            path
            for path in destination_dir.glob(f"{content_id}*")
            if path.is_file() and path.suffix.lower() in VIDEO_EXTENSIONS
        )

        if not candidates:
            raise ShortVideoDownloadError("yt-dlp reported success, but no video file was found.")

        return max(candidates, key=lambda path: path.stat().st_mtime)
