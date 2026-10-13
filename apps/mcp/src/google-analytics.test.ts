import assert from "node:assert/strict";
import test from "node:test";

import {
  buildMcpGoogleAnalyticsPayload,
  createPseudonymousClientId,
  type McpAnalyticsContext,
} from "./google-analytics.js";

const context: McpAnalyticsContext = {
  accountId: "019e6000-0000-7000-9000-000000000001",
  clientId: "capyra-mcp",
  userId: "019e6000-0000-7000-9000-000000000002",
};
const expectedEnvironment = process.env.CAPYRA_ENVIRONMENT?.trim() || process.env.NODE_ENV || "development";

test("MCP GA4 client id is stable and pseudonymous", () => {
  const first = createPseudonymousClientId(context);
  const second = createPseudonymousClientId(context);

  assert.equal(first, second);
  assert.equal(first.length, 36);
  assert.equal(first.includes(context.accountId), false);
  assert.equal(first.includes(context.userId), false);
});

test("MCP GA4 payload keeps only low-cardinality non-PII event parameters", () => {
  const payload = buildMcpGoogleAnalyticsPayload(
    context,
    "mcp_analysis_created",
    {
      analysis_language: "pt-BR",
      ignored: null,
      skills_count: 3,
      source_type: "url",
      status: "success",
      tool_name: "create_analysis_from_url",
    },
    {
      engagementTimeMsec: 1,
      sessionId: 1_765_000_000,
    },
  );

  assert.equal(payload.user_id, context.userId);
  assert.equal(payload.client_id.includes(context.userId), false);
  assert.deepEqual(payload.events, [
    {
      name: "mcp_analysis_created",
      params: {
        analysis_language: "pt-BR",
        engagement_time_msec: 1,
        environment: expectedEnvironment,
        session_id: 1_765_000_000,
        skills_count: 3,
        source_type: "url",
        status: "success",
        surface: "mcp",
        tool_name: "create_analysis_from_url",
      },
    },
  ]);
});
