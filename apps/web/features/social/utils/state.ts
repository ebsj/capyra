import type { Platform } from "../types/social";

export const socialPlatforms: Platform[] = ["instagram", "tiktok", "youtube", "linkedin"];
export const platformLabels: Record<Platform, string> = { instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube", linkedin: "LinkedIn" };

export const stateLabels: Record<string, string> = {
  draft: "Rascunho",
  awaiting_handoff: "Aguardando envio",
  submitting: "Enviando",
  scheduled: "Agendado",
  publishing: "Publicando",
  published: "Publicado",
  cancellation_requested: "Cancelamento solicitado",
  cancelled: "Cancelado",
  unknown: "Entrega desconhecida",
  failed: "Falha definitiva",
  partial: "Resultado parcial",
  active: "Ativa",
  pending: "Pendente",
  requires_action: "Ação necessária",
  disconnecting: "Desconexão em andamento",
  disconnected: "Desconectada",
};
export function canCancel(status: string) {
  return ["awaiting_handoff", "submitting", "scheduled", "failed", "unknown"].includes(status);
}
export function canEdit(status: string) {
  return ["draft", "cancelled"].includes(status);
}
export function metricIsStale(observedAt: string, now = Date.now()) {
  return now - Date.parse(observedAt) > 48 * 60 * 60 * 1000;
}

export const formatLabels: Record<string, string> = {
  text: "Texto",
  feed: "Feed",
  reel: "Reels",
  story: "Stories",
  carousel: "Carrossel",
  video: "Vídeo",
  photo_carousel: "Carrossel de fotos",
  short: "Shorts",
};
export const privacyLabels: Record<string, string> = {
  PUBLIC_TO_EVERYONE: "Público",
  MUTUAL_FOLLOW_FRIENDS: "Amigos mútuos",
  FOLLOWER_OF_CREATOR: "Seguidores",
  SELF_ONLY: "Somente eu",
  public: "Público",
  private: "Privado",
  unlisted: "Não listado",
  none: "Não comercial",
  brand_organic: "Minha marca",
  brand_content: "Parceria comercial",
};
