import test, { after, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks, stripTypeScriptTypes } from "node:module";
import { NextRequest } from "next/server.js";

const webRoot = new URL("../../apps/web/", import.meta.url);
const originalOrigin = process.env.CAPYRA_SOURCE_ASSET_UPLOAD_ORIGIN;
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "next/server") return nextResolve("next/server.js", context);
    if (specifier.startsWith("@/")) {
      return { url: new URL(`${specifier.slice(2)}.ts`, webRoot).href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith(webRoot.href) && url.endsWith(".ts")) {
      return { format: "module", source: stripTypeScriptTypes(readFileSync(new URL(url), "utf8")), shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});
after(() => hooks.deregister());
afterEach(() => {
  if (originalOrigin === undefined) delete process.env.CAPYRA_SOURCE_ASSET_UPLOAD_ORIGIN;
  else process.env.CAPYRA_SOURCE_ASSET_UPLOAD_ORIGIN = originalOrigin;
});
const { middleware } = await import(new URL("middleware.ts", webRoot));

function connectSources(url) {
  const response = middleware(new NextRequest(url));
  const policy = response.headers.get("content-security-policy");
  return policy.split("; ").find((directive) => directive.startsWith("connect-src ")).split(" ").slice(1);
}

test("the default local page permits the signed upload relay without an env file", () => {
  delete process.env.CAPYRA_SOURCE_ASSET_UPLOAD_ORIGIN;
  const sources = connectSources("http://localhost:3000/pt-br/analyses/new");
  assert.ok(sources.includes("http://localhost:5080"));
  assert.ok(!sources.includes("http://localhost:10000"));
});

test("production pages never allow the local upload relay", () => {
  process.env.CAPYRA_SOURCE_ASSET_UPLOAD_ORIGIN = "http://localhost:5080";
  const sources = connectSources("https://web.capyra.co/pt-br/analyses/new");
  assert.ok(!sources.some((source) => source.includes("localhost")));
  assert.ok(sources.includes("https://*.r2.cloudflarestorage.com"));
});

test("a custom local upload origin stays restricted to HTTP loopback", () => {
  process.env.CAPYRA_SOURCE_ASSET_UPLOAD_ORIGIN = "http://127.0.0.1:6080/upload";
  assert.ok(connectSources("http://localhost:3000/pt-br/login").includes("http://127.0.0.1:6080"));
  for (const origin of ["https://untrusted.example", "ftp://localhost:5080", "invalid"]) {
    process.env.CAPYRA_SOURCE_ASSET_UPLOAD_ORIGIN = origin;
    const sources = connectSources("http://localhost:3000/pt-br/login");
    assert.ok(!sources.includes(origin));
    assert.ok(!sources.includes("*"));
  }
});

test("invitation login preserves the one-use token and locale in the return destination", () => {
  const response = middleware(new NextRequest("http://localhost:3000/es/invitations/accept?token=opaque-local-token"));
  const redirect = new URL(response.headers.get("location"));
  assert.equal(redirect.pathname, "/es/login");
  assert.equal(redirect.searchParams.get("next"), "/es/invitations/accept?token=opaque-local-token");
  assert.equal(redirect.searchParams.get("reason"), "auth-required");
});
