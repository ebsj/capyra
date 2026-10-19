import { Container, getRandom } from "@cloudflare/containers";
import type { OutboundHandler } from "@cloudflare/containers";
import { ApiError, addSeconds, nowIso, parseJson } from "./common";
import { handleContainerR2Request } from "./container-r2";
import { validatePythonReport } from "./report";
import type { AnalysisJobMessage, RuntimeEnv } from "./runtime";

interface ProcessingRow {
  id: string;
  status: "pending" | "completed" | "failed";
  source_type: "owned_asset" | "public_url_best_effort";
  source_label: string;
  source_url: string | null;
  source_asset_id: string | null;
  language: string;
  intent: string | null;
  catalog_version: string;
  selected_skill_ids_json: string;
  object_key: string | null;
  attempts: number;
}

interface ContainerResponse {
  report_object_key: string;
  artifact_prefix: string;
  artifact_files: string[];
}

export class AnalysisContainer extends Container<Env> {
  defaultPort = 8080;
  sleepAfter = "60s";
  enableInternet = true;

  constructor(ctx: DurableObjectState<{}>, env: Env) {
    super(ctx, env);
    this.envVars = {
      CAPYRA_R2_BINDING_BASE_URL: "http://capyra-r2.internal",
      ...(env.OPENAI_API_KEY ? { OPENAI_API_KEY: env.OPENAI_API_KEY } : {}),
    };
  }
}

AnalysisContainer.outboundByHost = {
  "capyra-r2.internal": handleContainerR2Request as OutboundHandler,
};

export async function containerHealth(env: RuntimeEnv): Promise<Response> {
  const container = await getRandom(env.ANALYSIS_CONTAINER as DurableObjectNamespace<AnalysisContainer>, 2);
  const response = await container.fetch("http://container/health/storage");
  const probeKey = "development/container-storage-health.txt";
  try {
    if (response.ok && !(await env.STORAGE.head(probeKey))) {
      return new Response("Container did not publish the storage health object.", { status: 502 });
    }
    return response;
  } finally {
    await env.STORAGE.delete(probeKey);
  }
}

export async function consumeAnalysisMessage(env: RuntimeEnv, message: Message<AnalysisJobMessage>): Promise<void> {
  const timestamp = nowIso();
  const leaseUntil = addSeconds(timestamp, 15 * 60);
  const lease = await env.DB.prepare(`
    UPDATE video_analyses SET lease_expires_at = ?, attempts = attempts + 1, updated_at = ?
    WHERE id = ? AND status = 'pending' AND deleted_at IS NULL
      AND (lease_expires_at IS NULL OR lease_expires_at < ?)
  `).bind(leaseUntil, timestamp, message.body.analysisId, timestamp).run();
  if ((lease.meta.changes ?? 0) === 0) {
    const current = await env.DB.prepare("SELECT status, lease_expires_at FROM video_analyses WHERE id = ?")
      .bind(message.body.analysisId).first<{ status: string; lease_expires_at: string | null }>();
    if (!current || current.status !== "pending") return;
    throw new ApiError(409, "analysis_leased", "The analysis is already being processed.");
  }

  const row = await env.DB.prepare(`
    SELECT a.id, a.status, a.source_type, a.source_label, a.source_url, a.source_asset_id, a.language,
      a.intent, a.catalog_version, a.selected_skill_ids_json, a.attempts, s.object_key
    FROM video_analyses a LEFT JOIN source_assets s ON s.id = a.source_asset_id
    WHERE a.id = ? LIMIT 1
  `).bind(message.body.analysisId).first<ProcessingRow>();
  if (!row) return;

  try {
    const container = await getRandom(env.ANALYSIS_CONTAINER as DurableObjectNamespace<AnalysisContainer>, 2);
    const response = await container.fetch("http://container/jobs/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        analysis_id: row.id,
        source_type: row.source_type,
        source_label: row.source_label,
        source_object_key: row.object_key,
        video_url: row.source_url,
        language: row.language,
        skills: parseJson(row.selected_skill_ids_json, []),
        catalog_version: row.catalog_version,
        intent: row.intent,
      }),
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`Container returned ${response.status}.`);
    }
    const result = await response.json<ContainerResponse>();
    const reportObject = await env.STORAGE.get(result.report_object_key);
    if (!reportObject) throw new Error("Container did not publish report.json to R2.");
    const pythonReport = validatePythonReport(await reportObject.json());
    const executed = pythonReport.executed_skills;
    const summary = executed.map((skill) => skill.summary).filter(Boolean).join(" ").slice(0, 2_000);
    const completedAt = nowIso();
    const update = await env.DB.prepare(`
      UPDATE video_analyses SET status = 'completed', canonical_url = ?, platform = ?, content_id = ?,
        executed_skills_json = ?, summary = ?, overall_score = ?, report_object_key = ?, artifact_prefix = ?,
        artifact_files_json = ?, error_message = NULL, completed_at = ?, updated_at = ?, lease_expires_at = NULL
      WHERE id = ? AND status = 'pending' AND deleted_at IS NULL
    `).bind(
      pythonReport.source.canonical_url ?? null,
      pythonReport.source.platform ?? null,
      pythonReport.source.content_id ?? null,
      JSON.stringify(executed),
      summary,
      pythonReport.overall_score ?? null,
      result.report_object_key,
      result.artifact_prefix,
      JSON.stringify(result.artifact_files),
      completedAt,
      completedAt,
      row.id,
    ).run();
    if ((update.meta.changes ?? 0) === 0) throw new Error("Analysis completion lost its conditional update.");
  } catch (error) {
    await env.DB.prepare("UPDATE video_analyses SET lease_expires_at = NULL, error_message = ?, updated_at = ? WHERE id = ? AND status = 'pending'")
      .bind(error instanceof Error ? error.message.slice(0, 1_000) : "Analysis processing failed.", nowIso(), row.id).run();
    throw error;
  }
}

export async function markDlqFailure(env: RuntimeEnv, message: Message<AnalysisJobMessage>): Promise<void> {
  const timestamp = nowIso();
  await env.DB.prepare(`
    UPDATE video_analyses SET status = 'failed', error_message = 'Analysis failed after all retry attempts.',
      completed_at = ?, updated_at = ?, lease_expires_at = NULL
    WHERE id = ? AND status = 'pending'
  `).bind(timestamp, timestamp, message.body.analysisId).run();
}

export async function reconcile(env: RuntimeEnv): Promise<void> {
  const timestamp = nowIso();
  const pending = await env.DB.prepare(`
    SELECT id FROM video_analyses WHERE status = 'pending' AND deleted_at IS NULL
      AND (lease_expires_at IS NULL OR lease_expires_at < ?) AND attempts < 6
    ORDER BY created_at LIMIT 100
  `).bind(timestamp).all<{ id: string }>();
  if (pending.results.length) {
    await env.ANALYSIS_QUEUE.sendBatch(pending.results.map(({ id }) => ({ body: { analysisId: id }, contentType: "json" })));
  }
  await env.DB.prepare(`
    UPDATE video_analyses SET status = 'failed', error_message = 'Analysis exhausted all processing attempts.', completed_at = ?, updated_at = ?
    WHERE status = 'pending' AND attempts >= 6 AND (lease_expires_at IS NULL OR lease_expires_at < ?)
  `).bind(timestamp, timestamp, timestamp).run();
}

export async function purgeExpired(env: RuntimeEnv): Promise<void> {
  const timestamp = nowIso();
  const rows = await env.DB.prepare("SELECT id, artifact_prefix, report_object_key FROM video_analyses WHERE deleted_at IS NOT NULL AND purge_after <= ? LIMIT 100")
    .bind(timestamp).all<{ id: string; artifact_prefix: string | null; report_object_key: string | null }>();
  for (const row of rows.results) {
    const prefix = `analyses/${row.id}/`;
    let cursor: string | undefined;
    do {
      const objects = await env.STORAGE.list({ prefix, cursor, limit: 1_000 });
      if (objects.objects.length) await env.STORAGE.delete(objects.objects.map((object) => object.key));
      cursor = objects.truncated ? objects.cursor : undefined;
    } while (cursor);
    await env.DB.prepare("DELETE FROM video_analyses WHERE id = ? AND purge_after <= ?").bind(row.id, timestamp).run();
  }
  const staging = await env.STORAGE.list({ prefix: "staging/", limit: 1_000 });
  const cutoff = Date.now() - 86_400_000;
  const expiredKeys = staging.objects.filter((object) => object.uploaded.getTime() < cutoff).map((object) => object.key);
  if (expiredKeys.length) await env.STORAGE.delete(expiredKeys);
}
