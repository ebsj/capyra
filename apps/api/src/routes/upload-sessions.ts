import { Hono } from "hono";
import { z } from "zod";
import { principalOf, requireAuth, requireScope } from "../auth";
import {
  ApiError,
  addSeconds,
  nowIso,
  uuidv7,
  validationError,
} from "../common";
import { contractErrors, contractSchemas } from "../contract-validation";
import { requireActiveBrand } from "../foundations";
import type { AppBindings } from "../runtime";

const sessions = new Hono<AppBindings>();
sessions.use("*", requireAuth);

interface SessionRow {
  id: string;
  brand_id: string | null;
  status: "pending" | "completed" | "expired";
  client_id: string | null;
  source_asset_id: string | null;
  created_at: string;
  expires_at: string;
  completed_at: string | null;
}

function response(baseUrl: string, row: SessionRow) {
  return {
    id: row.id,
    brandId: row.brand_id,
    status: row.status,
    browserUrl: `${baseUrl.replace(/\/$/, "")}/integrations/source-assets/${
      row.id
    }`,
    clientId: row.client_id,
    sourceAssetId: row.source_asset_id,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    completedAt: row.completed_at,
  };
}

async function getSession(
  c: import("hono").Context<AppBindings>
): Promise<SessionRow> {
  const principal = principalOf(c);
  let row = await c.env.DB.prepare(
    "SELECT id,brand_id, status, client_id, source_asset_id, created_at, expires_at, completed_at FROM upload_sessions WHERE id = ? AND account_id = ?"
  )
    .bind(c.req.param("id"), principal.account_id)
    .first<SessionRow>();
  if (!row)
    throw new ApiError(
      404,
      "upload_session_not_found",
      "Source asset upload session was not found."
    );
  if (row.status === "pending" && row.expires_at <= nowIso()) {
    await c.env.DB.prepare(
      "UPDATE upload_sessions SET status = 'expired' WHERE id = ? AND status = 'pending'"
    )
      .bind(row.id)
      .run();
    row = { ...row, status: "expired" };
  }
  return row;
}

sessions.post("/", requireScope("source-assets:write"), async (c) => {
  const payload = await c.req.json().catch(() => null);
  const boundaryErrors = contractErrors(
    contractSchemas.SourceAssetUploadSessionCreateRequest,
    payload
  );
  if (boundaryErrors.length) return validationError(c, boundaryErrors);
  const parsed = z
    .object({
      brandId: z.string().uuid(),
      clientId: z.string().max(100).optional().nullable(),
    })
    .strict()
    .safeParse(payload);
  if (!parsed.success)
    return validationError(
      c,
      parsed.error.issues.map((issue) => ({
        field: issue.path.join(".") || "request",
        message: issue.message,
      }))
    );
  const principal = principalOf(c);
  await requireActiveBrand(c.env, principal.account_id, parsed.data.brandId);
  const id = uuidv7();
  const createdAt = nowIso();
  const expiresAt = addSeconds(
    createdAt,
    Number.parseInt(c.env.CAPYRA_OAUTH_UPLOAD_SESSION_LIFETIME_MINUTES, 10) * 60
  );
  const clientId = parsed.data.clientId ?? principal.client_id ?? null;
  await c.env.DB.prepare(
    `INSERT INTO upload_sessions
    (id, account_id,brand_id, account_user_id, client_id, status, created_at, expires_at) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`
  )
    .bind(
      id,
      principal.account_id,
      parsed.data.brandId,
      principal.sub,
      clientId,
      createdAt,
      expiresAt
    )
    .run();
  return c.json(
    response(c.env.CAPYRA_WEB_BASE_URL, {
      id,
      brand_id: parsed.data.brandId,
      status: "pending",
      client_id: clientId,
      source_asset_id: null,
      created_at: createdAt,
      expires_at: expiresAt,
      completed_at: null,
    })
  );
});

sessions.get("/:id", requireScope("source-assets:read"), async (c) =>
  c.json(response(c.env.CAPYRA_WEB_BASE_URL, await getSession(c)))
);

sessions.post(
  "/:id/complete",
  requireScope("source-assets:write"),
  async (c) => {
    const payload = await c.req.json().catch(() => null);
    const boundaryErrors = contractErrors(
      contractSchemas.SourceAssetUploadSessionCompleteRequest,
      payload
    );
    if (boundaryErrors.length) return validationError(c, boundaryErrors);
    const parsed = z
      .object({ sourceAssetId: z.string().uuid() })
      .strict()
      .safeParse(payload);
    if (!parsed.success)
      return validationError(
        c,
        parsed.error.issues.map((issue) => ({
          field: issue.path.join(".") || "request",
          message: issue.message,
        }))
      );
    const session = await getSession(c);
    if (session.status !== "pending")
      throw new ApiError(
        409,
        "upload_session_not_pending",
        "Upload session is no longer pending."
      );
    const principal = principalOf(c);
    await requireActiveBrand(
      c.env,
      principal.account_id,
      session.brand_id ?? ""
    );
    const asset = await c.env.DB.prepare(
      "SELECT id FROM source_assets WHERE id = ? AND account_id = ? AND brand_id=? AND upload_status = 'completed' AND deleted_at IS NULL"
    )
      .bind(parsed.data.sourceAssetId, principal.account_id, session.brand_id)
      .first<{ id: string }>();
    if (!asset)
      throw new ApiError(
        404,
        "source_asset_not_found",
        "The source asset was not found."
      );
    const completedAt = nowIso();
    const result = await c.env.DB.prepare(
      "UPDATE upload_sessions SET status = 'completed', source_asset_id = ?, completed_at = ? WHERE id = ? AND account_id = ? AND status = 'pending' AND expires_at > ?"
    )
      .bind(
        asset.id,
        completedAt,
        session.id,
        principal.account_id,
        completedAt
      )
      .run();
    if ((result.meta.changes ?? 0) !== 1)
      throw new ApiError(
        409,
        "upload_session_not_pending",
        "Upload session is no longer pending."
      );
    return c.json(
      response(c.env.CAPYRA_WEB_BASE_URL, {
        ...session,
        status: "completed",
        source_asset_id: asset.id,
        completed_at: completedAt,
      })
    );
  }
);

export default sessions;
