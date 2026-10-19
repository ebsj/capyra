"""Shared test helpers."""

from __future__ import annotations

from capyra_analytic_agent.models import (
    AnalysisSkillId,
    DEFAULT_ANALYSIS_CATALOG_VERSION,
    EvidenceItem,
    ExecutedAnalysisSkill,
    PropertyScore,
    Recommendation,
    ShortVideoAnalysisReport,
    Transcript,
    TranscriptExcerpt,
    TranscriptSegment,
    SourceSection,
)


def build_transcript(
    *,
    text: str | None = None,
    language: str = "pt-BR",
    segments: list[TranscriptSegment] | None = None,
) -> Transcript:
    default_segments = segments or [
        TranscriptSegment(start_seconds=0.0, end_seconds=1.4, text="Pare de perder tempo com video fraco."),
        TranscriptSegment(start_seconds=1.4, end_seconds=5.2, text="Aqui esta a ideia que sustenta a abertura."),
        TranscriptSegment(start_seconds=5.2, end_seconds=10.8, text="Fecha com um CTA simples e claro."),
    ]
    transcript_text = text or " ".join(segment.text for segment in default_segments)
    return Transcript(text=transcript_text, language=language, segments=default_segments)


def build_property_scores(skill_id: AnalysisSkillId, skill_score: float) -> list[PropertyScore]:
    property_labels: dict[AnalysisSkillId, list[tuple[str, str]]] = {
        "content_strategy": [
            ("script_quality", "Qualidade do roteiro"),
            ("observable_engagement_potential", "Potencial observavel de engajamento"),
        ],
        "filming": [
            ("filming_quality", "Qualidade de captacao"),
            ("cinematographic_language", "Linguagem cinematografica"),
            ("videography", "Execucao de videografia"),
        ],
        "editing": [
            ("editing", "Qualidade da edicao"),
            ("dynamism", "Dinamismo"),
            ("text_overlay", "Uso de texto em tela"),
        ],
        "audio_music": [
            ("voice_quality", "Qualidade da voz"),
            ("music_choice", "Escolha musical"),
        ],
        "compliance": [
            ("copyright_risk", "Risco observavel de copyright"),
        ],
    }

    return [
        PropertyScore(
            property_id=property_id,
            label=label,
            score=skill_score,
            rationale=f"{label} esta consistente com a leitura geral de {skill_id}.",
            confidence=0.9,
        )
        for property_id, label in property_labels[skill_id]
    ]


def build_recommendations(skill_id: AnalysisSkillId, improvement: str | None = None) -> list[Recommendation]:
    default_improvement = improvement or f"Reforce {skill_id} na proxima versao do corte."
    return [
        Recommendation(
            priority="high",
            title=f"Melhorar {skill_id}",
            rationale=default_improvement,
            action="Ajuste a proxima iteracao com base nesta oportunidade e valide o impacto no hook e na retenção.",
        )
    ]


def build_transcript_excerpts(
    skill_id: AnalysisSkillId,
    *,
    transcript: Transcript | None = None,
) -> list[TranscriptExcerpt]:
    transcript = transcript or build_transcript()
    first_segment = transcript.segments[0]
    return [
        TranscriptExcerpt(
            start_seconds=first_segment.start_seconds,
            end_seconds=first_segment.end_seconds,
            text=first_segment.text,
            why_it_matters=f"Este trecho sustenta a leitura de {skill_id} no hook inicial.",
        )
    ]


def build_executed_skill(
    skill_id: AnalysisSkillId,
    *,
    status: str = "completed",
    summary: str | None = None,
    key_signals: list[str] | None = None,
    evidence: list[EvidenceItem] | None = None,
    evidence_gaps: list[str] | None = None,
    warnings: list[str] | None = None,
    disclaimer: str | None = None,
    skill_score: float | None = None,
    property_scores: list[PropertyScore] | None = None,
    detailed_assessment: str | None = None,
    strengths: list[str] | None = None,
    improvement_opportunities: list[str] | None = None,
    recommendations: list[Recommendation] | None = None,
    transcript_excerpts: list[TranscriptExcerpt] | None = None,
) -> ExecutedAnalysisSkill:
    evaluated_items_by_skill: dict[AnalysisSkillId, list[str]] = {
        "content_strategy": ["script_quality", "observable_engagement_potential"],
        "filming": ["filming_quality", "cinematographic_language", "videography"],
        "editing": ["editing", "dynamism", "text_overlay"],
        "audio_music": ["voice_quality", "music_choice"],
        "compliance": ["copyright_risk"],
    }

    score_by_skill: dict[AnalysisSkillId, float] = {
        "content_strategy": 8.8,
        "filming": 8.4,
        "editing": 8.1,
        "audio_music": 7.9,
        "compliance": 9.2,
    }

    default_summary_by_skill: dict[AnalysisSkillId, str] = {
        "content_strategy": "O roteiro e claro e a proposta aparece cedo.",
        "filming": "A captacao visual sustenta a leitura do conteudo.",
        "editing": "A edicao sustenta ritmo e legibilidade.",
        "audio_music": "A voz e a musica estao legiveis para a proposta do video.",
        "compliance": "O video nao apresenta sinais evidentes de risco observado.",
    }

    default_insufficient_summary_by_skill: dict[AnalysisSkillId, str] = {
        "content_strategy": "Nao ha evidencia suficiente para concluir sobre a estrategia de conteudo.",
        "filming": "Nao ha evidencia suficiente para concluir sobre a filmagem.",
        "editing": "Nao ha evidencia suficiente para concluir sobre a edicao.",
        "audio_music": "Nao ha evidencia suficiente para concluir sobre audio e musica.",
        "compliance": "Nao ha evidencia suficiente para concluir sobre compliance.",
    }

    default_detailed_assessment_by_skill: dict[AnalysisSkillId, str] = {
        "content_strategy": "A abertura posiciona a promessa com clareza, e a narrativa mostra um caminho pratico para manter a atencao e orientar a proxima iteracao.",
        "filming": "A imagem entrega intencao visual e enquadramento consistente o bastante para sustentar a leitura do conteudo em formato curto.",
        "editing": "A montagem sustenta o fluxo, com ritmo suficiente para manter a leitura e destacar os pontos-chave da mensagem.",
        "audio_music": "A camada de audio nao distrai da mensagem principal e apoia a compreensao do video curto.",
        "compliance": "Nao ha sinais fortes de risco observavel, mas a leitura permanece restrita a evidencias de superficie e nao substitui revisao juridica.",
    }

    default_strengths_by_skill: dict[AnalysisSkillId, list[str]] = {
        "content_strategy": ["Hook inicial claro", "Promessa apresentada cedo"],
        "filming": ["Captacao visual consistente"],
        "editing": ["Ritmo legivel", "Texto em tela util"],
        "audio_music": ["Voz inteligivel", "Trilha compatível"],
        "compliance": ["Sem sinais evidentes de risco"],
    }

    default_improvement_by_skill: dict[AnalysisSkillId, list[str]] = {
        "content_strategy": ["Aumentar a especificidade da promessa inicial."],
        "filming": ["Explorar mais variação de planos na abertura."],
        "editing": ["Acelerar a transicao para o valor principal."],
        "audio_music": ["Uniformizar a energia da trilha com o tom do video."],
        "compliance": ["Checar cuidadosamente eventual uso de trechos protegidos."],
    }

    default_disclaimer_by_skill: dict[AnalysisSkillId, str | None] = {
        "content_strategy": "Engajamento e apenas estimativa observavel no video, nunca metrica real de plataforma.",
        "filming": None,
        "editing": None,
        "audio_music": None,
        "compliance": "Copyright e uma avaliacao de risco com base em evidencias visiveis e audiveis, nao aconselhamento juridico.",
    }

    score = skill_score if skill_score is not None else score_by_skill[skill_id]
    transcript = build_transcript()
    property_scores_value = property_scores or build_property_scores(skill_id, score)
    strengths_value = strengths or default_strengths_by_skill[skill_id]
    improvement_value = improvement_opportunities or default_improvement_by_skill[skill_id]
    recommendations_value = recommendations or build_recommendations(skill_id, improvement_value[0])
    transcript_excerpts_value = transcript_excerpts or build_transcript_excerpts(skill_id, transcript=transcript)

    if status != "completed":
        score = 0.0 if skill_score is None else skill_score
        summary = summary or default_insufficient_summary_by_skill[skill_id]
        detailed_assessment = detailed_assessment or default_insufficient_summary_by_skill[skill_id]
        property_scores_value = property_scores or []
        strengths_value = strengths or []
        improvement_value = improvement_opportunities or []
        recommendations_value = recommendations or []
        transcript_excerpts_value = transcript_excerpts or []
        warnings = warnings or ["Seção com evidencia limitada."]

    return ExecutedAnalysisSkill(
        skill_id=skill_id,
        status=status,
        evaluated_items=evaluated_items_by_skill[skill_id],
        summary=summary or default_summary_by_skill[skill_id],
        key_signals=key_signals or [f"Sinal principal para {skill_id}."],
        evidence=evidence or [
            EvidenceItem(
                timestamp_seconds=0.2,
                kind="hook",
                observation="Opens with a direct statement.",
                transcript_quote="Stop wasting time",
            )
        ],
        evidence_gaps=evidence_gaps or [],
        warnings=warnings or [],
        disclaimer=default_disclaimer_by_skill[skill_id] if disclaimer is None else disclaimer,
        skill_score=score,
        property_scores=property_scores_value,
        detailed_assessment=detailed_assessment or default_detailed_assessment_by_skill[skill_id],
        strengths=strengths_value,
        improvement_opportunities=improvement_value,
        recommendations=recommendations_value,
        transcript_excerpts=transcript_excerpts_value,
    )


def build_report(
    *,
    selected_skill_ids: list[AnalysisSkillId] | None = None,
    executed_skills: list[ExecutedAnalysisSkill] | None = None,
    transcript: Transcript | None = None,
    overall_score: float | None = None,
    warnings: list[str] | None = None,
) -> ShortVideoAnalysisReport:
    selected_skill_ids = selected_skill_ids or ["content_strategy", "editing"]
    transcript = transcript or build_transcript()
    executed_skills = executed_skills or [build_executed_skill(skill_id) for skill_id in selected_skill_ids]
    if overall_score is None:
        completed_scores = [skill.skill_score for skill in executed_skills if skill.status == "completed"]
        overall_score = round(sum(completed_scores) / len(completed_scores), 1) if completed_scores else None

    return ShortVideoAnalysisReport(
        source=SourceSection(
            source_type="public_url",
            source_label="https://www.instagram.com/reel/abc123/",
            source_url="https://www.instagram.com/reel/abc123/",
            canonical_url="https://www.instagram.com/reel/abc123/",
            platform="instagram_reels",
            content_id="abc123",
            duration_seconds=12.5,
            width=1080,
            height=1920,
            fps=30.0,
            has_audio=True,
            ingest_status="downloaded",
        ),
        catalog_version=DEFAULT_ANALYSIS_CATALOG_VERSION,
        selected_skill_ids=selected_skill_ids,
        transcript=transcript,
        executed_skills=executed_skills,
        overall_score=overall_score,
        warnings=warnings or [],
    )
