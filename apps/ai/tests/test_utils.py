import pytest

from capyra_analytic_agent.errors import InvalidShortVideoUrlError
from capyra_analytic_agent.utils import validate_short_video_url


def test_validate_instagram_url_canonicalizes_public_url() -> None:
    validated = validate_short_video_url(
        "https://instagram.com/reel/C9_Test123/?igsh=abc&utm_source=foo"
    )

    assert validated.platform == "instagram_reels"
    assert validated.content_id == "C9_Test123"
    assert str(validated.canonical_url) == "https://www.instagram.com/reel/C9_Test123/"


def test_validate_youtube_shorts_url_canonicalizes_public_url() -> None:
    validated = validate_short_video_url(
        "https://m.youtube.com/shorts/AbC123_xYz?feature=share"
    )

    assert validated.platform == "youtube_shorts"
    assert validated.content_id == "AbC123_xYz"
    assert str(validated.canonical_url) == "https://www.youtube.com/shorts/AbC123_xYz"


def test_validate_tiktok_url_canonicalizes_public_url() -> None:
    validated = validate_short_video_url(
        "https://www.tiktok.com/@creator/video/7488881234567890123?is_from_webapp=1"
    )

    assert validated.platform == "tiktok"
    assert validated.content_id == "7488881234567890123"
    assert (
        str(validated.canonical_url)
        == "https://www.tiktok.com/@creator/video/7488881234567890123"
    )


def test_validate_short_video_url_rejects_invalid_host() -> None:
    with pytest.raises(InvalidShortVideoUrlError):
        validate_short_video_url("https://example.com/reel/C9_Test123/")
