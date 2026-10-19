import { applyD1Migrations, env } from "cloudflare:test";
import { beforeEach, expect, it } from "vitest";
import { SignJWT } from "jose";
import { artifactMetadata } from "../src/artifacts";
import routes from "../src/routes/analyses";
import { ApiError } from "../src/common";
import type { RuntimeEnv } from "../src/runtime";

const runtime = { ...env, CAPYRA_AUTH_SIGNING_KEY: "artifact-test-signing-key-32-characters", CAPYRA_AUTH_ISSUER: "test", CAPYRA_AUTH_AUDIENCE: "test" } as unknown as RuntimeEnv;
routes.onError((error, c) => c.json({ error: error.message }, error instanceof ApiError ? error.status : 500));

it.each([
  ["upload-id/frames/frame.JPG", "frame", "image/jpeg"],
  ["upload-id/audio/audio.WAV", "audio", "audio/wav"],
  ["upload-id/downloads/video.MOV", "video", "video/quicktime"],
  ["nested/video.WEBM", "video", "video/webm"],
  ["nested/report.json", "report", "application/json"],
  ["nested/artifact-manifest.json", "manifest", "application/json"],
  ["nested/evidence.json", "other", "application/json"],
  ["nested/unknown.xyz", "other", "application/octet-stream"],
])("classifies %s independently of workspace", (path, category, mimeType) => {
  expect(artifactMetadata(path)).toEqual({ category, mimeType });
});

beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  await env.DB.prepare("DELETE FROM video_analyses").run();
  await env.DB.prepare("DELETE FROM accounts").run();
  await env.DB.prepare("INSERT INTO accounts (id,display_name,account_type,created_at,updated_at) VALUES ('owner','Owner','creator','now','now')").run();
  await env.DB.prepare("INSERT INTO accounts (id,display_name,account_type,created_at,updated_at) VALUES ('another-account','Other','creator','now','now')").run();
  await env.DB.prepare("INSERT INTO account_users(id,account_id,name,email,normalized_email,role,created_at,updated_at) VALUES ('owner-user','owner','Owner','owner@example.com','OWNER@EXAMPLE.COM','owner','now','now'),('another-account-user','another-account','Other','other@example.com','OTHER@EXAMPLE.COM','owner','now','now')").run();
  await env.DB.prepare(`INSERT INTO video_analyses
    (id,account_id,status,source_type,source_label,language,catalog_version,selected_skill_ids_json,artifact_prefix,artifact_files_json,created_at,updated_at)
    VALUES ('analysis','owner','completed','owned_asset','video','pt-BR','v1','[]','analyses/analysis/artifacts',?,'now','now')`)
    .bind(JSON.stringify(["nested/frame.JPG", "nested/audio.wav", "nested/video.mov"])).run();
});

async function request(path: string, account?: string) {
  const headers = new Headers();
  if (account) {
    const token = await new SignJWT({account_id: account, email: "test@example.com", role: "owner"})
      .setProtectedHeader({alg:"HS256"}).setSubject(`${account}-user`).setIssuer("test").setAudience("test").setExpirationTime("1h")
      .sign(new TextEncoder().encode(runtime.CAPYRA_AUTH_SIGNING_KEY));
    headers.set("authorization", `Bearer ${token}`);
  }
  return routes.request(`/analyses/analysis/artifacts/${path}`, {headers}, runtime);
}

it.each([["frame.JPG", "image/jpeg"], ["audio.wav", "audio/wav"], ["video.mov", "video/quicktime"]])("streams %s with corrected MIME and account isolation", async (name, mime) => {
  await env.STORAGE.put(`analyses/analysis/artifacts/nested/${name}`, "binary-fixture", {httpMetadata:{contentType:"application/octet-stream"}});
  const response = await request(`nested/${name}`, "owner");
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe(mime);
  expect(await response.text()).toBe("binary-fixture");
  expect((await request(`nested/${name}`, "another-account")).status).toBe(404);
  expect((await request(`nested/${name}`)).status).toBe(401);
});
