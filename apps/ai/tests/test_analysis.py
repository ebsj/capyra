import json
from types import SimpleNamespace

from capyra_analytic_agent.analysis import OpenAIShortVideoAnalyzer
from capyra_analytic_agent.config import AppConfig
from capyra_analytic_agent.language import STATIC_TEXTS, normalize_requested_language
from capyra_analytic_agent.models import AnalysisSkillSelection, IntermediateAnalysis, ShortVideoAnalysisReport
from capyra_analytic_agent.prompts import get_evidence_system_prompt, get_report_system_prompt

from .helpers import build_executed_skill, build_report, build_transcript


class FakeResponses:
    def __init__(self, responses):
        self._responses = list(responses)
        self.budgets: list[int] = []
        self.requests: list[dict[str, object]] = []

    def parse(self, **kwargs):
        self.budgets.append(kwargs["max_output_tokens"])
        self.requests.append(kwargs)
        response = self._responses.pop(0)
        if isinstance(response, Exception):
            raise response
        return response


class FakeClient:
    def __init__(self, responses):
        self.responses = FakeResponses(responses)


class FakeTranscriptions:
    def __init__(self, response):
        self.response = response
        self.requests: list[dict[str, object]] = []

    def create(self, **kwargs):
        self.requests.append(kwargs)
        return self.response


class FakeAudioClient:
    def __init__(self, response):
        self.audio = SimpleNamespace(transcriptions=FakeTranscriptions(response))
        self.responses = FakeResponses([])


def make_response(*, output_parsed=None, output_text=None, reason=None):
    return SimpleNamespace(
        output_parsed=output_parsed,
        output_text=output_text,
        incomplete_details=SimpleNamespace(reason=reason) if reason else None,
    )


def test_normalize_requested_language_supports_public_language_values() -> None:
    cases = [
        (None, "pt-BR"),
        ("", "pt-BR"),
        ("pt-BR", "pt-BR"),
        ("en", "en"),
        ("en-US", "en"),
        ("es", "es"),
        ("es-ES", "es"),
        ("es_MX", "es"),
        ("español", "es"),
    ]

    for value, expected in cases:
        assert normalize_requested_language(value) == expected


def test_static_text_catalogs_have_matching_keys() -> None:
    assert set(STATIC_TEXTS["pt-BR"]) == set(STATIC_TEXTS["en"])
    assert set(STATIC_TEXTS["pt-BR"]) == set(STATIC_TEXTS["es"])


def test_system_prompts_share_common_rules_between_languages() -> None:
    def without_language_rule(prompt: str) -> list[str]:
        return [
            line
            for line in prompt.splitlines()
            if not line.startswith("- Write all natural-language")
        ]

    assert without_language_rule(get_evidence_system_prompt("pt-BR")) == without_language_rule(
        get_evidence_system_prompt("en")
    )
    assert without_language_rule(get_evidence_system_prompt("pt-BR")) == without_language_rule(
        get_evidence_system_prompt("es")
    )
    assert without_language_rule(get_report_system_prompt("pt-BR")) == without_language_rule(
        get_report_system_prompt("en")
    )
    assert without_language_rule(get_report_system_prompt("pt-BR")) == without_language_rule(
        get_report_system_prompt("es")
    )
    assert "Write all natural-language fields in English." in get_evidence_system_prompt("en")
    assert "Write all natural-language output in English." in get_report_system_prompt("en")
    assert "Write all natural-language fields in Spanish." in get_evidence_system_prompt("es")
    assert "Write all natural-language output in Spanish." in get_report_system_prompt("es")
    assert "Write all natural-language fields in Brazilian Portuguese." in get_evidence_system_prompt("pt-BR")
    assert "Write all natural-language output in Brazilian Portuguese." in get_report_system_prompt("pt-BR")


def test_selected_skill_context_exposes_exclusive_criteria_and_safe_language_notes() -> None:
    from capyra_analytic_agent.analysis import build_selected_skill_context

    selection = AnalysisSkillSelection(
        catalog_version="2026-04-08-initial",
        selected_skill_ids=["content_strategy", "compliance"],
    )

    context = build_selected_skill_context(selection)
    skills = context["skills"]

    assert context["catalog_version"] == "2026-04-08-initial"
    assert [skill["skill_id"] for skill in skills] == ["content_strategy", "compliance"]
    assert skills[0]["persona"].startswith("Estrategista de conteudo")
    assert skills[0]["scoring_properties"][0]["property_id"] == "script_quality"
    assert skills[0]["safe_language_notes"] == [
        "Engajamento e apenas estimativa observavel no video, nunca metrica real de plataforma."
    ]
    assert skills[1]["safe_language_notes"] == [
        "Copyright e uma avaliacao de risco com base em evidencias visiveis e audiveis, nao aconselhamento juridico."
    ]

    all_criteria = [criterion for skill in skills for criterion in skill["criteria"]]
    assert len(all_criteria) == len(set(all_criteria))


def test_transcribe_audio_uses_json_for_gpt4o_mini_models(tmp_path) -> None:
    response = SimpleNamespace(
        text="Linha um. Linha dois.",
        language="pt-BR",
    )
    client = FakeAudioClient(response)
    analyzer = OpenAIShortVideoAnalyzer(AppConfig(openai_api_key="test"), client=client)
    audio_path = tmp_path / "audio.wav"
    audio_path.write_bytes(b"fake")

    transcript = analyzer.transcribe_audio(audio_path, language="pt-BR")

    assert transcript.text == "Linha um. Linha dois."
    assert transcript.language == "pt-BR"
    assert transcript.segments == []
    request = client.audio.transcriptions.requests[0]
    assert request["response_format"] == "json"
    assert "timestamp_granularities" not in request
    assert "language" not in request


def test_transcribe_audio_returns_verbose_segments_for_legacy_models(tmp_path) -> None:
    response = SimpleNamespace(
        text="Linha um. Linha dois.",
        language="pt-BR",
        segments=[
            SimpleNamespace(start=0.0, end=1.2, text="Linha um."),
            SimpleNamespace(start=1.2, end=2.4, text="Linha dois."),
        ],
    )
    client = FakeAudioClient(response)
    analyzer = OpenAIShortVideoAnalyzer(
        AppConfig(openai_api_key="test", transcription_model="whisper-1"),
        client=client,
    )
    audio_path = tmp_path / "audio.wav"
    audio_path.write_bytes(b"fake")

    transcript = analyzer.transcribe_audio(audio_path, language="pt-BR")

    assert transcript.text == "Linha um. Linha dois."
    assert transcript.language == "pt-BR"
    assert [segment.text for segment in transcript.segments] == ["Linha um.", "Linha dois."]
    request = client.audio.transcriptions.requests[0]
    assert request["response_format"] == "verbose_json"
    assert request["timestamp_granularities"] == ["segment"]
    assert "language" not in request


def test_transcribe_audio_does_not_force_requested_report_language_as_audio_hint(tmp_path) -> None:
    response = SimpleNamespace(
        text="Ola mundo.",
        language="pt",
    )
    client = FakeAudioClient(response)
    analyzer = OpenAIShortVideoAnalyzer(AppConfig(openai_api_key="test"), client=client)
    audio_path = tmp_path / "audio.wav"
    audio_path.write_bytes(b"fake")

    transcript = analyzer.transcribe_audio(audio_path, language="en")

    assert transcript.text == "Ola mundo."
    assert transcript.language == "pt"
    request = client.audio.transcriptions.requests[0]
    assert "language" not in request


def test_parse_response_retries_with_higher_budget_when_json_is_truncated() -> None:
    expected_report = build_report()
    client = FakeClient(
        [
            make_response(
                output_text='{"source": {"source_url": "partial', reason="max_output_tokens"
            ),
            make_response(output_parsed=expected_report),
        ]
    )
    analyzer = OpenAIShortVideoAnalyzer(AppConfig(openai_api_key="test"), client=client)

    result = analyzer._parse_response(
        model="gpt-5-mini",
        schema=ShortVideoAnalysisReport,
        system_prompt="system",
        user_content=[{"type": "input_text", "text": "user"}],
    )

    assert result == expected_report
    assert result.transcript.text
    assert result.overall_score is not None
    assert client.responses.budgets == [7000, 14000]


def test_parse_response_retries_when_sdk_raises_truncation_error() -> None:
    expected_report = build_report()
    client = FakeClient(
        [
            ValueError(
                "1 validation error for ShortVideoAnalysisReport\n"
                "  Invalid JSON: EOF while parsing a string at line 370 column 80"
            ),
            make_response(output_parsed=expected_report),
        ]
    )
    analyzer = OpenAIShortVideoAnalyzer(AppConfig(openai_api_key="test"), client=client)

    result = analyzer._parse_response(
        model="gpt-5-mini",
        schema=ShortVideoAnalysisReport,
        system_prompt="system",
        user_content=[{"type": "input_text", "text": "user"}],
    )

    assert result == expected_report
    assert client.responses.budgets == [7000, 14000]


def test_parse_response_retries_on_truncated_intermediate_json_without_incomplete_reason() -> None:
    expected_intermediate = IntermediateAnalysis(
        opening_line="Teste",
        structural_pattern="hook -> problema -> solucao",
        probable_target_audience="Clientes de restaurante",
    )
    client = FakeClient(
        [
            make_response(output_text='{"opening_line": "Dica do app'),
            make_response(output_parsed=expected_intermediate),
        ]
    )
    analyzer = OpenAIShortVideoAnalyzer(AppConfig(openai_api_key="test"), client=client)

    result = analyzer._parse_response(
        model="gpt-5-mini",
        schema=IntermediateAnalysis,
        system_prompt="system",
        user_content=[{"type": "input_text", "text": "user"}],
    )

    assert result == expected_intermediate
    assert client.responses.budgets == [6000, 12000]


def test_synthesize_report_serializes_selected_scope_into_prompt() -> None:
    transcript = build_transcript(text="Transcricao de teste.")
    expected_report = build_report(
        selected_skill_ids=["content_strategy", "compliance"],
        executed_skills=[
            build_executed_skill("content_strategy"),
            build_executed_skill("compliance", status="insufficient_evidence"),
        ],
        transcript=transcript,
    )
    client = FakeClient([make_response(output_parsed=expected_report)])
    analyzer = OpenAIShortVideoAnalyzer(AppConfig(openai_api_key="test"), client=client)

    result = analyzer.synthesize_report(
        source_context="Contexto do video",
        transcript=transcript,
        evidence=IntermediateAnalysis(
            opening_line="Teste",
            structural_pattern="hook -> problema -> solucao",
            probable_target_audience="Criadores",
        ),
        selection=AnalysisSkillSelection(
            catalog_version="2026-04-08-initial",
            selected_skill_ids=["content_strategy", "compliance"],
        ),
        language="pt-BR",
    )

    assert result == expected_report
    request = client.responses.requests[0]
    assert "exclusive ownership" in request["instructions"]
    assert "safe-language notes" in request["instructions"]
    assert "observable estimate" in request["instructions"]
    assert "risk assessment, not legal advice" in request["instructions"]

    user_content = request["input"][0]["content"]
    prompt_text = "\n".join(part["text"] for part in user_content if part["type"] == "input_text")
    assert '"catalog_version": "2026-04-08-initial"' in prompt_text
    assert '"criteria": [' in prompt_text
    assert '"safe_language_notes": [' in prompt_text
    assert "Transcricao estruturada em JSON" in prompt_text
    selection_text = next(
        part["text"]
        for part in user_content
        if part["type"] == "input_text" and part["text"].startswith("Selecao de skills em JSON:\n")
    )
    selection_payload = json.loads(selection_text.split("Selecao de skills em JSON:\n", maxsplit=1)[1])
    assert selection_payload["catalog_version"] == "2026-04-08-initial"
    assert selection_payload["selected_skill_ids"] == ["content_strategy", "compliance"]
    assert selection_payload["skills"][0]["persona"].startswith("Estrategista de conteudo")
    assert selection_payload["skills"][0]["scoring_properties"][0]["property_id"] == "script_quality"
    assert selection_payload["skills"][0]["safe_language_notes"] == [
        "Engajamento e apenas estimativa observavel no video, nunca metrica real de plataforma."
    ]
    assert selection_payload["skills"][1]["safe_language_notes"] == [
        "Copyright e uma avaliacao de risco com base em evidencias visiveis e audiveis, nao aconselhamento juridico."
    ]
    all_criteria = [criterion for skill in selection_payload["skills"] for criterion in skill["criteria"]]
    assert len(all_criteria) == len(set(all_criteria))


def test_synthesize_report_uses_english_prompt_bundle_when_requested() -> None:
    transcript = build_transcript(text="Test transcript.", language="en")
    expected_report = build_report(
        transcript=transcript,
        selected_skill_ids=["content_strategy"],
        executed_skills=[build_executed_skill("content_strategy")],
    )
    client = FakeClient([make_response(output_parsed=expected_report)])
    analyzer = OpenAIShortVideoAnalyzer(AppConfig(openai_api_key="test"), client=client)

    analyzer.synthesize_report(
        source_context="Short-form video context:\n- Platform: youtube\n- Has audio: yes\n",
        transcript=transcript,
        evidence=IntermediateAnalysis(
            opening_line="Test",
            structural_pattern="hook -> value -> CTA",
            probable_target_audience="Creators",
        ),
        selection=AnalysisSkillSelection(
            catalog_version="2026-04-08-initial",
            selected_skill_ids=["content_strategy"],
        ),
        language=normalize_requested_language("en"),
    )

    request = client.responses.requests[0]
    assert "Write all natural-language output in English." in request["instructions"]
    user_content = request["input"][0]["content"]
    prompt_text = "\n".join(part["text"] for part in user_content if part["type"] == "input_text")
    assert "Selected skills JSON:" in prompt_text
    assert "Transcript text:" in prompt_text
    assert "Structured evidence JSON:" in prompt_text
    assert "Selecao de skills em JSON" not in prompt_text


def test_synthesize_report_uses_spanish_prompt_bundle_when_requested() -> None:
    transcript = build_transcript(text="Transcripcion de prueba.", language="es")
    expected_report = build_report(
        transcript=transcript,
        selected_skill_ids=["content_strategy"],
        executed_skills=[build_executed_skill("content_strategy")],
    )
    client = FakeClient([make_response(output_parsed=expected_report)])
    analyzer = OpenAIShortVideoAnalyzer(AppConfig(openai_api_key="test"), client=client)

    analyzer.synthesize_report(
        source_context="Contexto del video corto:\n- Plataforma: youtube\n- Tiene audio: si\n",
        transcript=transcript,
        evidence=IntermediateAnalysis(
            opening_line="Prueba",
            structural_pattern="hook -> valor -> CTA",
            probable_target_audience="Creators",
        ),
        selection=AnalysisSkillSelection(
            catalog_version="2026-04-08-initial",
            selected_skill_ids=["content_strategy"],
        ),
        language=normalize_requested_language("es"),
    )

    request = client.responses.requests[0]
    assert "Write all natural-language output in Spanish." in request["instructions"]
    user_content = request["input"][0]["content"]
    prompt_text = "\n".join(part["text"] for part in user_content if part["type"] == "input_text")
    assert "Skills seleccionadas en JSON:" in prompt_text
    assert "Transcripcion textual:" in prompt_text
    assert "Evidencia estructurada en JSON:" in prompt_text
    assert "Selected skills JSON:" not in prompt_text


def test_normalize_report_localizes_skill_metadata_to_english() -> None:
    from capyra_analytic_agent.analysis import normalize_report

    transcript = build_transcript(text="Test transcript.", language="en")
    report = build_report(
        transcript=transcript,
        selected_skill_ids=["content_strategy", "editing"],
        executed_skills=[
            build_executed_skill("content_strategy"),
            build_executed_skill("editing"),
        ],
    )
    selection = AnalysisSkillSelection(
        catalog_version="2026-04-08-initial",
        selected_skill_ids=["content_strategy", "editing"],
    )

    normalized = normalize_report(report, selection, transcript, "en")
    skills = normalized.executed_skills

    assert skills[0].property_scores[0].label == "Script quality"
    assert skills[0].disclaimer == "Engagement is only an observable estimate from the video, never a real platform metric."
    assert skills[1].property_scores[2].label == "On-screen text usage"


def test_normalize_report_localizes_skill_metadata_to_spanish() -> None:
    from capyra_analytic_agent.analysis import normalize_report

    transcript = build_transcript(text="Transcripcion de prueba.", language="es")
    report = build_report(
        transcript=transcript,
        selected_skill_ids=["content_strategy", "editing"],
        executed_skills=[
            build_executed_skill("content_strategy"),
            build_executed_skill("editing"),
        ],
    )
    selection = AnalysisSkillSelection(
        catalog_version="2026-04-08-initial",
        selected_skill_ids=["content_strategy", "editing"],
    )

    normalized = normalize_report(report, selection, transcript, "es")
    skills = normalized.executed_skills

    assert skills[0].property_scores[0].label == "Calidad del guion"
    assert skills[0].disclaimer == "El engagement es solo una estimacion observable del video, nunca una metrica real de plataforma."
    assert skills[1].property_scores[2].label == "Uso de texto en pantalla"
