import assert from "node:assert/strict";
import test from "node:test";
import worker from "./server.js";

const brandId = "00000000-0000-4000-8000-000000000001";
const session = {
  tokenType: "Bearer", expiresAt: "2099-01-01T00:00:00Z", clientId: "capyra-mcp",
  scopes: ["analyses:read", "analyses:create", "source-assets:read", "source-assets:write"],
  account: {id: "account", displayName: "Account"}, user: {id: "user",email: "owner@example.test"},
  brands: [{id: brandId, name: "Explicit Brand",status: "active"}],
};
function environment(calls: string[]) {
  return {API: {fetch: async (input: RequestInfo | URL) => {
    const url = String(input); calls.push(url);
    if (url.endsWith("/oauth/session")) return Response.json(session);
    throw new Error(`Unexpected API call: ${url}`);
  }} as unknown as Fetcher};
}
function request(method: string, params: unknown = {}) {
  return new Request("http://localhost:5090/mcp", {method:"POST",headers:{host:"localhost:5090",authorization:"Bearer fixture", "content-type":"application/json",accept:"application/json, text/event-stream","mcp-protocol-version":"2025-03-26"},body:JSON.stringify({jsonrpc:"2.0",id:1,method,params})});
}

test("advertised MCP create/upload tools require Brand and preserve tool inventory", async () => {
  const response = await worker.fetch(request("tools/list"), environment([]));
  const body = await response.json() as {result:{tools:{name:string,inputSchema:{required?:string[]}}[]}};
  assert.equal(response.status, 200);
  for (const name of ["create_analysis_from_url", "create_analysis_from_source_asset", "start_source_asset_upload_session"]) {
    const tool = body.result.tools.find((candidate) => candidate.name === name);
    assert.ok(tool?.inputSchema.required?.includes("brandId"), name);
  }
  assert.ok(body.result.tools.every((tool) => !tool.name.includes("publish")));
});

test("MCP rejects missing Brand without creating analysis or upload", async () => {
  const calls: string[] = [];
  const response = await worker.fetch(request("tools/call", {name:"create_analysis_from_url",arguments:{url:"https://example.test/video",language:"pt-BR"}}), environment(calls));
  const body = await response.json() as {result?:{isError?:boolean},error?:unknown};
  assert.equal(response.status, 200);
  assert.ok(body.error || body.result?.isError);
  assert.deepEqual(calls, ["http://127.0.0.1:5080/api/v1/oauth/session"]);
});

test("auth_status discovers Brand UUIDs through the canonical API", async () => {
  const response = await worker.fetch(request("tools/call", {name:"auth_status",arguments:{}}), environment([]));
  const body = await response.json() as {result:{content:{text:string}[]}};
  const result = JSON.parse(body.result.content[0]!.text);
  assert.equal(result.session.brands[0].id, brandId);
});
