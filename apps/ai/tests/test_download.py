from pathlib import Path

import pytest
from yt_dlp.utils import DownloadError as YtDlpDownloadError

from capyra_analytic_agent.download import ANALYSIS_VIDEO_FORMAT, ShortVideoDownloader
from capyra_analytic_agent.errors import ShortVideoDownloadError
from capyra_analytic_agent.utils import validate_short_video_url


def test_short_video_downloader_passes_reliability_options_and_resolves_file(
    monkeypatch, tmp_path: Path
) -> None:
    expected_path = tmp_path / "abc123.mp4"
    expected_path.write_bytes(b"fake-video")

    captured_options: dict[str, object] = {}

    class FakeYoutubeDL:
        def __init__(self, options):
            captured_options.update(options)

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def extract_info(self, url, download):
            assert url == "https://www.youtube.com/shorts/abc123"
            assert download is True
            return {"_filename": str(expected_path)}

    monkeypatch.setattr("capyra_analytic_agent.download.YoutubeDL", FakeYoutubeDL)

    downloader = ShortVideoDownloader()
    result = downloader.download(
        validate_short_video_url("https://www.youtube.com/shorts/abc123"),
        tmp_path,
    )

    assert result.video_path == expected_path
    assert captured_options["socket_timeout"] == 60
    assert captured_options["retries"] == 3
    assert captured_options["fragment_retries"] == 3
    assert captured_options["extractor_retries"] == 3
    assert captured_options["format"] == ANALYSIS_VIDEO_FORMAT
    assert "height<=720" in ANALYSIS_VIDEO_FORMAT
    assert "fps<=30" in ANALYSIS_VIDEO_FORMAT
    assert captured_options["merge_output_format"] == "mp4"


def test_short_video_downloader_passes_cookie_file_path(monkeypatch, tmp_path: Path) -> None:
    expected_path = tmp_path / "abc123.mp4"
    expected_path.write_bytes(b"fake-video")
    cookie_file = tmp_path / "cookies.txt"
    cookie_file.write_text("# Netscape HTTP Cookie File\n", encoding="utf-8")

    captured_options: dict[str, object] = {}

    class FakeYoutubeDL:
        def __init__(self, options):
            captured_options.update(options)

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def extract_info(self, url, download):
            assert url == "https://www.instagram.com/reel/abc123/"
            assert download is True
            return {"_filename": str(expected_path)}

    monkeypatch.setattr("capyra_analytic_agent.download.YoutubeDL", FakeYoutubeDL)

    downloader = ShortVideoDownloader(cookies_file_path=cookie_file)
    result = downloader.download(
        validate_short_video_url("https://www.instagram.com/reel/abc123/"),
        tmp_path,
    )

    assert result.video_path == expected_path
    assert captured_options["cookiefile"] == str(cookie_file)


def test_short_video_downloader_materializes_cookie_data_and_deletes_temp_file(
    monkeypatch, tmp_path: Path
) -> None:
    expected_path = tmp_path / "abc123.mp4"
    expected_path.write_bytes(b"fake-video")
    cookie_file = tmp_path / "persisted-cookies.txt"
    cookie_file.write_text("persisted-cookie\n", encoding="utf-8")
    cookie_path: Path | None = None
    cookie_bytes = (
        b"# Netscape HTTP Cookie File\n.instagram.com\tTRUE\t/\tTRUE\t0\tsessionid\tabc123\n"
    )

    class FakeYoutubeDL:
        def __init__(self, options):
            nonlocal cookie_path
            cookie_path = Path(options["cookiefile"])

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def extract_info(self, url, download):
            assert url == "https://www.instagram.com/reel/abc123/"
            assert download is True
            assert cookie_path is not None
            assert cookie_path.read_bytes() == cookie_bytes
            return {"_filename": str(expected_path)}

    monkeypatch.setattr("capyra_analytic_agent.download.YoutubeDL", FakeYoutubeDL)

    downloader = ShortVideoDownloader(
        cookies_file_path=cookie_file,
        cookies_data=cookie_bytes,
    )
    downloader.download(
        validate_short_video_url("https://www.instagram.com/reel/abc123/"),
        tmp_path,
    )

    assert cookie_path is not None
    assert cookie_path != cookie_file
    assert not cookie_path.exists()


@pytest.mark.parametrize(
    ("cookies_configured", "expected_message"),
    [
        (
            False,
            "Instagram now requires authentication for this video URL. Configure the global yt-dlp cookies on the AI service or upload the video file directly.",
        ),
        (
            True,
            "the configured yt-dlp cookies were rejected, expired, or no longer grant access on Instagram. Refresh the AI service cookies or upload the video file directly.",
        ),
    ],
)
def test_short_video_downloader_normalizes_auth_errors(
    monkeypatch, tmp_path: Path, cookies_configured: bool, expected_message: str
) -> None:
    class FakeYoutubeDL:
        def __init__(self, options):
            self.options = options

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def extract_info(self, url, download):
            raise YtDlpDownloadError(
                "ERROR: [Instagram] DWCmY5Dklay: Requested content is not available, "
                "rate-limit reached or login required. Use --cookies-from-browser or "
                "--cookies for the authentication."
            )

    monkeypatch.setattr("capyra_analytic_agent.download.YoutubeDL", FakeYoutubeDL)

    downloader = ShortVideoDownloader(
        cookies_file_path=(tmp_path / "cookies.txt") if cookies_configured else None
    )
    if cookies_configured:
        downloader.cookies_file_path.write_text("# Netscape HTTP Cookie File\n", encoding="utf-8")

    with pytest.raises(
        ShortVideoDownloadError, match="Unable to download the short video"
    ) as exc_info:
        downloader.download(
            validate_short_video_url("https://www.instagram.com/reel/abc123/"),
            tmp_path,
        )

    assert expected_message in str(exc_info.value)
    assert exc_info.value.details == {
        "failure_kind": "authentication_required",
        "platform": "instagram_reels",
        "cookies_configured": cookies_configured,
    }


def test_short_video_downloader_preserves_generic_download_errors(
    monkeypatch, tmp_path: Path
) -> None:
    class FakeYoutubeDL:
        def __init__(self, options):
            self.options = options

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def extract_info(self, url, download):
            raise YtDlpDownloadError("ERROR: temporary upstream outage")

    monkeypatch.setattr("capyra_analytic_agent.download.YoutubeDL", FakeYoutubeDL)

    downloader = ShortVideoDownloader()

    with pytest.raises(
        ShortVideoDownloadError,
        match="Unable to download the short video: ERROR: temporary upstream outage",
    ) as exc_info:
        downloader.download(
            validate_short_video_url("https://www.youtube.com/shorts/abc123"),
            tmp_path,
        )

    assert exc_info.value.details is None
