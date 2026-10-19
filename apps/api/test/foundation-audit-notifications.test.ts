import { applyD1Migrations, env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { nowIso, uuidv7 } from "../src/common";
import { markDlqFailure, reconcile } from "../src/processor";
import {
  markMediaProbeFailure,
  reconcileMediaProbes,
} from "../src/media-probe";
import { reserveAnalysisCredit } from "../src/foundations";
import authRoutes from "../src/routes/auth";
import analysisRoutes from "../src/routes/analyses";
import { analysisInsert, runtime, seed, testApp } from "./foundation-helpers";

beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  await env.DB.prepare("DELETE FROM accounts").run();
});

describe("Sensitive audit and terminal failure notifications", () => {
  it("audits account updates and analysis deletion with actor, account, Brand and correlation", async () => {
    const a = await seed(),
      id = uuidv7();
    await analysisInsert(a.accountId, id, a.brand.id).run();
    const headers = {
      authorization: `Bearer ${a.token}`,
      "content-type": "application/json",
    };
    const update = await testApp(authRoutes, "/api/v1/auth").request(
      "https://api.test/api/v1/auth/account",
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          displayName: "Changed",
          accountType: "agency",
          ownerName: "Owner",
        }),
      },
      runtime
    );
    expect(update.status).toBe(204);
    const remove = await testApp(analysisRoutes).request(
      `https://api.test/api/v1/analyses/${id}`,
      { method: "DELETE", headers },
      runtime
    );
    expect(remove.status).toBe(204);
    const rows = (
      await env.DB.prepare(
        "SELECT * FROM audit_events WHERE account_id=? ORDER BY action"
      )
        .bind(a.accountId)
        .all<Record<string, string | null>>()
    ).results;
    expect(rows.map((r) => r.action)).toEqual([
      "account.updated",
      "analysis.deleted",
    ]);
    expect(rows[0]).toMatchObject({
      actor_id: a.userId,
      account_id: a.accountId,
      resource_id: a.accountId,
      brand_id: null,
    });
    expect(rows[1]).toMatchObject({
      actor_id: a.userId,
      account_id: a.accountId,
      resource_id: id,
      brand_id: a.brand.id,
    });
    for (const row of rows)
      expect(row.correlation_id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("notifies only the owner once per final analysis failure, never on a processing retry", async () => {
    const a = await seed();
    await seed(a.accountId, "member");
    await seed();
    for (const id of ["dlq", "exhausted", "retry"])
      await reserveAnalysisCredit(
        runtime,
        a.accountId,
        id,
        analysisInsert(a.accountId, id, a.brand.id)
      );
    await env.DB.prepare(
      "UPDATE video_analyses SET error_message='https://signed.invalid/secret', attempts=1 WHERE id='retry'"
    ).run();
    expect(
      (
        await env.DB.prepare("SELECT COUNT(*) AS n FROM notifications").first<{
          n: number;
        }>()
      )?.n
    ).toBe(0);
    await markDlqFailure(runtime, { body: { analysisId: "dlq" } } as Message<{
      analysisId: string;
    }>);
    await markDlqFailure(runtime, { body: { analysisId: "dlq" } } as Message<{
      analysisId: string;
    }>);
    await env.DB.prepare(
      "UPDATE video_analyses SET attempts=6 WHERE id='exhausted'"
    ).run();
    await reconcile(runtime);
    await reconcile(runtime);
    const rows = (
      await env.DB.prepare(
        "SELECT * FROM notifications ORDER BY resource_id"
      ).all<Record<string, string>>()
    ).results;
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.resource_id)).toEqual(["dlq", "exhausted"]);
    for (const row of rows) {
      expect(row).toMatchObject({
        owner_id: a.userId,
        account_id: a.accountId,
        brand_id: a.brand.id,
        code: "analysis_failed",
      });
      expect(row.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-a[0-9a-f]{3}-[0-9a-f]{12}$/
      );
      expect(row.message).not.toContain("signed.invalid");
    }
  });

  it("notifies once when media probing definitively fails or exhausts attempts", async () => {
    const a = await seed();
    for (const id of ["invalid", "exhausted"])
      await env.DB.prepare(
        "INSERT INTO source_assets(id,account_id,brand_id,source_label,content_type,content_length,object_key,upload_status,created_at) VALUES(?,?,?,'video.mp4','video/mp4',5,?,'completed',?)"
      )
        .bind(id, a.accountId, a.brand.id, `source-assets/${id}`, nowIso())
        .run();
    await markMediaProbeFailure(runtime, "invalid");
    await markMediaProbeFailure(runtime, "invalid");
    await env.DB.prepare(
      "UPDATE source_assets SET probe_attempts=6 WHERE id='exhausted'"
    ).run();
    await reconcileMediaProbes(runtime);
    await reconcileMediaProbes(runtime);
    const rows = (
      await env.DB.prepare(
        "SELECT owner_id,code,resource_id FROM notifications ORDER BY resource_id"
      ).all()
    ).results;
    expect(rows).toEqual([
      {
        owner_id: a.userId,
        code: "media_inspection_failed",
        resource_id: "exhausted",
      },
      {
        owner_id: a.userId,
        code: "media_inspection_failed",
        resource_id: "invalid",
      },
    ]);
  });
});
