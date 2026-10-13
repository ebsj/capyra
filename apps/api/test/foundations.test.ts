import { applyD1Migrations, env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import {
  acceptInvitation,
  ensureAccountFoundations,
  requireActiveBrand,
} from "../src/foundations";
import { findOrProvisionFirebaseIdentity } from "../src/auth";
import routes from "../src/routes/foundations";
import { randomToken, sha256 } from "../src/crypto";
import { nowIso, uuidv7 } from "../src/common";
import { runtime, seed, testApp, analysisInsert } from "./foundation-helpers";

beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  await env.DB.prepare("DELETE FROM accounts").run();
});
const app = testApp(routes);
const request = (path: string, token: string, method = "GET", body?: unknown) =>
  app.request(
    `https://api.test/api/v1${path}`,
    {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    },
    runtime
  );
async function invite(accountId: string, email: string) {
  const id = uuidv7(),
    token = randomToken();
  await env.DB.prepare(
    "INSERT INTO member_invitations(id,account_id,email,normalized_email,token_hash,status,created_by,created_at,expires_at) VALUES(?,?,?,?,?,'pending','owner',?,?)"
  )
    .bind(
      id,
      accountId,
      email,
      email.toUpperCase(),
      await sha256(token),
      nowIso(),
      new Date(Date.now() + 86400000).toISOString()
    )
    .run();
  return token;
}
describe("Brands and membership", () => {
  it("initializes once and preserves legacy analyses without a Brand", async () => {
    const a = await seed();
    await analysisInsert(a.accountId, "legacy").run();
    await Promise.all([
      ensureAccountFoundations(runtime, a.accountId),
      ensureAccountFoundations(runtime, a.accountId),
    ]);
    expect(
      (
        await env.DB.prepare(
          "SELECT COUNT(*) AS n FROM brands WHERE account_id=?"
        )
          .bind(a.accountId)
          .first<{ n: number }>()
      )?.n
    ).toBe(1);
    expect(
      (
        await env.DB.prepare(
          "SELECT brand_id FROM video_analyses WHERE id='legacy'"
        ).first<{ brand_id: null }>()
      )?.brand_id
    ).toBeNull();
  });
  it("enforces Brand ownership, confirmation and archived state", async () => {
    const a = await seed(),
      b = await seed();
    await expect(
      requireActiveBrand(runtime, b.accountId, a.brand.id)
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      requireActiveBrand(runtime, a.accountId, a.brand.id, { confirmed: true })
    ).rejects.toMatchObject({ code: "brand_confirmation_required" });
    await env.DB.prepare("UPDATE brands SET status='archived' WHERE id=?")
      .bind(a.brand.id)
      .run();
    await expect(
      requireActiveBrand(runtime, a.accountId, a.brand.id)
    ).rejects.toMatchObject({ code: "brand_read_only" });
  });
  it("protects owner controls and revokes a removed member with a still-valid JWT", async () => {
    const owner = await seed(),
      member = await seed(owner.accountId, "member");
    expect(
      (
        await request("/brands", member.token, "POST", {
          name: "New",
          timeZone: "UTC",
        })
      ).status
    ).toBe(403);
    expect((await request("/brands", member.token)).status).toBe(200);
    expect(
      (await request(`/members/${member.userId}`, owner.token, "DELETE")).status
    ).toBe(204);
    expect((await request("/brands", member.token)).status).toBe(401);
  });
  it("enforces exactly one owner and atomic Brand quota", async () => {
    const a = await seed();
    await expect(seed(a.accountId)).rejects.toThrow();
    await env.DB.prepare(
      "UPDATE account_entitlements SET brand_limit=2 WHERE account_id=?"
    )
      .bind(a.accountId)
      .run();
    const results = await Promise.all([
      request("/brands", a.token, "POST", { name: "A", timeZone: "UTC" }),
      request("/brands", a.token, "POST", { name: "B", timeZone: "UTC" }),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
  });
  it("accepts invited Firebase user before automatic account provisioning", async () => {
    const owner = await seed(),
      email = "invited@example.com",
      token = await invite(owner.accountId, email);
    const result = await findOrProvisionFirebaseIdentity(
      runtime,
      { uid: "firebase-invited", email, name: "Invited" },
      token
    );
    expect(result.identity.account_id).toBe(owner.accountId);
    expect(result.identity.role).toBe("member");
    expect(
      (
        await env.DB.prepare("SELECT COUNT(*) AS n FROM accounts").first<{
          n: number;
        }>()
      )?.n
    ).toBe(1);
    await expect(
      acceptInvitation(runtime, token, {
        uid: "firebase-invited",
        email,
        name: "Invited",
      })
    ).rejects.toMatchObject({ code: "invitation_unavailable" });
  });
  it("rejects mismatched email, other account and expired invitations", async () => {
    const owner = await seed(),
      other = await seed();
    const token = await invite(owner.accountId, other.email);
    await expect(
      acceptInvitation(runtime, token, {
        uid: "x",
        email: "wrong@example.com",
        name: "Wrong",
      })
    ).rejects.toMatchObject({ code: "invitation_email_mismatch" });
    await expect(
      acceptInvitation(runtime, token, {
        uid: "x",
        email: other.email,
        name: "Wrong",
      })
    ).rejects.toMatchObject({ code: "membership_conflict" });
    await env.DB.prepare(
      "UPDATE member_invitations SET expires_at='2000-01-01T00:00:00.000Z'"
    ).run();
    await expect(
      acceptInvitation(runtime, token, {
        uid: "x",
        email: other.email,
        name: "Wrong",
      })
    ).rejects.toMatchObject({ code: "invitation_unavailable" });
  });
  it("concurrent accepts cannot exceed member quota or reuse a token", async () => {
    const owner = await seed();
    await env.DB.prepare(
      "UPDATE account_entitlements SET operator_limit=2 WHERE account_id=?"
    )
      .bind(owner.accountId)
      .run();
    const t1 = await invite(owner.accountId, "one@example.com"),
      t2 = await invite(owner.accountId, "two@example.com");
    const r = await Promise.allSettled([
      acceptInvitation(runtime, t1, {
        uid: "one",
        email: "one@example.com",
        name: "One",
      }),
      acceptInvitation(runtime, t2, {
        uid: "two",
        email: "two@example.com",
        name: "Two",
      }),
    ]);
    expect(r.filter((v) => v.status === "fulfilled")).toHaveLength(1);
    expect(
      (
        await env.DB.prepare(
          "SELECT COUNT(*) AS n FROM member_invitations WHERE status='pending'"
        ).first<{ n: number }>()
      )?.n
    ).toBe(1);
  });
});
