import { applyD1Migrations, env } from "cloudflare:test";
import { beforeEach, expect, it } from "vitest";
import { currentUsageCycle, usageResponse } from "../src/foundations";
import { runtime, seed } from "./foundation-helpers";
import { nowIso, uuidv7 } from "../src/common";

beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  await env.DB.prepare("DELETE FROM social_accounts").run();
  await env.DB.prepare("DELETE FROM social_identity_usage").run();
  await env.DB.prepare("DELETE FROM accounts").run();
});

it("carries existing identities into a new cycle before rotation and preserves their charge after disconnect", async () => {
  const a = await seed(),
    now = nowIso();
  await env.DB.prepare(
    "UPDATE account_entitlements SET identity_limit=2,cycle_anchor='2000-01-01T00:00:00.000Z' WHERE account_id=?"
  )
    .bind(a.accountId)
    .run();
  for (const [platform, native] of [
    ["instagram", "original"],
    ["youtube", "channel"],
  ]) {
    await env.DB.prepare(
      "INSERT INTO social_accounts(id,account_id,brand_id,platform,native_identity_id,identity_status,status,created_at,updated_at) VALUES(?,?,?,?,?,'verified','active',?,?)"
    )
      .bind(uuidv7(), a.accountId, a.brand.id, platform, native, now, now)
      .run();
    await env.DB.prepare(
      "INSERT INTO social_identity_usage VALUES(?,'2000-01-01T00:00:00.000Z',?,?,?)"
    )
      .bind(a.accountId, platform, native, now)
      .run();
  }
  const cycle = await currentUsageCycle(runtime, a.accountId);
  expect(
    (await usageResponse(runtime, a.accountId)).usage.socialIdentities
  ).toBe(2);
  await env.DB.prepare(
    "UPDATE social_accounts SET status='disconnected' WHERE account_id=? AND platform='instagram'"
  )
    .bind(a.accountId)
    .run();
  await currentUsageCycle(runtime, a.accountId);
  expect(
    (await usageResponse(runtime, a.accountId)).usage.socialIdentities
  ).toBe(2);
  await expect(
    env.DB.prepare(
      "INSERT INTO social_identity_usage VALUES(?,?,'instagram','replacement',?)"
    )
      .bind(a.accountId, cycle.cycleStart, now)
      .run()
  ).rejects.toThrow("social_identity_quota");
  await expect(
    env.DB.prepare(
      "INSERT OR IGNORE INTO social_identity_usage VALUES(?,?,'instagram','original',?)"
    )
      .bind(a.accountId, cycle.cycleStart, now)
      .run()
  ).resolves.toBeTruthy();
});
