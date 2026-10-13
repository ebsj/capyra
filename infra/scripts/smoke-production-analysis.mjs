#!/usr/bin/env node

import { setTimeout as delay } from "node:timers/promises";

const apiBaseUrl = "https://api.capyra.co/api/v1";
const email = required("CAPYRA_SMOKE_EMAIL");
const password = required("CAPYRA_SMOKE_PASSWORD");
const videoUrl = required("CAPYRA_SMOKE_VIDEO_URL");
const timeoutSeconds = Number.parseInt(process.env.CAPYRA_SMOKE_TIMEOUT_SECONDS ?? "900", 10);

if (!Number.isFinite(timeoutSeconds) || timeoutSeconds < 30 || timeoutSeconds > 1800) {
  throw new Error("CAPYRA_SMOKE_TIMEOUT_SECONDS must be between 30 and 1800.");
}

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for the production analysis smoke.`);
  return value;
}

async function json(response, label) {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const code = body && typeof body === "object" && "code" in body ? ` (${body.code})` : "";
    throw new Error(`${label} failed with HTTP ${response.status}${code}.`);
  }
  return body;
}

const loginResponse = await fetch(`${apiBaseUrl}/auth/login`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email, password }),
});
const session = await json(loginResponse, "Smoke account login");
if (!session?.accessToken) throw new Error("Smoke account login did not return an access token.");

const authorization = { authorization: `Bearer ${session.accessToken}` };
let analysisId;
let completed = false;

try {
  const createResponse = await fetch(`${apiBaseUrl}/analyses`, {
    method: "POST",
    headers: { ...authorization, "content-type": "application/json" },
    body: JSON.stringify({
      url: videoUrl,
      skills: ["content_strategy"],
      language: "pt-BR",
      intent: "Automated production deployment smoke test.",
    }),
  });
  const analysis = await json(createResponse, "Analysis creation");
  analysisId = analysis?.id;
  if (!analysisId || analysis.status !== "pending") {
    throw new Error("Analysis creation did not return a pending analysis ID.");
  }

  const deadline = Date.now() + timeoutSeconds * 1000;
  let lastProgress;
  while (Date.now() < deadline) {
    await delay(10_000);
    const detailResponse = await fetch(`${apiBaseUrl}/analyses/${analysisId}`, { headers: authorization });
    const detail = await json(detailResponse, "Analysis polling");
    const progress = `${detail.status}:${detail.errorMessage ?? ""}`;
    if (progress !== lastProgress) {
      const retryNote = detail.errorMessage ? ` Last attempt: ${detail.errorMessage}` : "";
      console.log(`Production analysis smoke status: ${detail.status}.${retryNote}`);
      lastProgress = progress;
    }
    if (detail.status === "completed") {
      if (!detail.report) throw new Error("Completed smoke analysis did not contain a report.");
      console.log("Production analysis smoke passed.");
      completed = true;
      break;
    }
    if (detail.status === "failed") throw new Error("Production smoke analysis reached failed status.");
  }

  if (!completed) throw new Error(`Production smoke analysis timed out after ${timeoutSeconds} seconds.`);
} finally {
  if (analysisId) {
    const cleanup = await fetch(`${apiBaseUrl}/analyses/${analysisId}`, {
      method: "DELETE",
      headers: authorization,
    });
    if (!cleanup.ok) console.warn(`Smoke analysis cleanup returned HTTP ${cleanup.status}.`);
  }
}
