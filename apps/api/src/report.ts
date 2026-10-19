import { z } from "zod";
import Ajv2020 from "ajv/dist/2020";
import reportJsonSchema from "../../../contracts/schemas/analysis-report.v1.json";

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validateReportJson = ajv.compile(reportJsonSchema);

const skillId = z.enum(["content_strategy", "filming", "editing", "audio_music", "compliance"]);
const source = z.object({
  source_type: z.enum(["public_url", "public_url_best_effort", "file_upload", "owned_asset", "connected_media"]),
  source_label: z.string(),
  source_url: z.string().nullable().optional(),
  canonical_url: z.string().nullable().optional(),
  platform: z.enum(["instagram_reels", "youtube_shorts", "tiktok"]).nullable().optional(),
  content_id: z.string().nullable().optional(),
  duration_seconds: z.number().nonnegative(),
  width: z.number().int().nonnegative(),
  height: z.number().int().nonnegative(),
  fps: z.number().nonnegative(),
  has_audio: z.boolean(),
  ingest_status: z.enum(["downloaded", "uploaded", "partial"]),
  artifact_directory: z.string().nullable().optional(),
}).strict();

const recommendation = z.object({ priority: z.string(), title: z.string(), rationale: z.string(), action: z.string() }).strict();
const executedSkill = z.object({
  skill_id: skillId,
  status: z.enum(["completed", "insufficient_evidence", "failed"]),
  evaluated_items: z.array(z.string()),
  summary: z.string(),
  skill_score: z.number().min(0).max(10),
  property_scores: z.array(z.object({ property_id: z.string(), label: z.string(), score: z.number().min(0).max(10), rationale: z.string(), confidence: z.number().min(0).max(1) }).strict()),
  detailed_assessment: z.string(),
  strengths: z.array(z.string()),
  improvement_opportunities: z.array(z.string()),
  recommendations: z.array(recommendation),
  key_signals: z.array(z.string()),
  evidence: z.array(z.object({ timestamp_seconds: z.number().nonnegative(), kind: z.string(), observation: z.string(), transcript_quote: z.string().nullable().optional() }).strict()),
  evidence_gaps: z.array(z.string()),
  transcript_excerpts: z.array(z.object({ start_seconds: z.number().nonnegative(), end_seconds: z.number().nonnegative(), text: z.string(), why_it_matters: z.string() }).strict()),
  warnings: z.array(z.string()),
  disclaimer: z.string().nullable().optional(),
}).strict();

export const pythonReportSchema = z.object({
  source,
  catalog_version: z.string(),
  selected_skill_ids: z.array(skillId).min(1),
  executed_skills: z.array(executedSkill),
  transcript: z.object({
    text: z.string(),
    language: z.string(),
    segments: z.array(z.object({ start_seconds: z.number().nonnegative(), end_seconds: z.number().nonnegative(), text: z.string() }).strict()),
  }).strict(),
  overall_score: z.number().min(0).max(10).nullable().optional(),
  warnings: z.array(z.string()),
}).strict();

export function validatePythonReport(value: unknown): z.infer<typeof pythonReportSchema> {
  if (!validateReportJson(value)) {
    const message = validateReportJson.errors
      ?.map((error) => `${error.instancePath || "/"} ${error.message ?? "is invalid"}`)
      .join("; ") ?? "Report does not match analysis-report.v1.json.";
    throw new Error(`Invalid analysis report: ${message}`);
  }
  return pythonReportSchema.parse(value);
}

function camelKey(key: string): string {
  return key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

export function camelize<T>(value: unknown): T {
  if (Array.isArray(value)) return value.map((item) => camelize(item)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [camelKey(key), camelize(item)])) as T;
  }
  return value as T;
}
