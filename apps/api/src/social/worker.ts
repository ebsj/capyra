import { nowIso, uuidv7 } from "../common";
import { notifyOwners, requireActiveBrand } from "../foundations";
import { latestAttempt, disconnectAccount } from "./lifecycle";
import { preflight, validateReferences } from "./publications";
import { provider, ProviderError, postBody } from "./provider";
import { processSyncJob, syncSocialMetrics } from "./analytics";
import { processWebhook } from "./webhooks";
import type {
  AttemptRow,
  DestinationRow,
  ProviderPost,
  SocialAccountRow,
  SocialEnv,
  SocialMessage,
  Payload,
} from "./types";

export async function applyPost(
  env: SocialEnv,
  row: DestinationRow,
  attempt: AttemptRow,
  post: ProviderPost
) {
  if (row.status === "cancelled") return;
  if (row.status === "published") {
    if (post.status === "published")
      await env.DB.prepare(
        "UPDATE social_delivery_attempts SET native_post_id=COALESCE(?,native_post_id),published_url=COALESCE(?,published_url),updated_at=? WHERE id=? AND state='published'"
      )
        .bind(post.nativePostId ?? null, post.url ?? null, nowIso(), attempt.id)
        .run();
    return;
  }
  const applied = await env.DB.batch([
    env.DB.prepare(
      "UPDATE social_delivery_attempts SET provider_post_id=?,native_post_id=COALESCE(?,native_post_id),published_url=COALESCE(?,published_url),state=?,error_code=?,updated_at=? WHERE id=? AND EXISTS(SELECT 1 FROM social_destinations WHERE id=social_delivery_attempts.destination_id AND status NOT IN ('published','cancelled'))"
    ).bind(
      post.id,
      post.nativePostId ?? null,
      post.url ?? null,
      post.status,
      post.error ?? null,
      nowIso(),
      attempt.id
    ),
    env.DB.prepare(
      "UPDATE social_destinations SET status=?,last_error=?,lease_until=NULL,lease_token=NULL,updated_at=? WHERE id=? AND current_version_id=? AND status NOT IN ('published','cancelled')"
    ).bind(
      post.status,
      post.error ?? null,
      nowIso(),
      row.id,
      attempt.version_id
    ),
  ]);
  if (!applied[1].meta.changes) return;
  if (post.status === "failed" || post.status === "unknown")
    await notifyOwners(
      env,
      row.account_id,
      row.brand_id,
      post.error ?? "delivery_requires_action",
      "Um destino precisa de atenção. Consulte os detalhes da publicação.",
      row.id
    );
}
export async function reconcileDestination(
  env: SocialEnv,
  row: DestinationRow
) {
  const attempt = await latestAttempt(env, row);
  if (!attempt) return;
  const account = await env.DB.prepare(
    "SELECT * FROM social_accounts WHERE id=?"
  )
    .bind(row.social_account_id)
    .first<SocialAccountRow>();
  if (!account) return;
  const remote = provider(env);
  const post = attempt.provider_post_id
    ? await remote.getPost(attempt.provider_post_id)
    : attempt.submitted_at
    ? await remote.recoverPost(account, attempt.request_key)
    : null;
  if (post) {
    if (
      row.last_error === "cancellation_unconfirmed" &&
      post.status === "scheduled"
    ) {
      const confirmed = await remote.cancelPost(post.id);
      if (confirmed) post.status = "cancelled";
    }
    await applyPost(env, row, attempt, post);
  } else if (
    row.last_error === "cancellation_unconfirmed" &&
    attempt.provider_post_id
  ) {
    await applyPost(env, row, attempt, {
      id: attempt.provider_post_id,
      status: "cancelled",
    });
  } else
    await env.DB.prepare(
      "UPDATE social_destinations SET updated_at=? WHERE id=? AND status=?"
    )
      .bind(nowIso(), row.id, row.status)
      .run();
  // Absence in a listing does not prove a timed-out write failed. Leave unknown for operator action.
}
export async function processDestination(env: SocialEnv, id: string) {
  const row = await env.DB.prepare(
    "SELECT * FROM social_destinations WHERE id=?"
  )
    .bind(id)
    .first<DestinationRow>();
  if (
    !row ||
    ["draft", "published", "cancelled", "failed"].includes(row.status)
  )
    return;
  if (
    ["scheduled", "publishing", "unknown", "cancellation_requested"].includes(
      row.status
    )
  ) {
    await reconcileDestination(env, row);
    return;
  }
  if (
    row.scheduled_at &&
    Date.parse(row.scheduled_at) > Date.now() + 6 * 86400000
  )
    return;
  const now = nowIso(),
    lease = uuidv7();
  const locked = await env.DB.prepare(
    "UPDATE social_destinations SET lease_token=?,lease_until=? WHERE id=? AND status IN ('awaiting_handoff','submitting') AND (lease_until IS NULL OR lease_until<?)"
  )
    .bind(lease, new Date(Date.now() + 10 * 60000).toISOString(), id, now)
    .run();
  if (!locked.meta.changes) return;
  const attempt = await latestAttempt(env, row);
  if (!attempt) return;
  if (attempt.retry_after && Date.parse(attempt.retry_after) > Date.now()) {
    await env.DB.prepare(
      "UPDATE social_destinations SET lease_until=NULL,lease_token=NULL WHERE id=? AND lease_token=?"
    )
      .bind(id, lease)
      .run();
    return;
  }
  try {
    // A lease expiry after writing must reconcile, never repeat a potentially delivered request.
    if (attempt.submitted_at) {
      await env.DB.prepare(
        "UPDATE social_destinations SET status='unknown',last_error='delivery_unconfirmed',lease_until=NULL,lease_token=NULL WHERE id=? AND lease_token=?"
      )
        .bind(id, lease)
        .run();
      await reconcileDestination(env, { ...row, status: "unknown" });
      return;
    }
    await requireActiveBrand(env, row.account_id, row.brand_id);
    const checked = await preflight(env, row);
    if (!checked.valid) throw new ProviderError("preflight_failed");
    const version = await env.DB.prepare(
      "SELECT payload_json FROM social_destination_versions WHERE id=? AND destination_id=?"
    )
      .bind(attempt.version_id, id)
      .first<{ payload_json: string }>();
    if (!version) throw new ProviderError("version_missing");
    const payload = JSON.parse(version.payload_json) as Payload;
    const { account, assets } = await validateReferences(
      env,
      row.account_id,
      row.brand_id,
      payload
    );
    const remote = provider(env);
    const urls = JSON.parse(attempt.transfers_json) as Record<string, string>;
    for (const asset of assets) {
      if (urls[asset.id]) continue;
      const object = await env.STORAGE.get(asset.object_key);
      if (!object?.body) throw new ProviderError("media_missing");
      urls[asset.id] = await remote.transfer(asset, object.body);
      await env.DB.prepare(
        "UPDATE social_delivery_attempts SET transfers_json=?,updated_at=? WHERE id=?"
      )
        .bind(JSON.stringify(urls), nowIso(), attempt.id)
        .run();
    }
    const body = postBody(account, payload, urls, row.scheduled_at);
    body.metadata = { capyraAttemptId: attempt.request_key };
    const validation = await remote.validate(body);
    if (!validation.valid) throw new ProviderError("provider_preflight_failed");
    const owned = await env.DB.prepare(
      "UPDATE social_destinations SET status='submitting',updated_at=? WHERE id=? AND lease_token=? AND status IN ('awaiting_handoff','submitting')"
    )
      .bind(nowIso(), id, lease)
      .run();
    if (!owned.meta.changes) return;
    await env.DB.prepare(
      "UPDATE social_delivery_attempts SET submitted_at=?,state='submitting',updated_at=? WHERE id=? AND submitted_at IS NULL"
    )
      .bind(nowIso(), nowIso(), attempt.id)
      .run();
    const result =
      attempt.state === "retry_pending" && attempt.provider_post_id
        ? await remote.retryPost(attempt.provider_post_id, body)
        : await remote.createPost(body, attempt.request_key);
    await applyPost(env, row, attempt, result);
  } catch (error) {
    const failure =
      error instanceof ProviderError
        ? error
        : new ProviderError("delivery_internal_error", true);
    const persisted = await latestAttempt(env, row);
    const uncertain = failure.uncertain && Boolean(persisted?.submitted_at);
    const canRetry =
      !uncertain && failure.retryAfter > 0 && attempt.retry_count < 5;
    const state = uncertain
      ? "unknown"
      : canRetry
      ? "awaiting_handoff"
      : "failed";
    await env.DB.batch([
      env.DB.prepare(
        "UPDATE social_destinations SET status=?,last_error=?,lease_until=NULL,lease_token=NULL,updated_at=? WHERE id=? AND lease_token=?"
      ).bind(state, failure.code, nowIso(), id, lease),
      env.DB.prepare(
        "UPDATE social_delivery_attempts SET state=?,error_code=?,submitted_at=CASE WHEN ? THEN NULL ELSE submitted_at END,retry_count=retry_count+1,retry_after=?,updated_at=? WHERE id=?"
      ).bind(
        canRetry
          ? attempt.state === "retry_pending"
            ? "retry_pending"
            : "pending"
          : state,
        failure.code,
        canRetry ? 1 : 0,
        canRetry
          ? new Date(
              Date.now() +
                Math.max(failure.retryAfter, 2 ** attempt.retry_count * 10) *
                  1000
            ).toISOString()
          : null,
        nowIso(),
        attempt.id
      ),
    ]);
    if (!canRetry)
      await notifyOwners(
        env,
        row.account_id,
        row.brand_id,
        failure.code,
        "Um destino precisa de atenção antes de continuar.",
        id
      );
  }
}
export async function consumeSocialMessage(
  env: SocialEnv,
  message: SocialMessage
) {
  if (message.kind === "destination") await processDestination(env, message.id);
  else if (message.kind === "webhook") await processWebhook(env, message.id);
  else if (message.kind === "sync" || message.kind === "import")
    await processSyncJob(env, message.id);
}
export async function markSocialDlqFailure(
  env: SocialEnv,
  message: SocialMessage
) {
  if (message.kind === "destination") {
    const row = await env.DB.prepare(
      "SELECT * FROM social_destinations WHERE id=?"
    )
      .bind(message.id)
      .first<DestinationRow>();
    if (row && !["published", "cancelled"].includes(row.status)) {
      const attempt = await latestAttempt(env, row);
      await env.DB.prepare(
        "UPDATE social_destinations SET status=?,last_error=?,lease_until=NULL,lease_token=NULL WHERE id=?"
      )
        .bind(
          attempt?.submitted_at ? "unknown" : "failed",
          "social_job_exhausted",
          row.id
        )
        .run();
      if (attempt)
        await env.DB.prepare(
          "UPDATE social_delivery_attempts SET state=?,error_code=?,updated_at=? WHERE id=?"
        )
          .bind(
            attempt.submitted_at ? "unknown" : "failed",
            "social_job_exhausted",
            nowIso(),
            attempt.id
          )
          .run();
      await notifyOwners(
        env,
        row.account_id,
        row.brand_id,
        "social_job_exhausted",
        "O processamento social requer atenção.",
        row.id
      );
    }
  }
  if (message.kind === "sync" || message.kind === "import")
    await env.DB.prepare(
      "UPDATE social_sync_jobs SET state='failed',updated_at=? WHERE id=?"
    )
      .bind(nowIso(), message.id)
      .run();
}
export async function reconcileSocial(env: SocialEnv) {
  if (!env.CAPYRA_SOCIAL_PROVIDER) return;
  const rows = await env.DB.prepare(
    "SELECT * FROM social_destinations WHERE status IN ('awaiting_handoff','submitting','scheduled','publishing','unknown','cancellation_requested') AND (lease_until IS NULL OR lease_until<?) AND (status!='awaiting_handoff' OR scheduled_at IS NULL OR scheduled_at<=?) ORDER BY updated_at LIMIT 100"
  )
    .bind(nowIso(), new Date(Date.now() + 6 * 86400000).toISOString())
    .all<DestinationRow>();
  for (const row of rows.results) {
    if (
      row.status === "awaiting_handoff" &&
      row.scheduled_at &&
      Date.parse(row.scheduled_at) > Date.now() + 6 * 86400000
    )
      continue;
    await env.SOCIAL_QUEUE.send({ kind: "destination", id: row.id });
  }
  const inbox = await env.DB.prepare(
    "SELECT id FROM social_webhook_inbox WHERE processed_at IS NULL ORDER BY created_at LIMIT 100"
  ).all<{ id: string }>();
  for (const row of inbox.results)
    await env.SOCIAL_QUEUE.send({ kind: "webhook", id: row.id });
  const jobs = await env.DB.prepare(
    "SELECT id,kind FROM social_sync_jobs WHERE state IN ('pending','running') ORDER BY updated_at LIMIT 100"
  ).all<{ id: string; kind: "sync" | "import" }>();
  for (const row of jobs.results)
    await env.SOCIAL_QUEUE.send({ kind: row.kind, id: row.id });
  const disconnecting = await env.DB.prepare(
    "SELECT * FROM social_accounts WHERE status='disconnecting' LIMIT 30"
  ).all<SocialAccountRow>();
  for (const row of disconnecting.results) {
    try {
      await disconnectAccount(env, row);
    } catch {
      /* next reconciliation retains request */
    }
  }
}
export { syncSocialMetrics };
