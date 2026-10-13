"""Language helpers for AI prompt and context localization."""

from __future__ import annotations

DEFAULT_ANALYSIS_LANGUAGE = "pt-BR"

STATIC_TEXTS: dict[str, dict[str, str]] = {
    "pt-BR": {
        "selection_json_label": "Selecao de skills em JSON:\n",
        "transcript_text_label": "Transcricao textual:\n",
        "transcript_json_label": "Transcricao estruturada em JSON:\n",
        "evidence_json_label": "Evidencia estruturada em JSON:\n",
        "no_speech": "(sem fala detectada)",
        "no_speech_or_audio": "(sem fala detectada ou sem audio)",
        "keyframe_at_timestamp": "Keyframe no timestamp {timestamp:.2f}s:",
        "video_context_title": "Contexto do video curto:",
        "source_type": "- Tipo de origem: {value}",
        "source_label": "- Origem: {value}",
        "source_url": "- URL de origem: {value}",
        "canonical_url": "- URL canonica: {value}",
        "platform": "- Plataforma: {value}",
        "content_id": "- Content ID: {value}",
        "duration": "- Duracao: {value:.2f}s",
        "resolution": "- Resolucao: {width}x{height}",
        "fps": "- FPS: {value:.2f}",
        "has_audio": "- Tem audio: {value}",
        "yes": "sim",
        "no": "nao",
        "keyframes_count": "- Quantidade de keyframes: {value}",
        "ingest_title": "- Titulo de ingestao: {value}",
        "baseline_warning": (
            "Esta analise usa apenas a evidencia do video processado. Ela nao inclui metricas nativas da plataforma."
        ),
        "no_audio_warning": "O video nao possui faixa de audio detectavel.",
        "transcription_unavailable_warning": (
            "Audio foi detectado, mas a transcricao nao pode ser extraida com confianca. "
            "A analise pode depender mais das evidencias visuais."
        ),
        "evidence_language_rule": "Write all natural-language fields in Brazilian Portuguese.",
        "report_language_rule": "Write all natural-language output in Brazilian Portuguese.",
    },
    "en": {
        "selection_json_label": "Selected skills JSON:\n",
        "transcript_text_label": "Transcript text:\n",
        "transcript_json_label": "Structured transcript JSON:\n",
        "evidence_json_label": "Structured evidence JSON:\n",
        "no_speech": "(no speech detected)",
        "no_speech_or_audio": "(no speech detected or no audio)",
        "keyframe_at_timestamp": "Keyframe at timestamp {timestamp:.2f}s:",
        "video_context_title": "Short-form video context:",
        "source_type": "- Source type: {value}",
        "source_label": "- Source label: {value}",
        "source_url": "- Source URL: {value}",
        "canonical_url": "- Canonical URL: {value}",
        "platform": "- Platform: {value}",
        "content_id": "- Content ID: {value}",
        "duration": "- Duration: {value:.2f}s",
        "resolution": "- Resolution: {width}x{height}",
        "fps": "- FPS: {value:.2f}",
        "has_audio": "- Has audio: {value}",
        "yes": "yes",
        "no": "no",
        "keyframes_count": "- Keyframe count: {value}",
        "ingest_title": "- Ingest title: {value}",
        "baseline_warning": (
            "This analysis uses only the evidence visible in the processed video. "
            "It does not include native platform metrics."
        ),
        "no_audio_warning": "The video does not contain a detectable audio track.",
        "transcription_unavailable_warning": (
            "Audio was detected, but the transcript could not be extracted reliably. "
            "The analysis may rely more heavily on visual evidence."
        ),
        "evidence_language_rule": "Write all natural-language fields in English.",
        "report_language_rule": "Write all natural-language output in English.",
    },
    "es": {
        "selection_json_label": "Skills seleccionadas en JSON:\n",
        "transcript_text_label": "Transcripcion textual:\n",
        "transcript_json_label": "Transcripcion estructurada en JSON:\n",
        "evidence_json_label": "Evidencia estructurada en JSON:\n",
        "no_speech": "(sin habla detectada)",
        "no_speech_or_audio": "(sin habla detectada o sin audio)",
        "keyframe_at_timestamp": "Keyframe en el timestamp {timestamp:.2f}s:",
        "video_context_title": "Contexto del video corto:",
        "source_type": "- Tipo de fuente: {value}",
        "source_label": "- Fuente: {value}",
        "source_url": "- URL de fuente: {value}",
        "canonical_url": "- URL canonica: {value}",
        "platform": "- Plataforma: {value}",
        "content_id": "- Content ID: {value}",
        "duration": "- Duracion: {value:.2f}s",
        "resolution": "- Resolucion: {width}x{height}",
        "fps": "- FPS: {value:.2f}",
        "has_audio": "- Tiene audio: {value}",
        "yes": "si",
        "no": "no",
        "keyframes_count": "- Cantidad de keyframes: {value}",
        "ingest_title": "- Titulo de ingesta: {value}",
        "baseline_warning": (
            "Este analisis usa solo la evidencia visible en el video procesado. "
            "No incluye metricas nativas de la plataforma."
        ),
        "no_audio_warning": "El video no contiene una pista de audio detectable.",
        "transcription_unavailable_warning": (
            "Se detecto audio, pero la transcripcion no pudo extraerse con confianza. "
            "El analisis puede depender mas de las evidencias visuales."
        ),
        "evidence_language_rule": "Write all natural-language fields in Spanish.",
        "report_language_rule": "Write all natural-language output in Spanish.",
    },
}


def _validate_static_texts() -> None:
    expected_keys = set(STATIC_TEXTS[DEFAULT_ANALYSIS_LANGUAGE])
    for language, texts in STATIC_TEXTS.items():
        text_keys = set(texts)
        missing = sorted(expected_keys - text_keys)
        extra = sorted(text_keys - expected_keys)
        if missing or extra:
            raise ValueError(
                f"Static text keys for {language} do not match {DEFAULT_ANALYSIS_LANGUAGE}. "
                f"Missing: {missing}. Extra: {extra}."
            )


def normalize_requested_language(language: str | None) -> str:
    normalized = (language or "").strip().lower()
    if normalized in {"en", "en-us", "en_us", "english"}:
        return "en"
    if normalized in {"es", "es-es", "es_es", "es-mx", "es_mx", "spanish", "espanol", "español"}:
        return "es"
    return DEFAULT_ANALYSIS_LANGUAGE


def is_english(language: str | None) -> bool:
    return normalize_requested_language(language) == "en"


def translate_static_text(language: str | None, key: str) -> str:
    return STATIC_TEXTS[normalize_requested_language(language)][key]


_validate_static_texts()
