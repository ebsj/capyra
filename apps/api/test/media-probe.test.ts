import { applyD1Migrations, env } from "cloudflare:test";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { consumeMediaProbe, reconcileMediaProbes } from "../src/media-probe";
import { nowIso, uuidv7 } from "../src/common";
import { runtime, seed } from "./foundation-helpers";
import type { RuntimeEnv } from "../src/runtime";
beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  await env.DB.prepare("DELETE FROM accounts").run();
});
async function asset() {
  const a = await seed(),
    id = uuidv7();
  await env.DB.prepare(
    "INSERT INTO source_assets(id,account_id,brand_id,source_label,content_type,content_length,object_key,upload_status,created_at) VALUES(?,?,?,'video.mp4','video/mp4',5,?,'completed',?)"
  )
    .bind(id, a.accountId, a.brand.id, `source-assets/${id}`, nowIso())
    .run();
  return id;
}
function probeRuntime(fetch: ReturnType<typeof vi.fn>) {
  return {
    ...runtime,
    ANALYSIS_CONTAINER: {
      idFromName: (name: string) => name,
      get: () => ({ fetch }),
    },
  } as unknown as RuntimeEnv;
}
const result = () =>
  new Response(
    JSON.stringify({
      width: 1080,
      height: 1920,
      durationSeconds: 30,
      codec: "h264",
      format: "mp4",
    }),
    { headers: { "content-type": "application/json" } }
  );
describe("Metadata jobs", () => {
  it("deduplicates completed metadata jobs without calling analysis", async () => {
    const id = await asset(),
      fetch = vi.fn().mockImplementation(async () => result()),
      e = probeRuntime(fetch);
    await consumeMediaProbe(e, { body: { id }, attempts: 1 });
    await consumeMediaProbe(e, { body: { id }, attempts: 2 });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toBe("http://container/jobs/probe");
    expect(
      (
        await env.DB.prepare(
          "SELECT metadata_status FROM source_assets WHERE id=?"
        )
          .bind(id)
          .first<{ metadata_status: string }>()
      )?.metadata_status
    ).toBe("ready");
  });
  it("releases a transient lease for retry and makes invalid media a terminal inspection failure", async () => {
    const id = await asset(),
      fetch = vi
        .fn()
        .mockResolvedValueOnce(new Response("", { status: 503 }))
        .mockResolvedValueOnce(new Response("", { status: 422 })),
      e = probeRuntime(fetch);
    await expect(
      consumeMediaProbe(e, { body: { id }, attempts: 1 })
    ).rejects.toMatchObject({ status: 503 });
    expect(
      (
        await env.DB.prepare(
          "SELECT probe_lease_expires_at FROM source_assets WHERE id=?"
        )
          .bind(id)
          .first<{ probe_lease_expires_at: string | null }>()
      )?.probe_lease_expires_at
    ).toBeNull();
    await consumeMediaProbe(e, { body: { id }, attempts: 2 });
    expect(
      (
        await env.DB.prepare(
          "SELECT metadata_status FROM source_assets WHERE id=?"
        )
          .bind(id)
          .first<{ metadata_status: string }>()
      )?.metadata_status
    ).toBe("failed");
  });
  it("reconciles expired leases and exhausts bounded attempts", async () => {
    const id = await asset(),
      sendBatch = vi.fn();
    await env.DB.prepare(
      "UPDATE source_assets SET probe_lease_expires_at='2000-01-01T00:00:00Z' WHERE id=?"
    )
      .bind(id)
      .run();
    await reconcileMediaProbes({
      ...runtime,
      SOCIAL_QUEUE: { sendBatch },
    } as unknown as RuntimeEnv);
    expect(sendBatch).toHaveBeenCalledWith([
      { body: { kind: "probe", id }, contentType: "json" },
    ]);
    await env.DB.prepare("UPDATE source_assets SET probe_attempts=6 WHERE id=?")
      .bind(id)
      .run();
    await reconcileMediaProbes(runtime);
    expect(
      (
        await env.DB.prepare(
          "SELECT metadata_status FROM source_assets WHERE id=?"
        )
          .bind(id)
          .first<{ metadata_status: string }>()
      )?.metadata_status
    ).toBe("failed");
  });
});
