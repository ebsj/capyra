import { env } from "cloudflare:test";
import { Hono } from "hono";
import { SignJWT } from "jose";
import { ApiError, nowIso, uuidv7 } from "../src/common";
import { ensureAccountFoundations, type BrandRow } from "../src/foundations";
import type { AppBindings, RuntimeEnv } from "../src/runtime";

export const runtime = {
  ...env,
  CAPYRA_AUTH_SIGNING_KEY: "test-key-test-key-test-key-test-key",
  CAPYRA_AUTH_ISSUER: "https://api.test",
  CAPYRA_AUTH_AUDIENCE: "capyra-test",
  CAPYRA_WEB_BASE_URL: "https://web.test",
  AUTH_RATE_LIMITER: { limit: async () => ({ success: true }) },
  ANALYSIS_RATE_LIMITER: { limit: async () => ({ success: true }) },
  SOCIAL_QUEUE: { send: async () => {}, sendBatch: async () => {} },
  ANALYSIS_QUEUE: { send: async () => {}, sendBatch: async () => {} },
} as unknown as RuntimeEnv;
export async function seed(
  accountId = uuidv7(),
  role: "owner" | "member" = "owner"
) {
  const now = nowIso(),
    userId = uuidv7(),
    email = `${userId}@example.com`;
  await env.DB.prepare(
    "INSERT OR IGNORE INTO accounts(id,display_name,account_type,created_at,updated_at) VALUES(?,'Studio','agency',?,?)"
  )
    .bind(accountId, now, now)
    .run();
  await ensureAccountFoundations(runtime, accountId);
  await env.DB.prepare(
    "INSERT INTO account_users(id,account_id,name,email,normalized_email,role,created_at,updated_at) VALUES(?,?,'User',?,?,?,?,?)"
  )
    .bind(userId, accountId, email, email.toUpperCase(), role, now, now)
    .run();
  const brand = (await env.DB.prepare(
    "SELECT * FROM brands WHERE account_id=? LIMIT 1"
  )
    .bind(accountId)
    .first<BrandRow>())!;
  const token = await new SignJWT({
    sub: userId,
    account_id: accountId,
    email,
    name: "User",
    role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(runtime.CAPYRA_AUTH_ISSUER)
    .setAudience(runtime.CAPYRA_AUTH_AUDIENCE)
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(runtime.CAPYRA_AUTH_SIGNING_KEY));
  return { accountId, userId, email, brand, token };
}
export function testApp(routes: Hono<AppBindings>, base = "/api/v1") {
  const app = new Hono<AppBindings>();
  app.route(base, routes);
  app.onError((e, c) =>
    e instanceof ApiError
      ? c.json({ code: e.code }, e.status as 400)
      : c.json({ error: String(e) }, 500)
  );
  return app;
}
export function analysisInsert(
  accountId: string,
  id: string,
  brandId?: string
) {
  const now = nowIso();
  return env.DB.prepare(
    "INSERT INTO video_analyses(id,account_id,brand_id,status,source_type,source_label,language,catalog_version,selected_skill_ids_json,created_at,updated_at) VALUES(?,?,?,'pending','public_url_best_effort','video','pt-BR','v1','[]',?,?)"
  ).bind(id, accountId, brandId ?? null, now, now);
}
