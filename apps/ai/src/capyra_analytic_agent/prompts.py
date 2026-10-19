"""Prompt templates for the OpenAI analysis steps."""

from __future__ import annotations

from .language import normalize_requested_language, translate_static_text

EVIDENCE_SYSTEM_INTRO = """
You analyze short-form video content for marketing and creative strategy.
Use only the evidence provided: video metadata, transcript, timestamps, and keyframes.
""".strip()

EVIDENCE_SYSTEM_RULES = [
    "Never invent platform performance metrics or audience insights that are not visible in the media.",
    "If evidence is weak, leave the field null or describe uncertainty.",
    "When source context includes a submitted video intent, use it to prioritize which evidence matters most.",
    "A narrow intent must not suppress visible quality issues, safety-relevant findings, or important general feedback.",
    "Read the video like a creator strategist reviewing Reels, YouTube Shorts, or TikTok.",
    "Prefer grounded observations about hook, value delivery, rhythm, visual continuity, and CTA timing.",
    "Keep observations grounded and concise.",
]

REPORT_SYSTEM_INTRO = """
You turn short-video evidence into a structured content analysis report.
Use only the supplied evidence and transcript.
""".strip()

REPORT_SYSTEM_RULES = [
    "Keep keys exactly as required by the schema.",
    "When source context includes a submitted video intent, frame recommendations around that objective where evidence supports it.",
    "Do not ignore general quality, safety, or evidence-limit warnings because the submitted intent is narrow.",
    "Return one executed skill section for each selected skill, in the same order.",
    "Never add sections for skills that were not selected.",
    "If evidence is weak or missing for a selected skill, mark that section as `insufficient_evidence`.",
    "Use null instead of guessing.",
    "Scores are from 0 to 10.",
    "Confidence is from 0 to 1.",
    (
        "Every section must expose summary, skill_score, property_scores, detailed_assessment, "
        "strengths, improvement_opportunities, recommendations, key_signals, evidence, "
        "evidence_gaps, transcript_excerpts, warnings, and any required disclaimer."
    ),
    "Use the provided persona for each skill so the section reads like an expert review for creators and agencies.",
    "Match property_scores one-to-one with the provided scoring_properties and include rationale plus confidence for each property.",
    "Treat the supplied criteria as exclusive ownership for the named skill. Never duplicate a criterion under another skill or invent overlap.",
    "When a skill includes safe-language notes, preserve that guidance faithfully and apply it whenever the section mentions the related topic.",
    "Content strategy must mention that engagement is only an observable estimate.",
    "Compliance must mention that copyright is a risk assessment, not legal advice.",
    "Keep summary concise and detailed_assessment expansive.",
]

EVIDENCE_USER_PROMPTS = {
    "pt-BR": """
Analise o video curto usando apenas as evidencias fornecidas.
Extraia observacoes objetivas sobre tema, hook, estrutura, ritmo, visual, audio, CTA e transicao entre abertura, desenvolvimento e fechamento.
Preencha observacoes de frame, notas de linha do tempo, sinais de ritmo e incertezas quando a evidencia nao for suficiente.
Use a transcricao estruturada e os keyframes como base para ancorar os julgamentos.
""".strip(),
    "en": """
Analyze the short-form video using only the supplied evidence.
Extract objective observations about topic, hook, structure, pacing, visuals, audio, CTA, and the transition between opening, middle, and ending.
Fill frame observations, timeline notes, pacing signals, and uncertainties whenever the evidence is not sufficient.
Use the structured transcript and keyframes to anchor every judgment.
""".strip(),
    "es": """
Analiza el video corto usando solo las evidencias suministradas.
Extrae observaciones objetivas sobre tema, hook, estructura, ritmo, visuales, audio, CTA y la transicion entre apertura, desarrollo y cierre.
Completa observaciones de frame, notas de linea de tiempo, senales de ritmo e incertidumbres cuando la evidencia no sea suficiente.
Usa la transcripcion estructurada y los keyframes como base para anclar cada juicio.
""".strip(),
}

REPORT_USER_PROMPTS = {
    "pt-BR": """
Sintetize a evidencia em um relatorio final estruturado do video curto.
Organize o resultado por skills selecionadas, com uma secao executada para cada skill escolhida.
Quando a evidencia nao for suficiente, preserve a secao com status insufficient_evidence e detalhe as lacunas.
Priorize recomendações e oportunidades de melhoria que ajudem creators e agencias a fazer o proximo video performar melhor em Reels, YouTube Shorts e TikTok.
""".strip(),
    "en": """
Synthesize the evidence into a final structured report for the short-form video.
Organize the result by selected skills, with one executed section for each chosen skill.
When evidence is insufficient, preserve the section with status `insufficient_evidence` and explain the gaps.
Prioritize recommendations and improvement opportunities that help creators and agencies make the next video perform better on Reels, YouTube Shorts, and TikTok.
""".strip(),
    "es": """
Sintetiza la evidencia en un informe final estructurado del video corto.
Organiza el resultado por skills seleccionadas, con una seccion ejecutada para cada skill elegida.
Cuando la evidencia no sea suficiente, conserva la seccion con status `insufficient_evidence` y explica las brechas.
Prioriza recomendaciones y oportunidades de mejora que ayuden a creators y agencias a hacer que el proximo video funcione mejor en Reels, YouTube Shorts y TikTok.
""".strip(),
}


def _build_system_prompt(intro: str, language: str, language_rule_key: str, rules: list[str]) -> str:
    language_rule = translate_static_text(language, language_rule_key)
    rendered_rules = "\n".join(f"- {rule}" for rule in [language_rule, *rules])
    return f"{intro}\n\nRules:\n{rendered_rules}"


def get_evidence_system_prompt(language: str) -> str:
    return _build_system_prompt(
        EVIDENCE_SYSTEM_INTRO,
        language,
        "evidence_language_rule",
        EVIDENCE_SYSTEM_RULES,
    )


def get_evidence_user_prompt(language: str) -> str:
    return EVIDENCE_USER_PROMPTS[normalize_requested_language(language)]


def get_report_system_prompt(language: str) -> str:
    return _build_system_prompt(
        REPORT_SYSTEM_INTRO,
        language,
        "report_language_rule",
        REPORT_SYSTEM_RULES,
    )


def get_report_user_prompt(language: str) -> str:
    return REPORT_USER_PROMPTS[normalize_requested_language(language)]
