import { Hono } from "hono";
import { artifactMetadata } from "../artifacts";
import { z } from "zod";
import {
  detail,
  listItem,
  ANALYSIS_SELECT,
  type AnalysisRow,
} from "../analyses";
import { principalOf, requireAuth, requireScope } from "../auth";
import { CATALOG_VERSION, catalogResponse, validateSkills } from "../catalog";
import {
  ApiError,
  MULTIPART_MAX_BYTES,
  addSeconds,
  normalizeR2Path,
  nowIso,
  safeFileName,
  uuidv7,
  validateVideoMetadata,
  validationError,
} from "../common";
import type { AnalysisJobMessage, AppBindings } from "../runtime";
import {
  requireActiveBrand,
  reserveAnalysisCredit,
  recordAudit,
} from "../foundations";
import {
  probeMedia,
  assertAnalyzable,
  type MediaMetadata,
} from "../media-probe";
import { contractErrors, contractSchemas } from "../contract-validation";

const routes = new Hono<AppBindings>();
routes.use("*", requireAuth);
routes.get("/analysis-skills", requireScope("analysis-skills:read"), (c) =>
  c.json(catalogResponse())
);

const analyses = new Hono<AppBindings>();
analyses.use("*", requireAuth);

const createSchema = z
  .object({
    brandId: z.string().uuid(),
    url: z.string().url().max(2_048).optional(),
    sourceAssetId: z.string().uuid().optional(),
    skills: z.array(z.string()).min(1).max(4),
    language: z.string().trim().min(2).max(16).optional().nullable(),
    intent: z.string().trim().max(1_000).optional().nullable(),
  })
  .strict()
  .refine((value) => Boolean(value.url) !== Boolean(value.sourceAssetId), {
    message: "Provide exactly one of url or sourceAssetId.",
  });

function assertPublicUrl(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== "https:")
    throw new ApiError(
      422,
      "invalid_source_url",
      "Only HTTPS public URLs are accepted."
    );
  const allowed = ["youtube.com", "youtu.be", "tiktok.com", "instagram.com"];
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (!allowed.some((domain) => host === domain || host.endsWith(`.${domain}`)))
    throw new ApiError(
      422,
      "unsupported_platform",
      "The source URL platform is not supported."
    );
  return url;
}

analyses.post("/", requireScope("analyses:create"), async (c) => {
  const principal = principalOf(c);
  const rate = await c.env.ANALYSIS_RATE_LIMITER.limit({
    key: `analysis:${principal.account_id}`,
  });
  if (!rate.success)
    throw new ApiError(429, "rate_limited", "Too many analyses were created.");
  const contentType = c.req.header("content-type") ?? "";
  let request: z.infer<typeof createSchema>;
  if (contentType.includes("application/json")) {
    const payload = await c.req.json().catch(() => null);
    const boundaryErrors = contractErrors(
      contractSchemas.postApiv1analyses_Body,
      payload
    );
    if (boundaryErrors.length) return validationError(c, boundaryErrors);
    const parsed = createSchema.safeParse(payload);
    if (!parsed.success)
      return validationError(
        c,
        parsed.error.issues.map((issue) => ({
          field: issue.path.join(".") || "request",
          message: issue.message,
        }))
      );
    request = parsed.data;
  } else if (contentType.includes("multipart/form-data")) {
    const declared = Number.parseInt(c.req.header("content-length") ?? "0", 10);
    if (declared > MULTIPART_MAX_BYTES)
      throw new ApiError(
        413,
        "direct_upload_required",
        "Multipart analyses above 100 MB must use sourceAssetId."
      );
    const form = await c.req.formData();
    const file = form.get("file");
    if (!(file instanceof File))
      throw new ApiError(
        422,
        "validation_error",
        "Exactly one file field is required."
      );
    if (file.size > MULTIPART_MAX_BYTES)
      throw new ApiError(
        413,
        "direct_upload_required",
        "Multipart analyses above 100 MB must use sourceAssetId."
      );
    validateVideoMetadata(
      file.name,
      file.type || "application/octet-stream",
      file.size
    );
    const brandId = String(form.get("brandId") ?? "");
    await requireActiveBrand(c.env, principal.account_id, brandId);
    const sourceAssetId = uuidv7();
    const key = `source-assets/${
      principal.account_id
    }/${brandId}/${sourceAssetId}/${safeFileName(file.name)}`;
    const timestamp = nowIso();
    await c.env.STORAGE.put(key, file.stream(), {
      httpMetadata: { contentType: file.type },
      customMetadata: { accountId: principal.account_id, sourceAssetId },
    });
    await c.env.DB.prepare(
      `INSERT INTO source_assets (id, account_id,brand_id, source_label, content_type, content_length, object_key, upload_status, created_at, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?)`
    )
      .bind(
        sourceAssetId,
        principal.account_id,
        brandId,
        safeFileName(file.name),
        file.type || "application/octet-stream",
        file.size,
        key,
        timestamp,
        timestamp
      )
      .run();
    request = {
      brandId,
      sourceAssetId,
      skills: String(form.get("skills") ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      language: String(form.get("language") ?? "pt-BR"),
      intent: form.get("intent") ? String(form.get("intent")) : null,
    };
  } else {
    throw new ApiError(
      415,
      "unsupported_media_type",
      "Content-Type must be application/json or multipart/form-data."
    );
  }
  await requireActiveBrand(c.env, principal.account_id, request.brandId);
  let skills;
  try {
    skills = validateSkills(request.skills);
  } catch (error) {
    return validationError(c, [
      {
        field: "skills",
        message: error instanceof Error ? error.message : "Invalid skills.",
      },
    ]);
  }
  let sourceType: "owned_asset" | "public_url_best_effort";
  let sourceLabel: string;
  let sourceUrl: string | null = null;
  if (request.sourceAssetId) {
    const asset = await c.env.DB.prepare(
      "SELECT id, source_label,object_key,media_kind,metadata_status,metadata_json FROM source_assets WHERE id = ? AND account_id = ? AND brand_id = ? AND upload_status = 'completed' AND deleted_at IS NULL"
    )
      .bind(request.sourceAssetId, principal.account_id, request.brandId)
      .first<{
        id: string;
        source_label: string;
        object_key: string;
        media_kind: "image" | "video";
        metadata_status: string;
        metadata_json: string | null;
      }>();
    if (!asset)
      throw new ApiError(
        404,
        "source_asset_not_found",
        "The source asset was not found."
      );
    if (asset.media_kind !== "video")
      throw new ApiError(
        422,
        "video_required",
        "Image analysis is not supported."
      );
    if (asset.metadata_status === "failed")
      throw new ApiError(422, "invalid_media", "Media inspection failed.");
    const metadata =
      asset.metadata_status === "ready" && asset.metadata_json
        ? (JSON.parse(asset.metadata_json) as MediaMetadata)
        : await probeMedia(c.env, {
            source_object_key: asset.object_key,
            source_label: asset.source_label,
            media_kind: "video",
          });
    assertAnalyzable(metadata, asset.media_kind);
    await c.env.DB.prepare(
      "UPDATE source_assets SET metadata_status='ready',metadata_json=? WHERE id=? AND account_id=?"
    )
      .bind(JSON.stringify(metadata), asset.id, principal.account_id)
      .run();
    sourceType = "owned_asset";
    sourceLabel = asset.source_label;
  } else {
    const url = assertPublicUrl(request.url!);
    assertAnalyzable(
      await probeMedia(c.env, {
        video_url: url.toString(),
        media_kind: "video",
      }),
      "video"
    );
    sourceType = "public_url_best_effort";
    sourceLabel = url.toString();
    sourceUrl = url.toString();
  }
  const id = uuidv7();
  const timestamp = nowIso();
  await reserveAnalysisCredit(
    c.env,
    principal.account_id,
    id,
    c.env.DB.prepare(
      `INSERT INTO video_analyses
    (id, account_id,brand_id, source_asset_id, status, source_type, source_label, source_url, language, intent, catalog_version, selected_skill_ids_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      principal.account_id,
      request.brandId,
      request.sourceAssetId ?? null,
      sourceType,
      sourceLabel,
      sourceUrl,
      request.language || "pt-BR",
      request.intent || null,
      CATALOG_VERSION,
      JSON.stringify(skills),
      timestamp,
      timestamp
    )
  );
  await recordAudit(
    c.env,
    principal,
    "analysis.created",
    "analysis",
    id,
    request.brandId
  );
  try {
    await c.env.ANALYSIS_QUEUE.send(
      { analysisId: id } satisfies AnalysisJobMessage,
      { contentType: "json" }
    );
  } catch {
    console.warn(
      JSON.stringify({ event: "analysis_enqueue_deferred", analysisId: id })
    );
  }
  const row = await c.env.DB.prepare(
    `${ANALYSIS_SELECT} WHERE id = ? AND account_id = ?`
  )
    .bind(id, principal.account_id)
    .first<AnalysisRow>();
  return c.json(await detail(c.env, row!), 201, {
    Location: `/api/v1/analyses/${id}`,
  });
});

analyses.get("/", requireScope("analyses:read"), async (c) => {
  const principal = principalOf(c);
  const rows = await c.env.DB.prepare(
    `${ANALYSIS_SELECT} WHERE account_id = ? AND deleted_at IS NULL AND (? IS NULL OR brand_id=?) ORDER BY created_at DESC LIMIT 100`
  )
    .bind(
      principal.account_id,
      c.req.query("brandId") ?? null,
      c.req.query("brandId") ?? null
    )
    .all<AnalysisRow>();
  return c.json({ items: rows.results.map(listItem) });
});

analyses.get("/latest", requireScope("analyses:read"), async (c) => {
  const principal = principalOf(c);
  const limit = Math.min(
    Math.max(Number.parseInt(c.req.query("limit") ?? "20", 10) || 20, 1),
    100
  );
  const cursor = c.req.query("cursor");
  let before: string | null = null;
  if (cursor) {
    try {
      before = atob(cursor);
    } catch {
      throw new ApiError(400, "invalid_cursor", "The cursor is invalid.");
    }
  }
  const condition = before ? "AND created_at < ?" : "";
  const statement = c.env.DB.prepare(
    `${ANALYSIS_SELECT} WHERE account_id = ? AND deleted_at IS NULL ${condition} ORDER BY created_at DESC LIMIT ?`
  );
  const result = before
    ? await statement
        .bind(principal.account_id, before, limit + 1)
        .all<AnalysisRow>()
    : await statement.bind(principal.account_id, limit + 1).all<AnalysisRow>();
  const hasMore = result.results.length > limit;
  const page = result.results.slice(0, limit);
  const total = await c.env.DB.prepare(
    "SELECT COUNT(*) AS count FROM video_analyses WHERE account_id = ? AND deleted_at IS NULL"
  )
    .bind(principal.account_id)
    .first<{ count: number }>();
  const items = page.map((row) => ({
    id: row.id,
    brandId: row.brand_id,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    status: row.status,
    fileName: row.source_label,
    sourceLabel: row.source_label,
    sourceType: row.source_type,
    selectedSkills: JSON.parse(row.selected_skill_ids_json),
    executedSkills: JSON.parse(row.executed_skills_json).map(
      (skill: { skillId?: string; skill_id?: string }) =>
        skill.skillId ?? skill.skill_id
    ),
    overallScore: row.overall_score,
    mainOpportunity: null,
    oneLineSummary: row.summary || "Análise em processamento.",
    detailHint: {
      analysisId: row.id,
      tool: "get_analysis",
      message: "Use o ID para consultar os detalhes.",
    },
    intent: row.intent,
  }));
  const nextCursor =
    hasMore && page.length ? btoa(page[page.length - 1].created_at) : null;
  return c.json({
    total: total?.count ?? 0,
    returned: items.length,
    limit,
    sort: "createdAt_desc",
    hasMore,
    nextCursor,
    defaultView: "latest_analyses_table",
    message: "Latest analyses",
    summary: `${items.length} analyses returned.`,
    tableColumns: ["createdAt", "sourceLabel", "status", "overallScore"],
    recommendedResponse: {
      format: "table",
      columns: ["createdAt", "sourceLabel", "status", "overallScore"],
      instructions: "Show newest analyses first.",
    },
    presentation: null,
    pagination: {
      totalItems: total?.count ?? 0,
      limit,
      returned: items.length,
      hasMore,
      nextCursor,
    },
    items,
  });
});

analyses.get("/:id", requireScope("analyses:read"), async (c) => {
  const row = await ownedAnalysis(c);
  return c.json(await detail(c.env, row));
});

analyses.delete("/:id", requireScope("analyses:read"), async (c) => {
  const row = await ownedAnalysis(c);
  if (row.brand_id)
    await requireActiveBrand(c.env, row.account_id, row.brand_id);
  const timestamp = nowIso();
  await c.env.DB.prepare(
    "UPDATE video_analyses SET deleted_at = ?, purge_after = ?, updated_at = ? WHERE id = ? AND account_id = ?"
  )
    .bind(
      timestamp,
      addSeconds(timestamp, 30 * 86_400),
      timestamp,
      row.id,
      row.account_id
    )
    .run();
  await recordAudit(
    c.env,
    principalOf(c),
    "analysis.deleted",
    "analysis",
    row.id,
    row.brand_id
  );
  return c.body(null, 204);
});

analyses.get("/:id/artifacts/*", requireScope("analyses:read"), async (c) => {
  const row = await ownedAnalysis(c);
  const path = normalizeR2Path(
    c.req.path.split(`/analyses/${row.id}/artifacts/`)[1] ?? ""
  );
  if (!path)
    throw new ApiError(
      404,
      "artifact_not_found",
      "The artifact was not found."
    );
  const files = JSON.parse(row.artifact_files_json) as string[];
  if (!files.includes(path) || !row.artifact_prefix)
    throw new ApiError(
      404,
      "artifact_not_found",
      "The artifact was not found."
    );
  const object = await c.env.STORAGE.get(`${row.artifact_prefix}/${path}`);
  if (!object?.body)
    throw new ApiError(
      404,
      "artifact_not_found",
      "The artifact was not found."
    );
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  const storedType = headers
    .get("content-type")
    ?.split(";")[0]
    .trim()
    .toLowerCase();
  if (!storedType || storedType === "application/octet-stream") {
    headers.set("content-type", artifactMetadata(path).mimeType);
  }
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "private, max-age=300");
  return new Response(object.body, { headers });
});

analyses.patch("/:id/brand", requireScope("analyses:create"), async (c) => {
  const row = await ownedAnalysis(c);
  const p = principalOf(c);
  const payload = await c.req.json().catch(() => null);
  const boundaryErrors = contractErrors(
    contractSchemas.AssignAnalysisBrandRequest,
    payload
  );
  if (boundaryErrors.length) return validationError(c, boundaryErrors);
  const parsed = z
    .object({ brandId: z.string().uuid() })
    .strict()
    .safeParse(payload);
  if (!parsed.success)
    return validationError(c, [
      { field: "brandId", message: "Choose a Brand." },
    ]);
  await requireActiveBrand(c.env, p.account_id, parsed.data.brandId);
  if (row.brand_id)
    throw new ApiError(
      409,
      "analysis_brand_immutable",
      "Only legacy analyses can be assigned to a Brand."
    );
  if (row.source_asset_id) {
    const incompatible = await c.env.DB.prepare(
      "SELECT 1 FROM source_assets WHERE id=? AND account_id=? AND brand_id IS NOT NULL AND brand_id!=? UNION ALL SELECT 1 FROM video_analyses WHERE source_asset_id=? AND account_id=? AND brand_id IS NOT NULL AND brand_id!=? LIMIT 1"
    )
      .bind(
        row.source_asset_id,
        p.account_id,
        parsed.data.brandId,
        row.source_asset_id,
        p.account_id,
        parsed.data.brandId
      )
      .first();
    if (incompatible)
      throw new ApiError(
        409,
        "asset_brand_conflict",
        "The source asset already belongs to another Brand."
      );
  }
  const statements = [];
  if (row.source_asset_id)
    statements.push(
      c.env.DB.prepare(
        "UPDATE source_assets SET brand_id=? WHERE id=? AND account_id=? AND brand_id IS NULL"
      ).bind(parsed.data.brandId, row.source_asset_id, p.account_id)
    );
  statements.push(
    c.env.DB.prepare(
      "UPDATE video_analyses SET brand_id=?,updated_at=? WHERE id=? AND account_id=? AND brand_id IS NULL AND (source_asset_id IS NULL OR EXISTS(SELECT 1 FROM source_assets WHERE id=video_analyses.source_asset_id AND brand_id=?))"
    ).bind(
      parsed.data.brandId,
      nowIso(),
      row.id,
      p.account_id,
      parsed.data.brandId
    )
  );
  const results = await c.env.DB.batch(statements);
  if (!results[results.length - 1].meta.changes)
    throw new ApiError(
      409,
      "analysis_brand_immutable",
      "The analysis or source has already been assigned."
    );
  await recordAudit(
    c.env,
    p,
    "analysis.brand_assigned",
    "analysis",
    row.id,
    parsed.data.brandId
  );
  return c.json(await detail(c.env, await ownedAnalysis(c)));
});

async function ownedAnalysis(
  c: import("hono").Context<AppBindings>
): Promise<AnalysisRow> {
  const principal = principalOf(c);
  const row = await c.env.DB.prepare(
    `${ANALYSIS_SELECT} WHERE id = ? AND account_id = ? AND deleted_at IS NULL LIMIT 1`
  )
    .bind(c.req.param("id"), principal.account_id)
    .first<AnalysisRow>();
  if (!row)
    throw new ApiError(
      404,
      "analysis_not_found",
      "The analysis was not found."
    );
  return row;
}

routes.route("/analyses", analyses);
export default routes;
