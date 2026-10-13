"""Localized report copy for analysis skill metadata."""

from __future__ import annotations

from .language import normalize_requested_language

ENGLISH_PROPERTY_COPY = {
    "script_quality": ("Script quality", "Message clarity, opening promise, progression, and specificity."),
    "observable_engagement_potential": (
        "Observable engagement potential",
        "Observable ability to hold attention and stimulate the next action.",
    ),
    "filming_quality": ("Capture quality", "Sharpness, stability, lighting, and image consistency."),
    "cinematographic_language": (
        "Cinematographic language",
        "Composition, framing, depth, and visual intention.",
    ),
    "videography": (
        "Videography execution",
        "Movement, shot variety, and visual control throughout the video.",
    ),
    "editing": ("Editing quality", "Cuts, continuity, and clarity of the visual sequence."),
    "dynamism": ("Dynamism", "Pacing, visual energy, and enough variation to sustain retention."),
    "text_overlay": (
        "On-screen text usage",
        "Legibility, usefulness, and synchronization of overlays with the narrative.",
    ),
    "voice_quality": ("Voice quality", "Clarity, volume, diction, and intelligibility of speech."),
    "music_choice": ("Music choice", "How well the soundtrack fits the tone, energy, and context of the video."),
    "copyright_risk": (
        "Observable copyright risk",
        "Visible or audible signs that suggest protected material, attribution issues, or sensitive reuse.",
    ),
}

ENGLISH_SKILL_COPY = {
    "content_strategy": {
        "name": "content strategy",
        "persona": "Content and performance strategist for short-form, focused on hook, promise clarity, progression, and the next optimization.",
        "coverage_summary": "Script, promise, and observable engagement signals.",
        "insufficient_summary": "There is not enough evidence to conclude on content strategy.",
        "insufficient_gap": "The available evidence does not clearly show script, promise, or consistent engagement signals.",
    },
    "filming": {
        "name": "filming",
        "persona": "Director of photography and mobile videographer specialized in framing, capture quality, and visual language for shorts.",
        "coverage_summary": "Capture quality, framing, and cinematographic language.",
        "insufficient_summary": "There is not enough evidence to conclude on filming.",
        "insufficient_gap": "The available evidence does not clearly show enough capture, framing, or cinematographic language.",
    },
    "editing": {
        "name": "editing",
        "persona": "Short-form video editor focused on retention, pacing, and visual legibility.",
        "coverage_summary": "Editing, dynamism, and on-screen text overlays.",
        "insufficient_summary": "There is not enough evidence to conclude on editing.",
        "insufficient_gap": "The available evidence does not clearly show cuts, pacing, or on-screen text quality.",
    },
    "audio_music": {
        "name": "audio and music",
        "persona": "Sound designer and audio editor for social video, focused on voice, music, and sonic clarity.",
        "coverage_summary": "Voice quality and music choice.",
        "insufficient_summary": "There is not enough evidence to conclude on audio and music.",
        "insufficient_gap": "The available evidence does not clearly show enough voice, soundtrack, or audio mix details.",
    },
    "compliance": {
        "name": "compliance",
        "persona": "Copyright and compliance risk reviewer for short-form marketing video, using clear non-legal language.",
        "coverage_summary": "Observable copyright and compliance risks.",
        "insufficient_summary": "There is not enough evidence to conclude on compliance.",
        "insufficient_gap": "The available evidence does not clearly show enough signals to assess copyright or compliance risk.",
    },
}

ENGLISH_SAFE_LANGUAGE_NOTES = {
    "Engajamento e apenas estimativa observavel no video, nunca metrica real de plataforma.": (
        "Engagement is only an observable estimate from the video, never a real platform metric."
    ),
    "Copyright e uma avaliacao de risco com base em evidencias visiveis e audiveis, nao aconselhamento juridico.": (
        "Copyright is a risk assessment based on visible and audible evidence, not legal advice."
    ),
}

SPANISH_PROPERTY_COPY = {
    "script_quality": ("Calidad del guion", "Claridad del mensaje, promesa de apertura, progresion y especificidad."),
    "observable_engagement_potential": (
        "Potencial observable de engagement",
        "Capacidad observable de sostener la atencion y estimular la siguiente accion.",
    ),
    "filming_quality": ("Calidad de captura", "Nitidez, estabilidad, iluminacion y consistencia de imagen."),
    "cinematographic_language": (
        "Lenguaje cinematografico",
        "Composicion, encuadre, profundidad e intencion visual.",
    ),
    "videography": (
        "Ejecucion de videografia",
        "Movimiento, variedad de planos y control visual a lo largo del video.",
    ),
    "editing": ("Calidad de edicion", "Cortes, continuidad y claridad de la secuencia visual."),
    "dynamism": ("Dinamismo", "Ritmo, energia visual y variacion suficiente para sostener la retencion."),
    "text_overlay": (
        "Uso de texto en pantalla",
        "Legibilidad, utilidad y sincronizacion de los overlays con la narrativa.",
    ),
    "voice_quality": ("Calidad de voz", "Claridad, volumen, diccion e inteligibilidad del habla."),
    "music_choice": ("Eleccion musical", "Que tan bien la pista sonora encaja con tono, energia y contexto del video."),
    "copyright_risk": (
        "Riesgo observable de copyright",
        "Senales visibles o audibles que sugieren material protegido, problemas de atribucion o reutilizacion sensible.",
    ),
}

SPANISH_SKILL_COPY = {
    "content_strategy": {
        "name": "estrategia de contenido",
        "persona": "Estratega de contenido y performance para formato corto, enfocado en hook, claridad de promesa, progresion y proxima optimizacion.",
        "coverage_summary": "Guion, promesa y senales observables de engagement.",
        "insufficient_summary": "No hay evidencia suficiente para concluir sobre estrategia de contenido.",
        "insufficient_gap": "La evidencia disponible no muestra con claridad guion, promesa o senales consistentes de engagement.",
    },
    "filming": {
        "name": "filmacion",
        "persona": "Director de fotografia y videografo movil especializado en encuadre, calidad de captura y lenguaje visual para shorts.",
        "coverage_summary": "Calidad de captura, encuadre y lenguaje cinematografico.",
        "insufficient_summary": "No hay evidencia suficiente para concluir sobre filmacion.",
        "insufficient_gap": "La evidencia disponible no muestra suficientes detalles de captura, encuadre o lenguaje cinematografico.",
    },
    "editing": {
        "name": "edicion",
        "persona": "Editor de video corto enfocado en retencion, ritmo y legibilidad visual.",
        "coverage_summary": "Edicion, dinamismo y overlays de texto en pantalla.",
        "insufficient_summary": "No hay evidencia suficiente para concluir sobre edicion.",
        "insufficient_gap": "La evidencia disponible no muestra con claridad cortes, ritmo o calidad del texto en pantalla.",
    },
    "audio_music": {
        "name": "audio y musica",
        "persona": "Disenador sonoro y editor de audio para video social, enfocado en voz, musica y claridad sonora.",
        "coverage_summary": "Calidad de voz y eleccion musical.",
        "insufficient_summary": "No hay evidencia suficiente para concluir sobre audio y musica.",
        "insufficient_gap": "La evidencia disponible no muestra suficientes detalles de voz, banda sonora o mezcla de audio.",
    },
    "compliance": {
        "name": "compliance",
        "persona": "Revisor de riesgo de copyright y compliance para video corto de marketing, con lenguaje claro y no legalista.",
        "coverage_summary": "Riesgos observables de copyright y compliance.",
        "insufficient_summary": "No hay evidencia suficiente para concluir sobre compliance.",
        "insufficient_gap": "La evidencia disponible no muestra suficientes senales para evaluar riesgo de copyright o compliance.",
    },
}

SPANISH_SAFE_LANGUAGE_NOTES = {
    "Engajamento e apenas estimativa observavel no video, nunca metrica real de plataforma.": (
        "El engagement es solo una estimacion observable del video, nunca una metrica real de plataforma."
    ),
    "Copyright e uma avaliacao de risco com base em evidencias visiveis e audiveis, nao aconselhamento juridico.": (
        "Copyright es una evaluacion de riesgo basada en evidencias visibles y audibles, no asesoramiento juridico."
    ),
}


def localize_skill_blueprint(blueprint: dict[str, object], language: str) -> dict[str, object]:
    """Return report-facing copy for a skill blueprint in the requested language."""
    normalized_language = normalize_requested_language(language)
    if normalized_language == "en":
        skill_copy = ENGLISH_SKILL_COPY
        property_copy = ENGLISH_PROPERTY_COPY
        safe_language_notes = ENGLISH_SAFE_LANGUAGE_NOTES
        insufficient_warning = "Section with limited evidence."
    elif normalized_language == "es":
        skill_copy = SPANISH_SKILL_COPY
        property_copy = SPANISH_PROPERTY_COPY
        safe_language_notes = SPANISH_SAFE_LANGUAGE_NOTES
        insufficient_warning = "Seccion con evidencia limitada."
    else:
        return blueprint

    skill_id = str(blueprint["skill_id"])
    localized = dict(blueprint)
    localized.update(
        {
            **skill_copy[skill_id],
            "scoring_properties": [
                {
                    **dict(item),
                    "label": property_copy[str(item["property_id"])][0],
                    "guidance": property_copy[str(item["property_id"])][1],
                }
                for item in list(blueprint["scoring_properties"])
            ],
            "safe_language_notes": [
                safe_language_notes.get(str(note), str(note))
                for note in list(blueprint["safe_language_notes"])
            ],
            "disclaimer": safe_language_notes.get(
                str(blueprint["disclaimer"]),
                blueprint["disclaimer"],
            )
            if blueprint["disclaimer"] is not None
            else None,
            "insufficient_warning": insufficient_warning,
        }
    )
    return localized
