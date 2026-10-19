import type { AnalysisDetailResponseContract, AnalysisListItemContract, ExecutedAnalysisSkillContract } from "@capyra/contracts";
import { parseJson } from "./common";
import { artifactMetadata } from "./artifacts";
import { camelize } from "./report";
import type { RuntimeEnv } from "./runtime";

export interface AnalysisRow {
  id: string;
  account_id: string;
  brand_id: string | null;
  source_asset_id: string | null;
  status: "pending" | "completed" | "failed";
  source_type: AnalysisListItemContract["sourceType"];
  source_label: string;
  source_url: string | null;
  canonical_url: string | null;
  platform: AnalysisListItemContract["platform"];
  content_id: string | null;
  catalog_version: string;
  selected_skill_ids_json: string;
  executed_skills_json: string;
  summary: string;
  overall_score: number | null;
  report_object_key: string | null;
  artifact_prefix: string | null;
  artifact_files_json: string;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  intent: string | null;
}

function artifacts(row: AnalysisRow) {
  const files = parseJson<string[]>(row.artifact_files_json, []);
  return {
    blobPathPrefix: row.artifact_prefix,
    files,
    items: files.map((path) => ({
      path,
      fileName: path.split("/").pop() ?? path,
      ...artifactMetadata(path),
      downloadUrl: `/api/v1/analyses/${row.id}/artifacts/${path}`,
      previewUrl: `/api/v1/analyses/${row.id}/artifacts/${path}`,
    })),
  };
}


export function listItem(row: AnalysisRow): AnalysisListItemContract {
  return {
    id: row.id,
    brandId: row.brand_id,
    status: row.status,
    sourceType: row.source_type,
    sourceLabel: row.source_label,
    sourceUrl: row.source_url,
    platform: row.platform,
    contentId: row.content_id,
    catalogVersion: row.catalog_version,
    selectedSkillIds: parseJson(row.selected_skill_ids_json, []),
    executedSkills: parseJson<ExecutedAnalysisSkillContract[]>(row.executed_skills_json, []),
    summary: row.summary,
    overallScore: row.overall_score,
    blobPathPrefix: row.artifact_prefix,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    intent: row.intent,
  };
}

export async function detail(env: RuntimeEnv, row: AnalysisRow): Promise<AnalysisDetailResponseContract> {
  let report: AnalysisDetailResponseContract["report"] = null;
  if (row.report_object_key) {
    const object = await env.STORAGE.get(row.report_object_key);
    if (object) report = camelize(await object.json());
  }
  return {
    ...listItem(row),
    accountId: row.account_id,
    canonicalUrl: row.canonical_url,
    artifacts: artifacts(row),
    report,
  };
}

export const ANALYSIS_SELECT = `
  SELECT id, account_id,brand_id, source_asset_id, status, source_type, source_label, source_url, canonical_url,
    platform, content_id, catalog_version, selected_skill_ids_json, executed_skills_json, summary,
    overall_score, report_object_key, artifact_prefix, artifact_files_json, error_message, created_at,
    completed_at, intent FROM video_analyses
`;
