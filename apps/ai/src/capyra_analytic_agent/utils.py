"""Shared helpers."""

from __future__ import annotations

import re
from urllib.parse import urlparse

from pydantic import BaseModel, HttpUrl

from .errors import InvalidShortVideoUrlError

INSTAGRAM_HOSTS = {"instagram.com", "www.instagram.com", "m.instagram.com"}
YOUTUBE_HOSTS = {"youtube.com", "www.youtube.com", "m.youtube.com"}
TIKTOK_HOSTS = {"tiktok.com", "www.tiktok.com", "m.tiktok.com", "vt.tiktok.com"}
SHORT_VIDEO_ID_PATTERN = re.compile(r"^[A-Za-z0-9._-]+$")


class ValidatedShortVideoUrl(BaseModel):
    """Normalized short-video URL."""

    platform: str
    original_url: str
    canonical_url: HttpUrl
    content_id: str


def validate_short_video_url(raw_url: str) -> ValidatedShortVideoUrl:
    """Validate and canonicalize a supported public short-video URL."""
    candidate = raw_url.strip()
    if not candidate:
        raise InvalidShortVideoUrlError("A short-video URL must be provided.")

    parsed = urlparse(candidate)
    host = parsed.netloc.lower()
    if parsed.scheme not in {"http", "https"}:
        raise InvalidShortVideoUrlError("Only public HTTP(S) URLs are supported.")

    parts = [part for part in parsed.path.split("/") if part]
    if host in INSTAGRAM_HOSTS:
        return _validate_instagram_url(candidate, parts)
    if host in YOUTUBE_HOSTS:
        return _validate_youtube_shorts_url(candidate, parts)
    if host in TIKTOK_HOSTS:
        return _validate_tiktok_url(candidate, parts)

    raise InvalidShortVideoUrlError(
        "Only public Instagram Reels, YouTube Shorts, and TikTok URLs are supported."
    )


def _validate_instagram_url(candidate: str, parts: list[str]) -> ValidatedShortVideoUrl:
    if len(parts) < 2 or parts[0].lower() not in {"reel", "reels"}:
        raise InvalidShortVideoUrlError(
            "Instagram URLs must use the format https://www.instagram.com/reel/<id>/."
        )

    content_id = parts[1]
    if not SHORT_VIDEO_ID_PATTERN.match(content_id):
        raise InvalidShortVideoUrlError("The Instagram content ID in the URL is invalid.")

    return ValidatedShortVideoUrl(
        platform="instagram_reels",
        original_url=candidate,
        canonical_url=f"https://www.instagram.com/reel/{content_id}/",
        content_id=content_id,
    )


def _validate_youtube_shorts_url(candidate: str, parts: list[str]) -> ValidatedShortVideoUrl:
    if len(parts) < 2 or parts[0].lower() != "shorts":
        raise InvalidShortVideoUrlError(
            "YouTube URLs must use the format https://www.youtube.com/shorts/<id>."
        )

    content_id = parts[1]
    if not SHORT_VIDEO_ID_PATTERN.match(content_id):
        raise InvalidShortVideoUrlError("The YouTube Shorts ID in the URL is invalid.")

    return ValidatedShortVideoUrl(
        platform="youtube_shorts",
        original_url=candidate,
        canonical_url=f"https://www.youtube.com/shorts/{content_id}",
        content_id=content_id,
    )


def _validate_tiktok_url(candidate: str, parts: list[str]) -> ValidatedShortVideoUrl:
    if len(parts) < 3 or not parts[0].startswith("@") or parts[1].lower() != "video":
        raise InvalidShortVideoUrlError(
            "TikTok URLs must use the format https://www.tiktok.com/@user/video/<id>."
        )

    content_id = parts[2]
    if not SHORT_VIDEO_ID_PATTERN.match(content_id):
        raise InvalidShortVideoUrlError("The TikTok video ID in the URL is invalid.")

    return ValidatedShortVideoUrl(
        platform="tiktok",
        original_url=candidate,
        canonical_url=f"https://www.tiktok.com/{parts[0]}/video/{content_id}",
        content_id=content_id,
    )
