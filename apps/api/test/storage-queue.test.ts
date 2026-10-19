import { applyD1Migrations, env } from "cloudflare:test";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleContainerR2Request } from "../src/container-r2";
import { markDlqFailure, purgeExpired, reconcile } from "../src/processor";
import { handleLocalUpload, uploadRequest } from "../src/r2";
import type { RuntimeEnv } from "../src/runtime";

beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  await env.DB.prepare("DELETE FROM video_analyses").run();
  await env.DB.prepare("DELETE FROM accounts").run();
  const now = new Date().toISOString();
  await env.DB.prepare("INSERT INTO accounts (id, display_name, account_type, created_at, updated_at) VALUES ('account', 'Account', 'creator', ?, ?)")
    .bind(now, now).run();
});

function message(analysisId: string): Message<{ analysisId: string }> {
  return { body: { analysisId } } as Message<{ analysisId: string }>;
}

describe("R2 and Queue behavior", () => {
  it("bridges streamed Container HTTP requests to the bound R2 bucket", async () => {
    const runtime = env as unknown as RuntimeEnv;
    const put = await handleContainerR2Request(new Request("http://capyra-r2.internal/analyses/id/report.json", {
      method: "PUT",
      headers: { "content-length": "6", "content-type": "application/json", "x-capyra-analysis-id": "id" },
      body: "report",
    }), runtime);
    expect(put.status).toBe(201);

    const head = await handleContainerR2Request(new Request("http://capyra-r2.internal/analyses/id/report.json", { method: "HEAD" }), runtime);
    expect(head.status).toBe(200);
    expect(head.headers.get("content-length")).toBe("6");

    const get = await handleContainerR2Request(new Request("http://capyra-r2.internal/analyses/id/report.json"), runtime);
    expect(await get.text()).toBe("report");
    expect((await env.STORAGE.head("analyses/id/report.json"))?.customMetadata).toEqual({ analysisId: "id" });
  });

  it("rejects unsafe Container object paths and unsupported methods", async () => {
    const runtime = env as unknown as RuntimeEnv;
    expect((await handleContainerR2Request(new Request("http://capyra-r2.internal/analyses%2Fsecret"), runtime)).status).toBe(400);
    const response = await handleContainerR2Request(new Request("http://capyra-r2.internal/object", { method: "DELETE" }), runtime);
    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("GET, HEAD, PUT");
  });

  it("uses a signed local relay for direct uploads", async () => {
    const runtime = {
      ...(env as unknown as RuntimeEnv),
      CAPYRA_ENVIRONMENT: "local",
      CAPYRA_AUTH_SIGNING_KEY: "local-test-signing-key-with-sufficient-entropy",
    } as RuntimeEnv;
    const ticket = await uploadRequest(runtime, "http://localhost:5080", "staging/id/video.mp4", "video/mp4", 5);
    expect(ticket.url).toContain("/__dev/r2-upload?token=");

    const upload = await handleLocalUpload(new Request(ticket.url, {
      method: "PUT",
      headers: { "content-length": "5", "content-type": "video/mp4" },
      body: "video",
    }), runtime);
    expect(upload.status).toBe(201);
    expect(await (await env.STORAGE.get("staging/id/video.mp4"))!.text()).toBe("video");
  });

  it("rejects tampered local upload tickets", async () => {
    const runtime = {
      ...(env as unknown as RuntimeEnv),
      CAPYRA_ENVIRONMENT: "local",
      CAPYRA_AUTH_SIGNING_KEY: "local-test-signing-key-with-sufficient-entropy",
    } as RuntimeEnv;
    const ticket = await uploadRequest(runtime, "http://localhost:5080", "staging/id/tampered.mp4", "video/mp4", 5);
    const url = new URL(ticket.url);
    const token = url.searchParams.get("token")!;
    url.searchParams.set("token", `${token.slice(0, -1)}${token.endsWith("A") ? "B" : "A"}`);

    const response = await handleLocalUpload(new Request(url, {
      method: "PUT",
      headers: { "content-length": "5", "content-type": "video/mp4" },
      body: "video",
    }), runtime);

    expect(response.status).toBe(403);
    expect(await env.STORAGE.head("staging/id/tampered.mp4")).toBeNull();
  });

  it("streams private R2 objects with metadata", async () => {
    const bytes = new Uint8Array([0, 1, 2, 3, 4]);
    await env.STORAGE.put("analyses/a/artifacts/frame.jpg", bytes, {
      httpMetadata: { contentType: "image/jpeg" },
      customMetadata: { analysisId: "a" },
    });
    const object = await env.STORAGE.get("analyses/a/artifacts/frame.jpg");
    expect(object?.httpMetadata?.contentType).toBe("image/jpeg");
    expect(new Uint8Array(await object!.arrayBuffer())).toEqual(bytes);
  });

  it("marks an exhausted DLQ job once without changing completed work", async () => {
    const now = new Date().toISOString();
    await env.DB.prepare(`INSERT INTO video_analyses
      (id, account_id, status, source_type, source_label, language, catalog_version, selected_skill_ids_json, created_at, updated_at)
      VALUES ('pending', 'account', 'pending', 'public_url_best_effort', 'video', 'pt-BR', 'v1', '["editing"]', ?, ?),
             ('completed', 'account', 'completed', 'public_url_best_effort', 'video', 'pt-BR', 'v1', '["editing"]', ?, ?)`)
      .bind(now, now, now, now).run();
    const runtime = env as unknown as RuntimeEnv;
    await markDlqFailure(runtime, message("pending"));
    await markDlqFailure(runtime, message("completed"));
    expect((await env.DB.prepare("SELECT status FROM video_analyses WHERE id = 'pending'").first<{ status: string }>())?.status).toBe("failed");
    expect((await env.DB.prepare("SELECT status FROM video_analyses WHERE id = 'completed'").first<{ status: string }>())?.status).toBe("completed");
  });

  it("requeues lease-free pending work and fails exhausted work", async () => {
    const now = new Date().toISOString();
    await env.DB.prepare(`INSERT INTO video_analyses
      (id, account_id, status, source_type, source_label, language, catalog_version, selected_skill_ids_json, attempts, created_at, updated_at)
      VALUES ('retry', 'account', 'pending', 'public_url_best_effort', 'video', 'pt-BR', 'v1', '["editing"]', 2, ?, ?),
             ('exhausted', 'account', 'pending', 'public_url_best_effort', 'video', 'pt-BR', 'v1', '["editing"]', 6, ?, ?)`)
      .bind(now, now, now, now).run();
    const sendBatch = vi.fn().mockResolvedValue(undefined);
    await reconcile({ ...(env as unknown as RuntimeEnv), ANALYSIS_QUEUE: { sendBatch } as unknown as Queue });
    expect(sendBatch).toHaveBeenCalledWith([{ body: { analysisId: "retry" }, contentType: "json" }]);
    expect((await env.DB.prepare("SELECT status FROM video_analyses WHERE id = 'exhausted'").first<{ status: string }>())?.status).toBe("failed");
  });

  it("purges expired staging objects", async () => {
    await env.STORAGE.put("staging/expired/video.mp4", new Uint8Array([1]));
    const original = Date.now;
    Date.now = () => original() + 2 * 86_400_000;
    try {
      await purgeExpired(env as unknown as RuntimeEnv);
    } finally {
      Date.now = original;
    }
    expect(await env.STORAGE.head("staging/expired/video.mp4")).toBeNull();
  });
});
