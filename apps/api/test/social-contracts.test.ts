import { applyD1Migrations, createExecutionContext, env, waitOnExecutionContext } from "cloudflare:test";
import { beforeAll, expect, it } from "vitest";
import { schemas } from "@capyra/contracts/validators";
import worker from "../src/index";
import { runtime, seed } from "./foundation-helpers";

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  runtime.SOCIAL_RATE_LIMITER = { limit: async () => ({ success: true }) } as RateLimit;
});

async function request(token: string, path: string, method = "GET", body?: unknown) {
  const context = createExecutionContext();
  const response = await worker.fetch!(new Request(`https://api.test/api/v1${path}`, {
    method,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  }), runtime, context);
  await waitOnExecutionContext(context);
  return response;
}

it("serves foundation and Social resources through the full Worker using canonical response contracts", async () => {
  const identity = await seed();
  const cases: [string, keyof typeof schemas][] = [
    ["/brands", "BrandListResponse"], ["/members", "MemberListResponse"],
    ["/usage", "UsageResponse"], ["/notifications", "NotificationListResponse"],
    ["/audit-events", "AuditEventListResponse"],
    [`/brands/${identity.brand.id}/social-connections`, "SocialAccountList"],
    [`/external-posts?brandId=${identity.brand.id}`, "ExternalPostList"],
    [`/social-metrics?brandId=${identity.brand.id}`, "SocialMetricList"],
    [`/social-publications?brandId=${identity.brand.id}`, "SocialPublicationList"],
  ];
  for (const [path, schema] of cases) {
    const response = await request(identity.token, path);
    expect(response.status, path).toBe(200);
    expect(schemas[schema].safeParse(await response.json()).success, schema).toBe(true);
  }
  const created = await request(identity.token, "/social-publications", "POST", {
    brandId: identity.brand.id, title: "Contract publication",
  });
  expect(created.status).toBe(201);
  const publication = schemas.SocialPublication.parse(await created.json());
  const outsider = await seed();
  expect((await request(outsider.token, `/social-publications/${publication.id}`)).status).toBe(404);
});

it("rejects old inputs without a Brand and forwards durable operation headers through CORS", async () => {
  const identity = await seed();
  const invalid = await request(identity.token, "/social-publications", "POST", { title: "Missing Brand" });
  expect(invalid.status).toBe(422);
  expect(await invalid.json()).toMatchObject({ code: "validation_error" });
  const response = await worker.fetch!(new Request("https://api.test/api/v1/social-publications", {
    method: "OPTIONS",
    headers: { origin: runtime.CAPYRA_WEB_BASE_URL, "access-control-request-method": "POST", "access-control-request-headers": "Idempotency-Key" },
  }), runtime, createExecutionContext());
  expect(response.headers.get("access-control-allow-headers")).toContain("Idempotency-Key");
});
