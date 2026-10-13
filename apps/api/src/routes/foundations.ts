import { Hono } from "hono";
import { z } from "zod";
import { requireAuth, principalOf } from "../auth";
import {
  ApiError,
  nowIso,
  uuidv7,
  addSeconds,
  validationError,
} from "../common";
import { contractErrors, contractSchemas } from "../contract-validation";
import { randomToken, sha256 } from "../crypto";
import {
  acceptInvitation,
  brandResponse,
  ensureAccountFoundations,
  ORIGINAL_RETENTION_SECONDS,
  recordAudit,
  requireOwner,
  usageResponse,
  validateTimeZone,
  type BrandRow,
} from "../foundations";
import {
  cancelBrandDestinations,
  disconnectBrandAccounts,
} from "../social/lifecycle";
import type { AppBindings, AppContext, RuntimeEnv } from "../runtime";

const routes = new Hono<AppBindings>();
routes.use("*", requireAuth);
routes.use("*", async (c, next) => {
  if (
    principalOf(c).client_id &&
    !(c.req.method === "GET" && /\/brands\/?$/.test(c.req.path))
  ) {
    throw new ApiError(
      403,
      "first_party_required",
      "This operation is available only in the Capyra application."
    );
  }
  await next();
});
const brandSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    timeZone: z.string().min(1).max(80),
  })
  .strict();
async function ownedBrand(c: AppContext): Promise<BrandRow> {
  const row = await c.env.DB.prepare(
    "SELECT * FROM brands WHERE id=? AND account_id=?"
  )
    .bind(c.req.param("id"), principalOf(c).account_id)
    .first<BrandRow>();
  if (!row)
    throw new ApiError(404, "brand_not_found", "The Brand was not found.");
  return row;
}
function invalid(c: AppContext, error: z.ZodError) {
  return validationError(
    c,
    error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
  );
}
function quotaError(error: unknown): never {
  if (String(error).includes("brand_quota_exceeded"))
    throw new ApiError(
      409,
      "brand_quota_exceeded",
      "The active Brand limit has been reached."
    );
  throw error;
}
routes.get("/brands", async (c) => {
  const p = principalOf(c);
  await ensureAccountFoundations(c.env, p.account_id);
  const rows = await c.env.DB.prepare(
    "SELECT * FROM brands WHERE account_id=? ORDER BY created_at,id"
  )
    .bind(p.account_id)
    .all<BrandRow>();
  return c.json({ items: rows.results.map(brandResponse) });
});
routes.post("/brands", async (c) => {
  const p = principalOf(c);
  requireOwner(p);
  const payload = await c.req.json().catch(() => null);
  const boundaryErrors = contractErrors(
    contractSchemas.BrandCreateRequest,
    payload
  );
  if (boundaryErrors.length) return validationError(c, boundaryErrors);
  const parsed = brandSchema.safeParse(payload);
  if (!parsed.success) return invalid(c, parsed.error);
  validateTimeZone(parsed.data.timeZone);
  await ensureAccountFoundations(c.env, p.account_id);
  const id = uuidv7(),
    now = nowIso();
  try {
    await c.env.DB.prepare(
      "INSERT INTO brands(id,account_id,name,time_zone,confirmed_at,status,created_at,updated_at) VALUES(?,?,?,?,?,'active',?,?)"
    )
      .bind(
        id,
        p.account_id,
        parsed.data.name,
        parsed.data.timeZone,
        now,
        now,
        now
      )
      .run();
  } catch (e) {
    quotaError(e);
  }
  await recordAudit(c.env, p, "brand.created", "brand", id, id);
  return c.json(
    brandResponse(
      (await c.env.DB.prepare(
        "SELECT * FROM brands WHERE id=? AND account_id=?"
      )
        .bind(id, p.account_id)
        .first<BrandRow>())!
    ),
    201
  );
});
routes.patch("/brands/:id", async (c) => {
  const p = principalOf(c);
  requireOwner(p);
  const row = await ownedBrand(c);
  if (row.status !== "active")
    throw new ApiError(409, "brand_read_only", "The Brand is read only.");
  const payload = await c.req.json().catch(() => null);
  const boundaryErrors = contractErrors(
    contractSchemas.BrandUpdateRequest,
    payload
  );
  if (boundaryErrors.length) return validationError(c, boundaryErrors);
  const parsed = brandSchema
    .partial()
    .extend({ confirmed: z.boolean().optional() })
    .strict()
    .safeParse(payload);
  if (!parsed.success) return invalid(c, parsed.error);
  if (parsed.data.timeZone) validateTimeZone(parsed.data.timeZone);
  await c.env.DB.prepare(
    "UPDATE brands SET name=?,time_zone=?,confirmed_at=?,updated_at=? WHERE id=? AND account_id=? AND status='active'"
  )
    .bind(
      parsed.data.name ?? row.name,
      parsed.data.timeZone ?? row.time_zone,
      parsed.data.confirmed === true ? nowIso() : row.confirmed_at,
      nowIso(),
      row.id,
      p.account_id
    )
    .run();
  await recordAudit(c.env, p, "brand.updated", "brand", row.id, row.id);
  return c.json(brandResponse(await ownedBrand(c)));
});
export async function finishBrandArchive(
  env: RuntimeEnv,
  accountId: string,
  brandId: string
): Promise<boolean> {
  if (!(await cancelBrandDestinations(env, accountId, brandId))) return false;
  if (!(await disconnectBrandAccounts(env, accountId, brandId))) return false;
  const now = nowIso();
  await env.DB.batch([
    env.DB.prepare(
      "UPDATE brands SET status='archived',archived_at=?,updated_at=? WHERE id=? AND account_id=? AND status='archiving'"
    ).bind(now, now, brandId, accountId),
    env.DB.prepare(
      "UPDATE source_assets SET purge_after=COALESCE(purge_after,?) WHERE brand_id=? AND account_id=?"
    ).bind(addSeconds(now, ORIGINAL_RETENTION_SECONDS), brandId, accountId),
  ]);
  return true;
}
export async function reconcileBrandArchives(env: RuntimeEnv): Promise<void> {
  const rows = await env.DB.prepare(
    "SELECT id,account_id FROM brands WHERE status='archiving' LIMIT 50"
  ).all<{ id: string; account_id: string }>();
  for (const row of rows.results)
    await finishBrandArchive(env, row.account_id, row.id);
}
routes.post("/brands/:id/archive", async (c) => {
  const p = principalOf(c);
  requireOwner(p);
  const row = await ownedBrand(c);
  if (row.status === "archived") return c.json(brandResponse(row));
  await c.env.DB.prepare(
    "UPDATE brands SET status='archiving',updated_at=? WHERE id=? AND account_id=? AND status='active'"
  )
    .bind(nowIso(), row.id, p.account_id)
    .run();
  const done = await finishBrandArchive(c.env, p.account_id, row.id);
  await recordAudit(
    c.env,
    p,
    "brand.archive_requested",
    "brand",
    row.id,
    row.id
  );
  return c.json(brandResponse(await ownedBrand(c)), done ? 200 : 202);
});
routes.post("/brands/:id/restore", async (c) => {
  const p = principalOf(c);
  requireOwner(p);
  const row = await ownedBrand(c);
  if (row.status === "archiving")
    throw new ApiError(
      409,
      "archive_pending",
      "Wait for archive confirmation."
    );
  try {
    await c.env.DB.batch([
      c.env.DB.prepare(
        "UPDATE brands SET status='active',archived_at=NULL,updated_at=? WHERE id=? AND account_id=? AND status='archived'"
      ).bind(nowIso(), row.id, p.account_id),
      c.env.DB.prepare(
        "UPDATE source_assets SET purge_after=NULL WHERE account_id=? AND brand_id=? AND deleted_at IS NULL AND upload_status!='expired'"
      ).bind(p.account_id, row.id),
    ]);
  } catch (e) {
    quotaError(e);
  }
  await recordAudit(c.env, p, "brand.restored", "brand", row.id, row.id);
  return c.json(brandResponse(await ownedBrand(c)));
});
routes.get("/members", async (c) => {
  const rows = await c.env.DB.prepare(
    "SELECT id,name,email,role,created_at AS createdAt FROM account_users WHERE account_id=? ORDER BY created_at,id"
  )
    .bind(principalOf(c).account_id)
    .all();
  return c.json({ items: rows.results });
});
routes.delete("/members/:id", async (c) => {
  const p = principalOf(c);
  requireOwner(p);
  const member = await c.env.DB.prepare(
    "SELECT role FROM account_users WHERE id=? AND account_id=?"
  )
    .bind(c.req.param("id"), p.account_id)
    .first<{ role: string }>();
  if (!member)
    throw new ApiError(404, "member_not_found", "The member was not found.");
  if (member.role === "owner")
    throw new ApiError(
      409,
      "owner_cannot_be_removed",
      "The owner cannot be removed."
    );
  await c.env.DB.prepare(
    "DELETE FROM account_users WHERE id=? AND account_id=? AND role='member'"
  )
    .bind(c.req.param("id"), p.account_id)
    .run();
  await recordAudit(c.env, p, "member.removed", "member", c.req.param("id"));
  return c.body(null, 204);
});
routes.get("/member-invitations", async (c) => {
  const p = principalOf(c);
  requireOwner(p);
  const rows = await c.env.DB.prepare(
    "SELECT id,email,expires_at AS expiresAt,CASE WHEN status='pending' AND expires_at<=? THEN 'expired' ELSE status END AS status FROM member_invitations WHERE account_id=? ORDER BY created_at DESC"
  )
    .bind(nowIso(), p.account_id)
    .all();
  return c.json({ items: rows.results });
});
routes.post("/member-invitations", async (c) => {
  const p = principalOf(c);
  requireOwner(p);
  const payload = await c.req.json().catch(() => null);
  const boundaryErrors = contractErrors(
    contractSchemas.MemberInvitationCreateRequest,
    payload
  );
  if (boundaryErrors.length) return validationError(c, boundaryErrors);
  const parsed = z
    .object({ email: z.string().trim().email().max(254) })
    .strict()
    .safeParse(payload);
  if (!parsed.success) return invalid(c, parsed.error);
  const rate = await c.env.AUTH_RATE_LIMITER.limit({
    key: `invitation:${p.account_id}:${p.sub}`,
  });
  if (!rate.success)
    throw new ApiError(429, "rate_limited", "Too many invitations.");
  const existing = await c.env.DB.prepare(
    "SELECT account_id FROM account_users WHERE normalized_email=?"
  )
    .bind(parsed.data.email.toUpperCase())
    .first();
  if (existing)
    throw new ApiError(
      409,
      "membership_conflict",
      "This email already belongs to a Capyra account."
    );
  const token = randomToken(),
    id = uuidv7(),
    now = nowIso(),
    expiresAt = addSeconds(now, 7 * 86400);
  await c.env.DB.prepare(
    "INSERT INTO member_invitations(id,account_id,email,normalized_email,token_hash,status,created_by,created_at,expires_at) VALUES(?,?,?,?,?,'pending',?,?,?)"
  )
    .bind(
      id,
      p.account_id,
      parsed.data.email.toLowerCase(),
      parsed.data.email.toUpperCase(),
      await sha256(token),
      p.sub,
      now,
      expiresAt
    )
    .run();
  await recordAudit(c.env, p, "invitation.created", "invitation", id);
  return c.json(
    {
      id,
      email: parsed.data.email.toLowerCase(),
      expiresAt,
      inviteUrl: `${
        c.env.CAPYRA_WEB_BASE_URL
      }/invitations/accept?token=${encodeURIComponent(token)}`,
    },
    201
  );
});
routes.delete("/member-invitations/:id", async (c) => {
  const p = principalOf(c);
  requireOwner(p);
  await c.env.DB.prepare(
    "UPDATE member_invitations SET status='revoked' WHERE id=? AND account_id=? AND status='pending'"
  )
    .bind(c.req.param("id"), p.account_id)
    .run();
  await recordAudit(
    c.env,
    p,
    "invitation.revoked",
    "invitation",
    c.req.param("id")
  );
  return c.body(null, 204);
});
routes.post("/member-invitations/accept", async (c) => {
  const payload = await c.req.json().catch(() => null);
  const boundaryErrors = contractErrors(
    contractSchemas.MemberInvitationAcceptRequest,
    payload
  );
  if (boundaryErrors.length) return validationError(c, boundaryErrors);
  const parsed = z
    .object({ token: z.string().min(20).max(200) })
    .strict()
    .safeParse(payload);
  if (!parsed.success) return invalid(c, parsed.error);
  const p = principalOf(c);
  await acceptInvitation(c.env, parsed.data.token, {
    email: p.email,
    name: p.name,
    userId: p.sub,
  });
  return c.body(null, 204);
});
routes.get("/usage", async (c) =>
  c.json(await usageResponse(c.env, principalOf(c).account_id))
);
function page(c: AppContext) {
  const limit = Math.min(100, Math.max(1, Number(c.req.query("limit")) || 30));
  const cursor = c.req.query("cursor");
  if (cursor && !/^[0-9a-f-]{36}$/i.test(cursor))
    throw new ApiError(400, "invalid_cursor", "Invalid cursor.");
  return { limit, cursor: cursor ?? "ffffffff-ffff-ffff-ffff-ffffffffffff" };
}
routes.get("/notifications", async (c) => {
  const p = principalOf(c),
    { limit, cursor } = page(c);
  const rows = await c.env.DB.prepare(
    "SELECT id,code,message,brand_id AS brandId,resource_id AS resourceId,created_at AS createdAt,read_at AS readAt FROM notifications WHERE account_id=? AND owner_id=? AND id<? ORDER BY id DESC LIMIT ?"
  )
    .bind(p.account_id, p.sub, cursor, limit + 1)
    .all<{ id: string }>();
  return c.json({
    items: rows.results.slice(0, limit),
    ...(rows.results.length > limit
      ? { nextCursor: rows.results[limit - 1].id }
      : {}),
  });
});
routes.post("/notifications/:id/read", async (c) => {
  const p = principalOf(c);
  await c.env.DB.prepare(
    "UPDATE notifications SET read_at=COALESCE(read_at,?) WHERE id=? AND account_id=? AND owner_id=?"
  )
    .bind(nowIso(), c.req.param("id"), p.account_id, p.sub)
    .run();
  return c.body(null, 204);
});
routes.get("/audit-events", async (c) => {
  const p = principalOf(c);
  requireOwner(p);
  const { limit, cursor } = page(c);
  const rows = await c.env.DB.prepare(
    "SELECT id,action,actor_id AS actorId,brand_id AS brandId,resource_type AS resourceType,resource_id AS resourceId,created_at AS createdAt,correlation_id AS correlationId FROM audit_events WHERE account_id=? AND id<? ORDER BY id DESC LIMIT ?"
  )
    .bind(p.account_id, cursor, limit + 1)
    .all<{ id: string }>();
  return c.json({
    items: rows.results.slice(0, limit),
    ...(rows.results.length > limit
      ? { nextCursor: rows.results[limit - 1].id }
      : {}),
  });
});
export default routes;
