import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { CapyraApiError, CapyraClient, isTokenExpired, normalizeOAuthTokenResponse, toTokenStoreRecord } from "./index.js";

test("toTokenStoreRecord normalizes an OAuth token response", () => {
  const record = toTokenStoreRecord("capyra-cli", {
    accessToken: "token",
    tokenType: "Bearer",
    expiresIn: 60,
    refreshToken: "refresh",
    scope: "analyses:read analyses:create",
    user: {
      id: "user-1",
      name: "Owner",
      email: "owner@capyra.dev",
      role: "owner",
      createdAt: new Date().toISOString(),
    },
    account: {
      id: "account-1",
      displayName: "Capyra",
      accountType: "creator",
      createdAt: new Date().toISOString(),
      memberCount: 1,
    },
  });

  assert.equal(record.clientId, "capyra-cli");
  assert.equal(record.refreshToken, "refresh");
});

test("isTokenExpired respects future expirations", () => {
  assert.equal(isTokenExpired({ expiresAt: new Date(Date.now() + 120_000).toISOString() }), false);
  assert.equal(isTokenExpired({ expiresAt: new Date(Date.now() - 1_000).toISOString() }), true);
});

test("normalizeOAuthTokenResponse accepts OAuth-standard token fields", () => {
  const token = normalizeOAuthTokenResponse({
    access_token: "token",
    token_type: "Bearer",
    expires_in: 60,
    refresh_token: "refresh",
    scope: "analyses:read",
    user: {
      id: "user-1",
      name: "Owner",
      email: "owner@capyra.dev",
      role: "owner",
      createdAt: new Date().toISOString(),
    },
    account: {
      id: "account-1",
      displayName: "Capyra",
      accountType: "creator",
      createdAt: new Date().toISOString(),
      memberCount: 1,
    },
  });

  assert.equal(token.accessToken, "token");
  assert.equal(token.tokenType, "Bearer");
  assert.equal(token.expiresIn, 60);
  assert.equal(token.refreshToken, "refresh");
});

test("CapyraApiError stores structured data", () => {
  const error = new CapyraApiError({
    status: 403,
    code: "insufficient_scope",
    message: "forbidden",
    fieldErrors: [{ field: "scope", message: "missing" }],
  });

  assert.equal(error.status, 403);
  assert.equal(error.fieldErrors[0]?.field, "scope");
});

test("createAnalysisFromFile uploads the source asset directly before creating the analysis", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "capyra-integration-core-"));
  const filePath = path.join(tempDir, "upload.mp4");
  await writeFile(filePath, Buffer.from([1, 2, 3]));

  const uploadUrl = "https://storage.test/source-assets/account/asset/upload.mp4?sig=fake";
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const jsonResponse = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { "content-type": "application/json" },
    });
  const fetchImpl: typeof fetch = async (input, init) => {
    const url = input.toString();
    calls.push({ url, init });

    if (url === "https://api.test/api/v1/source-assets/direct-uploads") {
      return jsonResponse({
        sourceAssetId: "asset-1",
        uploadUrl,
        method: "PUT",
        headers: {
          "x-ms-blob-type": "BlockBlob",
          "Content-Type": "video/mp4",
        },
        maxFileSizeBytes: 209715200,
        expiresAt: "2026-06-03T12:00:00Z",
      });
    }

    if (url === uploadUrl) {
      return new Response(null, { status: 201 });
    }

    if (url === "https://api.test/api/v1/source-assets/direct-uploads/asset-1/complete") {
      return jsonResponse({
        id: "asset-1",
        sourceLabel: "upload.mp4",
        contentType: "video/mp4",
        contentLength: 3,
        analysisCount: 0,
        createdAt: "2026-06-03T12:00:00Z",
        lastAnalyzedAt: null,
      }, 201);
    }

    if (url === "https://api.test/api/v1/analyses") {
      return jsonResponse({
        id: "analysis-1",
        status: "pending",
      }, 201);
    }

    return jsonResponse({ code: "not_found", message: url }, 404);
  };
  const client = new CapyraClient({
    baseUrl: "https://api.test/api/v1",
    accessToken: "token",
    fetchImpl,
  });

  try {
    const analysis = await client.createAnalysisFromFile(filePath, ["editing"], "00000000-0000-4000-8000-000000000001", "pt-BR");

    assert.equal(analysis.id, "analysis-1");
    assert.equal(calls.length, 4);
    assert.equal(calls[0]?.url, "https://api.test/api/v1/source-assets/direct-uploads");
    assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), {
      brandId: "00000000-0000-4000-8000-000000000001",
      fileName: "upload.mp4",
      contentType: "video/mp4",
      contentLength: 3,
    });
    assert.equal(calls[1]?.url, uploadUrl);
    assert.equal(calls[1]?.init?.method, "PUT");
    assert.deepEqual(calls[1]?.init?.headers, {
      "x-ms-blob-type": "BlockBlob",
      "Content-Type": "video/mp4",
    });
    assert.equal(calls[1]?.init?.body instanceof Blob, true);
    assert.equal(calls[2]?.url, "https://api.test/api/v1/source-assets/direct-uploads/asset-1/complete");
    assert.deepEqual(JSON.parse(String(calls[2]?.init?.body)), {
      brandId: "00000000-0000-4000-8000-000000000001",
      fileName: "upload.mp4",
      contentType: "video/mp4",
      contentLength: 3,
    });
    assert.equal(calls[3]?.url, "https://api.test/api/v1/analyses");
    assert.deepEqual(JSON.parse(String(calls[3]?.init?.body)), {
      brandId: "00000000-0000-4000-8000-000000000001",
      sourceAssetId: "asset-1",
      skills: ["editing"],
      language: "pt-BR",
    });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("listLatestAnalyses sends default path and preserves listAnalyses raw path", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const jsonResponse = (payload: unknown) =>
    new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  const fetchImpl: typeof fetch = async (input, init) => {
    const url = input.toString();
    calls.push({ url, init });

    if (url === "https://api.test/api/v1/analyses/latest") {
      return jsonResponse({
        total: 1,
        returned: 1,
        limit: 10,
        sort: "createdAt_desc",
        hasMore: false,
        nextCursor: null,
        defaultView: "latest_analyses_table",
        message: "Foram encontradas 1 analises.",
        summary: "Foram encontradas 1 analises.",
        tableColumns: ["createdAt", "fileName", "status", "skills", "overallScore", "mainOpportunity"],
        recommendedResponse: {
          format: "table",
          columns: ["createdAt", "fileName", "status", "skills", "overallScore", "mainOpportunity"],
          instructions: "Non-empty items means analyses were found.",
        },
        presentation: null,
        pagination: {
          totalItems: 1,
          limit: 10,
          returned: 1,
          hasMore: false,
          nextCursor: null,
        },
        items: [],
      });
    }

    if (url === "https://api.test/api/v1/analyses") {
      return jsonResponse({ items: [] });
    }

    return jsonResponse({ code: "not_found", message: url });
  };
  const client = new CapyraClient({
    baseUrl: "https://api.test/api/v1",
    accessToken: "token",
    fetchImpl,
  });

  const latest = await client.listLatestAnalyses();
  const raw = await client.listAnalyses();

  assert.equal(latest.sort, "createdAt_desc");
  assert.equal(raw.items.length, 0);
  assert.equal(calls[0]?.url, "https://api.test/api/v1/analyses/latest");
  assert.equal(calls[1]?.url, "https://api.test/api/v1/analyses");
});

test("listLatestAnalyses passes cursor and bounded option parameters", async () => {
  const calls: string[] = [];
  const fetchImpl: typeof fetch = async (input) => {
    calls.push(input.toString());
    return new Response(JSON.stringify({
      total: 0,
      returned: 0,
      limit: 5,
      sort: "createdAt_desc",
      hasMore: false,
      nextCursor: null,
      defaultView: "latest_analyses_table",
      message: "Nenhuma analise foi encontrada.",
      summary: "",
      tableColumns: [],
      recommendedResponse: {
        format: "table",
        columns: [],
        instructions: "Non-empty items means analyses were found.",
      },
      presentation: null,
      pagination: {
        totalItems: 0,
        limit: 5,
        returned: 0,
        hasMore: false,
        nextCursor: null,
      },
      items: [],
    }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  const client = new CapyraClient({
    baseUrl: "https://api.test/api/v1",
    accessToken: "token",
    fetchImpl,
  });

  await client.listLatestAnalyses({
    limit: 5,
    cursor: "cursor-token",
    includeSummary: false,
    includeSkillDetails: true,
    includePresentation: false,
  });

  const url = new URL(calls[0] ?? "");
  assert.equal(url.pathname, "/api/v1/analyses/latest");
  assert.equal(url.searchParams.get("limit"), "5");
  assert.equal(url.searchParams.get("cursor"), "cursor-token");
  assert.equal(url.searchParams.get("includeSummary"), "false");
  assert.equal(url.searchParams.get("includeSkillDetails"), "true");
  assert.equal(url.searchParams.get("includePresentation"), "false");
});


test("Brand is mandatory and invalid legacy language arguments never issue requests", () => {
  let called = false;
  const client = new CapyraClient({baseUrl:"https://api.test/api/v1", fetchImpl: async () => {called=true; return Response.json({});}});
  assert.throws(() => client.createAnalysisFromUrl("https://example.test/video", ["editing"], "pt-BR"), (error: unknown) => error instanceof CapyraApiError && error.code === "brand_required");
  assert.throws(() => client.createSourceAssetUploadSession(""), /Choose a Brand/);
  assert.equal(called, false);
});

test("URL analysis and browser upload session preserve the explicitly selected Brand", async () => {
  const bodies: unknown[] = [];
  const brandId = "00000000-0000-4000-8000-000000000001";
  const client = new CapyraClient({baseUrl:"https://api.test/api/v1", fetchImpl: async (_input, init) => {bodies.push(JSON.parse(String(init?.body))); return Response.json({id:"test"});}});
  await client.createAnalysisFromUrl("https://example.test/video", ["editing"], brandId, "es");
  await client.createSourceAssetUploadSession(brandId, "capyra-mcp");
  assert.deepEqual(bodies, [{url:"https://example.test/video",skills:["editing"],brandId,language:"es"},{brandId,clientId:"capyra-mcp"}]);
});
