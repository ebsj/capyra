"""Application configuration."""

from __future__ import annotations

import base64
import binascii
import os
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel, Field

from .errors import ConfigurationError

load_dotenv(override=True)


class AppConfig(BaseModel):
    """Resolved runtime configuration."""

    openai_api_key: str = Field(min_length=1)
    transcription_model: str = "gpt-4o-mini-transcribe"
    analysis_model: str = "gpt-5-mini"
    request_timeout_seconds: int = Field(default=180, ge=30, le=900)
    max_keyframes: int = Field(default=16, ge=4, le=24)
    scene_threshold: float = Field(default=0.32, gt=0.0, lt=1.0)
    frame_width: int = Field(default=768, ge=320, le=1920)
    max_scene_candidates: int = Field(default=40, ge=4, le=80)
    yt_dlp_cookies_file: Path | None = None
    yt_dlp_cookies_data: bytes | None = None

    @classmethod
    def from_env(cls) -> "AppConfig":
        """Load configuration from environment variables."""
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ConfigurationError("OPENAI_API_KEY is required.")

        cookies_file = _read_cookie_file_env("SHORT_VIDEO_ANALYTIC_YTDLP_COOKIES_FILE")
        cookies_data = _read_cookie_data_env("SHORT_VIDEO_ANALYTIC_YTDLP_COOKIES_B64")

        return cls(
            openai_api_key=api_key,
            transcription_model=os.getenv(
                "SHORT_VIDEO_ANALYTIC_TRANSCRIPTION_MODEL", "gpt-4o-mini-transcribe"
            ),
            analysis_model=os.getenv("SHORT_VIDEO_ANALYTIC_ANALYSIS_MODEL", "gpt-5-mini"),
            request_timeout_seconds=int(os.getenv("SHORT_VIDEO_ANALYTIC_REQUEST_TIMEOUT_SECONDS", "180")),
            max_keyframes=int(os.getenv("SHORT_VIDEO_ANALYTIC_MAX_KEYFRAMES", "16")),
            scene_threshold=float(os.getenv("SHORT_VIDEO_ANALYTIC_SCENE_THRESHOLD", "0.32")),
            frame_width=int(os.getenv("SHORT_VIDEO_ANALYTIC_FRAME_WIDTH", "768")),
            max_scene_candidates=int(os.getenv("SHORT_VIDEO_ANALYTIC_MAX_SCENES", "40")),
            yt_dlp_cookies_file=cookies_file,
            yt_dlp_cookies_data=cookies_data,
        )


def _read_cookie_file_env(name: str) -> Path | None:
    raw_value = os.getenv(name)
    if raw_value is None:
        return None

    candidate = raw_value.strip()
    if not candidate:
        return None

    path = Path(candidate).expanduser()
    if not path.is_file():
        raise ConfigurationError(f"{name} must point to an existing cookie file.")

    return path


def _read_cookie_data_env(name: str) -> bytes | None:
    raw_value = os.getenv(name)
    if raw_value is None:
        return None

    candidate = "".join(raw_value.split())
    if not candidate:
        return None

    try:
        decoded = base64.b64decode(candidate, validate=True)
    except (ValueError, binascii.Error) as exc:
        raise ConfigurationError(f"{name} must contain valid base64-encoded cookie data.") from exc

    if not decoded.strip():
        raise ConfigurationError(f"{name} must decode to a non-empty cookie file.")

    return decoded
