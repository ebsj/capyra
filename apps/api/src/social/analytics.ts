import { ApiError, nowIso, uuidv7 } from "../common";
import { currentUsageCycle, notifyOwners } from "../foundations";
import { provider, ProviderError } from "./provider";
import type { SocialAccountRow, SocialEnv } from "./types";

export async function enqueueSync(
  env: SocialEnv,
  account: SocialAccountRow,
  url?: string
) {
  if (account.status !== "active" || !account.native_identity_id)
    throw new ApiError(
      409,
      "social_identity_unverified",
      "Conecte uma identidade verificada antes de importar."
    );
  if (url) {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new ApiError(422, "invalid_post_url", "URL inválida.");
    }
    const hosts =
      account.platform === "instagram"
        ? ["instagram.com"]
        : account.platform === "tiktok"
        ? ["tiktok.com"]
        : ["youtube.com", "youtu.be"];
    if (
      parsed.protocol !== "https:" ||
      !hosts.some(
        (h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`)
      )
    )
      throw new ApiError(
        422,
        "invalid_post_url",
        "Informe uma URL HTTPS da rede selecionada."
      );
  }
  const id = uuidv7(),
    now = nowIso(),
    kind = url ? "import" : "sync";
  const existing = !url
    ? await env.DB.prepare(
        "SELECT id FROM social_sync_jobs WHERE social_account_id=? AND kind='sync' AND state IN ('pending','running')"
      )
        .bind(account.id)
        .first<{ id: string }>()
    : null;
  if (existing) {
    await env.SOCIAL_QUEUE.send({ kind: "sync", id: existing.id });
    return existing.id;
  }
  await env.DB.prepare(
    "INSERT INTO social_sync_jobs(id,account_id,social_account_id,kind,url,from_date,to_date,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)"
  )
    .bind(
      id,
      account.account_id,
      account.id,
      kind,
      url ?? null,
      new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10),
      now.slice(0, 10),
      now,
      now
    )
    .run();
  await env.SOCIAL_QUEUE.send({ kind, id });
  return id;
}
interface SyncJob {
  id: string;
  account_id: string;
  social_account_id: string;
  kind: "sync" | "import";
  url: string | null;
  from_date: string;
  to_date: string;
  page: number;
  state: string;
  updated_at: string;
}
export async function storeAnalyticsPost(
  env: SocialEnv,
  account: SocialAccountRow,
  post: Record<string, unknown>
) {
  if (!account.native_identity_id) return;
  const native = String(post.platformPostId ?? post.nativePostId ?? "");
  if (!native) return;
  const publishedAt = String(post.publishedAt ?? "");
  if (!Number.isFinite(Date.parse(publishedAt))) return;
  const providerPostId =
    typeof post.latePostId === "string"
      ? post.latePostId
      : typeof post._id === "string"
      ? post._id
      : typeof post.postId === "string"
      ? post.postId
      : null;
  const known = await env.DB.prepare(
    "SELECT d.id FROM social_destinations d JOIN social_delivery_attempts a ON a.destination_id=d.id WHERE d.social_account_id=? AND d.account_id=? AND ((? IS NOT NULL AND a.provider_post_id=?) OR a.native_post_id=? OR (? IS NOT NULL AND a.published_url=?)) LIMIT 1"
  )
    .bind(
      account.id,
      account.account_id,
      providerPostId,
      providerPostId,
      native,
      post.platformPostUrl ?? null,
      post.platformPostUrl ?? null
    )
    .first<{ id: string }>();
  let externalId: string | null = null;
  if (!known) {
    externalId = uuidv7();
    await env.DB.prepare(
      "INSERT INTO external_posts(id,account_id,brand_id,social_account_id,platform,native_identity_id,native_post_id,provider_post_id,url,content,published_at,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(account_id,brand_id,platform,native_identity_id,native_post_id) DO UPDATE SET content=excluded.content,url=excluded.url,provider_post_id=excluded.provider_post_id"
    )
      .bind(
        externalId,
        account.account_id,
        account.brand_id,
        account.id,
        account.platform,
        account.native_identity_id,
        native,
        providerPostId,
        typeof post.platformPostUrl === "string" ? post.platformPostUrl : null,
        String(post.content ?? ""),
        publishedAt,
        nowIso()
      )
      .run();
    externalId = (await env.DB.prepare(
      "SELECT id FROM external_posts WHERE platform=? AND native_identity_id=? AND native_post_id=? AND account_id=? AND brand_id=?"
    )
      .bind(
        account.platform,
        account.native_identity_id,
        native,
        account.account_id,
        account.brand_id
      )
      .first<{ id: string }>())!.id;
  }
  const analytics = (post.analytics ?? {}) as Record<string, unknown>;
  const available = !["pending", "unavailable", "failed"].includes(
    String(post.syncStatus)
  );
  const dataThrough =
    typeof analytics.lastUpdated === "string" &&
    Number.isFinite(Date.parse(analytics.lastUpdated))
      ? analytics.lastUpdated
      : null;
  const observed = nowIso();
  const entries = Object.entries(analytics).filter(
    ([key, value]) =>
      key !== "lastUpdated" && (typeof value === "number" || value === null)
  );
  if (!entries.length) entries.push(["views", null]);
  await env.DB.batch(
    entries.map(([metric, value]) =>
      env.DB.prepare(
        "INSERT INTO metric_snapshots(id,account_id,brand_id,social_account_id,destination_id,external_post_id,platform,metric,value,availability,period_start,period_end,observed_at,data_through,source) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
      ).bind(
        uuidv7(),
        account.account_id,
        account.brand_id,
        account.id,
        known?.id ?? null,
        externalId,
        account.platform,
        metric,
        available && typeof value === "number" && Number.isFinite(value)
          ? value
          : null,
        available && typeof value === "number" ? "available" : "unavailable",
        publishedAt,
        dataThrough,
        observed,
        dataThrough,
        metric === "engagementRate"
          ? "provider.calculated"
          : `${account.platform}.native`
      )
    )
  );
}
export async function processSyncJob(env: SocialEnv, id: string) {
  const job = await env.DB.prepare("SELECT * FROM social_sync_jobs WHERE id=?")
    .bind(id)
    .first<SyncJob>();
  if (!job || ["completed", "failed"].includes(job.state)) return;
  if (job.state === "pending" && Date.parse(job.updated_at) > Date.now())
    return;
  // Persist page progress. A stale running job can resume after its five-minute lease.
  if (
    job.state === "running" &&
    Date.parse(job.updated_at) > Date.now() - 5 * 60000
  )
    return;
  const acquired = await env.DB.prepare(
    "UPDATE social_sync_jobs SET state='running',updated_at=? WHERE id=? AND (state='pending' OR (state='running' AND updated_at<?))"
  )
    .bind(nowIso(), id, new Date(Date.now() - 5 * 60000).toISOString())
    .run();
  if (!acquired.meta.changes) return;
  const account = await env.DB.prepare(
    "SELECT * FROM social_accounts WHERE id=? AND account_id=?"
  )
    .bind(job.social_account_id, job.account_id)
    .first<SocialAccountRow>();
  if (!account || account.status !== "active" || !account.native_identity_id) {
    await env.DB.prepare(
      "UPDATE social_sync_jobs SET state='failed',updated_at=? WHERE id=?"
    )
      .bind(nowIso(), id)
      .run();
    return;
  }
  try {
    const remote = provider(env);
    if (job.kind === "sync" && job.page === 1) {
      try {
        const observations = await remote.accountMetrics(
          account,
          job.from_date,
          job.to_date
        );
        for (const point of observations) {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(point.date)) continue;
          await env.DB.prepare(
            "INSERT INTO metric_snapshots(id,account_id,brand_id,social_account_id,platform,metric,value,availability,period_start,period_end,observed_at,data_through,source) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)"
          )
            .bind(
              uuidv7(),
              account.account_id,
              account.brand_id,
              account.id,
              account.platform,
              "followers",
              typeof point.followers === "number" ? point.followers : null,
              typeof point.followers === "number" ? "available" : "unavailable",
              `${point.date}T00:00:00.000Z`,
              `${point.date}T23:59:59.999Z`,
              nowIso(),
              `${point.date}T23:59:59.999Z`,
              `${account.platform}.native`
            )
            .run();
        }
      } catch {
        await env.DB.prepare(
          "INSERT INTO metric_snapshots(id,account_id,brand_id,social_account_id,platform,metric,value,availability,observed_at,source) VALUES(?,?,?,?,?,'followers',NULL,'unavailable',?,?)"
        )
          .bind(
            uuidv7(),
            account.account_id,
            account.brand_id,
            account.id,
            account.platform,
            nowIso(),
            `${account.platform}.native`
          )
          .run();
      }
    }
    const page =
      job.kind === "import"
        ? { posts: await remote.importUrl(account, job.url!), hasMore: false }
        : await remote.analytics(account, job.from_date, job.to_date, job.page);
    for (const post of page.posts) {
      if (
        job.kind === "sync" &&
        typeof post.publishedAt === "string" &&
        (post.publishedAt.slice(0, 10) < job.from_date ||
          post.publishedAt.slice(0, 10) > job.to_date)
      )
        continue;
      const platformAnalytics = (post.platformAnalytics ?? post.platforms) as
        | Record<string, unknown>[]
        | undefined;
      if (platformAnalytics?.length) {
        for (const p of platformAnalytics) {
          const ref =
            typeof p.accountId === "object"
              ? (p.accountId as Record<string, unknown>)?._id
              : p.accountId;
          if (String(ref) !== account.provider_account_id) continue;
          await storeAnalyticsPost(env, account, { ...post, ...p });
        }
      } else await storeAnalyticsPost(env, account, post);
    }
    await env.DB.prepare(
      "UPDATE social_sync_jobs SET state=?,page=page+1,updated_at=? WHERE id=?"
    )
      .bind(page.hasMore ? "pending" : "completed", nowIso(), id)
      .run();
    if (page.hasMore) await env.SOCIAL_QUEUE.send({ kind: job.kind, id });
  } catch (error) {
    const transient = error instanceof ProviderError && error.retryAfter > 0;
    await env.DB.prepare(
      "UPDATE social_sync_jobs SET state=?,updated_at=? WHERE id=?"
    )
      .bind(
        transient ? "pending" : "failed",
        transient
          ? new Date(
              Date.now() + (error as ProviderError).retryAfter * 1000
            ).toISOString()
          : nowIso(),
        id
      )
      .run();
    if (!transient)
      await notifyOwners(
        env,
        account.account_id,
        account.brand_id,
        "social_sync_failed",
        "A atualização de publicações e métricas precisa de atenção.",
        account.id
      );
  }
}
export async function syncSocialMetrics(env: SocialEnv) {
  const accounts = await env.DB.prepare(
    "SELECT * FROM social_accounts WHERE status!='disconnected' AND provider_account_id IS NOT NULL"
  ).all<SocialAccountRow>();
  for (const account of accounts.results) {
    await env.DB.prepare(
      "INSERT OR IGNORE INTO social_account_days VALUES(?,?,?)"
    )
      .bind(account.account_id, account.id, nowIso().slice(0, 10))
      .run();
    if (account.status !== "active" || !account.native_identity_id) continue;
    const cycle = await currentUsageCycle(env, account.account_id);
    try {
      await env.DB.prepare(
        "INSERT OR IGNORE INTO social_identity_usage VALUES(?,?,?,?,?)"
      )
        .bind(
          account.account_id,
          cycle.cycleStart,
          account.platform,
          account.native_identity_id,
          nowIso()
        )
        .run();
      await enqueueSync(env, account);
    } catch {
      await notifyOwners(
        env,
        account.account_id,
        account.brand_id,
        "social_sync_requires_action",
        "Revise a franquia ou conexão para atualizar métricas.",
        account.id
      );
    }
  }
}
