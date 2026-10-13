from capyra_analytic_agent.media import build_keyframe_timestamps, parse_ffprobe_output
from capyra_analytic_agent.models import TranscriptSegment


def test_parse_ffprobe_output_extracts_video_and_audio_metadata() -> None:
    payload = """
    {
      "streams": [
        {
          "codec_type": "video",
          "width": 1080,
          "height": 1920,
          "avg_frame_rate": "30000/1001"
        },
        {
          "codec_type": "audio",
          "duration": "12.50"
        }
      ],
      "format": {
        "duration": "12.50"
      }
    }
    """

    probe = parse_ffprobe_output(payload)

    assert probe.duration_seconds == 12.5
    assert probe.width == 1080
    assert probe.height == 1920
    assert round(probe.fps, 2) == 29.97
    assert probe.has_audio is True


def test_build_keyframe_timestamps_respects_limit_and_keeps_intro_density() -> None:
    timestamps = build_keyframe_timestamps(
        14.0,
        [0.2, 0.8, 1.2, 2.9, 4.1, 6.4, 7.8, 9.5, 11.2, 13.2],
        transcript_segments=[
            TranscriptSegment(start_seconds=0.4, end_seconds=1.8, text="Hook"),
            TranscriptSegment(start_seconds=4.0, end_seconds=6.2, text="Value"),
            TranscriptSegment(start_seconds=9.6, end_seconds=13.0, text="CTA"),
        ],
        max_keyframes=6,
    )

    assert len(timestamps) <= 6
    assert timestamps[0] == 0.0
    assert any(timestamp <= 1.5 for timestamp in timestamps)
    assert any(abs(timestamp - 4.0) < 0.2 for timestamp in timestamps)
    assert any(abs(timestamp - 9.6) < 0.2 for timestamp in timestamps)
