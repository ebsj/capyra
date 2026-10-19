from pathlib import Path

import pytest

from capyra_analytic_agent.config import AppConfig
from capyra_analytic_agent.download import DownloadedShortVideo
from capyra_analytic_agent.errors import OpenAIAnalysisError, WorkspaceError
from capyra_analytic_agent.media import KeyframeArtifact, VideoProbe
from capyra_analytic_agent.models import IntermediateAnalysis
from capyra_analytic_agent.service import BASELINE_WARNING, ShortVideoAnalysisService

from .helpers import build_executed_skill, build_report, build_transcript


class FakeDownloader:
    def __init__(self, video_path: Path) -> None:
        self.video_path = video_path

    def download(self, short_video_url, destination_dir: Path) -> DownloadedShortVideo:
        return DownloadedShortVideo(video_path=self.video_path, info={"title": "Teste"})


class FakeAnalyzer:
    def transcribe_audio(self, audio_path: Path, *, language: str):
        transcript = build_transcript(
            text="Transcricao de teste.",
            language=language,
        )
        transcript.segments = transcript.segments[:2]
        return transcript

    def extract_evidence(self, *, source_context: str, transcript, keyframes, language: str):
        if transcript.text:
            assert transcript.text == "Transcricao de teste."
            assert transcript.segments
        else:
            assert transcript.segments == []
        assert language in {"pt-BR", "en"}
        assert len(keyframes) >= 1
        return IntermediateAnalysis(
            opening_line="Teste",
            structural_pattern="hook -> solucao",
            probable_target_audience="Criadores",
        )

    def synthesize_report(self, *, source_context: str, transcript, evidence, selection, language: str):
        selected_skill_ids = list(selection.selected_skill_ids)
        assert language in {"pt-BR", "en"}
        return build_report(
            selected_skill_ids=selected_skill_ids,
            executed_skills=[build_executed_skill(selected_skill_ids[0])],
            transcript=transcript,
        )


def test_service_adds_baseline_warning_and_transcript(monkeypatch, tmp_path: Path) -> None:
    video_path = tmp_path / "video.mp4"
    video_path.write_bytes(b"not-a-real-video")

    monkeypatch.setattr(
        "capyra_analytic_agent.service.probe_video",
        lambda *args, **kwargs: VideoProbe(
            duration_seconds=12.5,
            width=1080,
            height=1920,
            fps=30.0,
            has_audio=True,
        ),
    )
    monkeypatch.setattr(
        "capyra_analytic_agent.service.extract_audio",
        lambda *args, **kwargs: tmp_path / "audio.wav",
    )
    monkeypatch.setattr(
        "capyra_analytic_agent.service.detect_scene_timestamps",
        lambda *args, **kwargs: [0.2, 1.5, 4.8],
    )
    monkeypatch.setattr(
        "capyra_analytic_agent.service.extract_keyframes",
        lambda *args, **kwargs: [
            KeyframeArtifact(timestamp_seconds=0.2, path=tmp_path / "frame-01.jpg"),
            KeyframeArtifact(timestamp_seconds=1.5, path=tmp_path / "frame-02.jpg"),
        ],
    )

    service = ShortVideoAnalysisService(
        AppConfig(openai_api_key="test"),
        downloader=FakeDownloader(video_path),
        analyzer=FakeAnalyzer(),
    )
    report = service.analyze(
        video_url="https://www.instagram.com/reel/abc123/",
        selected_skill_ids=["content_strategy", "editing"],
        keep_artifacts=True,
        artifact_root=tmp_path / "artifacts",
    )

    assert report.selected_skill_ids == ["content_strategy", "editing"]
    assert report.executed_skills[0].skill_id == "content_strategy"
    assert len(report.executed_skills) == 2
    assert report.executed_skills[1].status == "insufficient_evidence"
    assert BASELINE_WARNING in report.warnings
    assert report.overall_score is not None
    assert report.transcript.text == "Transcricao de teste."
    assert len(report.transcript.segments) == 2
    assert report.source.artifact_directory is not None
    assert report.source.source_type == "public_url"
    assert report.source.source_label == "https://www.instagram.com/reel/abc123/"
    assert report.source.platform == "instagram_reels"
    assert report.source.content_id == "abc123"


def test_service_includes_intent_in_source_context(monkeypatch, tmp_path: Path) -> None:
    video_path = tmp_path / "video.mp4"
    video_path.write_bytes(b"not-a-real-video")
    captured: dict[str, str] = {}

    monkeypatch.setattr(
        "capyra_analytic_agent.service.probe_video",
        lambda *args, **kwargs: VideoProbe(
            duration_seconds=12.5,
            width=1080,
            height=1920,
            fps=30.0,
            has_audio=True,
        ),
    )
    monkeypatch.setattr(
        "capyra_analytic_agent.service.extract_audio",
        lambda *args, **kwargs: tmp_path / "audio.wav",
    )
    monkeypatch.setattr(
        "capyra_analytic_agent.service.detect_scene_timestamps",
        lambda *args, **kwargs: [0.2],
    )
    monkeypatch.setattr(
        "capyra_analytic_agent.service.extract_keyframes",
        lambda *args, **kwargs: [
            KeyframeArtifact(timestamp_seconds=0.2, path=tmp_path / "frame-01.jpg"),
        ],
    )

    class CapturingAnalyzer(FakeAnalyzer):
        def extract_evidence(self, *, source_context: str, transcript, keyframes, language: str):
            captured["source_context"] = source_context
            return super().extract_evidence(
                source_context=source_context,
                transcript=transcript,
                keyframes=keyframes,
                language=language,
            )

    service = ShortVideoAnalysisService(
        AppConfig(openai_api_key="test"),
        downloader=FakeDownloader(video_path),
        analyzer=CapturingAnalyzer(),
    )
    intent = "Check whether this video convinces parents to book a trial class."

    service.analyze(
        video_url="https://www.youtube.com/shorts/intent123",
        selected_skill_ids=["content_strategy"],
        intent=intent,
    )

    assert "Submitted video intent" in captured["source_context"]
    assert intent in captured["source_context"]


def test_service_omits_intent_section_when_absent(monkeypatch, tmp_path: Path) -> None:
    video_path = tmp_path / "video.mp4"
    video_path.write_bytes(b"not-a-real-video")
    captured: dict[str, str] = {}

    monkeypatch.setattr(
        "capyra_analytic_agent.service.probe_video",
        lambda *args, **kwargs: VideoProbe(
            duration_seconds=9.0,
            width=1080,
            height=1920,
            fps=30.0,
            has_audio=False,
        ),
    )
    monkeypatch.setattr(
        "capyra_analytic_agent.service.detect_scene_timestamps",
        lambda *args, **kwargs: [0.1],
    )
    monkeypatch.setattr(
        "capyra_analytic_agent.service.extract_keyframes",
        lambda *args, **kwargs: [
            KeyframeArtifact(timestamp_seconds=0.1, path=tmp_path / "frame-01.jpg"),
        ],
    )

    class CapturingAnalyzer(FakeAnalyzer):
        def extract_evidence(self, *, source_context: str, transcript, keyframes, language: str):
            captured["source_context"] = source_context
            return super().extract_evidence(
                source_context=source_context,
                transcript=transcript,
                keyframes=keyframes,
                language=language,
            )

    service = ShortVideoAnalysisService(
        AppConfig(openai_api_key="test"),
        downloader=FakeDownloader(video_path),
        analyzer=CapturingAnalyzer(),
    )

    service.analyze(video_url="https://www.youtube.com/shorts/nointent")

    assert "Submitted video intent" not in captured["source_context"]


def test_service_detects_youtube_shorts_url(monkeypatch, tmp_path: Path) -> None:
    video_path = tmp_path / "video.mp4"
    video_path.write_bytes(b"not-a-real-video")

    monkeypatch.setattr(
        "capyra_analytic_agent.service.probe_video",
        lambda *args, **kwargs: VideoProbe(
            duration_seconds=9.0,
            width=1080,
            height=1920,
            fps=30.0,
            has_audio=False,
        ),
    )
    monkeypatch.setattr(
        "capyra_analytic_agent.service.detect_scene_timestamps",
        lambda *args, **kwargs: [0.1, 2.4],
    )
    monkeypatch.setattr(
        "capyra_analytic_agent.service.extract_keyframes",
        lambda *args, **kwargs: [
            KeyframeArtifact(timestamp_seconds=0.1, path=tmp_path / "frame-01.jpg"),
        ],
    )

    service = ShortVideoAnalysisService(
        AppConfig(openai_api_key="test"),
        downloader=FakeDownloader(video_path),
        analyzer=FakeAnalyzer(),
    )
    report = service.analyze(video_url="https://www.youtube.com/shorts/xyz123")

    assert report.source.source_type == "public_url"
    assert report.source.platform == "youtube_shorts"
    assert report.source.content_id == "xyz123"
    assert report.source.source_url == "https://www.youtube.com/shorts/xyz123"


def test_service_keeps_analysis_running_when_audio_transcription_is_empty(
    monkeypatch, tmp_path: Path
) -> None:
    video_path = tmp_path / "video.mp4"
    video_path.write_bytes(b"not-a-real-video")

    monkeypatch.setattr(
        "capyra_analytic_agent.service.probe_video",
        lambda *args, **kwargs: VideoProbe(
            duration_seconds=9.0,
            width=1080,
            height=1920,
            fps=30.0,
            has_audio=True,
        ),
    )
    monkeypatch.setattr(
        "capyra_analytic_agent.service.extract_audio",
        lambda *args, **kwargs: tmp_path / "audio.wav",
    )
    monkeypatch.setattr(
        "capyra_analytic_agent.service.detect_scene_timestamps",
        lambda *args, **kwargs: [0.1, 2.4],
    )
    monkeypatch.setattr(
        "capyra_analytic_agent.service.extract_keyframes",
        lambda *args, **kwargs: [
            KeyframeArtifact(timestamp_seconds=0.1, path=tmp_path / "frame-01.jpg"),
        ],
    )

    class EmptyTranscriptAnalyzer(FakeAnalyzer):
        def transcribe_audio(self, audio_path: Path, *, language: str):
            raise OpenAIAnalysisError("Audio transcription returned an empty response.")

    service = ShortVideoAnalysisService(
        AppConfig(openai_api_key="test"),
        downloader=FakeDownloader(video_path),
        analyzer=EmptyTranscriptAnalyzer(),
    )
    report = service.analyze(
        video_url="https://www.youtube.com/shorts/xyz123",
        selected_skill_ids=["content_strategy"],
        language="en",
    )

    assert report.transcript.text == ""
    assert report.transcript.segments == []
    assert (
        "Audio was detected, but the transcript could not be extracted reliably. "
        "The analysis may rely more heavily on visual evidence."
    ) in report.warnings


def test_service_accepts_uploaded_video_without_downloader(monkeypatch, tmp_path: Path) -> None:
    video_path = tmp_path / "uploaded.mp4"
    video_path.write_bytes(b"not-a-real-video")

    monkeypatch.setattr(
        "capyra_analytic_agent.service.probe_video",
        lambda *args, **kwargs: VideoProbe(
            duration_seconds=7.5,
            width=1080,
            height=1920,
            fps=24.0,
            has_audio=False,
        ),
    )
    monkeypatch.setattr(
        "capyra_analytic_agent.service.detect_scene_timestamps",
        lambda *args, **kwargs: [0.4, 2.0],
    )
    monkeypatch.setattr(
        "capyra_analytic_agent.service.extract_keyframes",
        lambda *args, **kwargs: [
            KeyframeArtifact(timestamp_seconds=0.4, path=tmp_path / "frame-01.jpg"),
        ],
    )

    class FailingDownloader:
        def download(self, *_args, **_kwargs):
            raise AssertionError("Uploader branch should not call yt-dlp.")

    service = ShortVideoAnalysisService(
        AppConfig(openai_api_key="test"),
        downloader=FailingDownloader(),
        analyzer=FakeAnalyzer(),
    )

    report = service.analyze(
        source_type="file_upload",
        source_label="uploaded.mp4",
        upload_path=video_path,
    )

    assert report.source.source_type == "file_upload"
    assert report.source.source_label == "uploaded.mp4"
    assert report.source.source_url is None
    assert report.source.canonical_url is None
    assert report.source.platform is None
    assert report.source.content_id is None
    assert report.source.ingest_status == "uploaded"


def test_copy_uploaded_video_copies_content_without_copy2(monkeypatch, tmp_path: Path) -> None:
    upload_path = tmp_path / "upload.mp4"
    upload_path.write_bytes(b"video-content")
    destination_dir = tmp_path / "downloads"
    destination_dir.mkdir()

    def fail_copy2(*_args, **_kwargs):
        raise AssertionError("copy2 should not be used for Azure Files uploads.")

    monkeypatch.setattr("capyra_analytic_agent.service.shutil.copy2", fail_copy2)

    copied_path = ShortVideoAnalysisService._copy_uploaded_video(
        upload_path,
        destination_dir,
        "../source-label.mp4",
    )

    assert copied_path == destination_dir / "source-label.mp4"
    assert copied_path.read_bytes() == b"video-content"


def test_copy_uploaded_video_ignores_copy2_metadata_failure(
    monkeypatch, tmp_path: Path
) -> None:
    upload_path = tmp_path / "upload.mp4"
    upload_path.write_bytes(b"video-content")
    destination_dir = tmp_path / "downloads"
    destination_dir.mkdir()

    def fail_copy2(*_args, **_kwargs):
        raise PermissionError("[Errno 1] Operation not permitted")

    monkeypatch.setattr("capyra_analytic_agent.service.shutil.copy2", fail_copy2)

    copied_path = ShortVideoAnalysisService._copy_uploaded_video(
        upload_path,
        destination_dir,
        "uploaded.mp4",
    )

    assert copied_path.read_bytes() == b"video-content"


def test_copy_uploaded_video_removes_partial_destination_on_failure(
    monkeypatch, tmp_path: Path
) -> None:
    upload_path = tmp_path / "upload.mp4"
    upload_path.write_bytes(b"video-content")
    destination_dir = tmp_path / "downloads"
    destination_dir.mkdir()
    destination_path = destination_dir / "uploaded.mp4"

    def fail_copyfile(_source, destination):
        Path(destination).write_bytes(b"partial")
        raise OSError("disk full")

    monkeypatch.setattr("capyra_analytic_agent.service.shutil.copyfile", fail_copyfile)

    with pytest.raises(WorkspaceError, match="Uploaded video could not be copied"):
        ShortVideoAnalysisService._copy_uploaded_video(
            upload_path,
            destination_dir,
            "uploaded.mp4",
        )

    assert not destination_path.exists()


def test_service_rejects_long_video_before_any_ai_call(monkeypatch, tmp_path: Path) -> None:
    video_path = tmp_path / "video.mp4"
    video_path.write_bytes(b"video")
    monkeypatch.setattr("capyra_analytic_agent.service.probe_video", lambda *args, **kwargs: VideoProbe(duration_seconds=181, width=1080, height=1920, fps=30, has_audio=True))
    class ForbiddenAnalyzer:
        def __getattr__(self, name):
            raise AssertionError("No AI work is allowed for an ineligible video")
    service = ShortVideoAnalysisService(AppConfig(openai_api_key="test"), downloader=FakeDownloader(video_path), analyzer=ForbiddenAnalyzer())
    with pytest.raises(ValueError, match="180 seconds"):
        service.analyze(video_url="https://www.instagram.com/reel/abc123/", selected_skill_ids=["editing"], keep_artifacts=False)
