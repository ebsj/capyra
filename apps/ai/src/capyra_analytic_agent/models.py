"""Pydantic schemas for structured analysis."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

Platform = Literal["instagram_reels", "youtube_shorts", "tiktok"]
SourceKind = Literal[
    "public_url",
    "public_url_best_effort",
    "file_upload",
    "owned_asset",
    "connected_media",
]
AnalysisSkillId = Literal["content_strategy", "filming", "editing", "audio_music", "compliance"]
CANONICAL_ANALYSIS_SKILL_IDS: tuple[AnalysisSkillId, ...] = (
    "content_strategy",
    "filming",
    "editing",
    "audio_music",
    "compliance",
)
DEFAULT_ANALYSIS_CATALOG_VERSION = "2026-04-08-initial"
Score10 = float
Confidence = float


class StrictModel(BaseModel):
    """Base model with strict output requirements.

    The final report is generated through `responses.parse` and validated by
    Pydantic. For that reason, every schema in this file forbids extra keys so
    unexpected model output becomes an explicit failure instead of silent drift.
    """

    model_config = ConfigDict(extra="forbid")


class EvidenceItem(StrictModel):
    """Timestamped observation that anchors an inference to visible evidence."""

    timestamp_seconds: float = Field(ge=0, description="Timestamp of the observation.")
    kind: Literal["hook", "structure", "visual", "audio", "cta", "pacing", "general"]
    observation: str = Field(min_length=1, description="What was observed at this time.")
    transcript_quote: str | None = Field(
        default=None,
        description="Short supporting quote from the transcript when available.",
    )


class Recommendation(StrictModel):
    """Actionable improvement suggestion derived from observed evidence."""

    priority: Literal["high", "medium", "low"]
    title: str = Field(min_length=1)
    rationale: str = Field(min_length=1)
    action: str = Field(min_length=1)


class TranscriptSegment(StrictModel):
    """Time-bounded excerpt from the spoken transcript."""

    start_seconds: float = Field(ge=0)
    end_seconds: float = Field(ge=0)
    text: str = Field(min_length=1)

    @model_validator(mode="after")
    def _validate_time_range(self) -> "TranscriptSegment":
        if self.end_seconds < self.start_seconds:
            raise ValueError("end_seconds must be greater than or equal to start_seconds.")
        return self


class Transcript(StrictModel):
    """Structured transcript returned by the media pipeline."""

    text: str = ""
    language: str = "pt-BR"
    segments: list[TranscriptSegment] = Field(default_factory=list)

    @model_validator(mode="after")
    def _normalize_segments(self) -> "Transcript":
        if self.segments:
            ordered_segments = sorted(
                self.segments,
                key=lambda segment: (segment.start_seconds, segment.end_seconds, segment.text),
            )
            if ordered_segments != self.segments:
                self.segments = ordered_segments

            if not self.text.strip():
                self.text = " ".join(segment.text.strip() for segment in self.segments if segment.text).strip()
        return self


class PropertyScore(StrictModel):
    """Justified score for one evaluated property within a skill."""

    property_id: str = Field(min_length=1)
    label: str = Field(min_length=1)
    score: Score10 = Field(default=0.0, ge=0, le=10)
    rationale: str = Field(min_length=1)
    confidence: Confidence = Field(default=0.0, ge=0, le=1)


class TranscriptExcerpt(StrictModel):
    """Short transcript quote tied to a skill-specific conclusion."""

    start_seconds: float = Field(ge=0)
    end_seconds: float = Field(ge=0)
    text: str = Field(min_length=1)
    why_it_matters: str = Field(min_length=1)

    @model_validator(mode="after")
    def _validate_time_range(self) -> "TranscriptExcerpt":
        if self.end_seconds < self.start_seconds:
            raise ValueError("end_seconds must be greater than or equal to start_seconds.")
        return self


class SourceSection(StrictModel):
    """Technical metadata about the analyzed short video and local ingest result."""

    source_type: SourceKind
    source_label: str
    source_url: str | None = None
    canonical_url: str | None = None
    platform: Platform | None = None
    content_id: str | None = None
    duration_seconds: float = Field(ge=0)
    width: int = Field(ge=0)
    height: int = Field(ge=0)
    fps: float = Field(ge=0)
    has_audio: bool
    ingest_status: Literal["downloaded", "uploaded", "partial"]
    artifact_directory: str | None = None


class ContentSection(StrictModel):
    """High-level semantic interpretation of the video's topic and promise."""

    main_theme: str | None = None
    subtheme: str | None = None
    niche: str | None = None
    core_promise: str | None = None
    pain_point: str | None = None
    promised_transformation: str | None = None
    likely_target_audience: str | None = None
    confidence: Confidence = Field(default=0.0, ge=0, le=1)


class HookSection(StrictModel):
    """Description of how the video tries to capture attention at the start."""

    opening_line: str | None = None
    hook_type: (
        Literal[
            "curiosity",
            "mistake",
            "pain",
            "promise",
            "controversy",
            "list",
            "question",
            "story",
            "unknown",
        ]
        | None
    ) = None
    hook_strength_score: Score10 = Field(default=0.0, ge=0, le=10)
    hook_clarity_score: Score10 = Field(default=0.0, ge=0, le=10)
    time_to_hook_seconds: float | None = Field(default=None, ge=0)
    hook_delivery: Literal["visual", "spoken", "written", "mixed", "unclear"] | None = None
    confidence: Confidence = Field(default=0.0, ge=0, le=1)


class StructureSection(StrictModel):
    """Narrative and logical organization of the video."""

    opening_summary: str | None = None
    development_summary: str | None = None
    climax_or_payoff: str | None = None
    cta_summary: str | None = None
    has_storytelling: bool | None = None
    logical_flow_assessment: str | None = None
    structural_pattern: str | None = None
    confidence: Confidence = Field(default=0.0, ge=0, le=1)


class PacingSection(StrictModel):
    """Timing and rhythm signals derived from the video structure."""

    total_duration_seconds: float = Field(ge=0)
    time_to_value_seconds: float | None = Field(default=None, ge=0)
    time_to_cta_seconds: float | None = Field(default=None, ge=0)
    approximate_cut_count: int | None = Field(default=None, ge=0)
    rhythm_speed: str | None = None
    information_density: str | None = None
    pauses_and_acceleration: str | None = None
    scene_changes_summary: str | None = None
    confidence: Confidence = Field(default=0.0, ge=0, le=1)


class VisualSection(StrictModel):
    """Visual production and editing characteristics visible in the video."""

    has_face: bool | None = None
    framing: str | None = None
    setting: str | None = None
    shot_changes: str | None = None
    has_b_roll: bool | None = None
    on_screen_text: str | None = None
    text_legibility: str | None = None
    editing_patterns: str | None = None
    uses_captions: bool | None = None
    perceived_visual_quality: str | None = None
    dominant_visual_style: str | None = None
    confidence: Confidence = Field(default=0.0, ge=0, le=1)


class AudioLanguageSection(StrictModel):
    """Speech, tone, and sound design observations grounded in the audio track."""

    transcript: str = ""
    voice_tone: str | None = None
    energy_level: str | None = None
    diction_clarity: str | None = None
    music_usage: str | None = None
    sound_effects_usage: str | None = None
    dominant_emotion: str | None = None
    formality_level: str | None = None
    language_complexity: str | None = None
    confidence: Confidence = Field(default=0.0, ge=0, le=1)


class CTAOfferSection(StrictModel):
    """Call-to-action analysis, if the video asks the viewer to do something."""

    has_cta: bool | None = None
    cta_type: Literal["comment", "follow", "save", "share", "click", "buy", "unknown"] | None = None
    cta_strength_score: Score10 = Field(default=0.0, ge=0, le=10)
    cta_position: str | None = None
    matches_content: bool | None = None
    confidence: Confidence = Field(default=0.0, ge=0, le=1)


class ScoresSection(StrictModel):
    """Normalized 0-10 scores used for quick comparison across analysis areas."""

    hook_effectiveness: Score10 = Field(default=0.0, ge=0, le=10)
    structure_clarity: Score10 = Field(default=0.0, ge=0, le=10)
    pacing: Score10 = Field(default=0.0, ge=0, le=10)
    visual_quality: Score10 = Field(default=0.0, ge=0, le=10)
    audio_clarity: Score10 = Field(default=0.0, ge=0, le=10)
    cta_strength: Score10 = Field(default=0.0, ge=0, le=10)
    overall: Score10 = Field(default=0.0, ge=0, le=10)


class IntermediateAnalysis(StrictModel):
    """Evidence-first model emitted before the final report synthesis step.

    This structure intentionally stays closer to observations than conclusions.
    It gives the final synthesis prompt a grounded payload with timestamps,
    notes, and uncertainties, which helps reduce invented detail.
    """

    opening_line: str | None = None
    structural_pattern: str | None = None
    probable_target_audience: str | None = None
    time_to_value_seconds: float | None = Field(default=None, ge=0)
    time_to_cta_seconds: float | None = Field(default=None, ge=0)
    approximate_cut_count: int | None = Field(default=None, ge=0)
    hook_notes: list[str] = Field(default_factory=list)
    content_notes: list[str] = Field(default_factory=list)
    frame_observations: list[str] = Field(default_factory=list)
    visual_observations: list[str] = Field(default_factory=list)
    audio_observations: list[str] = Field(default_factory=list)
    cta_observations: list[str] = Field(default_factory=list)
    timeline_notes: list[str] = Field(default_factory=list)
    transcript_segments: list[TranscriptSegment] = Field(default_factory=list)
    evidence: list[EvidenceItem] = Field(default_factory=list)
    uncertainties: list[str] = Field(default_factory=list)


class AnalysisSkillSelection(StrictModel):
    """Scope chosen for a single analysis run."""

    catalog_version: str = Field(min_length=1)
    selected_skill_ids: list[AnalysisSkillId] = Field(min_length=1)


class ExecutedAnalysisSkill(StrictModel):
    """Structured result for one executed skill section."""

    skill_id: AnalysisSkillId
    status: Literal["completed", "insufficient_evidence", "failed"]
    evaluated_items: list[str] = Field(default_factory=list)
    summary: str = ""
    key_signals: list[str] = Field(default_factory=list)
    evidence: list[EvidenceItem] = Field(default_factory=list)
    evidence_gaps: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    disclaimer: str | None = None
    skill_score: Score10 = Field(default=0.0, ge=0, le=10)
    property_scores: list[PropertyScore] = Field(default_factory=list)
    detailed_assessment: str = ""
    strengths: list[str] = Field(default_factory=list)
    improvement_opportunities: list[str] = Field(default_factory=list)
    recommendations: list[Recommendation] = Field(default_factory=list)
    transcript_excerpts: list[TranscriptExcerpt] = Field(default_factory=list)


class ShortVideoAnalysisReport(StrictModel):
    """Final JSON contract returned by the AI HTTP API."""

    source: SourceSection
    catalog_version: str = Field(min_length=1)
    selected_skill_ids: list[AnalysisSkillId] = Field(min_length=1)
    transcript: Transcript = Field(default_factory=Transcript)
    executed_skills: list[ExecutedAnalysisSkill] = Field(default_factory=list)
    overall_score: Score10 | None = Field(default=None, ge=0, le=10)
    warnings: list[str] = Field(default_factory=list)
