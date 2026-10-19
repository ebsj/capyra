import { describe, expect, it } from "vitest";
import { camelize, validatePythonReport } from "../src/report";

describe("Python report boundary", () => {
  it("validates snake_case and projects camelCase", () => {
    const report = validatePythonReport({
      source: { source_type: "owned_asset", source_label: "clip.mp4", source_url: null, canonical_url: null, platform: null,
        content_id: null, duration_seconds: 10, width: 1080, height: 1920, fps: 30, has_audio: true, ingest_status: "uploaded", artifact_directory: null },
      catalog_version: "v1", selected_skill_ids: ["editing"],
      transcript: { text: "", language: "pt-BR", segments: [] }, overall_score: 8, warnings: [],
      executed_skills: [{ skill_id: "editing", status: "completed", evaluated_items: [], summary: "Bom ritmo.", skill_score: 8,
        property_scores: [], detailed_assessment: "", strengths: [], improvement_opportunities: [], recommendations: [], key_signals: [],
        evidence: [], evidence_gaps: [], transcript_excerpts: [], warnings: [], disclaimer: null }],
    });
    const projected = camelize<Record<string, unknown>>(report);
    expect(projected.catalogVersion).toBe("v1");
    expect((projected.source as Record<string, unknown>).durationSeconds).toBe(10);
  });

  it("rejects a report that violates the canonical JSON Schema", () => {
    expect(() => validatePythonReport({ source: {}, warnings: [] })).toThrow("Invalid analysis report");
  });
});
