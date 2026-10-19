import { Hono } from "hono";
import { z } from "zod";
import { findIdentityById, identityResponse, issueAccessToken, principalOf, requireAuth, type IdentityRow } from "../auth";
import { ApiError, addSeconds, nowIso, uuidv7, validationError } from "../common";
import { pkceChallenge, randomToken, sha256 } from "../crypto";
import type { AppBindings, AppContext } from "../runtime";

const oauth = new Hono<AppBindings>();
const ALLOWED_SCOPES = new Set(["analysis-skills:read", "source-assets:read", "source-assets:write", "analyses:create", "analyses:read"]);
const DEFAULT_SCOPES = [...ALLOWED_SCOPES].sort();

function scopes(value: string[] | null | undefined): string[] {
  const normalized = [...new Set((value?.length ? value : DEFAULT_SCOPES).map((item) => item.trim()).filter(Boolean))].sort();
  const invalid = normalized.filter((item) => !ALLOWED_SCOPES.has(item));
  if (invalid.length) throw new ApiError(400, "invalid_scope", `Unsupported scopes requested: ${invalid.join(", ")}.`);
  return normalized;
}

function validateClient(env: AppContext["env"], clientId: string, redirectUri?: string): void {
  if (clientId === "capyra-cli") {
    if (redirectUri) throw new ApiError(400, "unsupported_client", "The CLI client does not support authorization code grants.");
    return;
  }
  if (clientId !== "capyra-mcp") throw new ApiError(400, "unsupported_client", "OAuth client is not supported.");
  if (!redirectUri) return;
  const patterns = env.CAPYRA_OAUTH_MCP_REDIRECT_URIS.split(",").map((item) => item.trim()).filter(Boolean);
  const allowed = patterns.some((pattern) => pattern.endsWith("*") ? redirectUri.startsWith(pattern.slice(0, -1)) : redirectUri === pattern)
    || redirectUri.startsWith("http://localhost") || redirectUri.startsWith("http://127.0.0.1");
  if (!allowed) throw new ApiError(400, "invalid_redirect_uri", "Redirect URI is not allowed for this client.");
}

const authCodeSchema = z.object({
  clientId: z.string().min(1), redirectUri: z.string().url(), codeChallenge: z.string().min(43).max(128),
  codeChallengeMethod: z.literal("S256"), scopes: z.array(z.string()).optional().nullable(),
}).strict();

oauth.post("/authorization-codes", requireAuth, async (c) => {
  const parsed = authCodeSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return validationError(c, parsed.error.issues.map((issue) => ({ field: issue.path.join(".") || "request", message: issue.message })));
  validateClient(c.env, parsed.data.clientId, parsed.data.redirectUri);
  const normalizedScopes = scopes(parsed.data.scopes);
  const principal = principalOf(c);
  const code = randomToken();
  const createdAt = nowIso();
  const expiresAt = addSeconds(createdAt, Number.parseInt(c.env.CAPYRA_OAUTH_AUTHORIZATION_CODE_LIFETIME_MINUTES, 10) * 60);
  await c.env.DB.prepare(`INSERT INTO oauth_authorization_codes
    (code_hash, client_id, account_id, account_user_id, redirect_uri, code_challenge, scopes, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(await sha256(code), parsed.data.clientId, principal.account_id, principal.sub, parsed.data.redirectUri, parsed.data.codeChallenge, normalizedScopes.join(" "), expiresAt, createdAt).run();
  return c.json({ code, redirectUri: parsed.data.redirectUri, expiresAt });
});

const deviceCodeSchema = z.object({ clientId: z.string().min(1), scopes: z.array(z.string()).optional().nullable() }).strict();
oauth.post("/device/code", async (c) => {
  const parsed = deviceCodeSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return validationError(c, parsed.error.issues.map((issue) => ({ field: issue.path.join(".") || "request", message: issue.message })));
  validateClient(c.env, parsed.data.clientId);
  const normalizedScopes = scopes(parsed.data.scopes);
  const deviceCode = randomToken();
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const random = crypto.getRandomValues(new Uint8Array(8));
  const chars = [...random].map((value) => alphabet[value % alphabet.length]);
  const userCode = `${chars.slice(0, 4).join("")}-${chars.slice(4).join("")}`;
  const createdAt = nowIso();
  const expiresIn = Number.parseInt(c.env.CAPYRA_OAUTH_DEVICE_CODE_LIFETIME_MINUTES, 10) * 60;
  const expiresAt = addSeconds(createdAt, expiresIn);
  await c.env.DB.prepare(`INSERT INTO oauth_device_codes
    (device_code_hash, user_code, client_id, scopes, status, expires_at, created_at) VALUES (?, ?, ?, ?, 'pending', ?, ?)`)
    .bind(await sha256(deviceCode), userCode, parsed.data.clientId, normalizedScopes.join(" "), expiresAt, createdAt).run();
  const verificationUri = `${c.env.CAPYRA_WEB_BASE_URL.replace(/\/$/, "")}/oauth/device`;
  return c.json({
    deviceCode, userCode, verificationUri,
    verificationUriComplete: `${verificationUri}?user_code=${encodeURIComponent(userCode)}&client_id=${encodeURIComponent(parsed.data.clientId)}`,
    expiresIn, interval: Number.parseInt(c.env.CAPYRA_OAUTH_DEVICE_POLLING_INTERVAL_SECONDS, 10), scope: normalizedScopes.join(" "),
  });
});

oauth.post("/device/activate", requireAuth, async (c) => {
  const parsed = z.object({ userCode: z.string().min(1).max(20) }).strict().safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return validationError(c, parsed.error.issues.map((issue) => ({ field: issue.path.join(".") || "request", message: issue.message })));
  const principal = principalOf(c);
  const timestamp = nowIso();
  const row = await c.env.DB.prepare("SELECT status, expires_at FROM oauth_device_codes WHERE user_code = ?")
    .bind(parsed.data.userCode.trim().toUpperCase()).first<{ status: string; expires_at: string }>();
  if (!row) throw new ApiError(404, "device_code_not_found", "Device code was not found.");
  if (row.status !== "pending") throw new ApiError(409, "device_code_consumed", "Device code was already used.");
  if (row.expires_at <= timestamp) throw new ApiError(410, "device_code_expired", "Device code expired.");
  const result = await c.env.DB.prepare(`UPDATE oauth_device_codes SET account_id = ?, account_user_id = ?, status = 'authorized'
    WHERE user_code = ? AND status = 'pending' AND expires_at > ?`)
    .bind(principal.account_id, principal.sub, parsed.data.userCode.trim().toUpperCase(), timestamp).run();
  if ((result.meta.changes ?? 0) !== 1) throw new ApiError(409, "device_code_consumed", "Device code was already used.");
  return c.body(null, 204);
});

oauth.get("/session", requireAuth, async (c) => {
  const principal = principalOf(c);
  const identity = await findIdentityById(c.env, principal.sub);
  if (!identity) throw new ApiError(401, "unauthorized", "Authenticated user could not be resolved.");
  return c.json({
    tokenType: "Bearer", expiresAt: new Date(Number(principal.exp ?? 0) * 1_000).toISOString(),
    clientId: principal.client_id ?? null, scopes: (principal.scope ?? "").split(" ").filter(Boolean), ...await identityResponse(c.env, identity),
  });
});

interface AuthorizationCodeRow { client_id: string; account_user_id: string; redirect_uri: string; code_challenge: string; scopes: string; expires_at: string; consumed_at: string | null }
interface DeviceCodeRow { client_id: string; account_user_id: string | null; scopes: string; status: string; expires_at: string }
interface RefreshRow { family_id: string; client_id: string; account_user_id: string; scopes: string; expires_at: string; consumed_at: string | null; revoked_at: string | null }

async function tokenResponse(c: AppContext, identity: IdentityRow, clientId: string, normalizedScopes: string[], familyId = uuidv7()) {
  const token = await issueAccessToken(c.env, identity, clientId, normalizedScopes);
  const refreshToken = randomToken();
  const timestamp = nowIso();
  const expiresAt = addSeconds(timestamp, Number.parseInt(c.env.CAPYRA_OAUTH_REFRESH_TOKEN_LIFETIME_DAYS, 10) * 86_400);
  await c.env.DB.prepare(`INSERT INTO oauth_refresh_tokens
    (token_hash, family_id, client_id, account_id, account_user_id, scopes, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(await sha256(refreshToken), familyId, clientId, identity.account_id, identity.user_id, normalizedScopes.join(" "), expiresAt, timestamp).run();
  return {
    access_token: token.accessToken, token_type: "Bearer" as const, expires_in: token.expiresIn,
    refresh_token: refreshToken, scope: normalizedScopes.join(" "), ...await identityResponse(c.env, identity),
  };
}

function required(form: FormData, name: string): string {
  const value = form.get(name);
  if (typeof value !== "string" || !value.trim()) throw new ApiError(400, "invalid_request", `The ${name} field is required.`);
  return value;
}

oauth.post("/token", async (c) => {
  const form = await c.req.formData();
  const grantType = required(form, "grant_type");
  const clientId = required(form, "client_id");
  const timestamp = nowIso();
  if (grantType === "authorization_code") {
    validateClient(c.env, clientId, required(form, "redirect_uri"));
    const codeHash = await sha256(required(form, "code"));
    const row = await c.env.DB.prepare("SELECT client_id, account_user_id, redirect_uri, code_challenge, scopes, expires_at, consumed_at FROM oauth_authorization_codes WHERE code_hash = ?")
      .bind(codeHash).first<AuthorizationCodeRow>();
    if (!row || row.client_id !== clientId || row.redirect_uri !== required(form, "redirect_uri") || row.expires_at <= timestamp || row.consumed_at) throw new ApiError(400, "invalid_grant", "Authorization code is invalid, expired, or already used.");
    if (await pkceChallenge(required(form, "code_verifier")) !== row.code_challenge) throw new ApiError(400, "invalid_grant", "PKCE verification failed.");
    const consumed = await c.env.DB.prepare("UPDATE oauth_authorization_codes SET consumed_at = ? WHERE code_hash = ? AND consumed_at IS NULL AND expires_at > ?")
      .bind(timestamp, codeHash, timestamp).run();
    if ((consumed.meta.changes ?? 0) !== 1) throw new ApiError(400, "invalid_grant", "Authorization code is expired or already used.");
    const identity = await findIdentityById(c.env, row.account_user_id);
    if (!identity) throw new ApiError(400, "invalid_grant", "Authorization identity no longer exists.");
    return c.json(await tokenResponse(c, identity, clientId, row.scopes.split(" ")));
  }
  if (grantType === "device_code" || grantType === "urn:ietf:params:oauth:grant-type:device_code") {
    validateClient(c.env, clientId);
    const hash = await sha256(required(form, "device_code"));
    const row = await c.env.DB.prepare("SELECT client_id, account_user_id, scopes, status, expires_at FROM oauth_device_codes WHERE device_code_hash = ?")
      .bind(hash).first<DeviceCodeRow>();
    if (!row || row.client_id !== clientId || row.expires_at <= timestamp) throw new ApiError(400, "invalid_grant", "Device code is invalid or expired.");
    if (row.status === "pending") throw new ApiError(400, "authorization_pending", "User authorization is still pending.");
    if (row.status !== "authorized" || !row.account_user_id) throw new ApiError(400, "invalid_grant", "Device code was already used.");
    const consumed = await c.env.DB.prepare("UPDATE oauth_device_codes SET status = 'consumed', last_polled_at = ? WHERE device_code_hash = ? AND status = 'authorized'")
      .bind(timestamp, hash).run();
    if ((consumed.meta.changes ?? 0) !== 1) throw new ApiError(400, "invalid_grant", "Device code was already used.");
    const identity = await findIdentityById(c.env, row.account_user_id);
    if (!identity) throw new ApiError(400, "invalid_grant", "Authorization identity no longer exists.");
    return c.json(await tokenResponse(c, identity, clientId, row.scopes.split(" ")));
  }
  if (grantType === "refresh_token") {
    const hash = await sha256(required(form, "refresh_token"));
    const row = await c.env.DB.prepare("SELECT family_id, client_id, account_user_id, scopes, expires_at, consumed_at, revoked_at FROM oauth_refresh_tokens WHERE token_hash = ?")
      .bind(hash).first<RefreshRow>();
    if (!row || row.client_id !== clientId || row.expires_at <= timestamp || row.consumed_at || row.revoked_at) throw new ApiError(400, "invalid_grant", "Refresh token is invalid.");
    const consumed = await c.env.DB.prepare("UPDATE oauth_refresh_tokens SET consumed_at = ? WHERE token_hash = ? AND consumed_at IS NULL AND revoked_at IS NULL")
      .bind(timestamp, hash).run();
    if ((consumed.meta.changes ?? 0) !== 1) throw new ApiError(400, "invalid_grant", "Refresh token is invalid.");
    const identity = await findIdentityById(c.env, row.account_user_id);
    if (!identity) throw new ApiError(400, "invalid_grant", "Authorization identity no longer exists.");
    return c.json(await tokenResponse(c, identity, clientId, row.scopes.split(" "), row.family_id));
  }
  throw new ApiError(400, "unsupported_grant_type", `Grant type '${grantType}' is not supported.`);
});

oauth.post("/revoke", async (c) => {
  const parsed = z.object({ clientId: z.string().min(1), refreshToken: z.string().min(1) }).strict().safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return validationError(c, parsed.error.issues.map((issue) => ({ field: issue.path.join(".") || "request", message: issue.message })));
  await c.env.DB.prepare("UPDATE oauth_refresh_tokens SET revoked_at = ? WHERE token_hash = ? AND client_id = ?")
    .bind(nowIso(), await sha256(parsed.data.refreshToken), parsed.data.clientId).run();
  return c.body(null, 204);
});

export default oauth;
