import { applyD1Migrations, env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";

import { findOrProvisionFirebaseIdentity } from "../src/auth";

beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  await env.DB.prepare("DELETE FROM account_users").run();
  await env.DB.prepare("DELETE FROM accounts").run();
});

async function seedLocalIdentity(options: {
  accountId?: string;
  userId?: string;
  email?: string;
  firebaseUid?: string | null;
}) {
  const accountId = options.accountId ?? "account-existing";
  const userId = options.userId ?? "user-existing";
  const email = options.email ?? "owner@example.com";
  const now = new Date().toISOString();

  await env.DB.batch([
    env.DB.prepare("INSERT INTO accounts (id, display_name, account_type, created_at, updated_at) VALUES (?, 'Existing Studio', 'agency', ?, ?)")
      .bind(accountId, now, now),
    env.DB.prepare(`INSERT INTO account_users
      (id, account_id, name, email, normalized_email, password_hash, firebase_uid, role, created_at, updated_at)
      VALUES (?, ?, 'Existing Owner', ?, ?, 'legacy-password-hash', ?, 'owner', ?, ?)`)
      .bind(userId, accountId, email, email.toUpperCase(), options.firebaseUid ?? null, now, now),
  ]);

  return { accountId, userId, email };
}

describe("Firebase identity provisioning", () => {
  it("creates a passwordless creator account on first sign-in", async () => {
    const result = await findOrProvisionFirebaseIdentity(env, {
      uid: "firebase-new",
      email: "New.Owner@Example.com",
      name: "New Owner",
    });

    expect(result.created).toBe(true);
    expect(result.identity).toMatchObject({
      name: "New Owner",
      email: "new.owner@example.com",
      firebase_uid: "firebase-new",
      password_hash: null,
      display_name: "New Owner",
      account_type: "creator",
      role: "owner",
    });
  });

  it("uses the email local part when Firebase has no usable name", async () => {
    const result = await findOrProvisionFirebaseIdentity(env, {
      uid: "firebase-fallback",
      email: "fallback.owner@example.com",
      name: "   ",
    });

    expect(result.identity.name).toBe("fallback.owner");
    expect(result.identity.display_name).toBe("fallback.owner");
  });

  it("returns the same account on repeated sign-in without creating duplicates", async () => {
    const verified = {
      uid: "firebase-repeat",
      email: "repeat@example.com",
      name: "Repeat Owner",
    };

    const first = await findOrProvisionFirebaseIdentity(env, verified);
    const second = await findOrProvisionFirebaseIdentity(env, verified);
    const accountCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM accounts").first<{ count: number }>();
    const userCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM account_users").first<{ count: number }>();

    expect(second.created).toBe(false);
    expect(second.identity.user_id).toBe(first.identity.user_id);
    expect(accountCount?.count).toBe(1);
    expect(userCount?.count).toBe(1);
  });

  it("links an existing local account by normalized email and preserves its profile", async () => {
    const seeded = await seedLocalIdentity({ email: "owner@example.com" });

    const result = await findOrProvisionFirebaseIdentity(env, {
      uid: "firebase-linked",
      email: "OWNER@example.com",
      name: "Firebase Name",
    });

    expect(result.created).toBe(false);
    expect(result.identity).toMatchObject({
      user_id: seeded.userId,
      account_id: seeded.accountId,
      name: "Existing Owner",
      display_name: "Existing Studio",
      account_type: "agency",
      password_hash: "legacy-password-hash",
      firebase_uid: "firebase-linked",
    });
  });

  it("rejects linking an email already bound to another Firebase identity", async () => {
    await seedLocalIdentity({ firebaseUid: "firebase-original" });

    await expect(findOrProvisionFirebaseIdentity(env, {
      uid: "firebase-other",
      email: "owner@example.com",
      name: "Other Owner",
    })).rejects.toMatchObject({
      status: 409,
      code: "firebase_identity_conflict",
    });
  });

  it("is idempotent when the first sign-in is submitted concurrently", async () => {
    const verified = {
      uid: "firebase-concurrent",
      email: "concurrent@example.com",
      name: "Concurrent Owner",
    };

    const results = await Promise.all([
      findOrProvisionFirebaseIdentity(env, verified),
      findOrProvisionFirebaseIdentity(env, verified),
    ]);
    const accountCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM accounts").first<{ count: number }>();
    const userCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM account_users").first<{ count: number }>();

    expect(new Set(results.map((result) => result.identity.user_id)).size).toBe(1);
    expect(accountCount?.count).toBe(1);
    expect(userCount?.count).toBe(1);
  });
});
