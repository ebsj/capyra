from __future__ import annotations

import io
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from urllib3.response import HTTPResponse

from capyra_analytic_agent.api import create_app
from capyra_analytic_agent.cloudflare_jobs import BindingObjectStorage


class FakePool:
    def __init__(self, responses: list[HTTPResponse]):
        self.responses = responses
        self.requests: list[tuple[str, str, dict]] = []

    def request(self, method: str, url: str, **kwargs) -> HTTPResponse:
        body = kwargs.get("body")
        if hasattr(body, "read"):
            kwargs["captured_body"] = body.read()
        self.requests.append((method, url, kwargs))
        return self.responses.pop(0)


def response(status: int = 200, body: bytes = b"", **headers: str) -> HTTPResponse:
    return HTTPResponse(
        body=io.BytesIO(body), status=status, headers=headers, preload_content=False
    )


def test_private_api_exposes_only_health_and_job_routes() -> None:
    client = TestClient(create_app())

    assert client.get("/health").json() == {"status": "ok"}
    assert client.post("/analyze", json={}).status_code == 404
    assert client.post("/analyze/upload").status_code == 404


def test_storage_health_uses_private_binding(monkeypatch) -> None:
    writes = []

    class FakeStorage:
        def put_bytes(self, key, content, content_type, analysis_id):
            writes.append((key, content, content_type, analysis_id))

        def size(self, key):
            return 2

    monkeypatch.setattr("capyra_analytic_agent.api.BindingObjectStorage", FakeStorage)

    response_value = TestClient(create_app()).get("/health/storage")

    assert response_value.json() == {"status": "ok", "storage": "ok"}
    assert writes == [
        ("development/container-storage-health.txt", b"ok", "text/plain", "health")
    ]


def test_binding_storage_streams_download_and_encodes_key(tmp_path: Path) -> None:
    pool = FakePool([response(body=b"video-bytes")])
    storage = BindingObjectStorage("http://capyra-r2.internal", pool)  # type: ignore[arg-type]
    destination = tmp_path / "video.mp4"

    storage.download("source-assets/account/video name.mp4", destination)

    assert destination.read_bytes() == b"video-bytes"
    assert pool.requests[0][0:2] == (
        "GET",
        "http://capyra-r2.internal/source-assets/account/video%20name.mp4",
    )


def test_binding_storage_validates_size_and_streams_upload(tmp_path: Path) -> None:
    source = tmp_path / "frame.jpg"
    source.write_bytes(b"frame")
    pool = FakePool(
        [
            response(**{"content-length": "5"}),
            response(status=201),
        ]
    )
    storage = BindingObjectStorage("http://capyra-r2.internal", pool)  # type: ignore[arg-type]

    assert storage.size("source.mp4") == 5
    storage.upload("analyses/id/artifacts/frame.jpg", source, "image/jpeg", "id")

    method, _, options = pool.requests[1]
    assert method == "PUT"
    assert options["captured_body"] == b"frame"
    assert options["headers"] == {
        "Content-Length": "5",
        "Content-Type": "image/jpeg",
        "X-Capyra-Analysis-Id": "id",
    }


def test_binding_storage_reports_missing_objects_without_credentials() -> None:
    storage = BindingObjectStorage(
        "http://capyra-r2.internal",
        FakePool([response(status=404)]),  # type: ignore[arg-type]
    )

    with pytest.raises(FileNotFoundError, match="Object not found"):
        storage.size("missing.mp4")


def test_binding_storage_rejects_unsafe_keys() -> None:
    storage = BindingObjectStorage("http://capyra-r2.internal", FakePool([]))  # type: ignore[arg-type]

    with pytest.raises(ValueError, match="Invalid object key"):
        storage.size("analyses/../secret")
