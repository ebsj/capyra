import { applyD1Migrations, env } from "cloudflare:test";
import { beforeAll, afterEach, describe, it, expect, vi } from "vitest";
import { Hono } from "hono";
import { runtime, seed, testApp } from "./foundation-helpers";
import { nowIso, uuidv7 } from "../src/common";
import routes, { publicSocialRoutes } from "../src/routes/social";
import { baseline, postBody, provider, SelectionRequired } from "../src/social/provider";
import { ownedDestination, validateMedia } from "../src/social/publications";
import { enqueueSync } from "../src/social/analytics";
import { processDestination } from "../src/social/worker";
import type { AppBindings } from "../src/runtime";
import type { Asset, Payload, SocialAccountRow, SocialEnv } from "../src/social/types";

const social = { ...runtime, CAPYRA_ENVIRONMENT: "local", CAPYRA_AUTH_ISSUER: "http://localhost:5080", CAPYRA_SOCIAL_PROVIDER: "mock", SOCIAL_RATE_LIMITER: { limit: async () => ({ success: true }) } } as SocialEnv;
const app = testApp(new Hono<AppBindings>().route("/", publicSocialRoutes).route("/", routes));
let migratedAccount: string;
let migratedDestination: string;
beforeAll(async () => {
  runtime.CAPYRA_AUTH_ISSUER = social.CAPYRA_AUTH_ISSUER;
  const previous = env.TEST_MIGRATIONS.filter((migration) => !migration.name.startsWith("0008_"));
  await applyD1Migrations(env.DB, previous);
  const fixture = await seed();
  migratedAccount = uuidv7();
  migratedDestination = uuidv7();
  const pub = uuidv7();
  await env.DB.prepare("INSERT INTO social_accounts(id,account_id,brand_id,platform,created_at,updated_at) VALUES(?,?,?,'youtube',?,?)")
    .bind(migratedAccount, fixture.accountId, fixture.brand.id, nowIso(), nowIso()).run();
  await env.DB.prepare("INSERT INTO social_publications VALUES(?,?,?,?,?,?)").bind(pub, fixture.accountId, fixture.brand.id, "History", nowIso(), nowIso()).run();
  await env.DB.prepare("INSERT INTO social_destinations(id,account_id,brand_id,publication_id,social_account_id,platform,payload_json,created_at,updated_at) VALUES(?,?,?,?,?,'youtube','{}',?,?)")
    .bind(migratedDestination, fixture.accountId, fixture.brand.id, pub, migratedAccount, nowIso(), nowIso()).run();
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});
afterEach(() => vi.restoreAllMocks());

const real = () => provider({ ...social, CAPYRA_SOCIAL_PROVIDER: "zernio", ZERNIO_API_KEY: "fixture", ZERNIO_API_BASE_URL: "https://zernio.com/api/v1" });
const pending = { platform: "linkedin", profileId: "profile", tempToken: "ephemeral", userProfile: { id: "member", displayName: "Member" }, organizations: [{ id: "123", name: "Company" }] };
const query = (selection?: string) => new URLSearchParams({ pendingDataToken: "pending", ...(selection ? { pageId: selection } : {}) });
const account = { platform: "linkedin", status: "active", identity_status: "verified", native_identity_id: "urn:li:person:member", provider_account_id: "remote" } as SocialAccountRow;
const payload: Payload = { socialAccountId: "account", format: "text", content: "Hello LinkedIn", mediaAssetIds: [], settings: {} };
const image: Asset = { id: "image", media_kind: "image", content_type: "image/jpeg", content_length: 1024, metadata_status: "ready", metadata_json: JSON.stringify({ width: 1200, height: 627 }) } as Asset;

describe("LinkedIn integration", () => {
  it("requests headless authorization with only the posting and analytics areas", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ authUrl: "https://www.linkedin.com/oauth/v2/authorization" }));
    await real().authorization("linkedin", "profile", "http://localhost:5080/callback?session=opaque");
    const url = new URL(String(spy.mock.calls[0][0]));
    expect(url.pathname).toBe("/api/v1/connect/linkedin");
    expect(url.searchParams.get("scopes")).toBe("posting,analytics");
    expect(url.searchParams.get("headless")).toBe("true");
    expect(url.searchParams.get("redirect_url")).toBe("http://localhost:5080/callback?session=opaque");
  });
  it("migrates a populated database without losing referenced accounts or weakening constraints", async () => {
    expect(await env.DB.prepare("SELECT social_account_id FROM social_destinations WHERE id=?").bind(migratedDestination).first()).toEqual({ social_account_id: migratedAccount });
    expect(await env.DB.prepare("SELECT platform FROM social_accounts WHERE id=?").bind(migratedAccount).first()).toEqual({ platform: "youtube" });
    expect((await env.DB.prepare("PRAGMA foreign_key_check").all()).results).toEqual([]);
    await expect(env.DB.prepare("UPDATE social_accounts SET platform='invalid' WHERE id=?").bind(migratedAccount).run()).rejects.toThrow();
    await expect(env.DB.prepare("UPDATE social_accounts SET status='active' WHERE id=?").bind(migratedAccount).run()).rejects.toThrow();
    await expect(env.DB.prepare("INSERT INTO social_accounts SELECT 'duplicate',account_id,brand_id,platform,NULL,NULL,NULL,'','unavailable','pending',created_at,updated_at FROM social_accounts WHERE id=?").bind(migratedAccount).run()).rejects.toThrow();
  });
  it("requires explicit profile/page selection using server-provided choices", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json(pending));
    await expect(real().complete("linkedin", "profile", query(), null)).rejects.toBeInstanceOf(SelectionRequired);
    expect(spy).toHaveBeenCalledTimes(1);
  });
  it.each(["urn:li:person:member", "urn:li:organization:123"])("claims %s before selecting it and verifies the resulting provider account", async (native) => {
    const order: string[] = [];
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      if (String(input).includes("pending-data")) return Response.json(pending);
      if (init?.method === "POST") {
        order.push("select");
        const body = JSON.parse(String(init.body));
        expect(body.userProfile).toEqual(pending.userProfile);
        expect(body.accountType).toBe(native.includes("organization") ? "organization" : "personal");
        if (body.accountType === "organization") expect(body.selectedOrganization.id).toBe("123");
        return Response.json({ account: { accountId: "remote" } });
      }
      return Response.json({ accounts: [{ _id: "remote", profileId: "profile", platform: "linkedin", isActive: true, displayName: "Selected" }] });
    });
    const result = await real().complete("linkedin", "profile", query(native), null, async (id) => { expect(id).toBe(native); order.push("claim"); });
    expect(result.nativeIdentityId).toBe(native);
    expect(order).toEqual(["claim", "select"]);
    expect(spy).toHaveBeenCalledTimes(3);
  });
  it("blocks unlisted selections, wrong profiles, identity swaps and quota conflicts before selection", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => Response.json(pending));
    await expect(real().complete("linkedin", "profile", query("urn:li:organization:999"), null)).rejects.toMatchObject({ code: "social_identity_unverified" });
    await expect(real().complete("linkedin", "other-profile", query("urn:li:person:member"), null)).rejects.toMatchObject({ code: "social_identity_unverified" });
    await expect(real().complete("linkedin", "profile", query("urn:li:person:member"), "urn:li:organization:123")).rejects.toMatchObject({ code: "social_identity_mismatch" });
    await expect(real().complete("linkedin", "profile", query("urn:li:person:member"), null, async () => { throw new Error("quota"); })).rejects.toThrow("quota");
    expect(spy.mock.calls.every(([, init]) => init?.method === "GET")).toBe(true);
  });
  it("does not trust browser-supplied native IDs without pending OAuth data", async () => {
    const spy = vi.spyOn(globalThis, "fetch");
    await expect(real().complete("linkedin", "profile", new URLSearchParams({ accountId: "remote", userId: "member" }), null)).rejects.toMatchObject({ code: "social_identity_unverified" });
    expect(spy).not.toHaveBeenCalled();
  });
  it("rejects a provider account belonging to a different profile after selection", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json(pending))
      .mockResolvedValueOnce(Response.json({ account: { accountId: "remote" } }))
      .mockResolvedValueOnce(Response.json({ accounts: [{ _id: "remote", profileId: "other", platform: "linkedin", isActive: true }] }));
    await expect(real().complete("linkedin", "profile", query("urn:li:person:member"), null)).rejects.toMatchObject({ code: "social_identity_unverified" });
  });
  it("renders protected LinkedIn selection, keeps the session usable for selection and consumes it after connecting", async () => {
    const a = await seed();
    const response = await app.request(`/api/v1/brands/${a.brand.id}/social-connections`, {
      method: "POST", headers: { Authorization: `Bearer ${a.token}`, "Content-Type": "application/json" }, body: JSON.stringify({ platform: "linkedin" }),
    }, social);
    const authorization = await response.json() as { authorizationUrl: string };
    const connected = (await env.DB.prepare("SELECT * FROM social_accounts WHERE brand_id=?").bind(a.brand.id).first<SocialAccountRow>())!;
    const callback = new URL(authorization.authorizationUrl);
    callback.searchParams.set("pendingDataToken", "pending");
    const realEnv = { ...social, CAPYRA_SOCIAL_PROVIDER: "zernio", ZERNIO_API_KEY: "fixture" };
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      if (String(input).includes("pending-data")) return Response.json({ ...pending, profileId: connected.provider_profile_id, organizations: [{ id: "123", name: "<script>Company</script>" }] });
      if (init?.method === "POST") return Response.json({ account: { accountId: "remote-callback" } });
      return Response.json({ accounts: [{ _id: "remote-callback", profileId: connected.provider_profile_id, platform: "linkedin", isActive: true, displayName: "Company" }] });
    });
    const selection = await app.request(callback.toString(), {}, realEnv);
    expect(selection.status).toBe(200);
    expect(selection.headers.get("content-security-policy")).toContain("form-action 'self'");
    const html = await selection.text();
    expect(html).toContain("Selecione a conta do LinkedIn");
    expect(html).toContain("&lt;script&gt;Company&lt;/script&gt;");
    expect(html).toContain('name="pendingDataToken" value="pending"');
    expect(html).not.toContain("ephemeral");
    const form = new URLSearchParams({ session: callback.searchParams.get("session")!, pendingDataToken: "pending", pageId: "urn:li:organization:123" });
    const complete = await app.request("/api/v1/social-connections/callback", { method: "POST", body: form.toString() }, realEnv);
    expect(complete.status).toBe(302);
    expect(await env.DB.prepare("SELECT native_identity_id,status FROM social_accounts WHERE id=?").bind(connected.id).first()).toEqual({ native_identity_id: "urn:li:organization:123", status: "active" });
    expect((await app.request(callback.toString(), {}, realEnv)).status).toBe(400);
  });
  it("validates text-only posts, image limits and mixed-media carousels", () => {
    const validate = (p: Payload, media: Asset[]) => validateMedia(p, account, media, baseline("linkedin"));
    expect(validate(payload, [])).toEqual([]);
    expect(validate({ ...payload, content: " " }, [])).toContainEqual(expect.objectContaining({ code: "linkedin_text_required" }));
    expect(validate({ ...payload, content: "a".repeat(3001) }, [])).toContainEqual(expect.objectContaining({ code: "content_too_long" }));
    expect(validate({ ...payload, format: "feed", mediaAssetIds: ["image"] }, [image])).toEqual([]);
    expect(validate({ ...payload, format: "feed", mediaAssetIds: ["image"] }, [{ ...image, content_length: 8 * 1024 * 1024 + 1 }])).toContainEqual(expect.objectContaining({ code: "image_too_large" }));
    const video = { ...image, id: "video", media_kind: "video", content_type: "video/mp4", metadata_json: JSON.stringify({ width: 1920, height: 1080, durationSeconds: 601 }) } as Asset;
    expect(validate({ ...payload, format: "video", mediaAssetIds: ["video"] }, [video])).toContainEqual(expect.objectContaining({ code: "video_duration" }));
    expect(validate({ ...payload, format: "carousel", mediaAssetIds: ["image", "video"] }, [image, video])).toContainEqual(expect.objectContaining({ code: "carousel_count" }));
    const images = Array.from({ length: 20 }, (_, i) => ({ ...image, id: String(i) }));
    expect(validate({ ...payload, format: "carousel", mediaAssetIds: images.map((a) => a.id) }, images)).toEqual([]);
    images.push({ ...image, id: "extra" });
    expect(validate({ ...payload, format: "carousel", mediaAssetIds: images.map((a) => a.id) }, images)).toContainEqual(expect.objectContaining({ code: "carousel_count" }));
    expect(validateMedia({ ...payload, format: "text" }, { ...account, platform: "youtube" }, [], baseline("youtube"))).toContainEqual(expect.objectContaining({ code: "media_required" }));
  });
  it("pins organization publishing to the verified native identity and respects video duration by account type", async () => {
    const org = { ...account, native_identity_id: "urn:li:organization:123" };
    expect(postBody(org, payload, {}, null)).toMatchObject({ content: payload.content, mediaItems: [], platforms: [{ platform: "linkedin", platformSpecificData: { organizationUrn: org.native_identity_id } }] });
    expect((await provider(social).capabilities(account)).limits.maxVideoSeconds).toBe(600);
    expect((await provider(social).capabilities(org)).limits.maxVideoSeconds).toBe(1800);
  });
  it("connects, publishes text exactly once and imports LinkedIn URLs through the canonical API", async () => {
    const a = await seed();
    await env.DB.prepare("UPDATE brands SET confirmed_at=? WHERE id=?").bind(nowIso(), a.brand.id).run();
    const request = (path: string, body: unknown, key?: string) => app.request(`/api/v1${path}`, { method: "POST", headers: { Authorization: `Bearer ${a.token}`, "Content-Type": "application/json", ...(key ? { "Idempotency-Key": key } : {}) }, body: JSON.stringify(body) }, social);
    const auth = await request(`/brands/${a.brand.id}/social-connections`, { platform: "linkedin" });
    expect(auth.status).toBe(201);
    const { authorizationUrl } = await auth.json() as { authorizationUrl: string };
    expect((await app.request(authorizationUrl, {}, social)).status).toBe(302);
    expect((await app.request(authorizationUrl, {}, social)).status).toBe(400);
    const connected = (await env.DB.prepare("SELECT * FROM social_accounts WHERE brand_id=?").bind(a.brand.id).first<SocialAccountRow>())!;
    expect(connected).toMatchObject({ platform: "linkedin", status: "active", identity_status: "verified" });
    const pub = await request("/social-publications", { brandId: a.brand.id, title: "LinkedIn" });
    const { id: pubId } = await pub.json() as { id: string };
    const draft = await request(`/social-publications/${pubId}/destinations`, { ...payload, socialAccountId: connected.id });
    expect(draft.status).toBe(201);
    const { id } = await draft.json() as { id: string };
    const path = `/social-publications/${pubId}/destinations/${id}/submit`;
    expect((await request(path, { publishNow: true }, "linkedin-once")).status).toBe(202);
    await processDestination(social, id);
    await processDestination(social, id);
    expect((await request(path, { publishNow: true }, "linkedin-once")).status).toBe(202);
    expect((await ownedDestination(social, a.accountId, id)).status).toBe("published");
    expect((await env.DB.prepare("SELECT COUNT(*) AS n FROM social_delivery_attempts WHERE destination_id=?").bind(id).first())?.n).toBe(1);
    await expect(enqueueSync(social, connected, "https://www.linkedin.com/feed/update/urn:li:share:123")).resolves.toBeTypeOf("string");
    await expect(enqueueSync(social, connected, "https://linkedin.com.attacker.invalid/posts/123")).rejects.toMatchObject({ code: "invalid_post_url" });
    await expect(enqueueSync(social, connected, "https://youtube.com/watch?v=123")).rejects.toMatchObject({ code: "invalid_post_url" });
  });
});
