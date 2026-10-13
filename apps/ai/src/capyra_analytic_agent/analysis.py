"""OpenAI-backed transcription and multimodal analysis."""

from __future__ import annotations

import base64
import json
from pathlib import Path
from typing import Any, TypeVar

from openai import OpenAI
from pydantic import ValidationError
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from .config import AppConfig
from .errors import OpenAIAnalysisError
from .language import normalize_requested_language, translate_static_text
from .models import (
    AnalysisSkillId,
    AnalysisSkillSelection,
    CANONICAL_ANALYSIS_SKILL_IDS,
    DEFAULT_ANALYSIS_CATALOG_VERSION,
    ExecutedAnalysisSkill,
    IntermediateAnalysis,
    PropertyScore,
    ShortVideoAnalysisReport,
    Transcript,
    TranscriptExcerpt,
    TranscriptSegment,
    StrictModel,
)
from .prompts import (
    get_evidence_system_prompt,
    get_evidence_user_prompt,
    get_report_system_prompt,
    get_report_user_prompt,
)
from .skill_localization import localize_skill_blueprint

ModelT = TypeVar("ModelT", bound=StrictModel)
STRUCTURED_OUTPUT_BUDGETS: dict[type[StrictModel], tuple[int, ...]] = {
    IntermediateAnalysis: (6000, 12000),
    ShortVideoAnalysisReport: (7000, 14000),
}

JSON_ONLY_TRANSCRIPTION_PREFIXES = ("gpt-4o-transcribe", "gpt-4o-mini-transcribe")

SKILL_BLUEPRINTS: dict[AnalysisSkillId, dict[str, object]] = {
    "content_strategy": {
        "name": "conteudo e estrategia",
        "persona": "Estrategista de conteudo e performance para short-form, focado em hook, clareza de promessa, progressao e proximo ajuste.",
        "coverage_summary": "Script, promessa e sinais observaveis de engajamento.",
        "criteria": ["script_quality", "observable_engagement_potential"],
        "evaluated_items": ["script_quality", "observable_engagement_potential"],
        "scoring_properties": [
            {
                "property_id": "script_quality",
                "label": "Qualidade do roteiro",
                "guidance": "Clareza da mensagem, promessa inicial, progressao e especificidade.",
            },
            {
                "property_id": "observable_engagement_potential",
                "label": "Potencial observavel de engajamento",
                "guidance": "Capacidade observavel de prender atencao e estimular proximo passo.",
            },
        ],
        "insufficient_summary": "Nao ha evidencia suficiente para concluir sobre a estrategia de conteudo.",
        "insufficient_gap": "A evidencia disponivel nao mostra script, promessa ou sinais consistentes de engajamento.",
        "insufficient_warning": "Seção com evidencia limitada.",
        "safe_language_notes": [
            "Engajamento e apenas estimativa observavel no video, nunca metrica real de plataforma."
        ],
        "disclaimer": "Engajamento e apenas estimativa observavel no video, nunca metrica real de plataforma.",
    },
    "filming": {
        "name": "filmagem",
        "persona": "Diretor(a) de fotografia e mobile videographer especializado(a) em enquadramento, captacao e linguagem visual para shorts.",
        "coverage_summary": "Qualidade de captura, enquadramento e linguagem cinematografica.",
        "criteria": ["filming_quality", "cinematographic_language", "videography"],
        "evaluated_items": ["filming_quality", "cinematographic_language", "videography"],
        "scoring_properties": [
            {
                "property_id": "filming_quality",
                "label": "Qualidade de captacao",
                "guidance": "Nitidez, estabilidade, iluminacao e consistencia da imagem.",
            },
            {
                "property_id": "cinematographic_language",
                "label": "Linguagem cinematografica",
                "guidance": "Composicao, enquadramento, profundidade e intencao visual.",
            },
            {
                "property_id": "videography",
                "label": "Execucao de videografia",
                "guidance": "Movimento, variacao de planos e controle visual ao longo do video.",
            },
        ],
        "insufficient_summary": "Nao ha evidencia suficiente para concluir sobre a filmagem.",
        "insufficient_gap": "A evidencia disponivel nao mostra captacao, enquadramento ou linguagem cinematografica suficientes.",
        "insufficient_warning": "Seção com evidencia limitada.",
        "safe_language_notes": [],
        "disclaimer": None,
    },
    "editing": {
        "name": "edicao",
        "persona": "Editor(a) de videos curtos focado(a) em retenção, ritmo e legibilidade visual.",
        "coverage_summary": "Edicao, dinamismo e overlays de texto.",
        "criteria": ["editing", "dynamism", "text_overlay"],
        "evaluated_items": ["editing", "dynamism", "text_overlay"],
        "scoring_properties": [
            {
                "property_id": "editing",
                "label": "Qualidade da edicao",
                "guidance": "Cortes, continuidade e clareza do encadeamento visual.",
            },
            {
                "property_id": "dynamism",
                "label": "Dinamismo",
                "guidance": "Ritmo, energia visual e variacao suficiente para sustentar retenção.",
            },
            {
                "property_id": "text_overlay",
                "label": "Uso de texto em tela",
                "guidance": "Legibilidade, utilidade e sincronizacao dos overlays com a narrativa.",
            },
        ],
        "insufficient_summary": "Nao ha evidencia suficiente para concluir sobre a edicao.",
        "insufficient_gap": "A evidencia disponivel nao mostra cortes, ritmo ou texto em tela com clareza suficiente.",
        "insufficient_warning": "Seção com evidencia limitada.",
        "safe_language_notes": [],
        "disclaimer": None,
    },
    "audio_music": {
        "name": "audio e musica",
        "persona": "Sound designer e editor(a) de audio para social video, focado(a) em voz, trilha e clareza sonora.",
        "coverage_summary": "Qualidade da voz e escolha musical.",
        "criteria": ["voice_quality", "music_choice"],
        "evaluated_items": ["voice_quality", "music_choice"],
        "scoring_properties": [
            {
                "property_id": "voice_quality",
                "label": "Qualidade da voz",
                "guidance": "Clareza, volume, dicção e intelligibilidade da fala.",
            },
            {
                "property_id": "music_choice",
                "label": "Escolha musical",
                "guidance": "Compatibilidade da trilha com o tom, energia e contexto do video.",
            },
        ],
        "insufficient_summary": "Nao ha evidencia suficiente para concluir sobre audio e musica.",
        "insufficient_gap": "A evidencia disponivel nao mostra voz, trilha ou mixagem de audio com clareza suficiente.",
        "insufficient_warning": "Seção com evidencia limitada.",
        "safe_language_notes": [],
        "disclaimer": None,
    },
    "compliance": {
        "name": "compliance",
        "persona": "Revisor(a) de direitos autorais e risco de compliance para marketing em video curto, com linguagem clara e nao juridica.",
        "coverage_summary": "Riscos observaveis de copyright e compliance.",
        "criteria": ["copyright_risk"],
        "evaluated_items": ["copyright_risk"],
        "scoring_properties": [
            {
                "property_id": "copyright_risk",
                "label": "Risco observavel de copyright",
                "guidance": "Sinais visiveis ou audiveis que sugerem material protegido, atribuicao ou reutilizacao sensivel.",
            },
        ],
        "insufficient_summary": "Nao ha evidencia suficiente para concluir sobre compliance.",
        "insufficient_gap": "A evidencia disponivel nao mostra sinais suficientes para avaliar risco de copyright ou compliance.",
        "insufficient_warning": "Seção com evidencia limitada.",
        "safe_language_notes": [
            "Copyright e uma avaliacao de risco com base em evidencias visiveis e audiveis, nao aconselhamento juridico."
        ],
        "disclaimer": "Copyright e uma avaliacao de risco com base em evidencias visiveis e audiveis, nao aconselhamento juridico.",
    },
}


def _validate_skill_blueprints() -> None:
    criteria_counts: dict[str, int] = {}
    missing_safe_language_notes: list[str] = []

    for skill_id, blueprint in SKILL_BLUEPRINTS.items():
        for criterion in blueprint["criteria"]:
            key = str(criterion)
            criteria_counts[key] = criteria_counts.get(key, 0) + 1

        criteria_set = {str(criterion).lower() for criterion in blueprint["criteria"]}
        scoring_property_ids = {
            str(property["property_id"]).lower() for property in blueprint["scoring_properties"]
        }
        if scoring_property_ids != criteria_set:
            raise ValueError(
                f"Skill {skill_id} must keep scoring properties aligned with its criteria."
            )

        requires_notes = {
            "observable_engagement_potential",
            "copyright_risk",
        } & criteria_set
        if requires_notes and not any(str(note).strip() for note in blueprint["safe_language_notes"]):
            missing_safe_language_notes.append(str(skill_id))

    duplicates = [criterion for criterion, count in criteria_counts.items() if count > 1]

    if duplicates:
        duplicate_summary = ", ".join(sorted(duplicates))
        raise ValueError(
            f"Skill criteria must be exclusive across the catalog. Duplicate criteria: {duplicate_summary}."
        )

    if missing_safe_language_notes:
        raise ValueError(
            "Skills with engagement or copyright coverage must define safe-language notes. "
            f"Missing notes for: {', '.join(sorted(missing_safe_language_notes))}."
        )


_validate_skill_blueprints()


def build_analysis_skill_selection(
    selected_skill_ids: list[AnalysisSkillId] | None,
    catalog_version: str | None = None,
) -> AnalysisSkillSelection:
    """Normalize the requested skill scope into a stable selection payload."""
    skill_ids = list(dict.fromkeys(selected_skill_ids or CANONICAL_ANALYSIS_SKILL_IDS))
    version = (catalog_version or DEFAULT_ANALYSIS_CATALOG_VERSION).strip() or DEFAULT_ANALYSIS_CATALOG_VERSION
    return AnalysisSkillSelection(catalog_version=version, selected_skill_ids=skill_ids)


def build_selected_skill_context(selection: AnalysisSkillSelection) -> dict[str, object]:
    """Build a compact prompt payload describing the selected skill scope."""
    return {
        "catalog_version": selection.catalog_version,
        "selected_skill_ids": selection.selected_skill_ids,
        "skills": [build_prompt_skill_blueprint(skill_id) for skill_id in selection.selected_skill_ids],
    }


def build_prompt_skill_blueprint(skill_id: AnalysisSkillId) -> dict[str, object]:
    """Describe one skill with stable metadata for the model prompt."""
    blueprint = SKILL_BLUEPRINTS[skill_id]
    return {
        "skill_id": skill_id,
        "name": blueprint["name"],
        "persona": blueprint["persona"],
        "coverage_summary": blueprint["coverage_summary"],
        "criteria": blueprint["criteria"],
        "evaluated_items": blueprint["evaluated_items"],
        "scoring_properties": blueprint["scoring_properties"],
        "safe_language_notes": blueprint["safe_language_notes"],
        "disclaimer": blueprint["disclaimer"],
        "insufficient_summary": blueprint["insufficient_summary"],
        "insufficient_gap": blueprint["insufficient_gap"],
        "insufficient_warning": blueprint["insufficient_warning"],
    }


def build_localized_skill_blueprint(skill_id: AnalysisSkillId, language: str = "pt-BR") -> dict[str, object]:
    """Describe one skill with report-facing copy for normalization fallbacks."""
    return localize_skill_blueprint(build_prompt_skill_blueprint(skill_id), language)


def normalize_report(
    report: ShortVideoAnalysisReport,
    selection: AnalysisSkillSelection,
    transcript: Transcript,
    language: str = "pt-BR",
) -> ShortVideoAnalysisReport:
    """Force the final report to cover exactly the selected skill scope."""
    selected_skill_ids = list(dict.fromkeys(selection.selected_skill_ids))
    executed_by_skill = {skill.skill_id: skill for skill in report.executed_skills}
    normalized_skills: list[ExecutedAnalysisSkill] = []

    for skill_id in selected_skill_ids:
        skill = executed_by_skill.get(skill_id)
        if skill is None:
            normalized_skills.append(build_insufficient_evidence_skill(skill_id, language))
            continue

        normalized_skills.append(_normalize_skill_result(skill, language))

    warnings = list(dict.fromkeys(report.warnings))
    overall_score = _calculate_overall_score(normalized_skills)

    return report.model_copy(
        update={
            "catalog_version": selection.catalog_version or report.catalog_version,
            "selected_skill_ids": selected_skill_ids,
            "executed_skills": normalized_skills,
            "warnings": warnings,
            "transcript": transcript,
            "overall_score": overall_score,
        }
    )


def build_insufficient_evidence_skill(skill_id: AnalysisSkillId, language: str = "pt-BR") -> ExecutedAnalysisSkill:
    """Create a fallback section when a selected skill was not returned by the model."""
    blueprint = build_localized_skill_blueprint(skill_id, language)
    warning = blueprint["insufficient_warning"]
    warnings = [warning] if isinstance(warning, str) and warning else []
    disclaimer = blueprint["disclaimer"]
    return ExecutedAnalysisSkill(
        skill_id=skill_id,
        status="insufficient_evidence",
        evaluated_items=list(blueprint["evaluated_items"]),
        summary=str(blueprint["insufficient_summary"]),
        key_signals=[],
        evidence=[],
        evidence_gaps=[str(blueprint["insufficient_gap"])],
        warnings=warnings,
        disclaimer=str(disclaimer) if isinstance(disclaimer, str) and disclaimer else None,
        skill_score=0.0,
        property_scores=[],
        detailed_assessment=str(blueprint["insufficient_summary"]),
        strengths=[],
        improvement_opportunities=[],
        recommendations=[],
        transcript_excerpts=[],
    )


def _normalize_skill_result(skill: ExecutedAnalysisSkill, language: str = "pt-BR") -> ExecutedAnalysisSkill:
    """Fill in missing skill metadata without changing model-provided evidence."""
    blueprint = build_localized_skill_blueprint(skill.skill_id, language)
    normalized_language = normalize_requested_language(language)
    disclaimer = skill.disclaimer
    if normalized_language != "pt-BR" and isinstance(blueprint["disclaimer"], str):
        disclaimer = str(blueprint["disclaimer"])
    elif disclaimer is None and isinstance(blueprint["disclaimer"], str):
        disclaimer = str(blueprint["disclaimer"])

    evaluated_items = skill.evaluated_items or [str(item) for item in blueprint["evaluated_items"]]
    summary = skill.summary.strip() if skill.summary.strip() else str(blueprint["insufficient_summary"])
    detailed_assessment = (
        skill.detailed_assessment.strip()
        if skill.detailed_assessment.strip()
        else summary
    )
    property_score_labels = {
        str(property["property_id"]): str(property["label"])
        for property in blueprint["scoring_properties"]
    }
    property_scores = [
        item.model_copy(
            update={
                "label": property_score_labels.get(item.property_id, item.label),
            }
        )
        for item in list(skill.property_scores)
    ]
    if not property_scores and skill.status == "completed":
        property_scores = [
            PropertyScore(
                property_id=str(property["property_id"]),
                label=str(property["label"]),
                score=skill.skill_score,
                rationale=detailed_assessment,
                confidence=0.5,
            )
            for property in blueprint["scoring_properties"]
        ]

    strengths = list(skill.strengths)
    if not strengths and summary:
        strengths = [summary]

    improvement_opportunities = list(skill.improvement_opportunities)
    if not improvement_opportunities:
        if skill.evidence_gaps:
            improvement_opportunities = [skill.evidence_gaps[0]]
        elif skill.status == "completed":
            improvement_opportunities = [
                f"Deepen {blueprint['name']} in the next cut to improve consistency."
                if normalized_language == "en"
                else f"Aprofunde {blueprint['name']} no proximo corte para elevar a consistencia."
            ]

    recommendations = list(skill.recommendations)
    if not recommendations and skill.status == "completed":
        first_opportunity = improvement_opportunities[0] if improvement_opportunities else summary
        recommendations = [
            Recommendation(
                priority="medium",
                title=(
                    f"Review {blueprint['name']}"
                    if normalized_language == "en"
                    else f"Revisar {blueprint['name']}"
                ),
                rationale=first_opportunity,
                action=(
                    "Apply this learning in the next video to strengthen the next iteration."
                    if normalized_language == "en"
                    else "Aplique este aprendizado no proximo video para fortalecer a proxima iteracao."
                ),
            )
        ]
    warnings = list(dict.fromkeys(skill.warnings))
    transcript_excerpts = list(skill.transcript_excerpts)

    if skill.status == "insufficient_evidence" and not warnings:
        warning = blueprint["insufficient_warning"]
        if isinstance(warning, str) and warning:
            warnings.append(warning)

    return skill.model_copy(
        update={
            "evaluated_items": evaluated_items,
            "summary": summary,
            "detailed_assessment": detailed_assessment,
            "property_scores": property_scores,
            "strengths": strengths,
            "improvement_opportunities": improvement_opportunities,
            "recommendations": recommendations,
            "transcript_excerpts": transcript_excerpts,
            "warnings": warnings,
            "disclaimer": disclaimer,
        }
    )


def _calculate_overall_score(skills: list[ExecutedAnalysisSkill]) -> float | None:
    completed_scores = [skill.skill_score for skill in skills if skill.status == "completed"]
    if not completed_scores:
        return None

    return round(sum(completed_scores) / len(completed_scores), 1)


class OpenAIShortVideoAnalyzer:
    """OpenAI integration for transcription and structured analysis.

    The analyzer uses a two-step flow: first gather evidence from transcript
    plus keyframes, then synthesize the final JSON report. Both steps are
    constrained by Pydantic schemas so the service has a stable machine-readable
    contract.
    """

    def __init__(self, config: AppConfig, client: OpenAI | None = None) -> None:
        self.config = config
        self.client = client or OpenAI(
            api_key=config.openai_api_key,
            timeout=float(config.request_timeout_seconds),
        )

    def _build_transcription_request_kwargs(self) -> dict[str, Any]:
        """Choose the transcription payload supported by the configured model.

        The newer `gpt-4o-transcribe*` models only accept `json`, while legacy
        transcription models still support `verbose_json` plus timestamp
        granularities. Using the wrong format causes a hard API failure before
        analysis can start.
        """
        if self.config.transcription_model.startswith(JSON_ONLY_TRANSCRIPTION_PREFIXES):
            return {"response_format": "json"}

        return {
            "response_format": "verbose_json",
            "timestamp_granularities": ["segment"],
        }

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        retry=retry_if_exception_type(OpenAIAnalysisError),
        reraise=True,
    )
    def transcribe_audio(self, audio_path: Path, *, language: str) -> Transcript:
        """Transcribe extracted audio with OpenAI.

        The method retries transient API failures because transcription is a
        hard dependency for spoken-content analysis and network hiccups should
        not fail the whole run on the first attempt.
        """
        try:
            with audio_path.open("rb") as audio_file:
                response = self.client.audio.transcriptions.create(
                    model=self.config.transcription_model,
                    file=audio_file,
                    **self._build_transcription_request_kwargs(),
                )
        except Exception as exc:  # pragma: no cover - network/API failure
            raise OpenAIAnalysisError(f"Audio transcription failed: {exc}") from exc

        if isinstance(response, str):
            return Transcript(text=response.strip(), language=language, segments=[])

        text = getattr(response, "text", None) or ""
        transcript_language = getattr(response, "language", None) or language
        segments_raw = getattr(response, "segments", None) or []
        segments: list[TranscriptSegment] = []
        for segment in segments_raw:
            start_seconds = float(getattr(segment, "start", 0.0))
            end_seconds = float(getattr(segment, "end", start_seconds))
            segment_text = str(getattr(segment, "text", "")).strip()
            if not segment_text:
                continue
            segments.append(
                TranscriptSegment(
                    start_seconds=start_seconds,
                    end_seconds=end_seconds,
                    text=segment_text,
                )
            )

        if not text.strip() and segments:
            text = " ".join(segment.text for segment in segments).strip()

        transcript = Transcript(
            text=text.strip(),
            language=str(transcript_language or language),
            segments=segments,
        )
        if not transcript.text.strip():
            raise OpenAIAnalysisError("Audio transcription returned an empty response.")

        return transcript

    def extract_evidence(
        self,
        *,
        source_context: str,
        transcript: Transcript,
        keyframes: list[tuple[float, Path]],
        language: str,
    ) -> IntermediateAnalysis:
        """Collect grounded evidence from transcript, keyframes, and source context."""
        normalized_language = normalize_requested_language(language)
        content = self._build_multimodal_payload(
            prompt=get_evidence_user_prompt(normalized_language),
            source_context=source_context,
            transcript=transcript,
            keyframes=keyframes,
            language=normalized_language,
        )
        return self._parse_response(
            model=self.config.analysis_model,
            schema=IntermediateAnalysis,
            system_prompt=get_evidence_system_prompt(normalized_language),
            user_content=content,
        )

    def synthesize_report(
        self,
        *,
        source_context: str,
        transcript: Transcript,
        evidence: IntermediateAnalysis,
        selection: AnalysisSkillSelection,
        language: str,
    ) -> ShortVideoAnalysisReport:
        """Turn evidence and source context into the final report JSON."""
        normalized_language = normalize_requested_language(language)
        user_content = [
            {"type": "input_text", "text": get_report_user_prompt(normalized_language)},
            {"type": "input_text", "text": source_context},
            {
                    "type": "input_text",
                    "text": (
                    translate_static_text(normalized_language, "selection_json_label")
                        + f"{json.dumps(build_selected_skill_context(selection), ensure_ascii=False, indent=2)}"
                    ),
                },
            {
                    "type": "input_text",
                    "text": (
                        translate_static_text(normalized_language, "transcript_text_label")
                        + f"{transcript.text or translate_static_text(normalized_language, 'no_speech')}"
                    ),
                },
            {
                    "type": "input_text",
                    "text": (
                        translate_static_text(normalized_language, "transcript_json_label")
                        + f"{json.dumps(transcript.model_dump(mode='json'), ensure_ascii=False, indent=2)}"
                    ),
                },
            {
                    "type": "input_text",
                    "text": (
                        translate_static_text(normalized_language, "evidence_json_label")
                        + f"{json.dumps(evidence.model_dump(mode='json'), ensure_ascii=False, indent=2)}"
                    ),
                },
        ]
        return self._parse_response(
            model=self.config.analysis_model,
            schema=ShortVideoAnalysisReport,
            system_prompt=get_report_system_prompt(normalized_language),
            user_content=user_content,
        )

    def _build_multimodal_payload(
        self,
        *,
        prompt: str,
        source_context: str,
        transcript: Transcript,
        keyframes: list[tuple[float, Path]],
        language: str,
    ) -> list[dict[str, Any]]:
        """Build the multimodal user payload sent to the Responses API.

        The payload mirrors the requested analysis language while reinforcing
        the rule that unsupported claims should remain null or uncertain.
        """
        payload: list[dict[str, Any]] = [
            {"type": "input_text", "text": prompt},
            {"type": "input_text", "text": source_context},
            {
                "type": "input_text",
                "text": (
                    translate_static_text(language, "transcript_text_label")
                    + f"{transcript.text or translate_static_text(language, 'no_speech_or_audio')}"
                ),
            },
            {
                "type": "input_text",
                "text": (
                    translate_static_text(language, "transcript_json_label")
                    + f"{json.dumps(transcript.model_dump(mode='json'), ensure_ascii=False, indent=2)}"
                ),
            },
        ]

        for timestamp_seconds, frame_path in keyframes:
            payload.append(
                {
                    "type": "input_text",
                    "text": translate_static_text(language, "keyframe_at_timestamp").format(
                        timestamp=timestamp_seconds
                    ),
                }
            )
            payload.append(
                {
                    "type": "input_image",
                    "image_url": self._build_data_url(frame_path),
                    "detail": "low",
                }
            )

        return payload

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        retry=retry_if_exception_type(OpenAIAnalysisError),
        reraise=True,
    )
    def _parse_response(
        self,
        *,
        model: str,
        schema: type[ModelT],
        system_prompt: str,
        user_content: list[dict[str, Any]],
    ) -> ModelT:
        """Parse a structured response using the OpenAI Responses API.

        `responses.parse` plus a strict Pydantic schema is the contract that
        keeps the report shape stable. If parsing fails, the error is surfaced
        instead of accepting loosely structured text.
        """
        budgets = STRUCTURED_OUTPUT_BUDGETS.get(schema, (6000, 12000))
        last_error: Exception | None = None

        for max_output_tokens in budgets:
            try:
                if not hasattr(self.client.responses, "parse"):
                    raise OpenAIAnalysisError(
                        "The installed OpenAI SDK does not expose responses.parse()."
                    )

                response = self.client.responses.parse(
                    model=model,
                    reasoning={"effort": "medium"},
                    text={"verbosity": "low"},
                    instructions=system_prompt,
                    input=[{"role": "user", "content": user_content}],
                    max_output_tokens=max_output_tokens,
                    text_format=schema,
                )
            except OpenAIAnalysisError:
                raise
            except Exception as exc:  # pragma: no cover - network/API failure
                if self._is_likely_truncation_error(exc):
                    last_error = exc
                    continue
                raise OpenAIAnalysisError(f"Structured analysis failed: {exc}") from exc

            incomplete_reason = getattr(
                getattr(response, "incomplete_details", None), "reason", None
            )
            parsed = getattr(response, "output_parsed", None)
            if isinstance(parsed, schema):
                return parsed

            output_text = getattr(response, "output_text", None)
            if output_text:
                try:
                    return schema.model_validate_json(output_text)
                except Exception as exc:  # pragma: no cover - defensive
                    last_error = exc
            else:
                last_error = OpenAIAnalysisError(
                    "Structured analysis returned no parseable content."
                )

            if incomplete_reason != "max_output_tokens" and not self._is_likely_truncation_error(
                last_error
            ):
                break

        if isinstance(last_error, OpenAIAnalysisError):
            raise last_error

        if last_error is not None:
            raise OpenAIAnalysisError(
                "Structured analysis returned invalid or truncated JSON. "
                "The model likely exceeded the output budget."
            ) from last_error

        raise OpenAIAnalysisError("Structured analysis returned no usable output.")

    @staticmethod
    def _build_data_url(path: Path) -> str:
        """Convert a local frame into a data URL accepted by image input."""
        media_type = "image/jpeg" if path.suffix.lower() in {".jpg", ".jpeg"} else "image/png"
        encoded = base64.b64encode(path.read_bytes()).decode("utf-8")
        return f"data:{media_type};base64,{encoded}"

    @staticmethod
    def _is_likely_truncation_error(error: Exception | None) -> bool:
        """Detect JSON parse failures that look like incomplete model output."""
        if error is None:
            return False

        if isinstance(error, ValidationError):
            for item in error.errors(include_url=False):
                message = str(item.get("msg", "")).lower()
                if item.get("type") == "json_invalid" and any(
                    fragment in message
                    for fragment in (
                        "eof while parsing",
                        "unterminated string",
                        "unexpected end",
                    )
                ):
                    return True

        message = str(error).lower()
        return any(
            fragment in message
            for fragment in (
                "eof while parsing",
                "unterminated string",
                "unexpected end",
            )
        )
