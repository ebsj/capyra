import { selectLinkedInIdentity } from "./linkedin";
import { ApiError, nowIso } from "../common";
import type {
  Asset,
  Capabilities,
  DestinationState,
  Payload,
  Platform,
  ProviderPost,
  SocialAccountRow,
  SocialEnv,
} from "./types";

export class ProviderError extends Error {
  constructor(
    readonly code: string,
    readonly uncertain = false,
    readonly retryAfter = 0
  ) {
    super(code);
  }
}
export function baseline(
  platform: Platform,
  identityStatus: "verified" | "unavailable" = "verified"
): Capabilities {
  const limits = {
    maxBytes: 200 * 1024 * 1024,
    maxImages: 1,
    maxContentLength: 2200,
    minVideoSeconds: 3,
    maxVideoSeconds: 90,
  };
  if (platform === "linkedin")
    return {
      platform,
      formats: ["text", "feed", "carousel", "video"],
      limits: { ...limits, maxImages: 20, maxContentLength: 3000, maxVideoSeconds: 600 },
      identityStatus,
      canPost: true,
    };
  if (platform === "instagram")
    return {
      platform,
      formats: ["feed", "reel", "story", "carousel"],
      limits: { ...limits, maxImages: 10 },
      identityStatus,
      canPost: true,
    };
  if (platform === "tiktok")
    return {
      platform,
      formats: ["video", "photo_carousel"],
      limits: {
        ...limits,
        maxImages: 35,
        maxContentLength: 4000,
        maxVideoSeconds: 600,
      },
      privacyLevels: ["PUBLIC_TO_EVERYONE"],
      identityStatus,
      canPost: true,
    };
  return {
    platform,
    formats: ["video", "short"],
    limits: { ...limits, maxContentLength: 5000, maxVideoSeconds: 43200 },
    privacyLevels: ["public", "private", "unlisted"],
    identityStatus,
    canPost: true,
  };
}
export class SelectionRequired extends Error {
  constructor(readonly pages: { id: string; name: string }[]) {
    super("social_selection_required");
  }
}
export interface ConnectedIdentity {
  providerAccountId: string;
  displayName: string;
  nativeIdentityId: string | null;
}
export interface AnalyticsPage {
  posts: Record<string, unknown>[];
  hasMore: boolean;
}
export interface SocialProvider {
  readonly mock: boolean;
  createProfile(name: string, key: string): Promise<string>;
  authorization(
    platform: Platform,
    profileId: string,
    callback: string
  ): Promise<string>;
  complete(
    platform: Platform,
    profileId: string,
    query: URLSearchParams,
    expectedIdentity: string | null,
    verifyIdentity?: (id: string) => Promise<void>
  ): Promise<ConnectedIdentity>;
  capabilities(
    account: SocialAccountRow,
    format?: string
  ): Promise<Capabilities>;
  transfer(asset: Asset, body: ReadableStream): Promise<string>;
  validate(body: Record<string, unknown>): Promise<{
    valid: boolean;
    errors?: { platform?: string; error: string }[];
  }>;
  createPost(body: Record<string, unknown>, key: string): Promise<ProviderPost>;
  getPost(id: string): Promise<ProviderPost | null>;
  recoverPost(
    account: SocialAccountRow,
    key: string
  ): Promise<ProviderPost | null>;
  cancelPost(id: string): Promise<boolean>;
  retryPost(id: string, body?: Record<string, unknown>): Promise<ProviderPost>;
  disconnect(id: string): Promise<void>;
  analytics(
    account: SocialAccountRow,
    from: string,
    to: string,
    page: number
  ): Promise<AnalyticsPage>;
  accountMetrics(
    account: SocialAccountRow,
    from: string,
    to: string
  ): Promise<{ date: string; followers: number | null }[]>;
  importUrl(
    account: SocialAccountRow,
    url: string
  ): Promise<Record<string, unknown>[]>;
}
export function mapProviderPost(raw: Record<string, unknown>): ProviderPost {
  if (!raw || typeof (raw._id ?? raw.id) !== "string")
    throw new ProviderError("provider_invalid_response", true);
  const platforms = (raw.platforms ?? []) as Record<string, unknown>[];
  const target = platforms[0] ?? {};
  const status = String(target.status ?? raw.status);
  const states: Record<string, DestinationState> = {
    pending: "scheduled",
    processing: "publishing",
    uploading: "publishing",
    partial: "failed",
    draft: "draft",
    scheduled: "scheduled",
    publishing: "publishing",
    published: "published",
    failed: "failed",
    cancelled: "cancelled",
  };
  return {
    id: String(raw._id ?? raw.id),
    status: states[status] ?? "unknown",
    nativePostId:
      typeof target.platformPostId === "string"
        ? target.platformPostId
        : undefined,
    url:
      typeof target.platformPostUrl === "string"
        ? target.platformPostUrl
        : undefined,
    error:
      status === "failed"
        ? String(target.errorCategory ?? "provider_rejected")
        : undefined,
  };
}
export function postBody(
  account: SocialAccountRow,
  payload: Payload,
  urls: Record<string, string>,
  scheduledAt: string | null
): Record<string, unknown> {
  const s = payload.settings;
  const data: Record<string, unknown> = {};
  if (account.platform === "linkedin" && account.native_identity_id?.startsWith("urn:li:organization:"))
    data.organizationUrn = account.native_identity_id;
  if (account.platform === "instagram")
    Object.assign(data, {
      ...(payload.format === "story" ? { contentType: "story" } : {}),
      ...(payload.coverAssetId
        ? { instagramThumbnail: urls[payload.coverAssetId] }
        : {}),
      thumbOffset: s.coverTimestampMs ?? 0,
      shareToFeed: s.shareToFeed ?? true,
      isAiGenerated: s.isAiGenerated ?? false,
    });
  if (account.platform === "youtube")
    Object.assign(data, {
      title: payload.title,
      description: payload.description ?? payload.content,
      visibility: s.privacyLevel ?? "private",
      madeForKids: s.madeForKids ?? false,
      containsSyntheticMedia: s.containsSyntheticMedia ?? false,
      tags: s.tags ?? [],
    });
  const body: Record<string, unknown> = {
    content:
      account.platform === "youtube"
        ? payload.description ?? payload.content
        : account.platform === "tiktok" && payload.format === "photo_carousel"
        ? payload.title ?? payload.content
        : payload.content,
    mediaItems: payload.mediaAssetIds.map((id) => ({
      url: urls[id],
      ...(payload.coverAssetId
        ? { thumbnail: urls[payload.coverAssetId] }
        : {}),
    })),
    platforms: [
      {
        platform: account.platform,
        accountId: account.provider_account_id,
        platformSpecificData: data,
      },
    ],
    ...(scheduledAt
      ? { scheduledFor: scheduledAt, timezone: "UTC" }
      : { publishNow: true }),
  };
  if (account.platform === "tiktok")
    body.tiktokSettings = {
      privacy_level: s.privacyLevel,
      content_preview_confirmed: s.previewConfirmed,
      express_consent_given: s.expressConsentGiven,
      allow_comment: s.allowComment,
      ...(payload.format === "video"
        ? {
            allow_duet: s.allowDuet,
            allow_stitch: s.allowStitch,
            video_cover_timestamp_ms: s.coverTimestampMs,
          }
        : {
            media_type: "photo",
            description: payload.description ?? payload.content,
          }),
      is_aigc: s.isAiGenerated ?? false,
      commercialContentType: s.commercialContentType ?? "none",
      ...(payload.coverAssetId
        ? { video_cover_image_url: urls[payload.coverAssetId] }
        : {}),
    };
  return body;
}
class ZernioProvider implements SocialProvider {
  readonly mock = false;
  constructor(private env: SocialEnv) {}
  private async call(
    path: string,
    method = "GET",
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<Record<string, unknown>> {
    let response: Response;
    try {
      response = await fetch(
        `${this.env.ZERNIO_API_BASE_URL || "https://zernio.com/api/v1"}${path}`,
        {
          method,
          headers: {
            Authorization: `Bearer ${this.env.ZERNIO_API_KEY}`,
            ...(body ? { "Content-Type": "application/json" } : {}),
            ...headers,
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: AbortSignal.timeout(
            method === "POST" && path === "/posts" ? 240_000 : 30_000
          ),
        }
      );
    } catch {
      throw new ProviderError("provider_timeout", method !== "GET", 60);
    }
    const data = (await response.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    if (response.status === 404) throw new ProviderError("provider_not_found");
    if (response.status === 429)
      throw new ProviderError(
        "provider_rate_limited",
        false,
        Math.max(
          1,
          Math.min(3600, Number(response.headers.get("retry-after")) || 60)
        )
      );
    if (response.status === 409 && path === "/posts") {
      const details = data.details as Record<string, unknown> | undefined;
      if (typeof details?.existingPostId === "string")
        return {
          post: (
            await this.call(
              `/posts/${encodeURIComponent(details.existingPostId)}`
            )
          ).post,
        };
    }
    if (response.status >= 500)
      throw new ProviderError("provider_unavailable", method !== "GET", 60);
    if (!response.ok)
      throw new ProviderError(
        response.status === 401 || response.status === 403
          ? "provider_authorization_required"
          : response.status === 402
          ? "provider_configuration_required"
          : "provider_rejected"
      );
    return data;
  }
  async createProfile(name: string, key: string) {
    const data = await this.call(
      "/profiles",
      "POST",
      { name },
      { "Idempotency-Key": key }
    );
    return String((data.profile as Record<string, unknown>)._id);
  }
  async authorization(platform: Platform, profileId: string, callback: string) {
    const q = new URLSearchParams({
      profileId,
      redirect_url: callback,
      headless: "true",
    });
    if (platform === "instagram") q.set("loginMethod", "facebook_login");
    if (platform === "linkedin") q.set("scopes", "posting,analytics");
    const data = await this.call(`/connect/${platform}?${q}`);
    if (typeof data.authUrl !== "string")
      throw new ProviderError("provider_invalid_response");
    return data.authUrl;
  }
  async complete(
    platform: Platform,
    profileId: string,
    query: URLSearchParams,
    expectedIdentity: string | null,
    verifyIdentity?: (id: string) => Promise<void>
  ): Promise<ConnectedIdentity> {
    if (query.has("error"))
      throw new ProviderError("social_authorization_denied");
    let nativeIdentityId: string | null = null;
    let selectedId: string | null = null;
    if (platform === "linkedin") {
      ({ nativeIdentityId, selectedId } = await selectLinkedInIdentity(
        this.call.bind(this), profileId, query, expectedIdentity, verifyIdentity,
      ));
    }
    if (platform === "instagram" && query.get("tempToken")) {
      const tempToken = query.get("tempToken")!;
      const q = new URLSearchParams({ profileId, tempToken });
      const listed = await this.call(`/connect/instagram/select-account?${q}`);
      const pages = (listed.pages ?? []) as {
        id: string;
        instagram_business_account?: { id: string; username: string };
      }[];
      const eligible = pages.filter(
        (p) =>
          p.instagram_business_account?.id &&
          (!expectedIdentity ||
            p.instagram_business_account.id === expectedIdentity) &&
          (!query.get("pageId") || p.id === query.get("pageId"))
      );
      // Do not guess among multiple authorized identities. A new authorization selecting one Page resolves this.
      if (eligible.length > 1)
        throw new SelectionRequired(
          eligible.map((p) => ({
            id: p.id,
            name: p.instagram_business_account!.username,
          }))
        );
      if (eligible.length !== 1)
        throw new ProviderError(
          expectedIdentity
            ? "social_identity_mismatch"
            : "social_selection_required"
        );
      nativeIdentityId = eligible[0].instagram_business_account!.id;
      await verifyIdentity?.(nativeIdentityId);
      const connected = await this.call(
        "/connect/instagram/select-account",
        "POST",
        { profileId, pageId: eligible[0].id, tempToken }
      );
      selectedId = String(
        (connected.account as Record<string, unknown>)?.accountId ?? ""
      );
    }
    const data = await this.call(
      `/accounts?${new URLSearchParams({ profileId, limit: "100", page: "1" })}`
    );
    const accounts = (data.accounts ?? []) as Record<string, unknown>[];
    const match = accounts.find(
      (a) =>
        a.platform === platform &&
        a.isActive === true &&
        String(
          typeof a.profileId === "object"
            ? (a.profileId as Record<string, unknown>)?._id
            : a.profileId
        ) === profileId &&
        String(a._id) === (selectedId ?? query.get("accountId"))
    );
    if (!match) throw new ProviderError("social_identity_unverified");
    // Public schemas do not guarantee a stable native identifier for TikTok/YouTube. Never infer it from handle or provider _id.
    return {
      providerAccountId: String(match._id),
      displayName: String(match.displayName ?? match.username ?? platform),
      nativeIdentityId,
    };
  }
  async capabilities(account: SocialAccountRow, format?: string) {
    const result = baseline(account.platform, account.identity_status);
    if (account.platform === "linkedin" && account.native_identity_id?.startsWith("urn:li:organization:"))
      result.limits.maxVideoSeconds = 1800;
    const health = await this.call(
      `/accounts/${encodeURIComponent(account.provider_account_id!)}/health`
    );
    const h = (health.health ?? health) as Record<string, unknown>;
    result.canPost =
      (h.permissions as Record<string, unknown> | undefined)?.canPost ===
        true &&
      (h.tokenStatus as Record<string, unknown> | undefined)?.valid === true;
    if (account.platform === "tiktok") {
      const info = await this.call(
        `/accounts/${encodeURIComponent(
          account.provider_account_id!
        )}/tiktok/creator-info?mediaType=${
          format === "photo_carousel" ? "photo" : "video"
        }`
      );
      result.privacyLevels = (
        (info.privacyLevels ?? []) as { value: string }[]
      ).map((p) => p.value);
      const limits = info.postingLimits as Record<string, unknown> | undefined;
      if (limits?.maxVideoDurationSec)
        result.limits.maxVideoSeconds = Number(limits.maxVideoDurationSec);
      result.interactionSettings =
        limits?.interactionSettings as Capabilities["interactionSettings"];
    }
    return result;
  }
  async transfer(asset: Asset, body: ReadableStream) {
    const data = await this.call("/media/presign", "POST", {
      filename: asset.source_label,
      contentType: asset.content_type,
      size: asset.content_length,
    });
    const url = new URL(String(data.uploadUrl));
    if (
      url.protocol !== "https:" ||
      !url.hostname.endsWith(".r2.cloudflarestorage.com")
    )
      throw new ProviderError("provider_upload_host_invalid");
    let response;
    try {
      response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": asset.content_type,
          "Content-Length": String(asset.content_length),
        },
        body,
        signal: AbortSignal.timeout(240_000),
      });
    } catch {
      throw new ProviderError("provider_upload_failed", false, 60);
    }
    if (!response.ok)
      throw new ProviderError("provider_upload_failed", false, 60);
    return String(data.publicUrl);
  }
  async validate(body: Record<string, unknown>) {
    const result = (await this.call(
      "/tools/validate/post",
      "POST",
      body
    )) as unknown as { valid: boolean; errors?: { error: string }[] };
    if (!result.valid) return result;
    const platform = String(
      (body.platforms as { platform: string }[])[0].platform
    );
    for (const item of body.mediaItems as { url: string }[]) {
      const media = await this.call("/tools/validate/media", "POST", {
        url: item.url,
      });
      const limits = media.platformLimits as
        | Record<string, { withinLimit: boolean }>
        | undefined;
      if (media.valid !== true || limits?.[platform]?.withinLimit === false)
        return { valid: false, errors: [{ error: "media_incompatible" }] };
    }
    return result;
  }
  async createPost(body: Record<string, unknown>, key: string) {
    const data = await this.call("/posts", "POST", body, {
      "x-request-id": key,
    });
    return mapProviderPost(
      (data.post ?? data.existingPost) as Record<string, unknown>
    );
  }
  async getPost(id: string) {
    try {
      return mapProviderPost(
        (await this.call(`/posts/${encodeURIComponent(id)}`)).post as Record<
          string,
          unknown
        >
      );
    } catch (e) {
      if (e instanceof ProviderError && e.code === "provider_not_found")
        return null;
      throw e;
    }
  }
  async recoverPost(account: SocialAccountRow, key: string) {
    for (let page = 1; page <= 5; page++) {
      const data = await this.call(
        `/posts?${new URLSearchParams({
          profileId: account.provider_profile_id!,
          limit: "100",
          page: String(page),
        })}`
      );
      const posts = (data.posts ?? []) as Record<string, unknown>[];
      const found = posts.find(
        (p) =>
          (p.metadata as Record<string, unknown> | undefined)
            ?.capyraAttemptId === key
      );
      if (found) return mapProviderPost(found);
      if (posts.length < 100) break;
    }
    return null;
  }
  async cancelPost(id: string) {
    const current = await this.getPost(id);
    if (!current) return true;
    if (!["draft", "scheduled", "failed", "cancelled"].includes(current.status))
      return false;
    await this.call(`/posts/${encodeURIComponent(id)}`, "DELETE");
    return true;
  }
  async retryPost(id: string, body?: Record<string, unknown>) {
    if (body) {
      const updated = await this.call(
        `/posts/${encodeURIComponent(id)}`,
        "PUT",
        { ...body, isDraft: false }
      );
      return mapProviderPost(updated.post as Record<string, unknown>);
    }
    const data = await this.call(
      `/posts/${encodeURIComponent(id)}/retry`,
      "POST",
      {}
    );
    return mapProviderPost((data.post ?? data) as Record<string, unknown>);
  }
  async disconnect(id: string) {
    try {
      await this.call(`/accounts/${encodeURIComponent(id)}`, "DELETE");
    } catch (e) {
      if (!(e instanceof ProviderError && e.code === "provider_not_found"))
        throw e;
    }
  }
  async analytics(
    account: SocialAccountRow,
    from: string,
    to: string,
    page: number
  ) {
    const q = new URLSearchParams({
      accountId: account.provider_account_id!,
      fromDate: from,
      toDate: to,
      page: String(page),
      limit: "100",
      source: "all",
    });
    const data = await this.call(`/analytics?${q}`);
    const posts = (data.posts ?? data.data ?? []) as Record<string, unknown>[];
    const pagination = data.pagination as Record<string, unknown> | undefined;
    return {
      posts,
      hasMore: pagination
        ? Number(pagination.page ?? page) <
          Number(pagination.pages ?? pagination.totalPages ?? 1)
        : posts.length === 100,
    };
  }
  async accountMetrics(account: SocialAccountRow, from: string, to: string) {
    const data = await this.call(
      `/accounts/follower-stats?${new URLSearchParams({
        accountIds: account.provider_account_id!,
        profileId: account.provider_profile_id!,
        fromDate: from,
        toDate: to,
        granularity: "daily",
      })}`
    );
    const stats = data.stats as
      | Record<string, { date: string; followers: number | null }[]>
      | undefined;
    return stats?.[account.provider_account_id!] ?? [];
  }
  async importUrl(account: SocialAccountRow, url: string) {
    const data = await this.call("/posts/sync-external", "POST", {
      accountId: account.provider_account_id,
      url,
    });
    return data.post
      ? [data.post as Record<string, unknown>]
      : ((data.posts ?? []) as Record<string, unknown>[]);
  }
}
class MockProvider implements SocialProvider {
  readonly mock = true;
  constructor(private env: SocialEnv) {}
  async createProfile(_name: string, key: string) {
    return `mock-profile-${key}`;
  }
  async authorization(
    _platform: Platform,
    _profileId: string,
    callback: string
  ) {
    return callback;
  }
  async complete(
    platform: Platform,
    profileId: string,
    _query: URLSearchParams,
    expectedIdentity: string | null,
    verifyIdentity?: (id: string) => Promise<void>
  ) {
    await verifyIdentity?.(
      expectedIdentity ?? `mock-native-${profileId}-${platform}`
    );
    return {
      providerAccountId: `mock-account-${profileId}-${platform}`,
      nativeIdentityId:
        expectedIdentity ?? `mock-native-${profileId}-${platform}`,
      displayName: `Demo ${platform}`,
    };
  }
  async capabilities(account: SocialAccountRow) {
    const result = baseline(account.platform, account.identity_status);
    if (account.platform === "linkedin" && account.native_identity_id?.startsWith("urn:li:organization:"))
      result.limits.maxVideoSeconds = 1800;
    return result;
  }
  async transfer(asset: Asset, body: ReadableStream) {
    await this.env.STORAGE.put(`social-mock/${asset.id}`, body);
    return `https://media.mock.invalid/${asset.id}`;
  }
  async validate() {
    return { valid: true };
  }
  async createPost(body: Record<string, unknown>, key: string) {
    const id = `mock-post-${key}`;
    await this.env.DB.prepare(
      "INSERT OR IGNORE INTO social_mock_posts(id,request_key,body_json,status,created_at) VALUES(?,?,?,?,?)"
    )
      .bind(
        id,
        key,
        JSON.stringify(body),
        body.scheduledFor ? "scheduled" : "published",
        nowIso()
      )
      .run();
    return (await this.getPost(id))!;
  }
  async getPost(id: string) {
    const r = await this.env.DB.prepare(
      "SELECT * FROM social_mock_posts WHERE id=?"
    )
      .bind(id)
      .first<{ id: string; body_json: string; status: DestinationState }>();
    if (!r) return null;
    const b = JSON.parse(r.body_json);
    if (r.status === "scheduled" && Date.parse(b.scheduledFor) <= Date.now()) {
      await this.env.DB.prepare(
        "UPDATE social_mock_posts SET status='published' WHERE id=? AND status='scheduled'"
      )
        .bind(id)
        .run();
      r.status = "published";
    }
    return {
      id,
      status: r.status,
      nativePostId: `native-${id}`,
      url:
        r.status === "published" ? `https://example.com/demo/${id}` : undefined,
    };
  }
  async recoverPost(_account: SocialAccountRow, key: string) {
    const r = await this.env.DB.prepare(
      "SELECT id FROM social_mock_posts WHERE request_key=?"
    )
      .bind(key)
      .first<{ id: string }>();
    return r ? this.getPost(r.id) : null;
  }
  async cancelPost(id: string) {
    const result = await this.env.DB.prepare(
      "UPDATE social_mock_posts SET status='cancelled' WHERE id=? AND status IN ('scheduled','draft','failed')"
    )
      .bind(id)
      .run();
    return (
      result.meta.changes > 0 ||
      (await this.getPost(id))?.status === "cancelled"
    );
  }
  async retryPost(id: string) {
    await this.env.DB.prepare(
      "UPDATE social_mock_posts SET status='published' WHERE id=? AND status='failed'"
    )
      .bind(id)
      .run();
    return (await this.getPost(id))!;
  }
  async disconnect() {}
  async analytics(
    account: SocialAccountRow,
    _from: string,
    _to: string,
    page: number
  ) {
    return {
      posts:
        page === 1
          ? [
              {
                platformPostId: `demo-${account.platform}`,
                platformPostUrl: `https://example.com/demo/${account.platform}`,
                content: "Publicação de demonstração local",
                publishedAt: nowIso(),
                isExternal: true,
                analytics: { views: 42, likes: 7, lastUpdated: nowIso() },
              },
            ]
          : [],
      hasMore: false,
    };
  }
  async accountMetrics(_account: SocialAccountRow, _from: string, to: string) {
    return [{ date: to, followers: 100 }];
  }
  async importUrl(account: SocialAccountRow, url: string) {
    return [
      {
        platformPostId: url,
        platformPostUrl: url,
        content: "Importação de demonstração local",
        publishedAt: nowIso(),
        isExternal: true,
        analytics: { likes: 3, lastUpdated: nowIso() },
      },
    ];
  }
}
export function provider(env: SocialEnv): SocialProvider {
  if (env.CAPYRA_SOCIAL_PROVIDER === "mock") {
    const host = new URL(env.CAPYRA_AUTH_ISSUER).hostname;
    if (
      String(env.CAPYRA_ENVIRONMENT) !== "local" ||
      !["localhost", "127.0.0.1", "api"].includes(host)
    )
      throw new ApiError(
        503,
        "mock_provider_forbidden",
        "O provedor simulado só está disponível localmente."
      );
    return new MockProvider(env);
  }
  if (env.CAPYRA_SOCIAL_PROVIDER !== "zernio" || !env.ZERNIO_API_KEY)
    throw new ApiError(
      503,
      "social_provider_not_configured",
      "A integração social ainda não foi configurada."
    );
  if (
    env.ZERNIO_API_BASE_URL &&
    env.ZERNIO_API_BASE_URL !== "https://zernio.com/api/v1"
  )
    throw new ApiError(
      503,
      "social_provider_invalid_configuration",
      "Endereço da integração inválido."
    );
  return new ZernioProvider(env);
}
