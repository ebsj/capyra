import { applyD1Migrations, env } from "cloudflare:test";
import { beforeAll, describe, it, expect, vi } from "vitest";
import { runtime, seed, testApp } from "./foundation-helpers";
import { nowIso, uuidv7 } from "../src/common";
import routes, { publicSocialRoutes } from "../src/routes/social";
import { Hono } from "hono";
import type { AppBindings } from "../src/runtime";
import {
  provider,
  baseline,
  mapProviderPost,
  postBody,
} from "../src/social/provider";
import {
  aggregateStatus,
  localToUtc,
  ownedDestination,
  submitDestination,
  validateMedia,
} from "../src/social/publications";
import {
  processDestination,
  applyPost,
  reconcileDestination,
  reconcileSocial,
  markSocialDlqFailure,
} from "../src/social/worker";
import {
  cancelDestination,
  latestAttempt,
  assetHasOpenDestinations,
  mutateDestination,
} from "../src/social/lifecycle";
import {
  receiveWebhook,
  verifySignature,
  processWebhook,
} from "../src/social/webhooks";
import { processSyncJob, storeAnalyticsPost } from "../src/social/analytics";
import type {
  Asset,
  Payload,
  SocialAccountRow,
  SocialEnv,
} from "../src/social/types";
import type { AuthPrincipal } from "../src/runtime";
const sent: { kind: string; id: string }[] = [];
const social = runtime as SocialEnv;
const app = testApp(
  new Hono<AppBindings>().route("/", publicSocialRoutes).route("/", routes)
);
beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  Object.assign(social, {
    CAPYRA_AUTH_ISSUER: "http://localhost:5080",
    CAPYRA_ENVIRONMENT: "local",
    CAPYRA_SOCIAL_PROVIDER: "mock",
    ZERNIO_WEBHOOK_SECRET: "test-social-secret",
    SOCIAL_RATE_LIMITER: { limit: async () => ({ success: true }) },
    SOCIAL_QUEUE: {
      send: async (m: { kind: string; id: string }) => sent.push(m),
      sendBatch: async () => {},
    },
  });
});
async function setup(platform: "instagram" | "tiktok" | "youtube" = "youtube") {
  const identity = await seed();
  await env.DB.prepare("UPDATE brands SET confirmed_at=? WHERE id=?")
    .bind(nowIso(), identity.brand.id)
    .run();
  const principal = {
    sub: identity.userId,
    email: identity.email,
    name: "User",
    role: "owner",
    account_id: identity.accountId,
  } as AuthPrincipal;
  const id = uuidv7();
  await env.DB.prepare(
    "INSERT INTO social_accounts(id,account_id,brand_id,platform,provider_profile_id,provider_account_id,native_identity_id,display_name,identity_status,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,'Demo','verified','active',?,?)"
  )
    .bind(
      id,
      identity.accountId,
      identity.brand.id,
      platform,
      `profile-${id}`,
      `account-${id}`,
      `native-${id}`,
      nowIso(),
      nowIso()
    )
    .run();
  const account = (await env.DB.prepare(
    "SELECT * FROM social_accounts WHERE id=?"
  )
    .bind(id)
    .first<SocialAccountRow>())!;
  const assetId = uuidv7(),
    key = `source-assets/${identity.accountId}/${identity.brand.id}/${assetId}/video.mp4`;
  await env.STORAGE.put(key, new Uint8Array([0, 1, 2, 3]));
  await env.DB.prepare(
    "INSERT INTO source_assets(id,account_id,brand_id,source_label,content_type,content_length,object_key,upload_status,media_kind,metadata_status,metadata_json,created_at) VALUES(?,?,?,'video.mp4','video/mp4',4,?,'completed','video','ready',?,?)"
  )
    .bind(
      assetId,
      identity.accountId,
      identity.brand.id,
      key,
      JSON.stringify({
        width: 1080,
        height: 1920,
        durationSeconds: 30,
        codec: "h264",
      }),
      nowIso()
    )
    .run();
  const publicationId = uuidv7();
  await env.DB.prepare("INSERT INTO social_publications VALUES(?,?,?,?,?,?)")
    .bind(
      publicationId,
      identity.accountId,
      identity.brand.id,
      "Demo",
      nowIso(),
      nowIso()
    )
    .run();
  const destinationId = uuidv7();
  const payload: Payload = {
    socialAccountId: id,
    format: platform === "instagram" ? "reel" : "video",
    content: "Demo",
    title: "Video",
    mediaAssetIds: [assetId],
    settings:
      platform === "tiktok"
        ? {
            privacyLevel: "PUBLIC_TO_EVERYONE",
            previewConfirmed: true,
            expressConsentGiven: true,
            allowComment: false,
            allowDuet: false,
            allowStitch: false,
          }
        : platform === "youtube"
        ? { privacyLevel: "private", madeForKids: false }
        : {},
  };
  await env.DB.prepare(
    "INSERT INTO social_destinations(id,account_id,brand_id,publication_id,social_account_id,platform,payload_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)"
  )
    .bind(
      destinationId,
      identity.accountId,
      identity.brand.id,
      publicationId,
      id,
      platform,
      JSON.stringify(payload),
      nowIso(),
      nowIso()
    )
    .run();
  return {
    ...identity,
    principal,
    account,
    assetId,
    publicationId,
    destinationId,
    payload,
    row: await ownedDestination(social, identity.accountId, destinationId),
  };
}
describe("social domain invariants", () => {
  it("rejects gaps and duplicate local instants, and preserves timezone conversion", () => {
    expect(localToUtc("2026-09-14T12:30", "America/Recife")).toBe(
      "2026-09-14T15:30:00.000Z"
    );
    expect(() => localToUtc("2026-03-08T02:30", "America/New_York")).toThrow();
    expect(() => localToUtc("2026-11-01T01:30", "America/New_York")).toThrow();
    expect(() => localToUtc("2026-02-31T02:30", "UTC")).toThrow();
  });
  it("does not treat partial HTTP success as complete delivery", () => {
    expect(
      mapProviderPost({
        _id: "p",
        status: "partial",
        platforms: [{ status: "failed", errorCategory: "user_content" }],
      })
    ).toMatchObject({ status: "failed", error: "user_content" });
    expect(aggregateStatus(["published", "failed"])).toBe("partial");
    expect(aggregateStatus(["unknown", "published"])).toBe("unknown");
  });
  it("requires explicit mock and local environment", () => {
    expect(() =>
      provider({ ...social, CAPYRA_ENVIRONMENT: "production" } as SocialEnv)
    ).toThrow();
    expect(() =>
      provider({ ...social, CAPYRA_SOCIAL_PROVIDER: undefined })
    ).toThrow();
  });
  it("enforces slots and global verified native identity through D1 constraints", async () => {
    const a = await setup(),
      b = await setup();
    await expect(
      env.DB.prepare(
        "UPDATE social_accounts SET native_identity_id=? WHERE id=?"
      )
        .bind(a.account.native_identity_id, b.account.id)
        .run()
    ).rejects.toThrow();
    await expect(
      env.DB.prepare(
        "UPDATE social_accounts SET identity_status='unavailable' WHERE id=?"
      )
        .bind(a.account.id)
        .run()
    ).rejects.toThrow();
  });
  it("protects cross-account assets and destination reads", async () => {
    const a = await setup(),
      b = await setup();
    const response = await app.request(
      `/api/v1/social-publications/${a.publicationId}`,
      { headers: { Authorization: `Bearer ${b.token}` } },
      social
    );
    expect(response.status).toBe(404);
    await expect(
      env.DB.prepare("UPDATE social_destinations SET payload_json=? WHERE id=?")
        .bind(
          JSON.stringify({ ...a.payload, mediaAssetIds: [b.assetId] }),
          a.destinationId
        )
        .run()
    ).rejects.toThrow();
  });
  it("refuses member connection administration", async () => {
    const a = await setup();
    const member = await seed(a.accountId, "member");
    const response = await app.request(
      `/api/v1/brands/${a.brand.id}/social-connections`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${member.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ platform: "instagram" }),
      },
      social
    );
    expect(response.status).toBe(403);
  });
  it("single-use callback consumes a session once and starts import", async () => {
    const a = await seed();
    const response = await app.request(
      `/api/v1/brands/${a.brand.id}/social-connections`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${a.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ platform: "instagram" }),
      },
      social
    );
    expect(response.status).toBe(201);
    const data = (await response.json()) as { authorizationUrl: string };
    const first = await app.request(data.authorizationUrl, {}, social);
    expect(first.status).toBe(302);
    const replay = await app.request(data.authorizationUrl, {}, social);
    expect(replay.status).toBe(400);
    const rows = await env.DB.prepare(
      "SELECT status,identity_status FROM social_accounts WHERE brand_id=?"
    )
      .bind(a.brand.id)
      .all();
    expect(rows.results[0]).toMatchObject({
      status: "active",
      identity_status: "verified",
    });
  });
  it("blocks real unsafe reconnection before any provider call", async () => {
    const a = await setup("tiktok");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const response = await app.request(
      `/api/v1/brands/${a.brand.id}/social-connections`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${a.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform: "tiktok",
          reconnectAccountId: a.account.id,
        }),
      },
      {
        ...social,
        CAPYRA_SOCIAL_PROVIDER: "zernio",
        ZERNIO_API_KEY: "not-used",
      }
    );
    expect(response.status).toBe(409);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
  it("validates each network and keeps consent required", async () => {
    const a = await setup("tiktok");
    const asset = (await env.DB.prepare(
      "SELECT * FROM source_assets WHERE id=?"
    )
      .bind(a.assetId)
      .first<Asset>())!;
    expect(
      validateMedia(a.payload, a.account, [asset], baseline("tiktok"))
    ).toEqual([]);
    expect(
      validateMedia(
        { ...a.payload, settings: {} },
        a.account,
        [asset],
        baseline("tiktok")
      ).some((i) => i.code === "consent_required")
    ).toBe(true);
    expect(
      validateMedia(
        { ...a.payload, format: "photo_carousel" },
        a.account,
        [asset],
        baseline("tiktok")
      ).some((i) => i.code === "photo_count")
    ).toBe(true);
    expect(
      validateMedia(
        { ...a.payload, format: "short" },
        { ...a.account, platform: "youtube" },
        [
          {
            ...asset,
            metadata_json: JSON.stringify({
              width: 1920,
              height: 1080,
              durationSeconds: 240,
            }),
          },
        ],
        baseline("youtube")
      ).some((i) => i.code === "video_duration")
    ).toBe(true);
  });
  it("creates one immutable version and one attempt under duplicate submissions", async () => {
    const a = await setup(),
      key = uuidv7();
    const calls = await Promise.allSettled([
      submitDestination(social, a.principal, a.row, key, { publishNow: true }),
      submitDestination(social, a.principal, a.row, key, { publishNow: true }),
    ]);
    expect(calls.some((c) => c.status === "fulfilled")).toBe(true);
    const count = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM social_delivery_attempts WHERE destination_id=?"
    )
      .bind(a.destinationId)
      .first<{ n: number }>();
    expect(count!.n).toBe(1);
    await expect(
      env.DB.prepare(
        "UPDATE social_destination_versions SET payload_json='{}' WHERE destination_id=?"
      )
        .bind(a.destinationId)
        .run()
    ).rejects.toThrow();
    await processDestination(social, a.destinationId);
    await processDestination(social, a.destinationId);
    const row = await ownedDestination(social, a.accountId, a.destinationId);
    expect(row.status).toBe("published");
    expect(
      (await env.DB.prepare(
        "SELECT COUNT(*) AS n FROM social_mock_posts WHERE request_key IN (SELECT request_key FROM social_delivery_attempts WHERE destination_id=?)"
      )
        .bind(a.destinationId)
        .first<{ n: number }>())!.n
    ).toBe(1);
  });
  it("holds media until T minus six days and confirms scheduled cancellation", async () => {
    const a = await setup();
    const far = new Date(Date.now() + 8 * 86400000).toISOString().slice(0, 16);
    await submitDestination(social, a.principal, a.row, uuidv7(), {
      publishNow: false,
      localDateTime: far,
    });
    await processDestination(social, a.destinationId);
    expect(
      (await env.DB.prepare(
        "SELECT transfers_json FROM social_delivery_attempts WHERE destination_id=?"
      )
        .bind(a.destinationId)
        .first<{ transfers_json: string }>())!.transfers_json
    ).toBe("{}");
    expect(await assetHasOpenDestinations(social, a.accountId, a.assetId)).toBe(
      true
    );
    await env.DB.prepare(
      "UPDATE social_destinations SET scheduled_at=? WHERE id=?"
    )
      .bind(new Date(Date.now() + 2 * 86400000).toISOString(), a.destinationId)
      .run();
    await processDestination(social, a.destinationId);
    const scheduled = await ownedDestination(
      social,
      a.accountId,
      a.destinationId
    );
    expect(scheduled.status).toBe("scheduled");
    expect((await cancelDestination(social, scheduled)).status).toBe(
      "cancelled"
    );
    expect(await assetHasOpenDestinations(social, a.accountId, a.assetId)).toBe(
      false
    );
  });
  it("never blindly resubmits a timed-out write after lease expiration", async () => {
    const a = await setup();
    await submitDestination(social, a.principal, a.row, uuidv7(), {
      publishNow: true,
    });
    await env.DB.prepare(
      "UPDATE social_delivery_attempts SET submitted_at=?,state='submitting' WHERE destination_id=?"
    )
      .bind(nowIso(), a.destinationId)
      .run();
    await env.DB.prepare(
      "UPDATE social_destinations SET status='submitting' WHERE id=?"
    )
      .bind(a.destinationId)
      .run();
    await processDestination(social, a.destinationId);
    expect(
      (await ownedDestination(social, a.accountId, a.destinationId)).status
    ).toBe("unknown");
    expect(
      (await env.DB.prepare(
        "SELECT COUNT(*) AS n FROM social_mock_posts WHERE request_key IN (SELECT request_key FROM social_delivery_attempts WHERE destination_id=?)"
      )
        .bind(a.destinationId)
        .first<{ n: number }>())!.n
    ).toBe(0);
    await expect(
      mutateDestination(
        social,
        a.principal,
        await ownedDestination(social, a.accountId, a.destinationId),
        "retry",
        uuidv7()
      )
    ).rejects.toThrow();
  });
  it("marks DLQ after a write unknown instead of failed", async () => {
    const a = await setup();
    await submitDestination(social, a.principal, a.row, uuidv7(), {
      publishNow: true,
    });
    await env.DB.prepare(
      "UPDATE social_delivery_attempts SET submitted_at=? WHERE destination_id=?"
    )
      .bind(nowIso(), a.destinationId)
      .run();
    await markSocialDlqFailure(social, {
      kind: "destination",
      id: a.destinationId,
    });
    expect(
      (await ownedDestination(social, a.accountId, a.destinationId)).status
    ).toBe("unknown");
  });
  it("verifies raw HMAC, deduplicates inbox and ignores unknown mapping", async () => {
    const raw = JSON.stringify({
      id: uuidv7(),
      event: "post.published",
      post: { id: "foreign-provider-id" },
    });
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(social.ZERNIO_WEBHOOK_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = [
      ...new Uint8Array(
        await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw))
      ),
    ]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    expect(
      await verifySignature(raw, signature, social.ZERNIO_WEBHOOK_SECRET)
    ).toBe(true);
    expect(
      await verifySignature(raw + " ", signature, social.ZERNIO_WEBHOOK_SECRET)
    ).toBe(false);
    await receiveWebhook(social, raw, signature);
    await receiveWebhook(social, raw, signature);
    const rows = await env.DB.prepare(
      "SELECT id FROM social_webhook_inbox WHERE event_id=?"
    )
      .bind(JSON.parse(raw).id)
      .all<{ id: string }>();
    expect(rows.results).toHaveLength(1);
    await processWebhook(social, rows.results[0].id);
    expect(
      (await env.DB.prepare(
        "SELECT body_json FROM social_webhook_inbox WHERE id=?"
      )
        .bind(rows.results[0].id)
        .first<{ body_json: string }>())!.body_json
    ).toBe("{}");
  });
  it("deduplicates external posts and preserves unavailable metric values", async () => {
    const a = await setup();
    const post = {
      platformPostId: "external-1",
      publishedAt: nowIso(),
      content: "external",
      analytics: { views: null, likes: 0, lastUpdated: nowIso() },
    };
    await storeAnalyticsPost(social, a.account, post);
    await storeAnalyticsPost(social, a.account, post);
    expect(
      (await env.DB.prepare(
        "SELECT COUNT(*) AS n FROM external_posts WHERE social_account_id=?"
      )
        .bind(a.account.id)
        .first<{ n: number }>())!.n
    ).toBe(1);
    const unavailable = await env.DB.prepare(
      "SELECT value,availability FROM metric_snapshots WHERE social_account_id=? AND metric='views'"
    )
      .bind(a.account.id)
      .first();
    expect(unavailable).toEqual({ value: null, availability: "unavailable" });
  });
  it("creates ninety-day resumable sync jobs on connection", async () => {
    const a = await setup();
    const response = await app.request(
      `/api/v1/social-connections/${a.account.id}/sync`,
      { method: "POST", headers: { Authorization: `Bearer ${a.token}` } },
      social
    );
    expect(response.status).toBe(202);
    const job = (await env.DB.prepare(
      "SELECT id,from_date,to_date FROM social_sync_jobs WHERE social_account_id=?"
    )
      .bind(a.account.id)
      .first<{ id: string; from_date: string; to_date: string }>())!;
    expect(
      (Date.parse(job.to_date) - Date.parse(job.from_date)) / 86400000
    ).toBe(90);
    await processSyncJob(social, job.id);
    expect(
      (await env.DB.prepare("SELECT state FROM social_sync_jobs WHERE id=?")
        .bind(job.id)
        .first<{ state: string }>())!.state
    ).toBe("completed");
  });
});

describe("real social transport without external requests", () => {
  const real = () =>
    provider({
      ...social,
      CAPYRA_SOCIAL_PROVIDER: "zernio",
      ZERNIO_API_KEY: "transport-fixture-only",
    });
  it("uses native SDK wire shapes, request dedup header and parses 207", async () => {
    const a = await setup("instagram");
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input, init) => {
        const url = String(input);
        if (url.endsWith("/health"))
          return Response.json({
            tokenStatus: { valid: true },
            permissions: { canPost: true },
          });
        expect(init?.headers).toMatchObject({
          "x-request-id": "logical-request",
        });
        return Response.json(
          {
            post: {
              _id: "provider-post",
              status: "partial",
              platforms: [{ status: "failed", errorCategory: "user_content" }],
            },
          },
          { status: 207 }
        );
      });
    try {
      expect((await real().capabilities(a.account)).canPost).toBe(true);
      expect(await real().createPost({}, "logical-request")).toMatchObject({
        status: "failed",
        id: "provider-post",
      });
    } finally {
      spy.mockRestore();
    }
  });
  it("classifies write timeouts as unknown and rate limit as safely deferred", async () => {
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response("{}", { status: 429, headers: { "Retry-After": "120" } })
      )
      .mockRejectedValueOnce(new TypeError("network"));
    try {
      await expect(real().createPost({}, "request")).rejects.toMatchObject({
        uncertain: false,
        retryAfter: 120,
      });
      await expect(real().createPost({}, "request")).rejects.toMatchObject({
        uncertain: true,
        code: "provider_timeout",
      });
    } finally {
      spy.mockRestore();
    }
  });
  it("rejects another Instagram identity before destructive account selection", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        pages: [
          {
            id: "page-other",
            instagram_business_account: {
              id: "native-other",
              username: "Other",
            },
          },
        ],
      })
    );
    try {
      await expect(
        real().complete(
          "instagram",
          "profile",
          new URLSearchParams({ tempToken: "ephemeral" }),
          "native-expected"
        )
      ).rejects.toMatchObject({ code: "social_identity_mismatch" });
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][1]?.method).toBe("GET");
    } finally {
      spy.mockRestore();
    }
  });
  it("claims verified Instagram identity before selecting and verifies resulting profile", async () => {
    const order: string[] = [];
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input, init) => {
        if (init?.method === "POST") {
          order.push("select");
          return Response.json({ account: { accountId: "provider-account" } });
        }
        if (String(input).includes("select-account"))
          return Response.json({
            pages: [
              {
                id: "page",
                instagram_business_account: { id: "native", username: "Brand" },
              },
            ],
          });
        return Response.json({
          accounts: [
            {
              _id: "provider-account",
              profileId: "profile",
              platform: "instagram",
              isActive: true,
              username: "Brand",
            },
          ],
        });
      });
    try {
      const result = await real().complete(
        "instagram",
        "profile",
        new URLSearchParams({ tempToken: "ephemeral" }),
        null,
        async () => {
          order.push("claim");
        }
      );
      expect(order).toEqual(["claim", "select"]);
      expect(result.nativeIdentityId).toBe("native");
    } finally {
      spy.mockRestore();
    }
  });
  it("keeps unknown native identity pending instead of using mutable handles", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        accounts: [
          {
            _id: "provider-account",
            profileId: "profile",
            platform: "tiktok",
            isActive: true,
            username: "mutable-handle",
            metadata: {},
          },
        ],
      })
    );
    try {
      const result = await real().complete(
        "tiktok",
        "profile",
        new URLSearchParams({ accountId: "provider-account" }),
        null
      );
      expect(result.nativeIdentityId).toBeNull();
    } finally {
      spy.mockRestore();
    }
  });
  it("uses media upload without leaking bearer and rejects oversized per-platform media", async () => {
    const a = await setup();
    const asset = (await env.DB.prepare(
      "SELECT * FROM source_assets WHERE id=?"
    )
      .bind(a.assetId)
      .first<Asset>())!;
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input, init) => {
        const url = String(input);
        if (url.endsWith("/media/presign"))
          return Response.json({
            uploadUrl: "https://bucket.r2.cloudflarestorage.com/temp/file",
            publicUrl: "https://media.zernio.com/temp/file.mp4",
          });
        if (init?.method === "PUT") {
          expect(init.headers).not.toHaveProperty("Authorization");
          expect(init.body).toBeInstanceOf(ReadableStream);
          return new Response(null, { status: 200 });
        }
        if (url.endsWith("/validate/post"))
          return Response.json({ valid: true });
        return Response.json({
          valid: true,
          platformLimits: { youtube: { withinLimit: false } },
        });
      });
    try {
      const url = await real().transfer(
        asset,
        new ReadableStream({
          start(c) {
            c.enqueue(new Uint8Array([1]));
            c.close();
          },
        })
      );
      expect(url).toContain("media.zernio.com");
      expect(
        (
          await real().validate({
            platforms: [{ platform: "youtube" }],
            mediaItems: [{ url }],
          })
        ).valid
      ).toBe(false);
    } finally {
      spy.mockRestore();
    }
  });
  it("does not overwrite historical posts when a native identity moves between tenants", async () => {
    const first = await setup(),
      second = await setup();
    const native = first.account.native_identity_id;
    await storeAnalyticsPost(social, first.account, {
      platformPostId: "same-native-post",
      publishedAt: nowIso(),
      content: "Original tenant",
      analytics: { likes: 1 },
    });
    await env.DB.prepare(
      "UPDATE social_accounts SET status='disconnected' WHERE id=?"
    )
      .bind(first.account.id)
      .run();
    await env.DB.prepare(
      "UPDATE social_accounts SET native_identity_id=? WHERE id=?"
    )
      .bind(native, second.account.id)
      .run();
    await storeAnalyticsPost(
      social,
      { ...second.account, native_identity_id: native },
      {
        platformPostId: "same-native-post",
        publishedAt: nowIso(),
        content: "Second tenant",
        analytics: { likes: 2 },
      }
    );
    const posts = await env.DB.prepare(
      "SELECT account_id,content FROM external_posts WHERE native_identity_id=? AND native_post_id=?"
    )
      .bind(native, "same-native-post")
      .all();
    expect(posts.results).toEqual(
      expect.arrayContaining([
        { account_id: first.accountId, content: "Original tenant" },
        { account_id: second.accountId, content: "Second tenant" },
      ])
    );
    expect(posts.results).toHaveLength(2);
  });
  it("protects media deletion against an already-created draft at the database boundary", async () => {
    const a = await setup();
    await expect(
      env.DB.prepare("UPDATE source_assets SET deleted_at=? WHERE id=?")
        .bind(nowIso(), a.assetId)
        .run()
    ).rejects.toThrow("source_asset_in_use");
  });
});

describe("social operation recovery", () => {
  it("does not consume a cancellation key when a precondition rejects it", async () => {
    const a = await setup();
    await submitDestination(social, a.principal, a.row, uuidv7(), {
      publishNow: true,
    });
    await env.DB.prepare(
      "UPDATE social_destinations SET status='submitting' WHERE id=?"
    )
      .bind(a.destinationId)
      .run();
    const key = uuidv7();
    await expect(
      mutateDestination(
        social,
        a.principal,
        await ownedDestination(social, a.accountId, a.destinationId),
        "cancel",
        key
      )
    ).rejects.toThrow();
    expect(
      await env.DB.prepare(
        "SELECT * FROM social_operations WHERE account_id=? AND operation_key=?"
      )
        .bind(a.accountId, key)
        .first()
    ).toBeNull();
    await env.DB.prepare(
      "UPDATE social_destinations SET status='awaiting_handoff' WHERE id=?"
    )
      .bind(a.destinationId)
      .run();
    const result = await mutateDestination(
      social,
      a.principal,
      await ownedDestination(social, a.accountId, a.destinationId),
      "cancel",
      key
    );
    expect(result.status).toBe("cancelled");
  });
  it("renders unavailable snapshots even if a pending provider supplies placeholder zero", async () => {
    const a = await setup();
    await storeAnalyticsPost(social, a.account, {
      platformPostId: "pending-native",
      publishedAt: nowIso(),
      syncStatus: "pending",
      analytics: { views: 0 },
    });
    expect(
      await env.DB.prepare(
        "SELECT value,availability FROM metric_snapshots WHERE social_account_id=? AND metric='views'"
      )
        .bind(a.account.id)
        .first()
    ).toEqual({ value: null, availability: "unavailable" });
  });
  it("allows a failed destination retry without repeating its successful sibling", async () => {
    const a = await setup(),
      b = await setup();
    await submitDestination(social, a.principal, a.row, uuidv7(), {
      publishNow: true,
    });
    await processDestination(social, a.destinationId);
    await submitDestination(social, b.principal, b.row, uuidv7(), {
      publishNow: true,
    });
    await env.DB.batch([
      env.DB.prepare(
        "UPDATE social_destinations SET status='failed' WHERE id=?"
      ).bind(b.destinationId),
      env.DB.prepare(
        "UPDATE social_delivery_attempts SET state='failed' WHERE destination_id=?"
      ).bind(b.destinationId),
    ]);
    await mutateDestination(
      social,
      b.principal,
      await ownedDestination(social, b.accountId, b.destinationId),
      "retry",
      uuidv7()
    );
    await processDestination(social, b.destinationId);
    expect(
      (await ownedDestination(social, a.accountId, a.destinationId)).status
    ).toBe("published");
    expect(
      (await ownedDestination(social, b.accountId, b.destinationId)).status
    ).toBe("published");
    expect(
      (await env.DB.prepare(
        "SELECT COUNT(*) AS n FROM social_delivery_attempts WHERE destination_id=?"
      )
        .bind(a.destinationId)
        .first<{ n: number }>())!.n
    ).toBe(1);
  });
});

describe("delivery convergence regressions", () => {
  it("does not regress terminal delivery or attempt on an out-of-order response", async () => {
    const a = await setup();
    await submitDestination(social, a.principal, a.row, uuidv7(), {
      publishNow: true,
    });
    const stale = await ownedDestination(social, a.accountId, a.destinationId);
    const attempt = (await latestAttempt(social, stale))!;
    await processDestination(social, a.destinationId);
    await applyPost(social, stale, attempt, {
      id: "older-provider-post",
      status: "failed",
      error: "old_failure",
    });
    expect(
      (await ownedDestination(social, a.accountId, a.destinationId)).status
    ).toBe("published");
    expect((await latestAttempt(social, stale))!.state).toBe("published");
  });
  it("keeps a cancellation timeout unknown until provider confirms publication", async () => {
    const a = await setup();
    const local = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
    await submitDestination(social, a.principal, a.row, uuidv7(), {
      publishNow: false,
      localDateTime: local,
    });
    await processDestination(social, a.destinationId);
    const scheduled = await ownedDestination(
      social,
      a.accountId,
      a.destinationId
    );
    const attempt = (await latestAttempt(social, scheduled))!;
    let published = false;
    const realEnv = {
      ...social,
      CAPYRA_SOCIAL_PROVIDER: "zernio" as const,
      ZERNIO_API_KEY: "transport-fixture-only",
    };
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (_input, init) => {
        if (init?.method === "DELETE") throw new TypeError("connection lost");
        return Response.json({
          post: {
            _id: attempt.provider_post_id,
            status: published ? "published" : "scheduled",
            platforms: [{ status: published ? "published" : "pending" }],
          },
        });
      });
    try {
      const unknown = await cancelDestination(realEnv, scheduled);
      expect(unknown.status).toBe("unknown");
      expect(unknown.last_error).toBe("cancellation_unconfirmed");
      published = true;
      await reconcileDestination(realEnv, unknown);
      expect(
        (await ownedDestination(social, a.accountId, a.destinationId)).status
      ).toBe("published");
    } finally {
      spy.mockRestore();
    }
  });
  it("correlates native analytics back to Capyra when latePostId is omitted", async () => {
    const a = await setup();
    await submitDestination(social, a.principal, a.row, uuidv7(), {
      publishNow: true,
    });
    await processDestination(social, a.destinationId);
    const row = await ownedDestination(social, a.accountId, a.destinationId),
      attempt = (await latestAttempt(social, row))!;
    expect(attempt.native_post_id).toBeTruthy();
    await storeAnalyticsPost(social, a.account, {
      platformPostId: attempt.native_post_id,
      platformPostUrl: attempt.published_url,
      publishedAt: nowIso(),
      analytics: { likes: 7, lastUpdated: nowIso() },
    });
    expect(
      await env.DB.prepare(
        "SELECT destination_id,external_post_id FROM metric_snapshots WHERE social_account_id=?"
      )
        .bind(a.account.id)
        .first()
    ).toEqual({ destination_id: a.destinationId, external_post_id: null });
    expect(
      await env.DB.prepare(
        "SELECT id FROM external_posts WHERE social_account_id=?"
      )
        .bind(a.account.id)
        .first()
    ).toBeNull();
  });
  it("accepts a late TikTok URL while preserving published state", async () => {
    const a = await setup("tiktok");
    await submitDestination(social, a.principal, a.row, uuidv7(), {
      publishNow: true,
    });
    await processDestination(social, a.destinationId);
    const row = await ownedDestination(social, a.accountId, a.destinationId),
      attempt = (await latestAttempt(social, row))!;
    await env.DB.prepare(
      "UPDATE social_delivery_attempts SET published_url=NULL,native_post_id=NULL WHERE id=?"
    )
      .bind(attempt.id)
      .run();
    await applyPost(social, row, attempt, {
      id: attempt.provider_post_id!,
      status: "published",
      nativePostId: "resolved-native",
      url: "https://www.tiktok.com/@demo/video/resolved",
    });
    expect((await latestAttempt(social, row))!.native_post_id).toBe(
      "resolved-native"
    );
    expect(
      (await ownedDestination(social, a.accountId, a.destinationId)).status
    ).toBe("published");
  });
});

describe("queue safe retries", () => {
  it("defers a preflight read timeout without classifying it as an unknown write", async () => {
    const a = await setup();
    await submitDestination(social, a.principal, a.row, uuidv7(), {
      publishNow: true,
    });
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new TypeError("offline"));
    try {
      await processDestination(
        {
          ...social,
          CAPYRA_SOCIAL_PROVIDER: "zernio",
          ZERNIO_API_KEY: "transport-fixture-only",
        },
        a.destinationId
      );
      expect(
        (await ownedDestination(social, a.accountId, a.destinationId)).status
      ).toBe("awaiting_handoff");
      const fresh = (await latestAttempt(
        social,
        await ownedDestination(social, a.accountId, a.destinationId)
      ))!;
      expect(fresh.submitted_at).toBeNull();
      expect(Date.parse(fresh.retry_after!)).toBeGreaterThan(Date.now());
    } finally {
      spy.mockRestore();
    }
  });
  it("closes a DLQ attempt before permitting manual retry", async () => {
    const a = await setup();
    await submitDestination(social, a.principal, a.row, uuidv7(), {
      publishNow: true,
    });
    await markSocialDlqFailure(social, {
      kind: "destination",
      id: a.destinationId,
    });
    const row = await ownedDestination(social, a.accountId, a.destinationId);
    expect(row.status).toBe("failed");
    await mutateDestination(social, a.principal, row, "retry", uuidv7());
    await processDestination(social, a.destinationId);
    expect(
      (await ownedDestination(social, a.accountId, a.destinationId)).status
    ).toBe("published");
  });
});

describe("format and import completeness", () => {
  it("accepts image feed/story/carousel and photo carousel with explicit consent", async () => {
    const a = await setup("instagram");
    const video = (await env.DB.prepare(
      "SELECT * FROM source_assets WHERE id=?"
    )
      .bind(a.assetId)
      .first<Asset>())!;
    const image: Asset = {
      ...video,
      media_kind: "image",
      content_type: "image/png",
      metadata_json: JSON.stringify({ width: 1080, height: 1920 }),
      source_label: "image.png",
    };
    for (const format of ["feed", "story"])
      expect(
        validateMedia(
          { ...a.payload, format, settings: {} },
          a.account,
          [image],
          baseline("instagram")
        )
      ).toEqual([]);
    const second = { ...image, id: uuidv7() };
    expect(
      validateMedia(
        {
          ...a.payload,
          format: "carousel",
          mediaAssetIds: [image.id, second.id],
          settings: {},
        },
        a.account,
        [image, second],
        baseline("instagram")
      )
    ).toEqual([]);
    const tiktok = { ...a.account, platform: "tiktok" as const };
    const payload: Payload = {
      ...a.payload,
      format: "photo_carousel",
      title: "Photos",
      description: "Full description",
      mediaAssetIds: [image.id, second.id],
      settings: {
        privacyLevel: "PUBLIC_TO_EVERYONE",
        previewConfirmed: true,
        expressConsentGiven: true,
        allowComment: false,
      },
    };
    expect(
      validateMedia(payload, tiktok, [image, second], baseline("tiktok"))
    ).toEqual([]);
    expect(
      postBody(
        tiktok,
        payload,
        {
          [image.id]: "https://media.test/1.png",
          [second.id]: "https://media.test/2.png",
        },
        null
      ).tiktokSettings as Record<string, unknown>
    ).toMatchObject({
      media_type: "photo",
      description: "Full description",
      express_consent_given: true,
    });
  });
  it("resumes ninety-day pagination and excludes older items except explicit URL imports", async () => {
    const a = await setup();
    const result = await app.request(
      `/api/v1/social-connections/${a.account.id}/sync`,
      { method: "POST", headers: { Authorization: `Bearer ${a.token}` } },
      social
    );
    expect(result.status).toBe(202);
    const job = (await env.DB.prepare(
      "SELECT id FROM social_sync_jobs WHERE social_account_id=?"
    )
      .bind(a.account.id)
      .first<{ id: string }>())!;
    const realEnv = {
      ...social,
      CAPYRA_SOCIAL_PROVIDER: "zernio" as const,
      ZERNIO_API_KEY: "transport-fixture-only",
    };
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input) => {
        const url = new URL(String(input));
        if (url.pathname.endsWith("/follower-stats"))
          return Response.json({ stats: {} });
        const page = Number(url.searchParams.get("page"));
        const make = (id: string, publishedAt = nowIso()) => ({
          publishedAt,
          content: id,
          platforms: [
            {
              platform: "youtube",
              accountId: a.account.provider_account_id,
              platformPostId: id,
              analytics: { views: 10, lastUpdated: nowIso() },
            },
          ],
        });
        return Response.json({
          posts:
            page === 1
              ? [make("page-1"), make("too-old", "2001-01-01T00:00:00Z")]
              : [make("page-2")],
          pagination: { page, pages: 2 },
        });
      });
    try {
      await processSyncJob(realEnv, job.id);
      expect(
        await env.DB.prepare(
          "SELECT page,state FROM social_sync_jobs WHERE id=?"
        )
          .bind(job.id)
          .first()
      ).toEqual({ page: 2, state: "pending" });
      await processSyncJob(realEnv, job.id);
      expect(
        (await env.DB.prepare("SELECT state FROM social_sync_jobs WHERE id=?")
          .bind(job.id)
          .first<{ state: string }>())!.state
      ).toBe("completed");
      expect(
        (
          await env.DB.prepare(
            "SELECT native_post_id FROM external_posts WHERE social_account_id=? ORDER BY native_post_id"
          )
            .bind(a.account.id)
            .all()
        ).results
      ).toEqual([{ native_post_id: "page-1" }, { native_post_id: "page-2" }]);
    } finally {
      spy.mockRestore();
    }
  });
  it("rejects URLs from another network and non-HTTPS URLs", async () => {
    const a = await setup();
    for (const url of [
      "https://instagram.com/p/123",
      "http://youtube.com/watch?v=123",
      "https://youtube.com.attacker.invalid/watch?v=123",
    ]) {
      const response = await app.request(
        "/api/v1/external-posts/import",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${a.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ socialAccountId: a.account.id, url }),
        },
        social
      );
      expect(response.status).toBe(422);
    }
  });
});
