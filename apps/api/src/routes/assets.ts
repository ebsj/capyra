import { Hono } from "hono";
import { z } from "zod";
import { principalOf, requireAuth, requireScope } from "../auth";
import {
  ApiError,
  DIRECT_UPLOAD_MAX_BYTES,
  MULTIPART_MAX_BYTES,
  nowIso,
  safeFileName,
  uuidv7,
  validationError,
} from "../common";
import {
  requireActiveBrand,
  recordAudit,
  ORIGINAL_RETENTION_SECONDS,
} from "../foundations";
import { validateMediaMetadata } from "../media-probe";
import { assetHasOpenDestinations } from "../social/lifecycle";
import { uploadRequest } from "../r2";
import { contractErrors, contractSchemas } from "../contract-validation";
import type { AppBindings } from "../runtime";

const assets = new Hono<AppBindings>();
assets.use("*", requireAuth);

interface AssetRow {
  id: string;
  brand_id: string | null;
  media_kind: "video" | "image";
  metadata_status: "pending" | "ready" | "failed";
  metadata_json: string | null;
  variant_of_asset_id: string | null;
  source_label: string;
  content_type: string;
  content_length: number;
  created_at: string;
  last_analyzed_at: string | null;
  analysis_count: number;
}

function mapAsset(row: AssetRow) {
  return {
    id: row.id,
    brandId: row.brand_id,
    mediaKind: row.media_kind,
    metadataStatus: row.metadata_status,
    metadata: row.metadata_json ? JSON.parse(row.metadata_json) : null,
    variantOfAssetId: row.variant_of_asset_id,
    sourceLabel: row.source_label,
    contentType: row.content_type,
    contentLength: row.content_length,
    analysisCount: row.analysis_count,
    createdAt: row.created_at,
    lastAnalyzedAt: row.last_analyzed_at,
  };
}

assets.get("/", requireScope("source-assets:read"), async (c) => {
  const principal = principalOf(c);
  const rows = await c.env.DB.prepare(
    `
    SELECT a.id,a.brand_id,a.media_kind,a.metadata_status,a.metadata_json,a.variant_of_asset_id, a.source_label, a.content_type, a.content_length, a.created_at,
      COUNT(v.id) AS analysis_count, MAX(v.created_at) AS last_analyzed_at
    FROM source_assets a LEFT JOIN video_analyses v
      ON v.source_asset_id = a.id AND v.deleted_at IS NULL
    WHERE a.account_id = ? AND a.upload_status = 'completed' AND a.deleted_at IS NULL AND (? IS NULL OR a.brand_id=?)
    GROUP BY a.id ORDER BY a.created_at DESC
  `
  )
    .bind(
      principal.account_id,
      c.req.query("brandId") ?? null,
      c.req.query("brandId") ?? null
    )
    .all<AssetRow>();
  return c.json({ items: rows.results.map(mapAsset) });
});

const uploadSchema = z
  .object({
    brandId: z.string().uuid(),
    variantOfAssetId: z.string().uuid().optional().nullable(),
    fileName: z.string().trim().min(1).max(255),
    contentType: z.string().trim().max(120).optional().nullable(),
    contentLength: z.number().int().positive().max(DIRECT_UPLOAD_MAX_BYTES),
  })
  .strict();

assets.post(
  "/direct-uploads",
  requireScope("source-assets:write"),
  async (c) => {
    const principal = principalOf(c);
    const rate = await c.env.ANALYSIS_RATE_LIMITER.limit({
      key: `upload:${principal.account_id}`,
    });
    if (!rate.success)
      throw new ApiError(
        429,
        "rate_limited",
        "Too many upload tickets were requested."
      );
    const payload = await c.req.json().catch(() => null);
    const boundaryErrors = contractErrors(
      contractSchemas.SourceAssetDirectUploadCreateRequest,
      payload
    );
    if (boundaryErrors.length) return validationError(c, boundaryErrors);
    const parsed = uploadSchema.safeParse(payload);
    if (!parsed.success)
      return validationError(
        c,
        parsed.error.issues.map((issue) => ({
          field: issue.path.join(".") || "request",
          message: issue.message,
        }))
      );
    const contentType = parsed.data.contentType || "application/octet-stream";
    const mediaKind = validateMediaMetadata(
      parsed.data.fileName,
      contentType,
      parsed.data.contentLength
    );
    await requireActiveBrand(c.env, principal.account_id, parsed.data.brandId);
    await validateVariant(c, parsed.data.variantOfAssetId, parsed.data.brandId);
    const sourceAssetId = uuidv7();
    const objectKey = `staging/${sourceAssetId}/${safeFileName(
      parsed.data.fileName
    )}`;
    const timestamp = nowIso();
    await c.env.DB.prepare(
      `
    INSERT INTO source_assets (id, account_id,brand_id,media_kind,variant_of_asset_id, source_label, content_type, content_length, object_key, upload_status, created_at)
    VALUES (?, ?,?,?,?, ?, ?, ?, ?, 'pending', ?)
  `
    )
      .bind(
        sourceAssetId,
        principal.account_id,
        parsed.data.brandId,
        mediaKind,
        parsed.data.variantOfAssetId ?? null,
        safeFileName(parsed.data.fileName),
        contentType,
        parsed.data.contentLength,
        objectKey,
        timestamp
      )
      .run();
    const signed = await uploadRequest(
      c.env,
      new URL(c.env.CAPYRA_AUTH_ISSUER).origin,
      objectKey,
      contentType,
      parsed.data.contentLength
    );
    return c.json({
      sourceAssetId,
      uploadUrl: signed.url,
      method: "PUT",
      headers: { "Content-Type": contentType },
      maxFileSizeBytes: DIRECT_UPLOAD_MAX_BYTES,
      expiresAt: new Date(Date.now() + 900_000).toISOString(),
    });
  }
);

assets.post(
  "/direct-uploads/:sourceAssetId/complete",
  requireScope("source-assets:write"),
  async (c) => {
    const principal = principalOf(c);
    const payload = await c.req.json().catch(() => null);
    const boundaryErrors = contractErrors(
      contractSchemas.SourceAssetDirectUploadCompleteRequest,
      payload
    );
    if (boundaryErrors.length) return validationError(c, boundaryErrors);
    const parsed = uploadSchema.safeParse(payload);
    if (!parsed.success)
      return validationError(
        c,
        parsed.error.issues.map((issue) => ({
          field: issue.path.join(".") || "request",
          message: issue.message,
        }))
      );
    const contentType = parsed.data.contentType || "application/octet-stream";
    const mediaKind = validateMediaMetadata(
      parsed.data.fileName,
      contentType,
      parsed.data.contentLength
    );
    await requireActiveBrand(c.env, principal.account_id, parsed.data.brandId);
    await validateVariant(c, parsed.data.variantOfAssetId, parsed.data.brandId);
    const row = await c.env.DB.prepare(
      "SELECT * FROM source_assets WHERE id = ? AND account_id = ? AND deleted_at IS NULL LIMIT 1"
    )
      .bind(c.req.param("sourceAssetId"), principal.account_id)
      .first<{
        id: string;
        object_key: string;
        upload_status: string;
        content_length: number;
        content_type: string;
        source_label: string;
        brand_id: string;
        variant_of_asset_id: string | null;
      }>();
    if (!row)
      throw new ApiError(
        404,
        "source_asset_not_found",
        "The source asset was not found."
      );
    if (
      row.source_label !== safeFileName(parsed.data.fileName) ||
      row.brand_id !== parsed.data.brandId ||
      (row.variant_of_asset_id ?? null) !==
        (parsed.data.variantOfAssetId ?? null)
    )
      throw new ApiError(
        409,
        "upload_metadata_mismatch",
        "The Brand or variant differs from the upload ticket."
      );
    if (row.upload_status === "completed")
      throw new ApiError(
        409,
        "source_asset_already_completed",
        "The source asset upload is already complete."
      );
    const object = await c.env.STORAGE.head(row.object_key);
    if (!object)
      throw new ApiError(
        409,
        "upload_object_missing",
        "The uploaded R2 object does not exist."
      );
    if (
      object.size !== parsed.data.contentLength ||
      object.size !== row.content_length
    ) {
      throw new ApiError(
        409,
        "upload_size_mismatch",
        "The uploaded object size does not match the declared content length.",
        {
          expected: row.content_length,
          actual: object.size,
        }
      );
    }
    if (row.content_type !== contentType)
      throw new ApiError(
        409,
        "upload_metadata_mismatch",
        "The uploaded content type does not match the ticket."
      );
    const finalKey = `source-assets/${principal.account_id}/${row.brand_id}/${
      row.id
    }/${safeFileName(parsed.data.fileName)}`;
    const source = await c.env.STORAGE.get(row.object_key);
    if (!source?.body)
      throw new ApiError(
        409,
        "upload_object_missing",
        "The uploaded R2 object does not exist."
      );
    await c.env.STORAGE.put(finalKey, source.body, {
      httpMetadata: { contentType },
      customMetadata: {
        accountId: principal.account_id,
        sourceAssetId: row.id,
      },
    });
    await c.env.STORAGE.delete(row.object_key);
    const completedAt = nowIso();
    await c.env.DB.prepare(
      "UPDATE source_assets SET object_key = ?, upload_status = 'completed', completed_at = ? WHERE id = ? AND account_id = ? AND upload_status = 'pending'"
    )
      .bind(finalKey, completedAt, row.id, principal.account_id)
      .run();
    const created = await c.env.DB.prepare(
      `SELECT id,brand_id,media_kind,metadata_status,metadata_json,variant_of_asset_id, source_label, content_type, content_length, created_at, 0 AS analysis_count, NULL AS last_analyzed_at FROM source_assets WHERE id = ? AND account_id = ?`
    )
      .bind(row.id, principal.account_id)
      .first<AssetRow>();
    await enqueueProbe(c.env, row.id);
    await recordAudit(
      c.env,
      principal,
      "asset.created",
      "asset",
      row.id,
      row.brand_id
    );
    return c.json(mapAsset(created!), 201, {
      Location: `/api/v1/source-assets/${row.id}`,
    });
  }
);

assets.post("/", requireScope("source-assets:write"), async (c) => {
  const declared = Number.parseInt(c.req.header("content-length") ?? "0", 10);
  if (declared > MULTIPART_MAX_BYTES)
    throw new ApiError(
      413,
      "direct_upload_required",
      "Multipart uploads above 100 MB must use a direct upload ticket.",
      {
        maxMultipartFileSizeBytes: MULTIPART_MAX_BYTES,
        directUploadEndpoint: "/api/v1/source-assets/direct-uploads",
      }
    );
  const form = await c.req.formData().catch(() => null);
  const file = form?.get("file");
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
      "Multipart uploads above 100 MB must use a direct upload ticket."
    );
  const mediaKind = validateMediaMetadata(
    file.name,
    file.type || "application/octet-stream",
    file.size
  );
  const principal = principalOf(c);
  const brandId = String(form!.get("brandId") ?? "");
  const variantOfAssetId = form!.get("variantOfAssetId")
    ? String(form!.get("variantOfAssetId"))
    : null;
  await requireActiveBrand(c.env, principal.account_id, brandId);
  await validateVariant(c, variantOfAssetId, brandId);
  const id = uuidv7();
  const key = `source-assets/${
    principal.account_id
  }/${brandId}/${id}/${safeFileName(file.name)}`;
  const timestamp = nowIso();
  await c.env.STORAGE.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
    customMetadata: { accountId: principal.account_id, sourceAssetId: id },
  });
  await c.env.DB.prepare(
    `INSERT INTO source_assets (id, account_id,brand_id,media_kind,variant_of_asset_id, source_label, content_type, content_length, object_key, upload_status, created_at, completed_at)
    VALUES (?, ?,?,?,?, ?, ?, ?, ?, 'completed', ?, ?)`
  )
    .bind(
      id,
      principal.account_id,
      brandId,
      mediaKind,
      variantOfAssetId,
      safeFileName(file.name),
      file.type || "application/octet-stream",
      file.size,
      key,
      timestamp,
      timestamp
    )
    .run();
  await enqueueProbe(c.env, id);
  await recordAudit(c.env, principal, "asset.created", "asset", id, brandId);
  return c.json(
    {
      id,
      brandId,
      mediaKind,
      metadataStatus: "pending",
      metadata: null,
      variantOfAssetId,
      sourceLabel: safeFileName(file.name),
      contentType: file.type,
      contentLength: file.size,
      analysisCount: 0,
      createdAt: timestamp,
      lastAnalyzedAt: null,
    },
    201,
    { Location: `/api/v1/source-assets/${id}` }
  );
});

async function enqueueProbe(env: import("../runtime").RuntimeEnv, id: string) {
  try {
    await env.SOCIAL_QUEUE.send({ kind: "probe", id });
  } catch {
    console.warn(
      JSON.stringify({ event: "media_probe_enqueue_deferred", assetId: id })
    );
  }
}
async function validateVariant(
  c: import("hono").Context<AppBindings>,
  id: string | null | undefined,
  brandId: string
) {
  if (!id) return;
  const found = await c.env.DB.prepare(
    "SELECT 1 FROM source_assets WHERE id=? AND account_id=? AND brand_id=? AND upload_status='completed' AND deleted_at IS NULL"
  )
    .bind(id, principalOf(c).account_id, brandId)
    .first();
  if (!found)
    throw new ApiError(
      404,
      "variant_source_not_found",
      "Choose an original in the same Brand."
    );
}
assets.get("/:id", requireScope("source-assets:read"), async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT *,0 AS analysis_count,NULL AS last_analyzed_at FROM source_assets WHERE id=? AND account_id=? AND deleted_at IS NULL"
  )
    .bind(c.req.param("id"), principalOf(c).account_id)
    .first<AssetRow>();
  if (!row)
    throw new ApiError(
      404,
      "source_asset_not_found",
      "The source asset was not found."
    );
  return c.json(mapAsset(row));
});
assets.get("/:id/content", requireScope("source-assets:read"), async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT object_key FROM source_assets WHERE id=? AND account_id=? AND upload_status='completed' AND deleted_at IS NULL"
  )
    .bind(c.req.param("id"), principalOf(c).account_id)
    .first<{ object_key: string }>();
  if (!row)
    throw new ApiError(
      404,
      "source_asset_not_found",
      "The source asset was not found."
    );
  const object = await c.env.STORAGE.get(row.object_key, {
    range: c.req.raw.headers,
  });
  if (!object)
    throw new ApiError(
      404,
      "source_asset_not_found",
      "The media is no longer available."
    );
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("cache-control", "private, max-age=60");
  headers.set("etag", object.httpEtag);
  headers.set("accept-ranges", "bytes");
  if (
    c.req.header("range") &&
    object.range &&
    "offset" in object.range &&
    object.range.offset !== undefined &&
    object.range.length
  ) {
    headers.set(
      "content-range",
      `bytes ${object.range.offset}-${
        object.range.offset + object.range.length - 1
      }/${object.size}`
    );
    headers.set("content-length", String(object.range.length));
    return new Response(object.body, { status: 206, headers });
  }
  headers.set("content-length", String(object.size));
  return new Response(object.body, { headers });
});
assets.delete("/:id", requireScope("source-assets:write"), async (c) => {
  const p = principalOf(c);
  const row = await c.env.DB.prepare(
    "SELECT brand_id FROM source_assets WHERE id=? AND account_id=? AND deleted_at IS NULL"
  )
    .bind(c.req.param("id"), p.account_id)
    .first<{ brand_id: string | null }>();
  if (!row)
    throw new ApiError(
      404,
      "source_asset_not_found",
      "The source asset was not found."
    );
  if (row.brand_id) await requireActiveBrand(c.env, p.account_id, row.brand_id);
  if (await assetHasOpenDestinations(c.env, p.account_id, c.req.param("id")))
    throw new ApiError(
      409,
      "media_in_use",
      "Media belongs to an open publication."
    );
  if (
    await c.env.DB.prepare(
      "SELECT 1 FROM video_analyses WHERE source_asset_id=? AND status='pending' AND deleted_at IS NULL LIMIT 1"
    )
      .bind(c.req.param("id"))
      .first()
  )
    throw new ApiError(
      409,
      "media_in_use",
      "Media belongs to a pending analysis."
    );
  const now = nowIso();
  try {
    await c.env.DB.prepare(
      "UPDATE source_assets SET deleted_at=?,purge_after=? WHERE id=? AND account_id=?"
    )
      .bind(
        now,
        new Date(Date.now() + ORIGINAL_RETENTION_SECONDS * 1000).toISOString(),
        c.req.param("id"),
        p.account_id
      )
      .run();
  } catch (error) {
    if (String(error).includes("source_asset_in_use"))
      throw new ApiError(
        409,
        "media_in_use",
        "Media belongs to work that has not completed."
      );
    throw error;
  }
  await recordAudit(
    c.env,
    p,
    "asset.deleted",
    "asset",
    c.req.param("id"),
    row.brand_id
  );
  return c.body(null, 204);
});
export default assets;
