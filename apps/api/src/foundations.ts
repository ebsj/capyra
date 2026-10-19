import { ApiError, nowIso, uuidv7, addSeconds } from "./common";
import { sha256 } from "./crypto";
import type { AuthPrincipal, RuntimeEnv } from "./runtime";

export interface BrandRow {
  id: string;
  account_id: string;
  name: string;
  time_zone: string;
  confirmed_at: string | null;
  status: "active" | "archiving" | "archived";
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}
export interface EntitlementRow {
  account_id: string;
  cycle_anchor: string;
  subscription_status: "active" | "inactive";
  brand_limit: number;
  identity_limit: number;
  operator_limit: number;
  analysis_limit: number;
}
export function brandResponse(row: BrandRow) {
  return {
    id: row.id,
    name: row.name,
    timeZone: row.time_zone,
    confirmedAt: row.confirmed_at,
    status: row.status,
    createdAt: row.created_at,
    archivedAt: row.archived_at,
  };
}
export async function ensureAccountFoundations(
  env: RuntimeEnv,
  accountId: string
): Promise<void> {
  const now = nowIso();
  await env.DB.batch([
    env.DB.prepare(
      "INSERT OR IGNORE INTO account_entitlements(account_id,cycle_anchor) VALUES(?,?)"
    ).bind(accountId, now),
    env.DB.prepare(
      `INSERT INTO brands(id,account_id,name,time_zone,status,created_at,updated_at)
      SELECT ?,id,display_name,'America/Recife','active',?,? FROM accounts WHERE id=? AND NOT EXISTS(SELECT 1 FROM brands WHERE account_id=?)`
    ).bind(uuidv7(), now, now, accountId, accountId),
  ]);
}
export function requireOwner(principal: AuthPrincipal): void {
  if (principal.role !== "owner")
    throw new ApiError(
      403,
      "owner_required",
      "Only the account owner can perform this action."
    );
}
export function validateTimeZone(value: string): void {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
  } catch {
    throw new ApiError(
      422,
      "invalid_time_zone",
      "A valid IANA time zone is required."
    );
  }
}
export async function requireActiveBrand(
  env: RuntimeEnv,
  accountId: string,
  brandId: string,
  options: { confirmed?: boolean } = {}
): Promise<BrandRow> {
  if (
    !brandId ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      brandId
    )
  )
    throw new ApiError(
      422,
      "brand_required",
      "Choose a Brand for this operation."
    );
  const row = await env.DB.prepare(
    "SELECT * FROM brands WHERE id=? AND account_id=?"
  )
    .bind(brandId, accountId)
    .first<BrandRow>();
  if (!row)
    throw new ApiError(404, "brand_not_found", "The Brand was not found.");
  if (row.status !== "active")
    throw new ApiError(
      409,
      "brand_read_only",
      "The Brand is archived or being archived."
    );
  if (options.confirmed && !row.confirmed_at)
    throw new ApiError(
      409,
      "brand_confirmation_required",
      "Confirm the Brand name and time zone first."
    );
  return row;
}
export async function recordAudit(
  env: RuntimeEnv,
  principal: AuthPrincipal,
  action: string,
  resourceType: string,
  resourceId: string,
  brandId: string | null = null
): Promise<void> {
  await env.DB.prepare(
    "INSERT INTO audit_events(id,account_id,actor_id,brand_id,action,resource_type,resource_id,correlation_id,created_at) VALUES(?,?,?,?,?,?,?,?,?)"
  )
    .bind(
      uuidv7(),
      principal.account_id,
      principal.sub,
      brandId,
      action,
      resourceType,
      resourceId,
      typeof principal.requestId === "string" ? principal.requestId : uuidv7(),
      nowIso()
    )
    .run();
}
export async function notifyOwners(
  env: RuntimeEnv,
  accountId: string,
  brandId: string | null,
  code: string,
  message: string,
  resourceId?: string
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO notifications(id,account_id,owner_id,brand_id,code,message,resource_id,created_at)
    SELECT ?,account_id,id,?,?,?,?,? FROM account_users WHERE account_id=? AND role='owner'`
  )
    .bind(
      uuidv7(),
      brandId,
      code,
      message.slice(0, 500),
      resourceId ?? null,
      nowIso(),
      accountId
    )
    .run();
}

/** Anniversary preserves its original day, clamped only for short months. */
export function cycleBounds(
  anchor: string,
  date = new Date()
): { cycleStart: string; cycleEnd: string } {
  const base = new Date(anchor);
  const occurrence = (offset: number) => {
    const month = base.getUTCMonth() + offset;
    const first = new Date(Date.UTC(base.getUTCFullYear(), month, 1));
    const lastDay = new Date(
      Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)
    ).getUTCDate();
    return new Date(
      Date.UTC(
        first.getUTCFullYear(),
        first.getUTCMonth(),
        Math.min(base.getUTCDate(), lastDay),
        base.getUTCHours(),
        base.getUTCMinutes(),
        base.getUTCSeconds(),
        base.getUTCMilliseconds()
      )
    );
  };
  let offset =
    (date.getUTCFullYear() - base.getUTCFullYear()) * 12 +
    date.getUTCMonth() -
    base.getUTCMonth();
  if (occurrence(offset) > date) offset--;
  return {
    cycleStart: occurrence(offset).toISOString(),
    cycleEnd: occurrence(offset + 1).toISOString(),
  };
}
export async function currentUsageCycle(env: RuntimeEnv, accountId: string) {
  await ensureAccountFoundations(env, accountId);
  const entitlement = (await env.DB.prepare(
    "SELECT * FROM account_entitlements WHERE account_id=?"
  )
    .bind(accountId)
    .first<EntitlementRow>())!;
  const bounds = cycleBounds(entitlement.cycle_anchor);
  const now = nowIso();
  await env.DB.batch([
    env.DB.prepare(
      `INSERT OR IGNORE INTO credit_lots(id,account_id,kind,cycle_start,expires_at,granted,remaining,created_at) VALUES(?,?,'included',?,?,?,?,?)`
    ).bind(
      `${accountId}:${bounds.cycleStart}`,
      accountId,
      bounds.cycleStart,
      bounds.cycleEnd,
      entitlement.analysis_limit,
      entitlement.analysis_limit,
      now
    ),
    env.DB.prepare(
      `INSERT INTO usage_ledger(account_id,lot_id,event,quantity,created_at)
      SELECT account_id,id,'expired',remaining,? FROM credit_lots l WHERE account_id=? AND kind='included' AND expires_at<=? AND NOT EXISTS(SELECT 1 FROM usage_ledger e WHERE e.lot_id=l.id AND e.event='expired')`
    ).bind(now, accountId, now),
  ]);
  // Carry connected identities into a new cycle before accepting rotations.
  // Bootstrap migrations can initialize entitlements before Social tables exist.
  const socialReady = await env.DB.prepare(
    "SELECT 1 FROM sqlite_master WHERE type='table' AND name='social_identity_usage'"
  ).first();
  if (socialReady && entitlement.subscription_status === "active") {
    await env.DB.prepare(
      `INSERT OR IGNORE INTO social_identity_usage(account_id,cycle_start,platform,native_identity_id,created_at)
      SELECT account_id,?,platform,native_identity_id,? FROM social_accounts
      WHERE account_id=? AND status!='disconnected' AND identity_status='verified' AND native_identity_id IS NOT NULL`
    )
      .bind(bounds.cycleStart, now, accountId)
      .run();
  }
  return { ...bounds, entitlement };
}
export async function reserveAnalysisCredit(
  env: RuntimeEnv,
  accountId: string,
  analysisId: string,
  create: D1PreparedStatement
): Promise<void> {
  await currentUsageCycle(env, accountId);
  const now = nowIso();
  try {
    await env.DB.batch([
      create,
      env.DB.prepare(
        `INSERT INTO analysis_credit_reservations(analysis_id,account_id,lot_id,created_at)
        VALUES(?,?,(SELECT id FROM credit_lots WHERE account_id=? AND remaining>0 AND (expires_at IS NULL OR expires_at>?) ORDER BY CASE kind WHEN 'included' THEN 0 ELSE 1 END,created_at,id LIMIT 1),?)`
      ).bind(analysisId, accountId, accountId, now, now),
    ]);
  } catch (error) {
    if (
      /analysis_credit_exhausted|analysis_credit_reservations.lot_id/.test(
        String(error)
      )
    )
      throw new ApiError(
        409,
        "analysis_credit_exhausted",
        "No analysis credits are available. Contact the account owner."
      );
    throw error;
  }
}
export async function usageResponse(env: RuntimeEnv, accountId: string) {
  const {
    cycleStart,
    cycleEnd,
    entitlement: e,
  } = await currentUsageCycle(env, accountId);
  const row = await env.DB.prepare(
    `SELECT
    (SELECT COUNT(*) FROM brands WHERE account_id=? AND status IN ('active','archiving')) AS brands,
    (SELECT COUNT(*) FROM account_users WHERE account_id=?) AS operators,
    (SELECT COUNT(*) FROM social_identity_usage WHERE account_id=? AND cycle_start=?) AS identities,
    (SELECT COUNT(*) FROM analysis_credit_reservations WHERE account_id=? AND state='consumed' AND created_at>=? AND created_at<?) AS consumed,
    (SELECT COUNT(*) FROM analysis_credit_reservations WHERE account_id=? AND state='reserved') AS reserved,
    (SELECT COALESCE(SUM(remaining),0) FROM credit_lots WHERE account_id=? AND kind='included' AND expires_at>?) AS included,
    (SELECT COALESCE(SUM(remaining),0) FROM credit_lots WHERE account_id=? AND kind='purchased') AS purchased`
  )
    .bind(
      accountId,
      accountId,
      accountId,
      cycleStart,
      accountId,
      cycleStart,
      cycleEnd,
      accountId,
      accountId,
      nowIso(),
      accountId
    )
    .first<Record<string, number>>();
  return {
    cycleStart,
    cycleEnd,
    subscriptionStatus: e.subscription_status,
    limits: {
      brands: e.brand_limit,
      socialIdentities: e.identity_limit,
      operators: e.operator_limit,
      analyses: e.analysis_limit,
    },
    usage: {
      brands: row!.brands,
      socialIdentities: row!.identities,
      operators: row!.operators,
      analyses: row!.consumed,
      reservedAnalyses: row!.reserved,
    },
    credits: {
      includedRemaining: row!.included,
      purchasedRemaining:
        e.subscription_status === "active" ? row!.purchased : 0,
    },
  };
}

export async function acceptInvitation(
  env: RuntimeEnv,
  token: string,
  identity: { email: string; name: string; uid?: string; userId?: string }
): Promise<string> {
  const now = nowIso();
  const invitation = await env.DB.prepare(
    "SELECT * FROM member_invitations WHERE token_hash=? AND status='pending' AND expires_at>?"
  )
    .bind(await sha256(token), now)
    .first<{ id: string; account_id: string; normalized_email: string }>();
  if (!invitation)
    throw new ApiError(
      409,
      "invitation_unavailable",
      "This invitation is expired or no longer available."
    );
  if (invitation.normalized_email !== identity.email.trim().toUpperCase())
    throw new ApiError(
      403,
      "invitation_email_mismatch",
      "Sign in using the invited email address."
    );
  const existing = await env.DB.prepare(
    "SELECT id,account_id,firebase_uid FROM account_users WHERE normalized_email=?"
  )
    .bind(invitation.normalized_email)
    .first<{ id: string; account_id: string; firebase_uid: string | null }>();
  if (existing && existing.account_id !== invitation.account_id)
    throw new ApiError(
      409,
      "membership_conflict",
      "This email already belongs to another Capyra account."
    );
  if (
    existing?.firebase_uid &&
    identity.uid &&
    existing.firebase_uid !== identity.uid
  )
    throw new ApiError(
      409,
      "firebase_identity_conflict",
      "The email belongs to another Firebase identity."
    );
  if (!existing && !identity.uid)
    throw new ApiError(
      401,
      "verified_identity_required",
      "A verified sign-in is required."
    );
  const userId = existing?.id ?? uuidv7();
  const statements = [
    env.DB.prepare(
      "UPDATE member_invitations SET status='accepted',accepted_at=?,accepted_user_id=? WHERE id=? AND status='pending' AND expires_at>?"
    ).bind(now, userId, invitation.id, now),
  ];
  if (!existing)
    statements.push(
      env.DB.prepare(
        `INSERT INTO account_users(id,account_id,name,email,normalized_email,firebase_uid,role,created_at,updated_at)
    SELECT ?,account_id,?,?,?,?,'member',?,? FROM member_invitations WHERE id=? AND status='accepted' AND accepted_user_id=?`
      ).bind(
        userId,
        identity.name.trim().slice(0, 160) || identity.email.split("@")[0],
        identity.email.toLowerCase(),
        invitation.normalized_email,
        identity.uid!,
        now,
        now,
        invitation.id,
        userId
      )
    );
  else if (identity.uid)
    statements.push(
      env.DB.prepare(
        "UPDATE account_users SET firebase_uid=COALESCE(firebase_uid,?),updated_at=? WHERE id=? AND account_id=?"
      ).bind(identity.uid, now, userId, invitation.account_id)
    );
  try {
    const results = await env.DB.batch(statements);
    if (!results[0].meta.changes)
      throw new ApiError(
        409,
        "invitation_unavailable",
        "This invitation is no longer available."
      );
  } catch (error) {
    if (String(error).includes("operator_quota_exceeded"))
      throw new ApiError(
        409,
        "operator_quota_exceeded",
        "The operator limit has been reached."
      );
    if (/account_users\.(normalized_email|firebase_uid)/.test(String(error))) {
      throw new ApiError(
        409,
        "membership_conflict",
        "This identity has already joined a Capyra account."
      );
    }
    throw error;
  }
  await recordAudit(
    env,
    {
      sub: userId,
      account_id: invitation.account_id,
      role: existing ? "owner" : "member",
      email: identity.email,
      name: identity.name,
    },
    "invitation.accepted",
    "member",
    userId
  );
  return userId;
}
export const ORIGINAL_RETENTION_SECONDS = 30 * 86_400;
export async function purgeFoundationRecords(env: RuntimeEnv): Promise<void> {
  const { assetHasOpenDestinations } = await import("./social/lifecycle");
  const now = nowIso();
  const rows = await env.DB.prepare(
    "SELECT id,account_id,object_key FROM source_assets WHERE purge_after<=? AND upload_status!='expired' LIMIT 100"
  )
    .bind(now)
    .all<{ id: string; account_id: string; object_key: string }>();
  for (const row of rows.results) {
    if (await assetHasOpenDestinations(env, row.account_id, row.id)) continue;
    const pendingAnalysis = await env.DB.prepare(
      "SELECT 1 FROM video_analyses WHERE source_asset_id=? AND status='pending' AND deleted_at IS NULL LIMIT 1"
    )
      .bind(row.id)
      .first();
    if (pendingAnalysis) continue;
    // Claim deletion atomically before touching R2; relation guards reject races.
    try {
      const claimed = await env.DB.prepare(
        "UPDATE source_assets SET deleted_at=COALESCE(deleted_at,?) WHERE id=? AND account_id=? AND purge_after<=?"
      )
        .bind(now, row.id, row.account_id, now)
        .run();
      if (!claimed.meta.changes) continue;
    } catch (error) {
      if (String(error).includes("source_asset_in_use")) continue;
      throw error;
    }
    await env.STORAGE.delete(row.object_key);
    await env.DB.prepare(
      "UPDATE source_assets SET upload_status='expired',deleted_at=COALESCE(deleted_at,?) WHERE id=? AND account_id=? AND purge_after<=?"
    )
      .bind(now, row.id, row.account_id, now)
      .run();
  }
  const auditCutoff = new Date(now);
  auditCutoff.setUTCMonth(auditCutoff.getUTCMonth() - 12);
  await env.DB.prepare("DELETE FROM audit_events WHERE created_at<?")
    .bind(auditCutoff.toISOString())
    .run();
}
