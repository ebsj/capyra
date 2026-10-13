import base64
from pathlib import Path

import pytest

from capyra_analytic_agent.config import AppConfig
from capyra_analytic_agent.errors import ConfigurationError


def test_app_config_reads_existing_cookie_file(monkeypatch, tmp_path: Path) -> None:
    cookie_file = tmp_path / "instagram-cookies.txt"
    cookie_file.write_text("# Netscape HTTP Cookie File\n", encoding="utf-8")

    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setenv("SHORT_VIDEO_ANALYTIC_YTDLP_COOKIES_FILE", str(cookie_file))
    monkeypatch.delenv("SHORT_VIDEO_ANALYTIC_YTDLP_COOKIES_B64", raising=False)

    config = AppConfig.from_env()

    assert config.yt_dlp_cookies_file == cookie_file
    assert config.yt_dlp_cookies_data is None


def test_app_config_decodes_cookie_data_from_base64(monkeypatch) -> None:
    cookie_bytes = b"# Netscape HTTP Cookie File\n.instagram.com\tTRUE\t/\tTRUE\t0\tsessionid\tabc123\n"

    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setenv(
        "SHORT_VIDEO_ANALYTIC_YTDLP_COOKIES_B64",
        base64.b64encode(cookie_bytes).decode("ascii"),
    )
    monkeypatch.delenv("SHORT_VIDEO_ANALYTIC_YTDLP_COOKIES_FILE", raising=False)

    config = AppConfig.from_env()

    assert config.yt_dlp_cookies_file is None
    assert config.yt_dlp_cookies_data == cookie_bytes


def test_app_config_rejects_missing_cookie_file(monkeypatch, tmp_path: Path) -> None:
    missing_file = tmp_path / "missing-cookies.txt"

    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setenv("SHORT_VIDEO_ANALYTIC_YTDLP_COOKIES_FILE", str(missing_file))
    monkeypatch.delenv("SHORT_VIDEO_ANALYTIC_YTDLP_COOKIES_B64", raising=False)

    with pytest.raises(ConfigurationError, match="SHORT_VIDEO_ANALYTIC_YTDLP_COOKIES_FILE"):
        AppConfig.from_env()


def test_app_config_rejects_invalid_base64_cookie_data(monkeypatch) -> None:
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setenv("SHORT_VIDEO_ANALYTIC_YTDLP_COOKIES_B64", "not-base64")
    monkeypatch.delenv("SHORT_VIDEO_ANALYTIC_YTDLP_COOKIES_FILE", raising=False)

    with pytest.raises(ConfigurationError, match="SHORT_VIDEO_ANALYTIC_YTDLP_COOKIES_B64"):
        AppConfig.from_env()
