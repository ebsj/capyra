import type { RuntimeEnv } from "../runtime";
export type Platform = "instagram" | "tiktok" | "youtube" | "linkedin";
export type DestinationState =
  | "draft"
  | "awaiting_handoff"
  | "submitting"
  | "scheduled"
  | "publishing"
  | "published"
  | "cancellation_requested"
  | "cancelled"
  | "unknown"
  | "failed";
export type SocialMessage = {
  kind: "destination" | "webhook" | "sync" | "import" | "probe";
  id: string;
};
export type SocialEnv = RuntimeEnv & {
  SOCIAL_QUEUE: Queue<SocialMessage>;
  CAPYRA_SOCIAL_PROVIDER?: string;
  ZERNIO_API_KEY?: string;
  ZERNIO_WEBHOOK_SECRET?: string;
  CAPYRA_SOCIAL_MOCK?: string;
};
export interface SocialAccountRow {
  id: string;
  account_id: string;
  brand_id: string;
  platform: Platform;
  provider_profile_id: string | null;
  provider_account_id: string | null;
  native_identity_id: string | null;
  display_name: string;
  identity_status: "verified" | "unavailable";
  status:
    | "pending"
    | "active"
    | "requires_action"
    | "disconnecting"
    | "disconnected";
  created_at: string;
  updated_at: string;
}
export interface Payload {
  socialAccountId: string;
  format: string;
  content: string;
  title?: string;
  description?: string;
  mediaAssetIds: string[];
  coverAssetId?: string;
  analysisId?: string;
  settings: Record<string, unknown>;
}
export interface DestinationRow {
  id: string;
  account_id: string;
  brand_id: string;
  publication_id: string;
  social_account_id: string;
  platform: Platform;
  payload_json: string;
  status: DestinationState;
  current_version_id: string | null;
  scheduled_at: string | null;
  time_zone: string | null;
  local_date_time: string | null;
  last_error: string | null;
  lease_until: string | null;
  lease_token: string | null;
  created_at: string;
  updated_at: string;
}
export interface AttemptRow {
  id: string;
  destination_id: string;
  version_id: string;
  account_id: string;
  request_key: string;
  provider_post_id: string | null;
  native_post_id: string | null;
  published_url: string | null;
  transfers_json: string;
  state: string;
  error_code: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  retry_after: string | null;
  retry_count: number;
}
export interface Asset {
  id: string;
  account_id: string;
  brand_id: string;
  object_key: string;
  content_type: string;
  content_length: number;
  source_label: string;
  media_kind: "video" | "image";
  metadata_status: string;
  metadata_json: string | null;
}
export interface Capabilities {
  platform: Platform;
  formats: string[];
  limits: {
    maxBytes: number;
    maxImages: number;
    maxContentLength: number;
    minVideoSeconds: number;
    maxVideoSeconds: number;
  };
  privacyLevels?: string[];
  interactionSettings?: Record<string, { enabled: boolean; required: boolean }>;
  identityStatus: "verified" | "unavailable";
  canPost: boolean;
}
export interface ProviderPost {
  id: string;
  status: DestinationState;
  nativePostId?: string;
  url?: string;
  error?: string;
}
export function accountDto(r: SocialAccountRow) {
  return {
    id: r.id,
    brandId: r.brand_id,
    platform: r.platform,
    displayName: r.display_name,
    status: r.status,
    identityStatus: r.identity_status,
    createdAt: r.created_at,
  };
}
export function destinationDto(r: DestinationRow) {
  return {
    ...(JSON.parse(r.payload_json) as Payload),
    id: r.id,
    publicationId: r.publication_id,
    socialAccountId: r.social_account_id,
    platform: r.platform,
    status: r.status,
    scheduledAt: r.scheduled_at,
    timeZone: r.time_zone,
    localDateTime: r.local_date_time,
    lastError: r.last_error,
  };
}
