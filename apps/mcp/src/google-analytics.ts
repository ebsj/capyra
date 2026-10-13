import { createHash } from "node:crypto";

export type McpAnalyticsContext = {
  accountId: string;
  clientId: string;
  userId: string;
};

export type McpAnalyticsEventName =
  | "mcp_analysis_created"
  | "mcp_tool_call"
  | "mcp_tool_error";

export type McpAnalyticsEventParams = Record<string, string | number | boolean | null | undefined>;

type GoogleAnalyticsSession = {
  engagementTimeMsec: number;
  sessionId: number;
};

type StoredSession = {
  lastEventAt: number;
  sessionId: number;
};

const MEASUREMENT_ID = process.env.CAPYRA_GA4_MEASUREMENT_ID?.trim() ?? "";
const API_SECRET = process.env.CAPYRA_GA4_API_SECRET?.trim() ?? "";
const IS_ENABLED = process.env.CAPYRA_GA4_ENABLED !== "false";
const ENVIRONMENT = process.env.CAPYRA_ENVIRONMENT?.trim() || process.env.NODE_ENV || "development";
const SESSION_TIMEOUT_MS = 30 * 60 * 1_000;
const MAX_ENGAGEMENT_TIME_MS = 60_000;
const sessions = new Map<string, StoredSession>();

export function createPseudonymousClientId(context: McpAnalyticsContext) {
  return createHash("sha256")
    .update(`${context.accountId}:${context.userId}:${context.clientId}`)
    .digest("hex")
    .slice(0, 36);
}

function sanitizeEventParams(params: McpAnalyticsEventParams) {
  return Object.fromEntries(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [
        key,
        typeof value === "string" ? value.trim().slice(0, 100) : value,
      ]),
  );
}

function getSession(context: McpAnalyticsContext, now = Date.now()): GoogleAnalyticsSession {
  const key = createPseudonymousClientId(context);
  const current = sessions.get(key);

  if (!current || now - current.lastEventAt > SESSION_TIMEOUT_MS) {
    const session = {
      lastEventAt: now,
      sessionId: Math.floor(now / 1_000),
    };
    sessions.set(key, session);
    return {
      engagementTimeMsec: 1,
      sessionId: session.sessionId,
    };
  }

  const engagementTimeMsec = Math.max(
    1,
    Math.min(now - current.lastEventAt, MAX_ENGAGEMENT_TIME_MS),
  );
  current.lastEventAt = now;

  if (sessions.size > 1_000) {
    for (const [sessionKey, session] of sessions.entries()) {
      if (now - session.lastEventAt > SESSION_TIMEOUT_MS) {
        sessions.delete(sessionKey);
      }
    }
  }

  return {
    engagementTimeMsec,
    sessionId: current.sessionId,
  };
}

export function buildMcpGoogleAnalyticsPayload(
  context: McpAnalyticsContext,
  name: McpAnalyticsEventName,
  params: McpAnalyticsEventParams,
  session: GoogleAnalyticsSession,
) {
  return {
    client_id: createPseudonymousClientId(context),
    user_id: context.userId,
    events: [
      {
        name,
        params: sanitizeEventParams({
          engagement_time_msec: session.engagementTimeMsec,
          environment: ENVIRONMENT,
          session_id: session.sessionId,
          surface: "mcp",
          ...params,
        }),
      },
    ],
  };
}

export async function trackMcpGoogleAnalyticsEvent(
  context: McpAnalyticsContext | null,
  name: McpAnalyticsEventName,
  params: McpAnalyticsEventParams = {},
) {
  if (!context || !IS_ENABLED || !MEASUREMENT_ID || !API_SECRET) {
    return;
  }

  const url = new URL("https://www.google-analytics.com/mp/collect");
  url.searchParams.set("measurement_id", MEASUREMENT_ID);
  url.searchParams.set("api_secret", API_SECRET);

  try {
    const response = await fetch(url, {
      body: JSON.stringify(buildMcpGoogleAnalyticsPayload(context, name, params, getSession(context))),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.warn(`GA4 MCP event was not accepted: ${response.status}`);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(
      `GA4 MCP event could not be sent: ${error instanceof Error ? error.message : "unknown error"}`,
    );
  }
}
