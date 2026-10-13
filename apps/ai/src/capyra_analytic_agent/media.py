"""Local media inspection and frame extraction."""

from __future__ import annotations

import json
import re
import shutil
import subprocess
from dataclasses import dataclass
from fractions import Fraction
from pathlib import Path

from .errors import ExternalDependencyError, MediaProcessingError
from .models import TranscriptSegment

SCENE_TIMESTAMP_RE = re.compile(r"pts_time:(?P<timestamp>\d+(?:\.\d+)?)")


@dataclass(slots=True)
class VideoProbe:
    """Subset of ffprobe metadata used by the analysis pipeline."""

    duration_seconds: float
    width: int
    height: int
    fps: float
    has_audio: bool


@dataclass(slots=True)
class KeyframeArtifact:
    """Still image extracted at a specific timestamp for multimodal analysis."""

    timestamp_seconds: float
    path: Path


def ensure_binary(name: str) -> None:
    """Fail early when a required media binary is missing."""
    if shutil.which(name) is None:
        raise ExternalDependencyError(
            f"Required binary '{name}' was not found in PATH. Install it before running the AI service."
        )


def parse_ffprobe_output(payload: str) -> VideoProbe:
    """Parse ffprobe JSON payload into a typed object.

    The pipeline needs only a small, stable subset of the probe output. Keeping
    the parser narrow makes downstream code less sensitive to ffprobe format
    drift.
    """
    data = json.loads(payload)
    streams = data.get("streams", [])
    format_section = data.get("format", {})

    video_stream = next((stream for stream in streams if stream.get("codec_type") == "video"), None)
    if video_stream is None:
        raise MediaProcessingError("ffprobe did not return a video stream.")

    audio_stream = next((stream for stream in streams if stream.get("codec_type") == "audio"), None)
    duration_value = (
        format_section.get("duration")
        or video_stream.get("duration")
        or (audio_stream or {}).get("duration")
        or 0
    )
    fps_value = video_stream.get("avg_frame_rate") or video_stream.get("r_frame_rate") or "0/1"

    return VideoProbe(
        duration_seconds=max(float(duration_value), 0.0),
        width=int(video_stream.get("width") or 0),
        height=int(video_stream.get("height") or 0),
        fps=float(Fraction(fps_value)) if fps_value != "0/0" else 0.0,
        has_audio=audio_stream is not None,
    )


def probe_video(video_path: Path, timeout_seconds: int) -> VideoProbe:
    """Inspect a video using ffprobe."""
    ensure_binary("ffprobe")
    command = [
        "ffprobe",
        "-v",
        "error",
        "-print_format",
        "json",
        "-show_streams",
        "-show_format",
        str(video_path),
    ]
    completed = subprocess.run(
        command,
        capture_output=True,
        text=True,
        check=False,
        timeout=timeout_seconds,
    )
    if completed.returncode != 0:
        raise MediaProcessingError(completed.stderr.strip() or "ffprobe failed.")

    return parse_ffprobe_output(completed.stdout)


def extract_audio(video_path: Path, output_path: Path, timeout_seconds: int) -> Path:
    """Extract mono 16k WAV audio for transcription.

    A mono 16k PCM WAV file is a pragmatic default: it is simple for ffmpeg to
    generate, stable across platforms, and directly consumable by the
    transcription API without extra codec ambiguity.
    """
    ensure_binary("ffmpeg")
    command = [
        "ffmpeg",
        "-y",
        "-i",
        str(video_path),
        "-vn",
        "-ac",
        "1",
        "-ar",
        "16000",
        "-c:a",
        "pcm_s16le",
        str(output_path),
    ]
    completed = subprocess.run(
        command,
        capture_output=True,
        text=True,
        check=False,
        timeout=timeout_seconds,
    )
    if completed.returncode != 0:
        raise MediaProcessingError(completed.stderr.strip() or "ffmpeg audio extraction failed.")

    return output_path


def detect_scene_timestamps(
    video_path: Path,
    *,
    scene_threshold: float,
    max_candidates: int,
    timeout_seconds: int,
) -> list[float]:
    """Use ffmpeg scene detection to locate likely shot changes.

    `scene_threshold` controls how sensitive ffmpeg is to visual changes.
    Lower values produce more candidate cuts but also more noise, so the config
    is tuned as a balanced heuristic instead of a hard truth detector.
    """
    ensure_binary("ffmpeg")
    filter_arg = f"select='gt(scene,{scene_threshold})',showinfo"
    command = [
        "ffmpeg",
        "-hide_banner",
        "-i",
        str(video_path),
        "-vf",
        filter_arg,
        "-f",
        "null",
        "-",
    ]
    completed = subprocess.run(
        command,
        capture_output=True,
        text=True,
        check=False,
        timeout=timeout_seconds,
    )

    if completed.returncode not in {0, 255}:
        raise MediaProcessingError(completed.stderr.strip() or "ffmpeg scene detection failed.")

    timestamps = sorted(
        {
            round(float(match.group("timestamp")), 2)
            for match in SCENE_TIMESTAMP_RE.finditer(completed.stderr)
        }
    )
    return timestamps[:max_candidates]


def build_keyframe_timestamps(
    duration_seconds: float,
    scene_timestamps: list[float],
    *,
    transcript_segments: list[TranscriptSegment] | None = None,
    max_keyframes: int,
) -> list[float]:
    """Blend dense intro sampling with scene-based timestamps.

    The first seconds of a short video usually contain the hook, so the sampler keeps
    the intro dense even when later scene changes are more numerous. This
    favors capturing the opening promise over perfectly uniform coverage.
    """
    duration_seconds = max(duration_seconds, 0.0)
    if duration_seconds == 0:
        return [0.0]

    upper_bound = max(round(duration_seconds - 0.05, 2), 0.0)
    clamp = lambda value: min(round(value, 2), upper_bound)

    # Fixed anchors preserve consistent coverage of the hook, middle, and tail
    # even when scene detection finds too few or too many candidate changes.
    anchors = [0.0, clamp(0.6), clamp(1.5)]
    if transcript_segments:
        anchors.extend(
            clamp(value)
            for segment in transcript_segments
            for value in (segment.start_seconds, segment.end_seconds)
        )

        midpoint_segment = transcript_segments[len(transcript_segments) // 2]
        anchors.extend(
            [clamp(midpoint_segment.start_seconds), clamp(midpoint_segment.end_seconds)]
        )

    if duration_seconds > 4:
        anchors.append(clamp(duration_seconds * 0.4))
    if duration_seconds > 8:
        anchors.append(clamp(duration_seconds * 0.7))
    anchors.append(clamp(duration_seconds - 0.5))

    combined = sorted(
        {clamp(value) for value in [*anchors, *scene_timestamps] if 0 <= value <= duration_seconds}
    )

    if len(combined) <= max_keyframes:
        return combined

    # Reserve part of the budget for the first 3 seconds because short videos often
    # front-load hook text, opening speech, and the first edit burst there.
    intro = [timestamp for timestamp in combined if timestamp <= 3.0][: min(3, max_keyframes)]
    remainder = [timestamp for timestamp in combined if timestamp not in intro]
    slots = max_keyframes - len(intro)
    if slots <= 0:
        return intro[:max_keyframes]

    step = len(remainder) / slots
    sampled = []
    for index in range(slots):
        sampled.append(remainder[min(int(index * step), len(remainder) - 1)])

    deduped = []
    for timestamp in [*intro, *sampled]:
        if timestamp not in deduped:
            deduped.append(timestamp)

    return deduped[:max_keyframes]


def extract_keyframes(
    video_path: Path,
    timestamps: list[float],
    output_dir: Path,
    *,
    frame_width: int,
    timeout_seconds: int,
) -> list[KeyframeArtifact]:
    """Extract one image per target timestamp.

    Keyframes are resized before upload so the OpenAI request remains bounded
    in payload size without losing the layout and text cues needed by the
    analysis prompts.
    """
    ensure_binary("ffmpeg")
    output_dir.mkdir(parents=True, exist_ok=True)
    artifacts: list[KeyframeArtifact] = []

    for index, timestamp in enumerate(timestamps, start=1):
        output_path = output_dir / f"frame-{index:02d}-{timestamp:.2f}.jpg"
        command = [
            "ffmpeg",
            "-y",
            "-ss",
            f"{timestamp:.3f}",
            "-i",
            str(video_path),
            "-frames:v",
            "1",
            "-vf",
            f"scale='min({frame_width},iw)':-2",
            "-q:v",
            "2",
            str(output_path),
        ]
        completed = subprocess.run(
            command,
            capture_output=True,
            text=True,
            check=False,
            timeout=timeout_seconds,
        )
        if completed.returncode != 0:
            raise MediaProcessingError(
                completed.stderr.strip() or "ffmpeg frame extraction failed."
            )

        artifacts.append(KeyframeArtifact(timestamp_seconds=timestamp, path=output_path))

    return artifacts
