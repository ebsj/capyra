import { applyD1Migrations, env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import {
  currentUsageCycle,
  cycleBounds,
  reserveAnalysisCredit,
} from "../src/foundations";
import { markDlqFailure, reconcile } from "../src/processor";
import { assertAnalyzable, validateMediaMetadata } from "../src/media-probe";
import { runtime, seed, analysisInsert } from "./foundation-helpers";
import { nowIso } from "../src/common";
beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  await env.DB.prepare("DELETE FROM accounts").run();
});
const balance = async () =>
  env.DB.prepare(
    "SELECT SUM(remaining) AS remaining FROM credit_lots WHERE kind='included'"
  ).first<{ remaining: number }>();
describe("Analysis credit ledger", () => {
  it("atomically bounds concurrent reservations and rolls back an unfunded analysis", async () => {
    const a = await seed();
    await env.DB.prepare(
      "UPDATE account_entitlements SET analysis_limit=1 WHERE account_id=?"
    )
      .bind(a.accountId)
      .run();
    const r = await Promise.allSettled(
      ["a", "b"].map((id) =>
        reserveAnalysisCredit(
          runtime,
          a.accountId,
          id,
          analysisInsert(a.accountId, id)
        )
      )
    );
    expect(r.filter((v) => v.status === "fulfilled")).toHaveLength(1);
    expect(
      (
        await env.DB.prepare("SELECT COUNT(*) AS n FROM video_analyses").first<{
          n: number;
        }>()
      )?.n
    ).toBe(1);
    expect((await balance())?.remaining).toBe(0);
  });
  it("consumes completion once and never releases a consumed unit", async () => {
    const a = await seed();
    await reserveAnalysisCredit(
      runtime,
      a.accountId,
      "one",
      analysisInsert(a.accountId, "one")
    );
    for (let i = 0; i < 2; i++)
      await env.DB.prepare(
        "UPDATE video_analyses SET status='completed',updated_at=? WHERE id='one'"
      )
        .bind(nowIso())
        .run();
    await env.DB.prepare(
      "UPDATE video_analyses SET deleted_at=?,updated_at=? WHERE id='one'"
    )
      .bind(nowIso(), nowIso())
      .run();
    expect((await balance())?.remaining).toBe(49);
    expect(
      (
        await env.DB.prepare(
          "SELECT COUNT(*) AS n FROM usage_ledger WHERE event='consumed'"
        ).first<{ n: number }>()
      )?.n
    ).toBe(1);
  });
  it("releases DLQ, exhausted and cancelled pending analyses exactly once", async () => {
    const a = await seed();
    for (const id of ["dlq", "exhausted", "cancelled"])
      await reserveAnalysisCredit(
        runtime,
        a.accountId,
        id,
        analysisInsert(a.accountId, id)
      );
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
    await env.DB.prepare(
      "UPDATE video_analyses SET deleted_at=?,updated_at=? WHERE id='cancelled'"
    )
      .bind(nowIso(), nowIso())
      .run();
    expect((await balance())?.remaining).toBe(50);
    expect(
      (
        await env.DB.prepare(
          "SELECT COUNT(*) AS n FROM usage_ledger WHERE event='released'"
        ).first<{ n: number }>()
      )?.n
    ).toBe(3);
  });
  it("uses included credits before purchased lots and blocks inactive subscriptions", async () => {
    const a = await seed();
    await env.DB.prepare(
      "UPDATE account_entitlements SET analysis_limit=1 WHERE account_id=?"
    )
      .bind(a.accountId)
      .run();
    await env.DB.prepare(
      "INSERT INTO credit_lots(id,account_id,kind,granted,remaining,created_at) VALUES('pack',?,'purchased',50,50,?)"
    )
      .bind(a.accountId, nowIso())
      .run();
    for (const id of ["first", "second"])
      await reserveAnalysisCredit(
        runtime,
        a.accountId,
        id,
        analysisInsert(a.accountId, id)
      );
    const rows = await env.DB.prepare(
      "SELECT analysis_id,lot_id FROM analysis_credit_reservations ORDER BY analysis_id"
    ).all<{ analysis_id: string; lot_id: string }>();
    expect(
      rows.results.find((r) => r.analysis_id === "first")?.lot_id
    ).not.toBe("pack");
    expect(rows.results.find((r) => r.analysis_id === "second")?.lot_id).toBe(
      "pack"
    );
    await env.DB.prepare(
      "UPDATE account_entitlements SET subscription_status='inactive' WHERE account_id=?"
    )
      .bind(a.accountId)
      .run();
    await expect(
      reserveAnalysisCredit(
        runtime,
        a.accountId,
        "third",
        analysisInsert(a.accountId, "third")
      )
    ).rejects.toMatchObject({ code: "analysis_credit_exhausted" });
  });
  it("expires previous included lots without reusing them and retains packages", async () => {
    const a = await seed();
    await env.DB.prepare(
      "INSERT INTO credit_lots(id,account_id,kind,cycle_start,expires_at,granted,remaining,created_at) VALUES('old',?,'included','2000-01-01','2000-02-01',50,20,'2000-01-01')"
    )
      .bind(a.accountId)
      .run();
    await currentUsageCycle(runtime, a.accountId);
    await currentUsageCycle(runtime, a.accountId);
    await reserveAnalysisCredit(
      runtime,
      a.accountId,
      "current",
      analysisInsert(a.accountId, "current")
    );
    expect(
      (
        await env.DB.prepare(
          "SELECT lot_id FROM analysis_credit_reservations WHERE analysis_id='current'"
        ).first<{ lot_id: string }>()
      )?.lot_id
    ).not.toBe("old");
    expect(
      (
        await env.DB.prepare(
          "SELECT COUNT(*) AS n FROM usage_ledger WHERE lot_id='old' AND event='expired'"
        ).first<{ n: number }>()
      )?.n
    ).toBe(1);
  });
  it("keeps original monthly anniversary after February", () => {
    const anchor = "2024-01-31T10:30:00.000Z";
    expect(cycleBounds(anchor, new Date("2024-02-29T12:00:00Z"))).toEqual({
      cycleStart: "2024-02-29T10:30:00.000Z",
      cycleEnd: "2024-03-31T10:30:00.000Z",
    });
    expect(
      cycleBounds(anchor, new Date("2024-03-30T12:00:00Z")).cycleStart
    ).toBe("2024-02-29T10:30:00.000Z");
  });
  it("rejects unsupported media, spoofed MIME, images and videos over 180 seconds", () => {
    expect(validateMediaMetadata("photo.jpg", "image/jpeg", 20)).toBe("image");
    expect(() => validateMediaMetadata("photo.jpg", "video/mp4", 20)).toThrow();
    expect(() =>
      assertAnalyzable({ width: 10, height: 10 }, "image")
    ).toThrow();
    expect(() =>
      assertAnalyzable({ width: 10, height: 10, durationSeconds: 181 }, "video")
    ).toThrow();
    expect(() =>
      assertAnalyzable({ width: 10, height: 10, durationSeconds: 180 }, "video")
    ).not.toThrow();
  });
});
