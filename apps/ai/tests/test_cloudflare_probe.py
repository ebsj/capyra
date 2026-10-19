from __future__ import annotations

import json
from pathlib import Path
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from capyra_analytic_agent.api import create_app
from capyra_analytic_agent.cloudflare_jobs import inspect_media


def fake_probe(monkeypatch, *, codec="h264", duration="180", format_name="mov,mp4", width=1080):
    monkeypatch.setattr("capyra_analytic_agent.media.ensure_binary", lambda _: None)
    monkeypatch.setattr(
        "capyra_analytic_agent.cloudflare_jobs.subprocess.run",
        lambda *args, **kwargs: SimpleNamespace(
            returncode=0,
            stdout=json.dumps(
                {
                    "streams": [
                        {"codec_type": "video", "codec_name": codec, "width": width, "height": 1920}
                    ],
                    "format": {"duration": duration, "format_name": format_name},
                }
            ),
        ),
    )


def test_probe_runs_without_openai_key_or_analysis(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)

    def forbidden():
        raise AssertionError("Analysis must never be constructed by metadata inspection")

    monkeypatch.setattr("capyra_analytic_agent.cloudflare_jobs.AnalysisApplication", forbidden)

    class Storage:
        def size(self, key):
            return 5

        def download(self, key, destination):
            destination.write_bytes(b"video")

    monkeypatch.setattr("capyra_analytic_agent.cloudflare_jobs.BindingObjectStorage", Storage)
    fake_probe(monkeypatch)
    response = TestClient(create_app()).post(
        "/jobs/probe",
        json={
            "source_object_key": "source-assets/a/b/video.mp4",
            "source_label": "video.mp4",
            "media_kind": "video",
        },
    )
    assert response.status_code == 200
    assert response.json() == {
        "width": 1080,
        "height": 1920,
        "durationSeconds": 180.0,
        "codec": "h264",
        "format": "mov,mp4",
    }


@pytest.mark.parametrize("duration", ["0", "NaN", "Infinity"])
def test_video_probe_rejects_unverifiable_duration(monkeypatch, tmp_path: Path, duration):
    fake_probe(monkeypatch, duration=duration)
    file = tmp_path / "video.mp4"
    file.write_bytes(b"video")
    with pytest.raises(ValueError, match="duration"):
        inspect_media(file, "video")


def test_image_probe_reports_dimensions_and_rejects_mislabeled_video(monkeypatch, tmp_path: Path):
    file = tmp_path / "photo.png"
    file.write_bytes(b"image")
    fake_probe(monkeypatch, codec="png", format_name="png_pipe")
    assert inspect_media(file, "image")["width"] == 1080
    assert "durationSeconds" not in inspect_media(file, "image")
    fake_probe(monkeypatch, codec="h264")
    with pytest.raises(ValueError, match="supported image"):
        inspect_media(file, "image")


def test_public_probe_validates_url_without_loading_openai(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    response = TestClient(create_app()).post(
        "/jobs/probe", json={"video_url": "http://127.0.0.1/private"}
    )
    assert response.status_code == 422


def test_probe_requires_exactly_one_source():
    response = TestClient(create_app()).post(
        "/jobs/probe", json={"source_object_key": "a", "video_url": "https://youtube.com/shorts/x"}
    )
    assert response.status_code == 422
