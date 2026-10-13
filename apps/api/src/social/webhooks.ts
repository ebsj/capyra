import { ApiError, nowIso, uuidv7 } from "../common";
import { notifyOwners } from "../foundations";
import { provider } from "./provider";
import { reconcileDestination } from "./worker";
import type { DestinationRow, SocialAccountRow, SocialEnv } from "./types";
export async function verifySignature(
  body: string,
  signature: string | undefined,
  secret: string | undefined
): Promise<boolean> {
  if (!signature || !secret || !/^[0-9a-f]{64}$/.test(signature)) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const bytes = new Uint8Array(
    signature.match(/../g)!.map((s) => parseInt(s, 16))
  );
  return crypto.subtle.verify(
    "HMAC",
    key,
    bytes,
    new TextEncoder().encode(body)
  );
}
export async function receiveWebhook(
  env: SocialEnv,
  raw: string,
  signature: string | undefined
) {
  if (raw.length > 1024 * 1024)
    throw new ApiError(413, "webhook_too_large", "Evento excede o limite.");
  if (!(await verifySignature(raw, signature, env.ZERNIO_WEBHOOK_SECRET)))
    throw new ApiError(
      401,
      "webhook_signature_invalid",
      "Assinatura inválida."
    );
  let payload: { id?: string; event?: string };
  try {
    payload = JSON.parse(raw);
  } catch {
    throw new ApiError(400, "webhook_invalid", "Evento inválido.");
  }
  if (
    typeof payload.id !== "string" ||
    payload.id.length > 200 ||
    typeof payload.event !== "string"
  )
    throw new ApiError(400, "webhook_invalid", "Evento inválido.");
  const id = uuidv7();
  const inserted = await env.DB.prepare(
    "INSERT OR IGNORE INTO social_webhook_inbox(id,event_id,body_json,created_at) VALUES(?,?,?,?)"
  )
    .bind(id, payload.id, raw, nowIso())
    .run();
  if (inserted.meta.changes) {
    try {
      await env.SOCIAL_QUEUE.send({ kind: "webhook", id });
    } catch {
      /* durable inbox is recovered by cron */
    }
  }
}
export async function processWebhook(env: SocialEnv, id: string) {
  const inbox = await env.DB.prepare(
    "SELECT * FROM social_webhook_inbox WHERE id=? AND processed_at IS NULL"
  )
    .bind(id)
    .first<{ body_json: string }>();
  if (!inbox) return;
  const data = JSON.parse(inbox.body_json) as Record<string, unknown>;
  const event = String(data.event);
  const post = (data.post ?? {}) as Record<string, unknown>;
  const account = (data.account ?? {}) as Record<string, unknown>;
  if (event.startsWith("post.")) {
    const postId = post.id ?? post._id ?? data.postId;
    if (typeof postId === "string") {
      const rows = await env.DB.prepare(
        "SELECT d.* FROM social_destinations d JOIN social_delivery_attempts a ON a.destination_id=d.id WHERE a.provider_post_id=? AND d.current_version_id=a.version_id"
      )
        .bind(postId)
        .all<DestinationRow>();
      for (const row of rows.results) await reconcileDestination(env, row);
    }
  }
  if (event === "account.disconnected") {
    const accountId = account.id ?? account._id ?? data.accountId;
    if (typeof accountId === "string") {
      const row = await env.DB.prepare(
        "SELECT * FROM social_accounts WHERE provider_account_id=?"
      )
        .bind(accountId)
        .first<SocialAccountRow>();
      if (
        row &&
        row.status === "active" &&
        !(await provider(env).capabilities(row)).canPost
      ) {
        await env.DB.prepare(
          "UPDATE social_accounts SET status='requires_action',updated_at=? WHERE id=? AND status='active'"
        )
          .bind(nowIso(), row.id)
          .run();
        await notifyOwners(
          env,
          row.account_id,
          row.brand_id,
          "social_authorization_lost",
          "A conta social precisa ser reconectada.",
          row.id
        );
      }
    }
  }
  // No tenant is accepted from event claims. Unknown mappings are acknowledged without mutating domain state.
  await env.DB.prepare(
    "UPDATE social_webhook_inbox SET processed_at=?,body_json='{}' WHERE id=? AND processed_at IS NULL"
  )
    .bind(nowIso(), id)
    .run();
}
