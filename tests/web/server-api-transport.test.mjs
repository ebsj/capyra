import test, { after, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks, stripTypeScriptTypes } from "node:module";

const originalBaseUrl = process.env.CAPYRA_API_BASE_URL;
afterEach(() => {
  if (originalBaseUrl === undefined) delete process.env.CAPYRA_API_BASE_URL;
  else process.env.CAPYRA_API_BASE_URL = originalBaseUrl;
});

const webRoot = new URL("../../apps/web/", import.meta.url);
const bindingsUrl = "data:text/javascript,export const env = {}";
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "cloudflare:workers") return { url: bindingsUrl, shortCircuit: true };
    if (specifier === "server-only") return { url: "data:text/javascript,", shortCircuit: true };
    if (specifier.startsWith("@/lib/")) {
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

const { env } = await import(bindingsUrl);
const { createServerApiRequest, fetchServerApi } = await import(new URL("lib/http.server.ts", webRoot));
const { ApiError, createBrowserApiRequest } = await import(new URL("lib/http.ts", webRoot));

test("a locally issued session uses the API binding even when the configured URL is production", async (t) => {
  process.env.CAPYRA_API_BASE_URL = "https://api.capyra.co/api/v1";
  t.mock.method(globalThis, "fetch", async () => assert.fail("Local tokens must not reach the public API"));
  const requests = [];
  env.API = {
    async fetch(request) {
      requests.push(request);
      assert.equal(request.headers.get("authorization"), "Bearer local-test-token");
      return Response.json({ items: [], total: 0 });
    },
  };
  const history = await createServerApiRequest("local-test-token")("/analyses");
  assert.deepEqual(history, { items: [], total: 0 });
  await fetchServerApi("https://api.capyra.co/api/v1/auth/firebase", {
    method: "POST", headers: { Authorization: "Bearer local-test-token" }, body: "{}",
  });
  assert.deepEqual(requests.map((request) => [new URL(request.url).pathname, request.method]), [
    ["/api/v1/analyses", "GET"], ["/api/v1/auth/firebase", "POST"],
  ]);
});

test("invalid sessions still propagate authentication failures from the binding", async () => {
  env.API = { fetch: async () => Response.json({ code: "invalid_token", message: "Invalid session" }, { status: 401 }) };
  await assert.rejects(createServerApiRequest("invalid-token")("/analyses"), (error) =>
    error instanceof ApiError && error.status === 401 && error.code === "invalid_token");
});

test("without a binding the server uses the explicitly configured HTTP endpoint", async (t) => {
  delete env.API;
  process.env.CAPYRA_API_BASE_URL = "http://localhost:5080/api/v1";
  t.mock.method(globalThis, "fetch", async (url, init) => {
    assert.equal(url, "http://localhost:5080/api/v1/analyses");
    assert.equal(init.headers.Authorization, "Bearer local-test-token");
    return Response.json({ items: [] });
  });
  assert.deepEqual(await createServerApiRequest("local-test-token")("/analyses"), { items: [] });
});

test("browser calls remain on the same-origin proxy", async (t) => {
  env.API = { fetch: async () => assert.fail("Browser code must not access Worker bindings") };
  t.mock.method(globalThis, "fetch", async (url) => {
    assert.equal(url, "/api/v1/analyses");
    return Response.json({ items: [] });
  });
  assert.deepEqual(await createBrowserApiRequest("local-test-token")("/analyses"), { items: [] });
});
