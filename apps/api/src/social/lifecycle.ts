import { ApiError, nowIso, uuidv7 } from "../common";
import { notifyOwners, recordAudit, currentUsageCycle } from "../foundations";
import type { AuthPrincipal } from "../runtime";
import { provider, ProviderError } from "./provider";
import { operationReplay, ownedDestination } from "./publications";
import {
  destinationDto,
  type AttemptRow,
  type DestinationRow,
  type SocialAccountRow,
  type SocialEnv,
} from "./types";

export async function latestAttempt(env: SocialEnv, row: DestinationRow) {
  return env.DB.prepare(
    "SELECT * FROM social_delivery_attempts WHERE destination_id=? AND version_id=? ORDER BY created_at DESC,id DESC LIMIT 1"
  )
    .bind(row.id, row.current_version_id)
    .first<AttemptRow>();
}
export async function assetHasOpenDestinations(
  env: SocialEnv,
  accountId: string,
  assetId: string
): Promise<boolean> {
  const rows = await env.DB.prepare(
    "SELECT payload_json FROM social_destinations WHERE account_id=? AND status NOT IN ('published','cancelled','failed') UNION ALL SELECT v.payload_json FROM social_destination_versions v JOIN social_destinations d ON d.current_version_id=v.id WHERE d.account_id=? AND d.status NOT IN ('published','cancelled','failed')"
  )
    .bind(accountId, accountId)
    .all<{ payload_json: string }>();
  return rows.results.some((row) => {
    const p = JSON.parse(row.payload_json);
    return p.coverAssetId === assetId || p.mediaAssetIds?.includes(assetId);
  });
}
export async function cancelDestination(
  env: SocialEnv,
  row: DestinationRow
): Promise<DestinationRow> {
  if (row.status === "cancelled") return row;
  if (["published", "publishing"].includes(row.status))
    throw new ApiError(
      409,
      "cancellation_too_late",
      "A rede já iniciou a publicação."
    );
  if (
    row.status === "unknown" ||
    row.status === "submitting" ||
    (row.lease_until && Date.parse(row.lease_until) > Date.now())
  )
    throw new ApiError(
      409,
      "cancellation_requires_reconciliation",
      "Aguarde a confirmação do envio antes de cancelar."
    );
  const changed = await env.DB.prepare(
    "UPDATE social_destinations SET status='cancellation_requested',updated_at=? WHERE id=? AND account_id=? AND status=? AND (lease_until IS NULL OR lease_until<?)"
  )
    .bind(nowIso(), row.id, row.account_id, row.status, nowIso())
    .run();
  if (!changed.meta.changes)
    throw new ApiError(
      409,
      "destination_state_conflict",
      "O destino mudou; tente novamente após atualizar."
    );
  const attempt = await latestAttempt(env, row);
  try {
    if (attempt?.submitted_at && !attempt.provider_post_id)
      throw new ProviderError("cancellation_unconfirmed", true);
    if (
      attempt?.provider_post_id &&
      !(await provider(env).cancelPost(attempt.provider_post_id))
    ) {
      const state = await provider(env).getPost(attempt.provider_post_id);
      await env.DB.prepare(
        "UPDATE social_destinations SET status=?,last_error='cancellation_too_late',updated_at=? WHERE id=? AND status='cancellation_requested'"
      )
        .bind(state?.status ?? "unknown", nowIso(), row.id)
        .run();
      throw new ApiError(
        409,
        "cancellation_too_late",
        "A rede já iniciou a publicação."
      );
    }
    await env.DB.batch([
      env.DB.prepare(
        "UPDATE social_destinations SET status='cancelled',lease_until=NULL,lease_token=NULL,last_error=NULL,updated_at=? WHERE id=? AND status='cancellation_requested'"
      ).bind(nowIso(), row.id),
      env.DB.prepare(
        "UPDATE social_delivery_attempts SET state='cancelled',updated_at=? WHERE destination_id=? AND version_id=?"
      ).bind(nowIso(), row.id, row.current_version_id),
    ]);
  } catch (e) {
    if (e instanceof ApiError) throw e;
    await env.DB.prepare(
      "UPDATE social_destinations SET status='unknown',last_error='cancellation_unconfirmed',updated_at=? WHERE id=? AND status='cancellation_requested'"
    )
      .bind(nowIso(), row.id)
      .run();
    await notifyOwners(
      env,
      row.account_id,
      row.brand_id,
      "cancellation_unconfirmed",
      "O cancelamento precisa de confirmação. Nenhum novo envio será realizado.",
      row.id
    );
  }
  return ownedDestination(env, row.account_id, row.id);
}
export async function mutateDestination(
  env: SocialEnv,
  principal: AuthPrincipal,
  row: DestinationRow,
  action: "cancel" | "retry",
  key: string
) {
  const op = await operationReplay(
    env,
    row.account_id,
    key,
    row.id,
    action,
    {}
  );
  if (op.replay)
    return destinationDto(await ownedDestination(env, row.account_id, row.id));
  if (action === "cancel") {
    await env.DB.prepare("INSERT INTO social_operations VALUES(?,?,?,?,?,?)")
      .bind(row.account_id, key, row.id, action, op.requestHash, nowIso())
      .run();
    let result: DestinationRow;
    try {
      result = await cancelDestination(env, row);
    } catch (error) {
      // A rejected precondition or confirmed too-late cancellation performed no cancel.
      // Release the request key so a later eligible state can execute the operation.
      if (error instanceof ApiError)
        await env.DB.prepare(
          "DELETE FROM social_operations WHERE account_id=? AND operation_key=? AND resource_id=? AND action='cancel'"
        )
          .bind(row.account_id, key, row.id)
          .run();
      throw error;
    }
    await recordAudit(
      env,
      principal,
      "destination.cancel_requested",
      "social_destination",
      row.id,
      row.brand_id
    );
    return destinationDto(result);
  }
  if (row.status !== "failed")
    throw new ApiError(
      409,
      "retry_not_eligible",
      "Somente falhas confirmadas podem ser repetidas."
    );
  const previous = await latestAttempt(env, row);
  if (!previous)
    throw new ApiError(
      409,
      "retry_not_eligible",
      "Tentativa anterior não encontrada."
    );
  const id = uuidv7(),
    timestamp = nowIso();
  await env.DB.batch([
    env.DB.prepare("INSERT INTO social_operations VALUES(?,?,?,?,?,?)").bind(
      row.account_id,
      key,
      row.id,
      action,
      op.requestHash,
      timestamp
    ),
    env.DB.prepare(
      "UPDATE social_destinations SET status='awaiting_handoff',last_error=NULL,lease_until=NULL,updated_at=? WHERE id=? AND status='failed'"
    ).bind(timestamp, row.id),
    env.DB.prepare(
      "INSERT INTO social_delivery_attempts(id,destination_id,version_id,account_id,request_key,provider_post_id,transfers_json,state,created_at,updated_at) VALUES(?,?,?,?,?,?,?,'retry_pending',?,?)"
    ).bind(
      id,
      row.id,
      previous.version_id,
      row.account_id,
      id,
      previous.provider_post_id,
      "{}",
      timestamp,
      timestamp
    ),
  ]);
  await env.SOCIAL_QUEUE.send({ kind: "destination", id: row.id });
  await recordAudit(
    env,
    principal,
    "destination.retry_requested",
    "social_destination",
    row.id,
    row.brand_id
  );
  return destinationDto(await ownedDestination(env, row.account_id, row.id));
}
export async function disconnectAccount(
  env: SocialEnv,
  row: SocialAccountRow
): Promise<SocialAccountRow> {
  if (row.status === "disconnected") return row;
  await currentUsageCycle(env, row.account_id);
  await env.DB.prepare(
    "UPDATE social_accounts SET status='disconnecting',updated_at=? WHERE id=? AND account_id=? AND status!='disconnected'"
  )
    .bind(nowIso(), row.id, row.account_id)
    .run();
  const destinations = await env.DB.prepare(
    "SELECT * FROM social_destinations WHERE social_account_id=? AND account_id=? AND status NOT IN ('published','cancelled','failed')"
  )
    .bind(row.id, row.account_id)
    .all<DestinationRow>();
  let confirmed = true;
  for (const d of destinations.results) {
    try {
      if ((await cancelDestination(env, d)).status !== "cancelled")
        confirmed = false;
    } catch {
      confirmed = false;
    }
  }
  if (confirmed) {
    try {
      if (row.provider_account_id)
        await provider(env).disconnect(row.provider_account_id);
      await env.DB.prepare(
        "UPDATE social_accounts SET status='disconnected',updated_at=? WHERE id=? AND account_id=?"
      )
        .bind(nowIso(), row.id, row.account_id)
        .run();
    } catch {
      confirmed = false;
    }
  }
  if (!confirmed)
    await notifyOwners(
      env,
      row.account_id,
      row.brand_id,
      "disconnect_pending",
      "A desconexão aguarda confirmação das publicações futuras.",
      row.id
    );
  return (await env.DB.prepare(
    "SELECT * FROM social_accounts WHERE id=? AND account_id=?"
  )
    .bind(row.id, row.account_id)
    .first<SocialAccountRow>())!;
}
export async function cancelBrandDestinations(
  env: SocialEnv,
  accountId: string,
  brandId: string
): Promise<boolean> {
  const rows = await env.DB.prepare(
    "SELECT * FROM social_destinations WHERE account_id=? AND brand_id=? AND status NOT IN ('published','cancelled','failed')"
  )
    .bind(accountId, brandId)
    .all<DestinationRow>();
  let ok = true;
  for (const row of rows.results) {
    try {
      if ((await cancelDestination(env, row)).status !== "cancelled")
        ok = false;
    } catch {
      ok = false;
    }
  }
  return ok;
}
export async function disconnectBrandAccounts(
  env: SocialEnv,
  accountId: string,
  brandId: string
): Promise<boolean> {
  const rows = await env.DB.prepare(
    "SELECT * FROM social_accounts WHERE account_id=? AND brand_id=? AND status!='disconnected'"
  )
    .bind(accountId, brandId)
    .all<SocialAccountRow>();
  let ok = true;
  for (const row of rows.results)
    if ((await disconnectAccount(env, row)).status !== "disconnected")
      ok = false;
  return ok;
}
