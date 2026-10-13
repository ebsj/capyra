import { applyD1Migrations, env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { nowIso, uuidv7 } from "../src/common";
import { seed, runtime, testApp, analysisInsert } from "./foundation-helpers";
import analysisRoutes from "../src/routes/analyses";
import assets from "../src/routes/assets";
import { handleLocalUpload } from "../src/r2";
import type { RuntimeEnv } from "../src/runtime";
beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  await env.DB.prepare("DELETE FROM accounts").run();
});
const analyses = testApp(analysisRoutes),
  media = testApp(assets, "/api/v1/source-assets");
async function video(
  a: Awaited<ReturnType<typeof seed>>,
  duration = 180,
  kind = "video"
) {
  const id = uuidv7();
  await env.DB.prepare(
    "INSERT INTO source_assets(id,account_id,brand_id,source_label,content_type,content_length,object_key,upload_status,created_at,media_kind,metadata_status,metadata_json) VALUES(?,?,?,'test.mp4','video/mp4',5,?,'completed',?,?,'ready',?)"
  )
    .bind(
      id,
      a.accountId,
      a.brand.id,
      `source-assets/${id}`,
      nowIso(),
      kind,
      JSON.stringify({ width: 1080, height: 1920, durationSeconds: duration })
    )
    .run();
  return id;
}
const create = (token: string, payload: unknown) =>
  analyses.request(
    "https://api.test/api/v1/analyses",
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    runtime
  );
describe("Brand-scoped media analysis API", () => {
  it("requires explicit Brand and reserves an accepted eligible video", async () => {
    const a = await seed(),
      id = await video(a);
    expect(
      (await create(a.token, { sourceAssetId: id, skills: ["editing"] })).status
    ).toBe(422);
    const result = await create(a.token, {
      brandId: a.brand.id,
      sourceAssetId: id,
      skills: ["editing"],
    });
    expect(result.status).toBe(201);
    const detail = (await result.json()) as {
      brandId: string;
      status: string;
      id: string;
    };
    expect(detail.brandId).toBe(a.brand.id);
    expect(detail.status).toBe("pending");
    expect(
      (
        await env.DB.prepare(
          "SELECT state FROM analysis_credit_reservations WHERE analysis_id=?"
        )
          .bind(detail.id)
          .first<{ state: string }>()
      )?.state
    ).toBe("reserved");
  });
  it("rejects images and long videos without creating analyses or reservations", async () => {
    const a = await seed();
    for (const id of [await video(a, 181), await video(a, 12, "image")])
      expect(
        (
          await create(a.token, {
            brandId: a.brand.id,
            sourceAssetId: id,
            skills: ["editing"],
          })
        ).status
      ).toBe(422);
    expect(
      (
        await env.DB.prepare(
          "SELECT COUNT(*) AS n FROM analysis_credit_reservations"
        ).first<{ n: number }>()
      )?.n
    ).toBe(0);
  });
  it("rejects assets or brands belonging to another tenant", async () => {
    const a = await seed(),
      b = await seed(),
      id = await video(b);
    expect(
      (
        await create(a.token, {
          brandId: b.brand.id,
          sourceAssetId: id,
          skills: ["editing"],
        })
      ).status
    ).toBe(404);
    expect(
      (
        await create(a.token, {
          brandId: a.brand.id,
          sourceAssetId: id,
          skills: ["editing"],
        })
      ).status
    ).toBe(404);
  });
  it("assigns legacy once without moving an already assigned analysis", async () => {
    const a = await seed(),
      id = uuidv7();
    await analysisInsert(a.accountId, id).run();
    const patch = () =>
      analyses.request(
        `https://api.test/api/v1/analyses/${id}/brand`,
        {
          method: "PATCH",
          headers: {
            authorization: `Bearer ${a.token}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({ brandId: a.brand.id }),
        },
        runtime
      );
    expect((await patch()).status).toBe(200);
    expect((await patch()).status).toBe(409);
  });
  it("completes an image upload through private local R2 and returns metadata pending", async () => {
    const a = await seed();
    const local = { ...runtime, CAPYRA_ENVIRONMENT: "local" } as RuntimeEnv;
    const payload = {
      brandId: a.brand.id,
      fileName: "photo.jpg",
      contentType: "image/jpeg",
      contentLength: 5,
    };
    const post = (path: string) =>
      media.request(
        `https://api.test/api/v1/source-assets${path}`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${a.token}`,
            "content-type": "application/json",
          },
          body: JSON.stringify(payload),
        },
        local
      );
    const ticketResponse = await post("/direct-uploads");
    expect(ticketResponse.status).toBe(200);
    const ticket = (await ticketResponse.json()) as {
      sourceAssetId: string;
      uploadUrl: string;
    };
    expect(
      (
        await handleLocalUpload(
          new Request(ticket.uploadUrl, {
            method: "PUT",
            headers: { "content-type": "image/jpeg", "content-length": "5" },
            body: "image",
          }),
          local
        )
      ).status
    ).toBe(201);
    const complete = await post(
      `/direct-uploads/${ticket.sourceAssetId}/complete`
    );
    expect(complete.status).toBe(201);
    expect(await complete.json()).toMatchObject({
      brandId: a.brand.id,
      mediaKind: "image",
      metadataStatus: "pending",
      metadata: null,
    });
    const stored = await env.DB.prepare(
      "SELECT object_key FROM source_assets WHERE id=?"
    )
      .bind(ticket.sourceAssetId)
      .first<{ object_key: string }>();
    expect(stored?.object_key).toContain(`${a.accountId}/${a.brand.id}/`);
  });
});
