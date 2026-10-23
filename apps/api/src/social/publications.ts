import { z } from "zod";
import { validateLinkedInMedia } from "./linkedin";
import { ApiError, nowIso, uuidv7 } from "../common";
import { requireActiveBrand, recordAudit } from "../foundations";
import type { AuthPrincipal } from "../runtime";
import { baseline, provider } from "./provider";
import {
  destinationDto,
  type Asset,
  type Capabilities,
  type DestinationRow,
  type Payload,
  type SocialAccountRow,
  type SocialEnv,
} from "./types";

export const payloadSchema = z
  .object({
    socialAccountId: z.string().uuid(),
    format: z.enum([
      "feed",
      "reel",
      "story",
      "carousel",
      "video",
      "photo_carousel",
      "short",
      "text",
    ]),
    content: z.string().max(5000).default(""),
    title: z.string().max(100).optional(),
    description: z.string().max(5000).optional(),
    mediaAssetIds: z.array(z.string().uuid()).max(35).default([]),
    coverAssetId: z.string().uuid().optional(),
    analysisId: z.string().uuid().optional(),
    settings: z
      .object({
        privacyLevel: z
          .enum([
            "PUBLIC_TO_EVERYONE",
            "MUTUAL_FOLLOW_FRIENDS",
            "FOLLOWER_OF_CREATOR",
            "SELF_ONLY",
            "public",
            "private",
            "unlisted",
          ])
          .optional(),
        previewConfirmed: z.boolean().optional(),
        expressConsentGiven: z.boolean().optional(),
        allowComment: z.boolean().optional(),
        allowDuet: z.boolean().optional(),
        allowStitch: z.boolean().optional(),
        isAiGenerated: z.boolean().optional(),
        commercialContentType: z
          .enum(["none", "brand_organic", "brand_content"])
          .optional(),
        shareToFeed: z.boolean().optional(),
        madeForKids: z.boolean().optional(),
        containsSyntheticMedia: z.boolean().optional(),
        tags: z.array(z.string().max(100)).max(50).optional(),
        coverTimestampMs: z.number().nonnegative().optional(),
      })
      .strict()
      .default({}),
  })
  .strict();
export function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    throw new ApiError(
      422,
      "validation_error",
      "Revise os campos informados.",
      {
        issues: parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      }
    );
  return parsed.data;
}
export async function hash(value: string) {
  const bytes = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
  );
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}
export async function ownedAccount(
  env: SocialEnv,
  accountId: string,
  id: string
) {
  const row = await env.DB.prepare(
    "SELECT * FROM social_accounts WHERE id=? AND account_id=?"
  )
    .bind(id, accountId)
    .first<SocialAccountRow>();
  if (!row)
    throw new ApiError(
      404,
      "social_account_not_found",
      "Conta social não encontrada."
    );
  return row;
}
export async function ownedDestination(
  env: SocialEnv,
  accountId: string,
  id: string,
  publicationId?: string
) {
  const row = await env.DB.prepare(
    `SELECT * FROM social_destinations WHERE id=? AND account_id=? ${
      publicationId ? "AND publication_id=?" : ""
    }`
  )
    .bind(...[id, accountId, ...(publicationId ? [publicationId] : [])])
    .first<DestinationRow>();
  if (!row)
    throw new ApiError(404, "destination_not_found", "Destino não encontrado.");
  return row;
}
export async function getPublication(
  env: SocialEnv,
  accountId: string,
  id: string
) {
  const row = await env.DB.prepare(
    "SELECT * FROM social_publications WHERE id=? AND account_id=?"
  )
    .bind(id, accountId)
    .first<{
      id: string;
      brand_id: string;
      title: string;
      created_at: string;
      updated_at: string;
    }>();
  if (!row)
    throw new ApiError(
      404,
      "publication_not_found",
      "Publicação não encontrada."
    );
  const rows = await env.DB.prepare(
    "SELECT * FROM social_destinations WHERE publication_id=? AND account_id=? ORDER BY id"
  )
    .bind(id, accountId)
    .all<DestinationRow>();
  const destinations = await Promise.all(
    rows.results.map(async (d) => ({
      ...destinationDto(d),
      versions: (
        await env.DB.prepare(
          "SELECT id,created_at,scheduled_at,payload_json,time_zone,local_date_time FROM social_destination_versions WHERE destination_id=? AND account_id=? ORDER BY created_at DESC"
        )
          .bind(d.id, accountId)
          .all<{
            id: string;
            created_at: string;
            scheduled_at: string | null;
            payload_json: string;
            time_zone: string | null;
            local_date_time: string | null;
          }>()
      ).results.map((v) => ({
        id: v.id,
        createdAt: v.created_at,
        scheduledAt: v.scheduled_at,
        snapshot: JSON.parse(v.payload_json) as Payload,
        timeZone: v.time_zone,
        localDateTime: v.local_date_time,
      })),
      attempts: (
        await env.DB.prepare(
          "SELECT id,state,error_code,created_at,updated_at FROM social_delivery_attempts WHERE destination_id=? AND account_id=? ORDER BY created_at DESC"
        )
          .bind(d.id, accountId)
          .all<{
            id: string;
            state: string;
            error_code: string | null;
            created_at: string;
            updated_at: string;
          }>()
      ).results.map((a) => ({
        id: a.id,
        status: a.state,
        lastError: a.error_code,
        createdAt: a.created_at,
        updatedAt: a.updated_at,
      })),
    }))
  );
  return {
    id: row.id,
    brandId: row.brand_id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: aggregateStatus(rows.results.map((d) => d.status)),
    destinations,
  };
}
export function aggregateStatus(states: string[]): string {
  if (!states.length || states.every((s) => s === "draft")) return "draft";
  if (states.every((s) => s === "published")) return "published";
  if (states.every((s) => s === "cancelled")) return "cancelled";
  if (states.includes("unknown")) return "unknown";
  if (states.includes("cancellation_requested"))
    return "cancellation_requested";
  if (states.some((s) => ["submitting", "publishing"].includes(s)))
    return "publishing";
  if (states.some((s) => ["awaiting_handoff", "scheduled"].includes(s)))
    return "scheduled";
  if (states.includes("published")) return "partial";
  if (states.includes("failed")) return "failed";
  return "draft";
}
export async function validateReferences(
  env: SocialEnv,
  accountId: string,
  brandId: string,
  payload: Payload
) {
  const account = await ownedAccount(env, accountId, payload.socialAccountId);
  if (account.brand_id !== brandId)
    throw new ApiError(
      404,
      "social_account_not_found",
      "Conta social não encontrada nesta Marca."
    );
  const ids = [
    ...new Set([
      ...payload.mediaAssetIds,
      ...(payload.coverAssetId ? [payload.coverAssetId] : []),
    ]),
  ];
  const assets: Asset[] = [];
  for (const id of ids) {
    const asset = await env.DB.prepare(
      "SELECT * FROM source_assets WHERE id=? AND account_id=? AND brand_id=? AND upload_status='completed' AND deleted_at IS NULL"
    )
      .bind(id, accountId, brandId)
      .first<Asset>();
    if (!asset)
      throw new ApiError(
        404,
        "source_asset_not_found",
        "Mídia não encontrada nesta Marca."
      );
    assets.push(asset);
  }
  if (payload.analysisId) {
    const analysis = await env.DB.prepare(
      "SELECT id FROM video_analyses WHERE id=? AND account_id=? AND brand_id=? AND status='completed' AND deleted_at IS NULL"
    )
      .bind(payload.analysisId, accountId, brandId)
      .first();
    if (!analysis)
      throw new ApiError(
        422,
        "analysis_link_invalid",
        "O vínculo exige análise concluída desta Marca."
      );
  }
  return { account, assets };
}
export interface Issue {
  field: string;
  code: string;
  message: string;
}
export function validateMedia(
  payload: Payload,
  account: SocialAccountRow,
  assets: Asset[],
  capabilities: Capabilities
): Issue[] {
  const issues: Issue[] = [];
  const add = (field: string, code: string, message: string) =>
    issues.push({ field, code, message });
  if (account.status !== "active" || account.identity_status !== "verified")
    add(
      "socialAccountId",
      "identity_unverified",
      "A conta social precisa de identidade verificada e conexão ativa."
    );
  if (!capabilities.canPost)
    add(
      "socialAccountId",
      "authorization_required",
      "A rede requer revisão da autorização."
    );
  if (!capabilities.formats.includes(payload.format))
    add("format", "unsupported_format", "Formato não suportado nesta rede.");
  const media = payload.mediaAssetIds.map(
    (id) => assets.find((a) => a.id === id)!
  );
  const videos = media.filter((a) => a.media_kind === "video");
  const images = media.filter((a) => a.media_kind === "image");
  if (!media.length && !(account.platform === "linkedin" && payload.format === "text")) add("mediaAssetIds", "media_required", "Adicione mídia.");
  if (new Set(payload.mediaAssetIds).size !== payload.mediaAssetIds.length)
    add("mediaAssetIds", "duplicate_media", "Não repita a mesma mídia.");
  if (payload.content.length > capabilities.limits.maxContentLength)
    add("content", "content_too_long", "O texto excede o limite da rede.");
  if (account.platform === "linkedin")
    issues.push(...validateLinkedInMedia(payload, media, capabilities));
  if (account.platform === "instagram") {
    if (
      payload.format === "feed" &&
      (media.length !== 1 || images.length !== 1)
    )
      add(
        "mediaAssetIds",
        "feed_requires_image",
        "Feed exige uma imagem; use Reels para vídeo."
      );
    if (
      payload.format === "reel" &&
      (media.length !== 1 || videos.length !== 1)
    )
      add("mediaAssetIds", "reel_requires_video", "Reels exige um vídeo.");
    if (payload.format === "story" && media.length !== 1)
      add("mediaAssetIds", "story_single_media", "Story exige uma mídia.");
    if (
      payload.format === "carousel" &&
      (media.length < 2 || media.length > 10)
    )
      add("mediaAssetIds", "carousel_count", "Carrossel exige 2 a 10 mídias.");
  }
  if (account.platform === "tiktok") {
    if (
      payload.format === "video" &&
      (videos.length !== 1 || media.length !== 1)
    )
      add("mediaAssetIds", "video_single", "Selecione um vídeo.");
    if (
      payload.format === "photo_carousel" &&
      (videos.length || images.length < 1 || images.length > 35)
    )
      add("mediaAssetIds", "photo_count", "Selecione de 1 a 35 imagens.");
    if (payload.format === "video" && payload.content.length > 2200)
      add(
        "content",
        "caption_too_long",
        "A legenda do vídeo aceita até 2200 caracteres."
      );
    if (
      payload.format === "photo_carousel" &&
      (payload.title ?? payload.content).length > 90
    )
      add(
        "title",
        "photo_title_too_long",
        "O título das fotos aceita até 90 caracteres."
      );
    if (
      payload.settings.previewConfirmed !== true ||
      payload.settings.expressConsentGiven !== true
    )
      add(
        "settings",
        "consent_required",
        "Confirme a prévia e autorize a publicação."
      );
    for (const key of [
      "allowComment",
      ...(payload.format === "video" ? ["allowDuet", "allowStitch"] : []),
    ])
      if (typeof payload.settings[key] !== "boolean")
        add(
          `settings.${key}`,
          "interaction_choice_required",
          "Escolha explicitamente esta permissão."
        );
    const names: Record<string, string> = {
      allow_comment: "allowComment",
      allow_duet: "allowDuet",
      allow_stitch: "allowStitch",
    };
    for (const [key, value] of Object.entries(
      capabilities.interactionSettings ?? {}
    ))
      if (value?.enabled === false && payload.settings[names[key]] === true)
        add(
          `settings.${names[key]}`,
          "interaction_disabled",
          "A conta não permite esta interação."
        );
  }
  if (
    account.platform === "youtube" &&
    (media.length !== 1 || videos.length !== 1)
  )
    add(
      "mediaAssetIds",
      "youtube_single_video",
      "YouTube exige exatamente um vídeo."
    );
  if (account.platform === "youtube" && !(payload.title ?? "").trim())
    add("title", "title_required", "Informe o título do vídeo.");
  if (
    capabilities.privacyLevels &&
    !capabilities.privacyLevels.includes(String(payload.settings.privacyLevel))
  )
    add(
      "settings.privacyLevel",
      "privacy_required",
      "Selecione uma privacidade permitida."
    );
  for (const asset of media) {
    const metadata = asset.metadata_json
      ? JSON.parse(asset.metadata_json)
      : null;
    if (asset.metadata_status !== "ready" || !metadata) {
      add(
        "mediaAssetIds",
        "metadata_pending",
        "Aguarde a inspeção técnica da mídia."
      );
      continue;
    }
    if (asset.content_length > capabilities.limits.maxBytes)
      add("mediaAssetIds", "media_too_large", "O arquivo excede o limite.");
    if (asset.media_kind === "image") {
      const max =
        ["instagram", "linkedin"].includes(account.platform) ? 8 * 1024 * 1024 : 20 * 1024 * 1024;
      if (asset.content_length > max)
        add(
          "mediaAssetIds",
          "image_too_large",
          "Envie uma variante menor da imagem."
        );
      if (
        account.platform === "instagram" &&
        !["image/jpeg", "image/png"].includes(asset.content_type)
      )
        add(
          "mediaAssetIds",
          "image_format",
          "Instagram exige imagem JPEG ou PNG."
        );
    }
    if (asset.media_kind === "video") {
      const max =
        account.platform === "instagram" && payload.format === "story"
          ? 60
          : payload.format === "short"
          ? 180
          : capabilities.limits.maxVideoSeconds;
      if (
        typeof metadata.durationSeconds !== "number" ||
        metadata.durationSeconds < capabilities.limits.minVideoSeconds ||
        metadata.durationSeconds > max
      )
        add(
          "mediaAssetIds",
          "video_duration",
          "A duração do vídeo não é compatível com o formato."
        );
      if (
        account.platform === "instagram" &&
        payload.format === "story" &&
        asset.content_length > 100 * 1024 * 1024
      )
        add(
          "mediaAssetIds",
          "story_size",
          "Stories aceita vídeo de até 100 MB."
        );
      if (
        account.platform === "instagram" &&
        (!["video/mp4", "video/quicktime"].includes(asset.content_type) ||
          metadata.codec !== "h264")
      )
        add(
          "mediaAssetIds",
          "video_codec",
          "Envie vídeo MP4 ou MOV com codec H.264."
        );
    }
    const ratio = Number(metadata.width) / Number(metadata.height);
    if (!Number.isFinite(ratio) || ratio <= 0)
      add(
        "mediaAssetIds",
        "dimensions_invalid",
        "Dimensões da mídia não estão disponíveis."
      );
    else if (
      account.platform === "instagram" &&
      ["carousel", "feed"].includes(payload.format) &&
      (ratio < 0.5625 || ratio > 1.91)
    )
      add(
        "mediaAssetIds",
        "aspect_ratio",
        "Feed e carrossel requerem proporção entre 9:16 e 1.91:1."
      );
    else if (
      (account.platform === "instagram" &&
        ["reel", "story"].includes(payload.format) &&
        Math.abs(ratio - 9 / 16) > 0.02) ||
      (payload.format === "short" && ratio > 1)
    )
      add(
        "mediaAssetIds",
        "aspect_ratio",
        "Envie uma variante 9:16 para Reels/Stories ou vertical/quadrada para Shorts."
      );
  }
  if (account.platform === "instagram" && payload.format === "carousel") {
    const ratios = media
      .map((a) => (a.metadata_json ? JSON.parse(a.metadata_json) : null))
      .filter(Boolean)
      .map((m) => Number(m.width) / Number(m.height));
    if (ratios.some((r) => Math.abs(r - ratios[0]) > 0.02))
      add(
        "mediaAssetIds",
        "carousel_aspect_mismatch",
        "Envie variantes com a mesma proporção para evitar cortes pela rede."
      );
  }
  if (payload.coverAssetId) {
    const cover = assets.find((a) => a.id === payload.coverAssetId)!;
    if (
      cover.media_kind !== "image" ||
      cover.metadata_status !== "ready" ||
      cover.content_length > 10 * 1024 * 1024
    )
      add(
        "coverAssetId",
        "cover_invalid",
        "A capa precisa ser imagem inspecionada de até 10 MB."
      );
  }
  return issues;
}
export async function preflight(env: SocialEnv, row: DestinationRow) {
  const payload = JSON.parse(row.payload_json) as Payload;
  const { account, assets } = await validateReferences(
    env,
    row.account_id,
    row.brand_id,
    payload
  );
  let capabilities = baseline(account.platform, account.identity_status);
  if (account.status === "active")
    capabilities = await provider(env).capabilities(account, payload.format);
  const issues = validateMedia(payload, account, assets, capabilities);
  return { valid: !issues.length, issues, capabilities };
}
/** Find all UTC instants that render as the supplied wall clock; reject DST gaps and folds. */
export function localToUtc(local: string, timeZone: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(local))
    throw new ApiError(
      422,
      "invalid_local_time",
      "Informe data e hora local sem deslocamento."
    );
  const target = local.length === 16 ? `${local}:00` : local;
  const tentative = Date.parse(`${target}Z`);
  if (
    !Number.isFinite(tentative) ||
    new Date(tentative).toISOString().slice(0, 19) !== target
  )
    throw new ApiError(422, "invalid_local_time", "Data e hora inválidas.");
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const render = (ms: number) =>
    formatter.format(new Date(ms)).replace(" ", "T");
  const offsets = new Set<number>();
  for (let delta = -48; delta <= 48; delta += 6) {
    const instant = tentative + delta * 3600000;
    offsets.add(Date.parse(`${render(instant)}Z`) - instant);
  }
  const matches = [...offsets]
    .map((offset) => tentative - offset)
    .filter((ms) => render(ms) === target);
  if (matches.length !== 1)
    throw new ApiError(
      422,
      "ambiguous_local_time",
      "O horário não existe ou é ambíguo neste fuso. Escolha outro horário."
    );
  return new Date(matches[0]).toISOString();
}
export async function operationReplay(
  env: SocialEnv,
  accountId: string,
  key: string,
  resourceId: string,
  action: string,
  body: unknown
) {
  if (!key || key.length > 200)
    throw new ApiError(
      422,
      "idempotency_key_required",
      "Informe Idempotency-Key de até 200 caracteres."
    );
  const requestHash = await hash(JSON.stringify(body));
  const existing = await env.DB.prepare(
    "SELECT * FROM social_operations WHERE account_id=? AND operation_key=?"
  )
    .bind(accountId, key)
    .first<{ resource_id: string; action: string; request_hash: string }>();
  if (
    existing &&
    (existing.resource_id !== resourceId ||
      existing.action !== action ||
      existing.request_hash !== requestHash)
  )
    throw new ApiError(
      409,
      "idempotency_conflict",
      "Esta chave já identifica outra operação."
    );
  return { replay: !!existing, requestHash };
}
export async function submitDestination(
  env: SocialEnv,
  principal: AuthPrincipal,
  row: DestinationRow,
  key: string,
  body: { publishNow: boolean; localDateTime?: string }
) {
  const op = await operationReplay(
    env,
    row.account_id,
    key,
    row.id,
    "submit",
    body
  );
  if (op.replay)
    return destinationDto(await ownedDestination(env, row.account_id, row.id));
  const brand = await requireActiveBrand(env, row.account_id, row.brand_id, {
    confirmed: true,
  });
  if (!["draft", "cancelled"].includes(row.status))
    throw new ApiError(
      409,
      "destination_state_conflict",
      "Este destino não está em rascunho."
    );
  const result = await preflight(env, row);
  if (!result.valid)
    throw new ApiError(
      422,
      "preflight_failed",
      "Corrija os itens indicados antes de publicar.",
      { issues: result.issues }
    );
  const scheduled = body.publishNow
    ? null
    : localToUtc(body.localDateTime ?? "", brand.time_zone);
  if (scheduled && Date.parse(scheduled) <= Date.now() + 60000)
    throw new ApiError(
      422,
      "schedule_in_past",
      "Agende pelo menos um minuto no futuro."
    );
  const version = uuidv7(),
    attempt = uuidv7(),
    now = nowIso();
  // The guard trigger makes stale drafts fail the entire batch, including operation/version inserts.
  await env.DB.batch([
    env.DB.prepare("INSERT INTO social_operations VALUES(?,?,?,?,?,?)").bind(
      row.account_id,
      key,
      row.id,
      "submit",
      op.requestHash,
      now
    ),
    env.DB.prepare(
      "INSERT INTO social_destination_versions VALUES(?,?,?,?,?,?,?,?,?)"
    ).bind(
      version,
      row.id,
      row.account_id,
      row.payload_json,
      scheduled,
      brand.time_zone,
      body.localDateTime ?? null,
      key,
      now
    ),
    env.DB.prepare(
      "UPDATE social_destinations SET status='awaiting_handoff',current_version_id=?,scheduled_at=?,time_zone=?,local_date_time=?,last_error=NULL,updated_at=? WHERE id=? AND account_id=? AND status IN ('draft','cancelled')"
    ).bind(
      version,
      scheduled,
      brand.time_zone,
      body.localDateTime ?? null,
      now,
      row.id,
      row.account_id
    ),
    env.DB.prepare(
      "INSERT INTO social_delivery_attempts(id,destination_id,version_id,account_id,request_key,created_at,updated_at) SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM social_destinations WHERE id=? AND current_version_id=?)"
    ).bind(
      attempt,
      row.id,
      version,
      row.account_id,
      attempt,
      now,
      now,
      row.id,
      version
    ),
  ]);
  const updated = await ownedDestination(env, row.account_id, row.id);
  if (updated.current_version_id !== version)
    throw new ApiError(
      409,
      "destination_state_conflict",
      "O destino foi alterado; atualize a página."
    );
  await recordAudit(
    env,
    principal,
    "destination.submitted",
    "social_destination",
    row.id,
    row.brand_id
  );
  if (!scheduled || Date.parse(scheduled) <= Date.now() + 6 * 86400000)
    await env.SOCIAL_QUEUE.send({ kind: "destination", id: row.id });
  return destinationDto(updated);
}
