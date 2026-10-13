import { applyD1Migrations, env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { purgeFoundationRecords } from "../src/foundations";
import { nowIso, uuidv7 } from "../src/common";
import { seed, runtime, testApp } from "./foundation-helpers";
import assets from "../src/routes/assets";

beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  for (const table of [
    "social_delivery_attempts",
    "social_destination_versions",
    "social_destinations",
    "social_publications",
    "social_sync_jobs",
    "social_authorizations",
    "social_accounts",
    "social_profiles",
    "accounts",
  ])
    await env.DB.prepare(`DELETE FROM ${table}`).run();
});
const app = testApp(assets, "/api/v1/source-assets");
async function media(
  accountId: string,
  brandId: string,
  purgeAfter: string | null = null
) {
  const id = uuidv7(),
    key = `source-assets/${accountId}/${brandId}/${id}/image.jpg`,
    now = nowIso();
  await env.STORAGE.put(key, new Uint8Array([1, 2, 3, 4]), {
    httpMetadata: { contentType: "image/jpeg" },
  });
  await env.DB.prepare(
    "INSERT INTO source_assets(id,account_id,brand_id,source_label,content_type,content_length,object_key,upload_status,created_at,media_kind,metadata_status,metadata_json,purge_after) VALUES(?,?,?,'image.jpg','image/jpeg',4,?,'completed',?,'image','ready',?,?)"
  )
    .bind(
      id,
      accountId,
      brandId,
      key,
      now,
      JSON.stringify({ width: 1080, height: 1080 }),
      purgeAfter
    )
    .run();
  return { id, key };
}
async function destination(
  accountId: string,
  brandId: string,
  assetId: string,
  status = "draft"
) {
  const now = nowIso(),
    account = uuidv7(),
    publication = uuidv7(),
    id = uuidv7();
  await env.DB.batch([
    env.DB.prepare(
      "INSERT INTO social_accounts(id,account_id,brand_id,platform,status,created_at,updated_at) VALUES(?,?,?,'instagram','pending',?,?)"
    ).bind(account, accountId, brandId, now, now),
    env.DB.prepare(
      "INSERT INTO social_publications(id,account_id,brand_id,title,created_at,updated_at) VALUES(?,?,?,'Test',?,?)"
    ).bind(publication, accountId, brandId, now, now),
    env.DB.prepare(
      "INSERT INTO social_destinations(id,account_id,brand_id,publication_id,social_account_id,platform,payload_json,status,created_at,updated_at) VALUES(?,?,?,?,?,'instagram',?,?,?,?)"
    ).bind(
      id,
      accountId,
      brandId,
      publication,
      account,
      JSON.stringify({ mediaAssetIds: [assetId] }),
      status,
      now,
      now
    ),
  ]);
  return id;
}
describe("Private media and retention", () => {
  it("streams private content with range and tenant isolation", async () => {
    const a = await seed(),
      b = await seed(),
      asset = await media(a.accountId, a.brand.id);
    const get = (token: string, range?: string) =>
      app.request(
        `https://api.test/api/v1/source-assets/${asset.id}/content`,
        {
          headers: {
            authorization: `Bearer ${token}`,
            ...(range ? { range } : {}),
          },
        },
        runtime
      );
    const all = await get(a.token);
    expect(all.status).toBe(200);
    expect(Array.from(new Uint8Array(await all.arrayBuffer()))).toEqual([
      1, 2, 3, 4,
    ]);
    expect((await get(b.token)).status).toBe(404);
    const partial = await get(a.token, "bytes=1-2");
    expect(partial.status).toBe(206);
    expect(partial.headers.get("content-range")).toBe("bytes 1-2/4");
    expect(Array.from(new Uint8Array(await partial.arrayBuffer()))).toEqual([
      2, 3,
    ]);
  });
  it("blocks deletion and purge while a destination is open, then purges only originals", async () => {
    const a = await seed(),
      asset = await media(a.accountId, a.brand.id, "2000-01-01T00:00:00.000Z");
    const dest = await destination(a.accountId, a.brand.id, asset.id);
    const del = await app.request(
      `https://api.test/api/v1/source-assets/${asset.id}`,
      { method: "DELETE", headers: { authorization: `Bearer ${a.token}` } },
      runtime
    );
    expect(del.status).toBe(409);
    await purgeFoundationRecords(runtime);
    expect(await env.STORAGE.head(asset.key)).not.toBeNull();
    await env.DB.prepare(
      "UPDATE social_destinations SET status='published' WHERE id=?"
    )
      .bind(dest)
      .run();
    await env.STORAGE.put("analyses/retained/report.json", "{}");
    await purgeFoundationRecords(runtime);
    expect(await env.STORAGE.head(asset.key)).toBeNull();
    expect(
      await env.STORAGE.head("analyses/retained/report.json")
    ).not.toBeNull();
    expect(
      (
        await env.DB.prepare(
          "SELECT upload_status FROM source_assets WHERE id=?"
        )
          .bind(asset.id)
          .first<{ upload_status: string }>()
      )?.upload_status
    ).toBe("expired");
  });
  it("waits thirty days for requested deletion and preserves unexpired originals", async () => {
    const a = await seed(),
      asset = await media(a.accountId, a.brand.id);
    const response = await app.request(
      `https://api.test/api/v1/source-assets/${asset.id}`,
      { method: "DELETE", headers: { authorization: `Bearer ${a.token}` } },
      runtime
    );
    expect(response.status).toBe(204);
    const row = await env.DB.prepare(
      "SELECT deleted_at,purge_after FROM source_assets WHERE id=?"
    )
      .bind(asset.id)
      .first<{ deleted_at: string; purge_after: string }>();
    expect(
      Date.parse(row!.purge_after) - Date.parse(row!.deleted_at)
    ).toBeGreaterThanOrEqual(30 * 86400000);
    await purgeFoundationRecords(runtime);
    expect(await env.STORAGE.head(asset.key)).not.toBeNull();
  });
  it("rejects cross-Brand variants before writing R2 or a source record", async () => {
    const a = await seed(),
      b = await seed(),
      asset = await media(b.accountId, b.brand.id);
    const form = new FormData();
    form.set(
      "file",
      new File([new Uint8Array([1])], "photo.jpg", { type: "image/jpeg" })
    );
    form.set("brandId", a.brand.id);
    form.set("variantOfAssetId", asset.id);
    const response = await app.request(
      "https://api.test/api/v1/source-assets",
      {
        method: "POST",
        headers: { authorization: `Bearer ${a.token}` },
        body: form,
      },
      runtime
    );
    expect(response.status).toBe(404);
    expect(
      (
        await env.DB.prepare(
          "SELECT COUNT(*) AS n FROM source_assets WHERE account_id=?"
        )
          .bind(a.accountId)
          .first<{ n: number }>()
      )?.n
    ).toBe(0);
  });
  it("prunes audit only after the twelve-month retention boundary", async () => {
    const a = await seed();
    for (const [id, date] of [
      ["old", "2000-01-01T00:00:00.000Z"],
      ["new", nowIso()],
    ])
      await env.DB.prepare(
        "INSERT INTO audit_events(id,account_id,actor_id,action,resource_type,resource_id,correlation_id,created_at) VALUES(?,?,'actor','test','brand',?,'correlation',?)"
      )
        .bind(id, a.accountId, a.brand.id, date)
        .run();
    await purgeFoundationRecords(runtime);
    expect(
      (
        await env.DB.prepare("SELECT id FROM audit_events").all<{
          id: string;
        }>()
      ).results.map((r) => r.id)
    ).toEqual(["new"]);
  });
});
