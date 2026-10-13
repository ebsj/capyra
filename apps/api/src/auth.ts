import { createRemoteJWKSet, jwtVerify, SignJWT } from "jose";
import type { AppBindings, AppMiddleware, AuthPrincipal, RuntimeEnv } from "./runtime";
import { ApiError, addSeconds, nowIso, uuidv7 } from "./common";

import { acceptInvitation, brandResponse, ensureAccountFoundations, type BrandRow } from "./foundations";

const encoder = new TextEncoder();

export interface IdentityRow {
  user_id: string;
  account_id: string;
  name: string;
  email: string;
  role: "owner" | "member";
  password_hash: string | null;
  firebase_uid: string | null;
  display_name: string;
  account_type: "agency" | "creator" | "team";
  account_created_at: string;
  user_created_at: string;
  member_count: number;
}

export interface VerifiedFirebaseIdentity {
  uid: string;
  email: string;
  name: string;
}

export async function findIdentity(env: RuntimeEnv, column: "normalized_email" | "firebase_uid", value: string): Promise<IdentityRow | null> {
  return env.DB.prepare(`
    SELECT u.id AS user_id, u.account_id, u.name, u.email, u.role, u.password_hash, u.firebase_uid,
      a.display_name, a.account_type, a.created_at AS account_created_at, u.created_at AS user_created_at,
      (SELECT COUNT(*) FROM account_users members WHERE members.account_id = a.id) AS member_count
    FROM account_users u JOIN accounts a ON a.id = u.account_id
    WHERE u.${column} = ? LIMIT 1
  `).bind(value).first<IdentityRow>();
}

export async function findIdentityById(env: RuntimeEnv, userId: string): Promise<IdentityRow | null> {
  return env.DB.prepare(`
    SELECT u.id AS user_id, u.account_id, u.name, u.email, u.role, u.password_hash, u.firebase_uid,
      a.display_name, a.account_type, a.created_at AS account_created_at, u.created_at AS user_created_at,
      (SELECT COUNT(*) FROM account_users members WHERE members.account_id = a.id) AS member_count
    FROM account_users u JOIN accounts a ON a.id = u.account_id WHERE u.id = ? LIMIT 1
  `).bind(userId).first<IdentityRow>();
}

async function findAndLinkFirebaseIdentity(
  env: RuntimeEnv,
  verified: VerifiedFirebaseIdentity,
): Promise<IdentityRow | null> {
  const identityByUid = await findIdentity(env, "firebase_uid", verified.uid);
  if (identityByUid) return identityByUid;

  const normalizedEmail = verified.email.trim().toUpperCase();
  const identityByEmail = await findIdentity(env, "normalized_email", normalizedEmail);
  if (!identityByEmail) return null;
  if (identityByEmail.firebase_uid && identityByEmail.firebase_uid !== verified.uid) {
    throw new ApiError(409, "firebase_identity_conflict", "This email is already linked to another Firebase identity.");
  }
  if (identityByEmail.firebase_uid === verified.uid) return identityByEmail;

  try {
    await env.DB.prepare("UPDATE account_users SET firebase_uid = ?, updated_at = ? WHERE id = ? AND firebase_uid IS NULL")
      .bind(verified.uid, nowIso(), identityByEmail.user_id).run();
  } catch (error) {
    const racedIdentity = await findIdentity(env, "firebase_uid", verified.uid);
    if (racedIdentity?.email.toUpperCase() === normalizedEmail) return racedIdentity;
    throw error;
  }

  const linkedIdentity = await findIdentityById(env, identityByEmail.user_id);
  if (linkedIdentity?.firebase_uid === verified.uid) return linkedIdentity;
  throw new ApiError(409, "firebase_identity_conflict", "This email could not be linked to the Firebase identity.");
}

export async function findOrProvisionFirebaseIdentity(
  env: RuntimeEnv,
  verified: VerifiedFirebaseIdentity,
  invitationToken?: string,
): Promise<{ identity: IdentityRow; created: boolean }> {
  if (invitationToken) {
    const userId = await acceptInvitation(env, invitationToken, verified);
    const identity = await findIdentityById(env, userId);
    if (!identity) throw new ApiError(500, "identity_creation_failed", "Invitation acceptance failed.");
    return { identity, created: false };
  }
  const existingIdentity = await findAndLinkFirebaseIdentity(env, verified);
  if (existingIdentity) return { identity: existingIdentity, created: false };

  const timestamp = nowIso();
  const accountId = uuidv7();
  const userId = uuidv7();
  const normalizedEmail = verified.email.trim().toUpperCase();
  const storedEmail = verified.email.trim().toLowerCase();
  const fallbackName = storedEmail.split("@")[0] || "Capyra";
  const name = (verified.name.trim() || fallbackName).slice(0, 160);

  try {
    await env.DB.batch([
      env.DB.prepare("INSERT INTO accounts (id, display_name, account_type, created_at, updated_at) VALUES (?, ?, 'creator', ?, ?)")
        .bind(accountId, name, timestamp, timestamp),
      env.DB.prepare(`INSERT INTO account_users
        (id, account_id, name, email, normalized_email, password_hash, firebase_uid, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, NULL, ?, 'owner', ?, ?)`)
        .bind(userId, accountId, name, storedEmail, normalizedEmail, verified.uid, timestamp, timestamp),
    ]);
  } catch (error) {
    const racedIdentity = await findAndLinkFirebaseIdentity(env, verified);
    if (racedIdentity) return { identity: racedIdentity, created: false };
    throw error;
  }

  const identity = await findIdentityById(env, userId);
  if (!identity) throw new ApiError(500, "identity_creation_failed", "The account could not be loaded after creation.");
  await ensureAccountFoundations(env, accountId);
  return { identity, created: true };
}

export async function identityResponse(env: RuntimeEnv, identity: IdentityRow) {
  await ensureAccountFoundations(env, identity.account_id);
  const brands = await env.DB.prepare("SELECT * FROM brands WHERE account_id=? ORDER BY created_at,id").bind(identity.account_id).all<BrandRow>();
  return {
    brands: brands.results.map(brandResponse),
    user: {
      id: identity.user_id,
      name: identity.name,
      email: identity.email,
      role: identity.role,
      createdAt: identity.user_created_at,
    },
    account: {
      id: identity.account_id,
      displayName: identity.display_name,
      accountType: identity.account_type,
      createdAt: identity.account_created_at,
      memberCount: identity.member_count,
    },
  };
}

export async function issueAccessToken(
  env: RuntimeEnv,
  identity: IdentityRow,
  clientId?: string,
  scopes: string[] = [],
): Promise<{ accessToken: string; expiresAt: string; expiresIn: number }> {
  const expiresIn = Number.parseInt(env.CAPYRA_AUTH_ACCESS_TOKEN_LIFETIME_MINUTES, 10) * 60;
  const now = nowIso();
  const expiresAt = addSeconds(now, expiresIn);
  const claims: AuthPrincipal = {
    sub: identity.user_id,
    email: identity.email,
    name: identity.name,
    account_id: identity.account_id,
    role: identity.role,
    ...(clientId ? { client_id: clientId, scope: scopes.join(" ") } : {}),
  };
  const accessToken = await new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(env.CAPYRA_AUTH_ISSUER)
    .setAudience(env.CAPYRA_AUTH_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.parse(expiresAt) / 1000))
    .sign(encoder.encode(env.CAPYRA_AUTH_SIGNING_KEY));
  return { accessToken, expiresAt, expiresIn };
}

export async function verifyFirebaseToken(env: RuntimeEnv, token: string) {
  if (!env.CAPYRA_FIREBASE_PROJECT_ID) throw new ApiError(503, "firebase_not_configured", "Firebase sign-in is not configured.");
  const jwks = createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));
  const result = await jwtVerify(token, jwks, {
    issuer: `https://securetoken.google.com/${env.CAPYRA_FIREBASE_PROJECT_ID}`,
    audience: env.CAPYRA_FIREBASE_PROJECT_ID,
    algorithms: ["RS256"],
  });
  const email = typeof result.payload.email === "string" ? result.payload.email : null;
  if (!email || result.payload.email_verified !== true || typeof result.payload.sub !== "string") {
    throw new ApiError(401, "invalid_firebase_token", "The Firebase identity is not verified.");
  }
  return { uid: result.payload.sub, email, name: typeof result.payload.name === "string" ? result.payload.name : email.split("@")[0] };
}

export const requireAuth: AppMiddleware = async (c, next) => {
  const header = c.req.header("authorization");
  if (!header?.startsWith("Bearer ")) throw new ApiError(401, "unauthorized", "A bearer token is required.");
  try {
    const result = await jwtVerify(header.slice(7), encoder.encode(c.env.CAPYRA_AUTH_SIGNING_KEY), {
      issuer: c.env.CAPYRA_AUTH_ISSUER,
      audience: c.env.CAPYRA_AUTH_AUDIENCE,
      algorithms: ["HS256"],
    });
    const payload = result.payload as AuthPrincipal;
    if (!payload.sub || !payload.account_id || !payload.email || !payload.role) throw new Error("Missing identity claims");
    const identity = await findIdentityById(c.env, payload.sub);
    if (!identity || identity.account_id !== payload.account_id) throw new ApiError(401, "membership_revoked", "This account membership is no longer active.");
    c.set("principal", { ...payload, role: identity.role, email: identity.email, name: identity.name, requestId: c.get("requestId") });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, "invalid_token", "The access token is invalid or expired.");
  }
  await next();
};

export function requireScope(scope: string): AppMiddleware {
  return async (c, next) => {
    const principal = c.get("principal");
    if (principal.client_id) {
      const scopes = new Set((principal.scope ?? "").split(" ").filter(Boolean));
      if (!scopes.has(scope)) throw new ApiError(403, "insufficient_scope", `The '${scope}' scope is required.`);
    }
    await next();
  };
}

export function principalOf(c: import("hono").Context<AppBindings>): AuthPrincipal {
  return c.get("principal");
}
