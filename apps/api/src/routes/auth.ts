import { Hono } from "hono";
import { z } from "zod";
import { ApiError, nowIso, uuidv7, validationError } from "../common";
import {
  findIdentity,
  findIdentityById,
  findOrProvisionFirebaseIdentity,
  identityResponse,
  issueAccessToken,
  principalOf,
  requireAuth,
  verifyFirebaseToken,
} from "../auth";
import { hashPassword, verifyPassword } from "../crypto";
import { contractErrors, contractSchemas } from "../contract-validation";
import {
  ensureAccountFoundations,
  requireOwner,
  recordAudit,
} from "../foundations";
import type { AppBindings, AppContext } from "../runtime";

const auth = new Hono<AppBindings>();
const email = z.string().trim().email().max(254);
const registerSchema = z
  .object({
    displayName: z.string().trim().min(1).max(160),
    accountType: z.enum(["agency", "creator", "team"]),
    ownerName: z.string().trim().min(1).max(160),
    email,
    password: z.string().min(8).max(256),
  })
  .strict();
const loginSchema = z
  .object({ email, password: z.string().min(1).max(256) })
  .strict();
const firebaseSchema = z
  .object({
    idToken: z.string().min(1).max(10_000),
    invitationToken: z.string().min(20).max(200).optional(),
  })
  .strict();

async function session(
  env: AppContext["env"],
  identity: Awaited<ReturnType<typeof findIdentity>> extends infer T
    ? Exclude<T, null>
    : never,
  token: Awaited<ReturnType<typeof issueAccessToken>>
) {
  return {
    accessToken: token.accessToken,
    tokenType: "Bearer" as const,
    expiresAt: token.expiresAt,
    ...(await identityResponse(env, identity)),
  };
}

auth.post("/register", async (c) => {
  const rate = await c.env.AUTH_RATE_LIMITER.limit({
    key: `register:${c.req.header("cf-connecting-ip") ?? "unknown"}`,
  });
  if (!rate.success)
    throw new ApiError(429, "rate_limited", "Too many registration attempts.");
  const payload = await c.req.json().catch(() => null);
  const boundaryErrors = contractErrors(
    contractSchemas.RegisterRequest,
    payload
  );
  if (boundaryErrors.length) return validationError(c, boundaryErrors);
  const parsed = registerSchema.safeParse(payload);
  if (!parsed.success)
    return validationError(
      c,
      parsed.error.issues.map((issue) => ({
        field: issue.path.join(".") || "request",
        message: issue.message,
      }))
    );
  const normalizedEmail = parsed.data.email.toUpperCase();
  if (await findIdentity(c.env, "normalized_email", normalizedEmail))
    throw new ApiError(
      409,
      "email_already_registered",
      "An account already exists for this email."
    );
  const timestamp = nowIso();
  const accountId = uuidv7();
  const userId = uuidv7();
  await c.env.DB.batch([
    c.env.DB.prepare(
      "INSERT INTO accounts (id, display_name, account_type, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(
      accountId,
      parsed.data.displayName,
      parsed.data.accountType,
      timestamp,
      timestamp
    ),
    c.env.DB.prepare(
      "INSERT INTO account_users (id, account_id, name, email, normalized_email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'owner', ?, ?)"
    ).bind(
      userId,
      accountId,
      parsed.data.ownerName,
      parsed.data.email.toLowerCase(),
      normalizedEmail,
      await hashPassword(parsed.data.password),
      timestamp,
      timestamp
    ),
  ]);
  await ensureAccountFoundations(c.env, accountId);
  const identity = await findIdentityById(c.env, userId);
  if (!identity)
    throw new ApiError(
      500,
      "identity_creation_failed",
      "The account could not be loaded after creation."
    );
  return c.json(
    await session(c.env, identity, await issueAccessToken(c.env, identity)),
    201,
    { Location: "/api/v1/account" }
  );
});

auth.post("/login", async (c) => {
  const payload = await c.req.json().catch(() => null);
  const boundaryErrors = contractErrors(contractSchemas.LoginRequest, payload);
  if (boundaryErrors.length) return validationError(c, boundaryErrors);
  const parsed = loginSchema.safeParse(payload);
  if (!parsed.success)
    return validationError(
      c,
      parsed.error.issues.map((issue) => ({
        field: issue.path.join(".") || "request",
        message: issue.message,
      }))
    );
  const rate = await c.env.AUTH_RATE_LIMITER.limit({
    key: `login:${parsed.data.email.toUpperCase()}`,
  });
  if (!rate.success)
    throw new ApiError(429, "rate_limited", "Too many login attempts.");
  const identity = await findIdentity(
    c.env,
    "normalized_email",
    parsed.data.email.toUpperCase()
  );
  if (
    !identity?.password_hash ||
    !(await verifyPassword(parsed.data.password, identity.password_hash))
  ) {
    throw new ApiError(
      401,
      "invalid_credentials",
      "The email/password combination is invalid."
    );
  }
  return c.json(
    await session(c.env, identity, await issueAccessToken(c.env, identity))
  );
});

async function firebaseSignIn(c: AppContext) {
  const rate = await c.env.AUTH_RATE_LIMITER.limit({
    key: `firebase:${c.req.header("cf-connecting-ip") ?? "unknown"}`,
  });
  if (!rate.success)
    throw new ApiError(
      429,
      "rate_limited",
      "Too many Firebase sign-in attempts."
    );
  const payload = await c.req.json().catch(() => null);
  const boundaryErrors = contractErrors(
    contractSchemas.FirebaseSignInRequest,
    payload
  );
  if (boundaryErrors.length) return validationError(c, boundaryErrors);
  const parsed = firebaseSchema.safeParse(payload);
  if (!parsed.success)
    return validationError(
      c,
      parsed.error.issues.map((issue) => ({
        field: issue.path.join(".") || "request",
        message: issue.message,
      }))
    );
  const verified = await verifyFirebaseToken(c.env, parsed.data.idToken);
  const { identity } = await findOrProvisionFirebaseIdentity(
    c.env,
    verified,
    parsed.data.invitationToken
  );
  return c.json(
    await session(c.env, identity, await issueAccessToken(c.env, identity))
  );
}

auth.post("/firebase", firebaseSignIn);
auth.post("/email-link", firebaseSignIn);

auth.patch("/account", requireAuth, async (c) => {
  const schema = registerSchema.pick({
    displayName: true,
    accountType: true,
    ownerName: true,
  });
  const parsed = schema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success)
    return validationError(
      c,
      parsed.error.issues.map((issue) => ({
        field: issue.path.join(".") || "request",
        message: issue.message,
      }))
    );
  const principal = principalOf(c);
  requireOwner(principal);
  const timestamp = nowIso();
  await c.env.DB.batch([
    c.env.DB.prepare(
      "UPDATE accounts SET display_name = ?, account_type = ?, updated_at = ? WHERE id = ?"
    ).bind(
      parsed.data.displayName,
      parsed.data.accountType,
      timestamp,
      principal.account_id
    ),
    c.env.DB.prepare(
      "UPDATE account_users SET name = ?, updated_at = ? WHERE id = ? AND account_id = ?"
    ).bind(
      parsed.data.ownerName,
      timestamp,
      principal.sub,
      principal.account_id
    ),
  ]);
  await recordAudit(
    c.env,
    principal,
    "account.updated",
    "account",
    principal.account_id
  );
  return c.body(null, 204);
});

export default auth;
