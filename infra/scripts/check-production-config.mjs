#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const failures = [];

if (process.argv.includes("--require-credentials")) {
  for (const name of ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID"]) {
    if (!process.env[name]?.trim()) failures.push(`${name} is not configured in the deployment environment.`);
  }
}

function readConfig(relativePath) {
  return JSON.parse(readFileSync(resolve(repoRoot, relativePath), "utf8"));
}

function requiredValue(config, relativePath, path) {
  const value = path.reduce((current, segment) => current?.[segment], config);
  const label = `${relativePath}: ${path.join(".")}`;
  if (typeof value !== "string" || !value.trim()) {
    failures.push(`${label} must be configured.`);
    return;
  }
  if (/replace-with|00000000-0000-0000-0000-000000000000/i.test(value)) {
    failures.push(`${label} still contains a provisioning placeholder.`);
  }
}

const apiPath = "apps/api/wrangler.jsonc";
const api = readConfig(apiPath);
requiredValue(api, apiPath, ["vars", "CAPYRA_R2_PUBLIC_ENDPOINT"]);
requiredValue(api, apiPath, ["d1_databases", 0, "database_id"]);

const webPath = "apps/web/wrangler.jsonc";
const web = readConfig(webPath);
for (const name of [
  "CAPYRA_FIREBASE_API_KEY",
  "CAPYRA_FIREBASE_AUTH_DOMAIN",
  "CAPYRA_FIREBASE_PROJECT_ID",
  "CAPYRA_FIREBASE_APP_ID",
]) {
  requiredValue(web, webPath, ["vars", name]);
}

if (failures.length) {
  console.error("Production configuration is incomplete:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Production configuration preflight passed.");
