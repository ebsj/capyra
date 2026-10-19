import { applyD1Migrations, env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";

beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  for (const table of ["feedback_reactions", "oauth_authorization_codes", "oauth_device_codes", "oauth_refresh_tokens", "upload_sessions", "video_analyses", "source_assets", "account_users", "accounts"]) {
    await env.DB.prepare(`DELETE FROM ${table}`).run();
  }
});

async function seedIdentity(accountId: string, userId: string, email: string) {
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare("INSERT INTO accounts (id, display_name, account_type, created_at, updated_at) VALUES (?, ?, 'creator', ?, ?)")
      .bind(accountId, accountId, now, now),
    env.DB.prepare("INSERT INTO account_users (id, account_id, name, email, normalized_email, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'owner', ?, ?)")
      .bind(userId, accountId, userId, email, email.toUpperCase(), now, now),
  ]);
}

describe("D1 invariants", () => {
  it("enforces enum-like constraints", async () => {
    const now = new Date().toISOString();
    await expect(env.DB.prepare("INSERT INTO accounts (id, display_name, account_type, created_at, updated_at) VALUES ('a', 'A', 'invalid', ?, ?)")
      .bind(now, now).run()).rejects.toThrow();
  });

  it("keeps analysis reads scoped by account", async () => {
    await seedIdentity("account-a", "user-a", "a@example.com");
    await seedIdentity("account-b", "user-b", "b@example.com");
    const now = new Date().toISOString();
    await env.DB.prepare(`INSERT INTO video_analyses
      (id, account_id, status, source_type, source_label, language, catalog_version, selected_skill_ids_json, created_at, updated_at)
      VALUES ('analysis-a', 'account-a', 'pending', 'public_url_best_effort', 'video', 'pt-BR', 'v1', '["editing"]', ?, ?)`)
      .bind(now, now).run();
    const visible = await env.DB.prepare("SELECT id FROM video_analyses WHERE id = 'analysis-a' AND account_id = 'account-b' AND deleted_at IS NULL").first();
    expect(visible).toBeNull();
  });

  it("allows an authorization code to be consumed only once", async () => {
    await seedIdentity("account-a", "user-a", "a@example.com");
    const now = new Date().toISOString();
    const expires = new Date(Date.now() + 60_000).toISOString();
    await env.DB.prepare(`INSERT INTO oauth_authorization_codes
      (code_hash, client_id, account_id, account_user_id, redirect_uri, code_challenge, scopes, expires_at, created_at)
      VALUES ('hash', 'capyra-mcp', 'account-a', 'user-a', 'https://mcp.capyra.co/callback', 'challenge', 'analyses:read', ?, ?)`)
      .bind(expires, now).run();
    const consume = () => env.DB.prepare("UPDATE oauth_authorization_codes SET consumed_at = ? WHERE code_hash = 'hash' AND consumed_at IS NULL AND expires_at > ?")
      .bind(now, now).run();
    const results = await Promise.all([consume(), consume()]);
    expect(results.map((result) => result.meta.changes).sort()).toEqual([0, 1]);
  });
});
