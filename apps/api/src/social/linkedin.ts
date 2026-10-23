import { ProviderError, SelectionRequired } from "./provider";
import type { Asset, Capabilities, Payload } from "./types";

type Call = (path: string, method?: string, body?: unknown, headers?: Record<string, string>) => Promise<Record<string, unknown>>;

/** Resolve identity from server-side OAuth data, never from callback-supplied IDs. */
export async function selectLinkedInIdentity(
  call: Call,
  profileId: string,
  query: URLSearchParams,
  expectedIdentity: string | null,
  verifyIdentity?: (id: string) => Promise<void>,
) {
  const token = query.get("pendingDataToken");
  if (!token) throw new ProviderError("social_identity_unverified");
  const pending = await call(`/connect/pending-data?${new URLSearchParams({ token })}`);
  if (pending.platform !== "linkedin" || pending.profileId !== profileId || typeof pending.tempToken !== "string")
    throw new ProviderError("social_identity_unverified");
  const user = pending.userProfile as Record<string, unknown> | undefined;
  const organizations = (pending.organizations ?? []) as { id: string; name?: string }[];
  const choices = [
    ...(typeof user?.id === "string" && user.id ? [{ id: `urn:li:person:${user.id}`, name: String(user.displayName ?? user.username ?? "Perfil pessoal"), organization: null }] : []),
    ...organizations.filter((org) => typeof org.id === "string" && /^\d+$/.test(org.id)).map((org) => ({
      id: `urn:li:organization:${org.id}`, name: org.name || "Página de empresa", organization: org,
    })),
  ];
  const eligible = choices.filter((choice) => !expectedIdentity || choice.id === expectedIdentity);
  const selection = query.get("pageId");
  if (!selection && eligible.length > 1) throw new SelectionRequired(eligible);
  const chosen = selection ? eligible.find((choice) => choice.id === selection) : eligible[0];
  if (!chosen) throw new ProviderError(expectedIdentity ? "social_identity_mismatch" : "social_identity_unverified");
  await verifyIdentity?.(chosen.id);
  const connected = await call("/connect/linkedin/select-organization", "POST", {
    profileId,
    tempToken: pending.tempToken,
    userProfile: user,
    accountType: chosen.organization ? "organization" : "personal",
    ...(chosen.organization ? { selectedOrganization: chosen.organization } : {}),
  }, query.get("connect_token") ? { "X-Connect-Token": query.get("connect_token")! } : undefined);
  const account = connected.account as Record<string, unknown> | undefined;
  if (typeof account?.accountId !== "string" || !account.accountId)
    throw new ProviderError("provider_invalid_response");
  return { nativeIdentityId: chosen.id, selectedId: account.accountId };
}

export function validateLinkedInMedia(payload: Payload, media: Asset[], capabilities: Capabilities) {
  const issues: { field: string; code: string; message: string }[] = [];
  const add = (code: string, message: string, field = "mediaAssetIds") => issues.push({ field, code, message });
  const images = media.filter((asset) => asset.media_kind === "image");
  const videos = media.filter((asset) => asset.media_kind === "video");
  if (payload.format === "text" && (media.length || !payload.content.trim()))
    add("linkedin_text_required", "Informe texto e remova as mídias para uma publicação de texto.", "content");
  if (payload.format === "feed" && (media.length !== 1 || images.length !== 1))
    add("feed_requires_image", "Selecione uma imagem.");
  if (payload.format === "carousel" && (media.length !== images.length || images.length < 2 || images.length > capabilities.limits.maxImages))
    add("carousel_count", "LinkedIn exige de 2 a 20 imagens, sem vídeos no carrossel.");
  if (payload.format === "video" && (media.length !== 1 || videos.length !== 1))
    add("video_single", "Selecione um vídeo.");
  if (payload.coverAssetId) add("cover_unsupported", "A capa personalizada não está disponível para LinkedIn.", "coverAssetId");
  for (const asset of media) {
    if (asset.media_kind === "image" && !["image/jpeg", "image/png", "image/gif"].includes(asset.content_type))
      add("image_format", "LinkedIn exige imagem JPEG, PNG ou GIF.");
    if (asset.media_kind !== "video" || asset.metadata_status !== "ready") continue;
    const metadata = JSON.parse(asset.metadata_json ?? "{}");
    const ratio = Number(metadata.width) / Number(metadata.height);
    if (!["video/mp4", "video/quicktime", "video/x-msvideo"].includes(asset.content_type))
      add("video_format", "LinkedIn exige vídeo MP4, MOV ou AVI.");
    if (ratio < 1 / 2.4 || ratio > 2.4) add("aspect_ratio", "LinkedIn exige proporção de vídeo entre 1:2.4 e 2.4:1.");
  }
  return issues;
}
