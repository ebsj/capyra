import process from "node:process";

import * as z from "zod/v4";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { InvalidTokenError, ServerError } from "@modelcontextprotocol/sdk/server/auth/errors.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import {
  getOAuthProtectedResourceMetadataUrl,
} from "@modelcontextprotocol/sdk/server/auth/router.js";

import type { AnalysisSkillId } from "@capyra/contracts";
import {
  CAPYRA_MCP_CLIENT_ID,
  CapyraApiError,
  CapyraClient,
  DEFAULT_OAUTH_SCOPES,
  formatApiError,
  pollAnalysis,
} from "@capyra/integration-core";

import {
  ANALYSIS_LANGUAGE_DESCRIPTION,
  MCP_LANGUAGE_CODES,
  localizeBrowserUrl,
  resolveMcpLanguage,
} from "./language.js";
import {
  trackMcpGoogleAnalyticsEvent,
  type McpAnalyticsContext,
  type McpAnalyticsEventParams,
} from "./google-analytics.js";

const TEMPORARILY_UNAVAILABLE_SKILLS = ["compliance"] as const;
const TEMPORARY_UNAVAILABLE_SKILL_MESSAGE =
  "The compliance/copywriting legal skill is temporarily unavailable for new analyses.";
const analysisLanguageSchema = z.enum(MCP_LANGUAGE_CODES).describe(ANALYSIS_LANGUAGE_DESCRIPTION);
const latestAnalysesLimitSchema = z.number().int().min(1).max(50).default(10);
const summarizeAnalysesFormatSchema = z.enum(["table", "brief", "detailed"]).default("table");
const analysisSkillsInputSchema = z
  .array(z.string().trim().min(1).describe("Published skill id from list_analysis_skills, or all/recommended to use the current published catalog."))
  .optional();

const DEFAULT_HOST = process.env.CAPYRA_MCP_HOST ?? "127.0.0.1";
const DEFAULT_PORT = Number.parseInt(process.env.CAPYRA_MCP_PORT ?? "5090", 10);
const DEFAULT_PUBLIC_HOST = DEFAULT_HOST === "0.0.0.0" ? "127.0.0.1" : DEFAULT_HOST;
const API_BASE_URL = (process.env.CAPYRA_API_BASE_URL ?? "http://127.0.0.1:5080/api/v1").replace(/\/$/, "");
const OAUTH_API_PUBLIC_BASE_URL = (process.env.CAPYRA_OAUTH_API_PUBLIC_BASE_URL?.trim() || API_BASE_URL).replace(/\/$/, "");
const WEB_BASE_URL = (process.env.CAPYRA_WEB_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const PUBLIC_BASE_URL = (process.env.CAPYRA_MCP_PUBLIC_BASE_URL ?? `http://${DEFAULT_PUBLIC_HOST}:${DEFAULT_PORT}`).replace(/\/$/, "");
const RESOURCE_NAME = process.env.CAPYRA_MCP_RESOURCE_NAME ?? "Capyra MCP";
const DOCUMENTATION_URL = process.env.CAPYRA_MCP_DOCUMENTATION_URL ?? `${WEB_BASE_URL}/`;
const MCP_URL = new URL("mcp", ensureTrailingSlash(PUBLIC_BASE_URL));
const DISCOVERY_CORS_ORIGINS = (process.env.CAPYRA_MCP_DISCOVERY_CORS_ORIGINS ?? new URL(WEB_BASE_URL).origin)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const AUTH_ISSUER = new URL(process.env.CAPYRA_OAUTH_ISSUER_URL ?? ensureTrailingSlash(WEB_BASE_URL));
const AUTHORIZATION_ENDPOINT = new URL("oauth/authorize", ensureTrailingSlash(WEB_BASE_URL));
const DEVICE_AUTHORIZATION_ENDPOINT = new URL("oauth/device/code", ensureTrailingSlash(OAUTH_API_PUBLIC_BASE_URL));
const TOKEN_ENDPOINT = new URL("oauth/token", ensureTrailingSlash(OAUTH_API_PUBLIC_BASE_URL));
const REVOCATION_ENDPOINT = new URL("oauth/revoke", ensureTrailingSlash(OAUTH_API_PUBLIC_BASE_URL));
const OAUTH_METADATA = {
  issuer: AUTH_ISSUER.href,
  authorization_endpoint: AUTHORIZATION_ENDPOINT.href,
  device_authorization_endpoint: DEVICE_AUTHORIZATION_ENDPOINT.href,
  token_endpoint: TOKEN_ENDPOINT.href,
  revocation_endpoint: REVOCATION_ENDPOINT.href,
  response_types_supported: ["code"],
  grant_types_supported: ["authorization_code", "refresh_token", "urn:ietf:params:oauth:grant-type:device_code"],
  token_endpoint_auth_methods_supported: ["none"],
  code_challenge_methods_supported: ["S256"],
  scopes_supported: [...DEFAULT_OAUTH_SCOPES],
  service_documentation: new URL(DOCUMENTATION_URL).href,
};
const DYNAMIC_RESPONSE_CACHE_CONTROL = "no-store, no-cache, max-age=0, must-revalidate, private";

interface McpEnv {
  API: Fetcher;
}

function ensureTrailingSlash(value: string) {
  return value.endsWith("/") ? value : `${value}/`;
}

function createApiClient(accessToken?: string | null, env?: McpEnv) {
  return new CapyraClient({
    baseUrl: API_BASE_URL,
    accessToken,
    fetchImpl: env ? ((input, init) => env.API.fetch(input, init)) as typeof fetch : fetch,
  });
}

async function verifyAccessToken(token: string, env: McpEnv) {
  try {
    const session = await createApiClient(token, env).getOAuthSession();
    const expiresAt = Math.floor(new Date(session.expiresAt).getTime() / 1_000);

    return {
      token,
      clientId: session.clientId ?? CAPYRA_MCP_CLIENT_ID,
      scopes: session.scopes,
      expiresAt,
      resource: MCP_URL,
      extra: {
        accountId: session.account.id,
        accountDisplayName: session.account.displayName,
        userId: session.user.id,
        userEmail: session.user.email,
      },
    };
  } catch (error) {
    if (error instanceof CapyraApiError && (error.status === 401 || error.status === 403)) {
      throw new InvalidTokenError(error.message);
    }

    throw new ServerError(formatApiError(error));
  }
}

function jsonToolResult(value: Record<string, unknown>) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(value, null, 2),
      },
    ],
    structuredContent: value,
  };
}

function getMcpAnalyticsContext(auth?: AuthInfo): McpAnalyticsContext | null {
  const accountId = auth?.extra?.accountId;
  const userId = auth?.extra?.userId;
  const clientId = auth?.clientId;

  if (typeof accountId !== "string" || typeof userId !== "string") {
    return null;
  }

  return {
    accountId,
    clientId: typeof clientId === "string" && clientId.trim() ? clientId.trim() : CAPYRA_MCP_CLIENT_ID,
    userId,
  };
}

function getMcpAnalyticsErrorType(error: unknown) {
  if (error instanceof CapyraApiError) {
    return `api_${error.status}`;
  }

  if (error instanceof Error && error.name.trim()) {
    return error.name;
  }

  return "unknown";
}

async function runTrackedMcpTool<T>(
  analyticsContext: McpAnalyticsContext | null,
  toolName: string,
  params: McpAnalyticsEventParams,
  handler: () => Promise<T>,
) {
  try {
    const result = await handler();
    void trackMcpGoogleAnalyticsEvent(analyticsContext, "mcp_tool_call", {
      status: "success",
      tool_name: toolName,
      ...params,
    });
    return result;
  } catch (error) {
    void trackMcpGoogleAnalyticsEvent(analyticsContext, "mcp_tool_error", {
      error_type: getMcpAnalyticsErrorType(error),
      status: "error",
      tool_name: toolName,
      ...params,
    });
    throw error;
  }
}

function logMcpRequest(req: Request, statusCode: number, error?: unknown) {
  const payload = {
    method: req.method,
    path: new URL(req.url).pathname,
    statusCode,
    error: error instanceof Error ? error.message : error ? "Unknown MCP request error" : undefined,
  };

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ event: "mcp_request", ...payload }));
}

function buildTemporaryUnavailableSkillResult(unavailableSkills: readonly string[]) {
  return jsonToolResult({
    error: "skill_temporarily_unavailable",
    message: TEMPORARY_UNAVAILABLE_SKILL_MESSAGE,
    unavailableSkills,
    analysisCreated: false,
  });
}

async function resolveSkillSelection(client: CapyraClient, requested?: readonly string[]) {
  const requestedTokens = requested
    ?.map((skill) => skill.trim().toLowerCase())
    .filter(Boolean) ?? [];
  const unavailableSkills = requestedTokens.filter((skill) =>
    TEMPORARILY_UNAVAILABLE_SKILLS.includes(skill as (typeof TEMPORARILY_UNAVAILABLE_SKILLS)[number])
  );

  if (unavailableSkills.length > 0) {
    return {
      ok: false as const,
      result: buildTemporaryUnavailableSkillResult([...new Set(unavailableSkills)]),
    };
  }

  const catalog = await client.getAnalysisSkills();
  const publishedSkillIds = catalog.items
    .filter((item) => item.status === "published")
    .map((item) => item.id);

  if (requestedTokens.length === 0 || requestedTokens.some((skill) => skill === "all" || skill === "recommended")) {
    return {
      ok: true as const,
      skills: publishedSkillIds,
    };
  }

  return {
    ok: true as const,
    skills: [...new Set(requestedTokens)] as AnalysisSkillId[],
  };
}

function createServerForToken(accessToken: string, analyticsContext: McpAnalyticsContext | null, env: McpEnv) {
  const client = createApiClient(accessToken, env);
  const server = new McpServer(
    {
      name: "capyra-mcp",
      version: "0.1.0",
      websiteUrl: WEB_BASE_URL,
    },
    {
      capabilities: {
        logging: {},
      },
    },
  );

  server.registerTool(
    "auth_status",
    {
      description: "Describe the authenticated Capyra OAuth session bound to this MCP request.",
      outputSchema: z.object({}).passthrough(),
      annotations: {
        readOnlyHint: true,
      },
    },
    async () => runTrackedMcpTool(analyticsContext, "auth_status", {}, async () => {
      const session = await client.getOAuthSession();
      return jsonToolResult({
        session,
        resourceServer: MCP_URL.href,
      });
    }),
  );

  server.registerTool(
    "list_analysis_skills",
    {
      description: "List currently published/selectable Capyra analysis skills.",
      outputSchema: z.object({}).passthrough(),
      annotations: {
        readOnlyHint: true,
      },
    },
    async () => runTrackedMcpTool(analyticsContext, "list_analysis_skills", {}, async () => {
      const catalog = await client.getAnalysisSkills();
      return jsonToolResult(catalog as unknown as Record<string, unknown>);
    }),
  );

  server.registerTool(
    "list_source_assets",
    {
      description: "List reusable Capyra source assets in the authenticated account.",
      outputSchema: z.object({}).passthrough(),
      annotations: {
        readOnlyHint: true,
      },
    },
    async () => runTrackedMcpTool(analyticsContext, "list_source_assets", {}, async () => {
      const assets = await client.listSourceAssets();
      return jsonToolResult(assets as unknown as Record<string, unknown>);
    }),
  );

  server.registerTool(
    "start_source_asset_upload_session",
    {
      description: "Start a Capyra-hosted browser upload session and return a browser URL that resolves to a sourceAssetId.",
      inputSchema: {
        clientId: z.string().optional(),
        brandId: z.string().uuid().describe("Brand UUID from auth_status"),
        language: analysisLanguageSchema,
      },
      outputSchema: z.object({}).passthrough(),
    },
    async ({ clientId, brandId, language }, extra) => runTrackedMcpTool(
      analyticsContext,
      "start_source_asset_upload_session",
      {},
      async () => {
        const requestedLanguage = resolveMcpLanguage(language, extra._meta);
        const session = await client.createSourceAssetUploadSession(brandId, clientId ?? CAPYRA_MCP_CLIENT_ID);
        return jsonToolResult({
          ...(session as unknown as Record<string, unknown>),
          browserUrl: localizeBrowserUrl(session.browserUrl, requestedLanguage),
        });
      },
    ),
  );

  server.registerTool(
    "get_source_asset_upload_session",
    {
      description: "Read the current status of a browser-mediated Capyra source asset upload session.",
      inputSchema: {
        sessionId: z.string().uuid(),
      },
      outputSchema: z.object({}).passthrough(),
      annotations: {
        readOnlyHint: true,
      },
    },
    async ({ sessionId }) => runTrackedMcpTool(analyticsContext, "get_source_asset_upload_session", {}, async () => {
      const session = await client.getSourceAssetUploadSession(sessionId);
      return jsonToolResult(session as unknown as Record<string, unknown>);
    }),
  );

  server.registerTool(
    "create_analysis_from_url",
    {
      description: "Create a Capyra analysis from a public video URL using currently published skills only.",
      inputSchema: {
        url: z.string().url(),
        brandId: z.string().uuid().describe("Brand UUID from auth_status"),
        language: analysisLanguageSchema,
        skills: analysisSkillsInputSchema,
      },
      outputSchema: z.object({}).passthrough(),
    },
    async ({ url, brandId, language, skills }, extra) => runTrackedMcpTool(
      analyticsContext,
      "create_analysis_from_url",
      {
        source_type: "url",
      },
      async () => {
        const requestedLanguage = resolveMcpLanguage(language, extra._meta);
        const skillSelection = await resolveSkillSelection(client, skills);
        if (!skillSelection.ok) {
          return skillSelection.result;
        }

        const selectedSkills = skillSelection.skills;
        const analysis = await client.createAnalysisFromUrl(url, selectedSkills, brandId, requestedLanguage);
        void trackMcpGoogleAnalyticsEvent(analyticsContext, "mcp_analysis_created", {
          analysis_language: requestedLanguage,
          skills_count: selectedSkills.length,
          source_type: "url",
          status: "success",
          tool_name: "create_analysis_from_url",
        });
        return jsonToolResult(analysis as unknown as Record<string, unknown>);
      },
    ),
  );

  server.registerTool(
    "create_analysis_from_source_asset",
    {
      description: "Create a Capyra analysis from an existing source asset id using currently published skills only.",
      inputSchema: {
        sourceAssetId: z.string().uuid(),
        brandId: z.string().uuid().describe("Brand UUID from auth_status"),
        language: analysisLanguageSchema,
        skills: analysisSkillsInputSchema,
      },
      outputSchema: z.object({}).passthrough(),
    },
    async ({ sourceAssetId, brandId, language, skills }, extra) => runTrackedMcpTool(
      analyticsContext,
      "create_analysis_from_source_asset",
      {
        source_type: "asset",
      },
      async () => {
        const requestedLanguage = resolveMcpLanguage(language, extra._meta);
        const skillSelection = await resolveSkillSelection(client, skills);
        if (!skillSelection.ok) {
          return skillSelection.result;
        }

        const selectedSkills = skillSelection.skills;
        const analysis = await client.createAnalysisFromSourceAsset(sourceAssetId, selectedSkills, brandId, requestedLanguage);
        void trackMcpGoogleAnalyticsEvent(analyticsContext, "mcp_analysis_created", {
          analysis_language: requestedLanguage,
          skills_count: selectedSkills.length,
          source_type: "asset",
          status: "success",
          tool_name: "create_analysis_from_source_asset",
        });
        return jsonToolResult(analysis as unknown as Record<string, unknown>);
      },
    ),
  );

  server.registerTool(
    "list_analyses",
    {
      description: "List raw analyses for the authenticated Capyra account. For ordinary latest-analysis conversational requests, prefer list_latest_analyses.",
      outputSchema: z.object({}).passthrough(),
      annotations: {
        readOnlyHint: true,
      },
    },
    async () => runTrackedMcpTool(analyticsContext, "list_analyses", {}, async () => {
      const analyses = await client.listAnalyses();
      return jsonToolResult(analyses as unknown as Record<string, unknown>);
    }),
  );

  server.registerTool(
    "list_latest_analyses",
    {
      description: "List the latest Capyra analyses with count context, cursor pagination, table-ready fields, and guidance. Use this when the user asks to list recent or latest analyses. If items is non-empty, do not say that no analyses were found.",
      inputSchema: {
        limit: latestAnalysesLimitSchema,
        cursor: z.string().optional(),
        includeSummary: z.boolean().default(true),
        includeSkillDetails: z.boolean().default(false),
        includePresentation: z.boolean().optional(),
      },
      outputSchema: z.object({}).passthrough(),
      annotations: {
        readOnlyHint: true,
      },
    },
    async ({ limit, cursor, includeSummary, includeSkillDetails, includePresentation }) => runTrackedMcpTool(
      analyticsContext,
      "list_latest_analyses",
      {
        limit,
      },
      async () => {
        const analyses = await client.listLatestAnalyses({
          limit,
          cursor,
          includeSummary,
          includeSkillDetails,
          includePresentation,
        });
        return jsonToolResult(analyses as unknown as Record<string, unknown>);
      },
    ),
  );

  server.registerTool(
    "summarize_analyses",
    {
      description: "Return a direct answer summarizing recent Capyra analyses as a table, brief, or detailed response. If itemsUsed is greater than zero, never answer that no analyses were found.",
      inputSchema: {
        limit: latestAnalysesLimitSchema,
        format: summarizeAnalysesFormatSchema,
        language: analysisLanguageSchema,
      },
      outputSchema: z.object({}).passthrough(),
      annotations: {
        readOnlyHint: true,
      },
    },
    async ({ limit, format, language }, extra) => runTrackedMcpTool(
      analyticsContext,
      "summarize_analyses",
      {
        format,
        limit,
      },
      async () => {
        const requestedLanguage = resolveMcpLanguage(language, extra._meta);
        const analyses = await client.listLatestAnalyses({
          limit,
          includeSummary: true,
          includeSkillDetails: format === "detailed",
          includePresentation: true,
        });
        const table = analyses.presentation?.markdownTable;
        const answer = format === "table" && table
          ? [analyses.presentation?.answer ?? analyses.message, table].filter(Boolean).join("\n\n")
          : format === "brief"
            ? analyses.message
            : [
                analyses.message,
                ...analyses.items.map((item) => `${item.createdAt} ${item.fileName}: ${item.oneLineSummary}`),
              ].join("\n");

        return jsonToolResult({
          answer,
          itemsUsed: analyses.items.length,
          totalAvailable: analyses.total,
          format,
          language: requestedLanguage,
          items: analyses.items,
        });
      },
    ),
  );

  server.registerTool(
    "get_analysis",
    {
      description: "Get a Capyra analysis by id.",
      inputSchema: {
        analysisId: z.string().uuid(),
      },
      outputSchema: z.object({}).passthrough(),
      annotations: {
        readOnlyHint: true,
      },
    },
    async ({ analysisId }) => runTrackedMcpTool(analyticsContext, "get_analysis", {}, async () => {
      const analysis = await client.getAnalysis(analysisId);
      return jsonToolResult(analysis as unknown as Record<string, unknown>);
    }),
  );

  server.registerTool(
    "wait_for_analysis",
    {
      description: "Poll a pending Capyra analysis until it completes or fails.",
      inputSchema: {
        analysisId: z.string().uuid(),
        intervalSeconds: z.number().int().positive().default(2),
        timeoutSeconds: z.number().int().positive().default(300),
      },
      outputSchema: z.object({}).passthrough(),
      annotations: {
        readOnlyHint: true,
      },
    },
    async ({ analysisId, intervalSeconds, timeoutSeconds }) => runTrackedMcpTool(
      analyticsContext,
      "wait_for_analysis",
      {},
      async () => {
        const analysis = await pollAnalysis(client, analysisId, {
          intervalMs: intervalSeconds * 1_000,
          timeoutMs: timeoutSeconds * 1_000,
        });

        return jsonToolResult(analysis as unknown as Record<string, unknown>);
      },
    ),
  );

  return server;
}

const resourceMetadataUrl = getOAuthProtectedResourceMetadataUrl(MCP_URL);
const protectedResourceMetadata = {
  resource: MCP_URL.href,
  authorization_servers: [OAUTH_METADATA.issuer],
  scopes_supported: [...DEFAULT_OAUTH_SCOPES],
  resource_name: RESOURCE_NAME,
  resource_documentation: new URL(DOCUMENTATION_URL).href,
};

function setDiscoveryCorsHeaders(req: Request, headers: Headers) {
  const origin = req.headers.get("origin");
  if (origin && DISCOVERY_CORS_ORIGINS.includes(origin)) {
    // nosemgrep: javascript.express.security.cors-misconfiguration.cors-misconfiguration -- exact allowlist membership is required above.
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }

  headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Accept, Content-Type");
}

function discoveryResponse(request: Request, metadata: Record<string, unknown>): Response {
  const headers = new Headers({ "content-type": "application/json; charset=utf-8" });
  setDiscoveryCorsHeaders(request, headers);
  return request.method === "OPTIONS"
    ? new Response(null, { status: 204, headers })
    : Response.json(metadata, { headers });
}

function secure(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", DYNAMIC_RESPONSE_CACHE_CONTROL);
  headers.set("Content-Security-Policy", "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'");
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("Cross-Origin-Resource-Policy", "same-origin");
  headers.set("Expires", "0");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  headers.set("Pragma", "no-cache");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function handleMcp(request: Request, env: McpEnv): Promise<Response> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return Response.json({ error: "invalid_token", error_description: "No bearer token was provided." }, {
      status: 401,
      headers: { "WWW-Authenticate": `Bearer resource_metadata="${resourceMetadataUrl}"` },
    });
  }
  const token = header.slice(7);
  let authInfo: AuthInfo;
  try {
    authInfo = await verifyAccessToken(token, env);
  } catch (error) {
    const status = error instanceof InvalidTokenError ? 401 : 503;
    return Response.json({ error: status === 401 ? "invalid_token" : "temporarily_unavailable", error_description: error instanceof Error ? error.message : "Token verification failed." }, {
      status,
      headers: { "WWW-Authenticate": `Bearer resource_metadata="${resourceMetadataUrl}"` },
    });
  }
  const server = createServerForToken(token, getMcpAnalyticsContext(authInfo), env);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
    allowedHosts: [MCP_URL.host, "localhost:5090", "127.0.0.1:5090"],
    enableDnsRebindingProtection: true,
  });
  try {
    await server.connect(transport);
    const response = await transport.handleRequest(request, { authInfo });
    logMcpRequest(request, response.status);
    return response;
  } catch (error) {
    logMcpRequest(request, 500, error);
    return Response.json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal server error" }, id: null }, { status: 500 });
  } finally {
    await transport.close();
    await server.close();
  }
}

export default {
  async fetch(request: Request, env: McpEnv): Promise<Response> {
    const { pathname } = new URL(request.url);
    let response: Response;
    if (pathname === "/healthz" && request.method === "GET") {
      response = Response.json({ status: "ok", resourceServer: MCP_URL.href });
    } else if (pathname === "/.well-known/oauth-protected-resource/mcp" && ["GET", "OPTIONS"].includes(request.method)) {
      response = discoveryResponse(request, protectedResourceMetadata);
    } else if (pathname === "/.well-known/oauth-authorization-server" && ["GET", "OPTIONS"].includes(request.method)) {
      response = discoveryResponse(request, OAUTH_METADATA);
    } else if (pathname === "/mcp") {
      response = await handleMcp(request, env);
    } else {
      response = new Response("Not Found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
    }
    return secure(response);
  },
} satisfies ExportedHandler<McpEnv>;
