import assert from "node:assert/strict";

const legacyBaseUrl = process.env.CAPYRA_LEGACY_API_BASE_URL;
const workerBaseUrl = process.env.CAPYRA_WORKER_API_BASE_URL;

if (!legacyBaseUrl || !workerBaseUrl) {
  throw new Error("Set CAPYRA_LEGACY_API_BASE_URL and CAPYRA_WORKER_API_BASE_URL before running parity tests.");
}

function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => {
    if (["id", "accountId", "accessToken", "refresh_token", "uploadUrl", "sourceAssetId", "traceId"].includes(key)) return [key, `<${key}>`];
    if (key.endsWith("At")) return [key, "<timestamp>"];
    return [key, redact(item)];
  }));
}

async function request(baseUrl, path, init = {}) {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, init);
  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("json") ? await response.json() : await response.text();
  return {
    status: response.status,
    contentType: contentType.split(";")[0],
    location: response.headers.get("location")?.replace(/[0-9a-f-]{36}/gi, "<id>") ?? null,
    body: redact(body),
  };
}

async function characterize(baseUrl, suffix) {
  const email = `parity-${suffix}@example.test`;
  const registration = await request(baseUrl, "/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ displayName: "Parity", accountType: "creator", ownerName: "Parity Owner", email, password: "Parity-Password-123!" }),
  });
  assert.equal(registration.status, 201);
  const rawLogin = await fetch(`${baseUrl.replace(/\/$/, "")}/auth/login`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: "Parity-Password-123!" }),
  });
  const loginBody = await rawLogin.json();
  const headers = { authorization: `Bearer ${loginBody.accessToken}` };
  return {
    registration,
    invalidLogin: await request(baseUrl, "/auth/login", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password: "wrong-password" }),
    }),
    skills: await request(baseUrl, "/analysis-skills", { headers }),
    analyses: await request(baseUrl, "/analyses", { headers }),
  };
}

const suffix = crypto.randomUUID();
const [legacy, worker] = await Promise.all([characterize(legacyBaseUrl, suffix), characterize(workerBaseUrl, suffix)]);
assert.deepEqual(worker, legacy);
console.log("Cloudflare V2 characterization parity passed.");
