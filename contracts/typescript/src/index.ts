export type AccountType = "agency" | "creator" | "team";
export type AccountUserRole = "owner" | "member";
export type VideoAnalysisStatus = "pending" | "completed" | "failed";
export type AnalysisSourceKind =
  | "public_url"
  | "public_url_best_effort"
  | "file_upload"
  | "owned_asset"
  | "connected_media";
export type VideoPlatform = "instagram_reels" | "youtube_shorts" | "tiktok";
export type AnalysisSkillId =
  | "content_strategy"
  | "filming"
  | "editing"
  | "audio_music"
  | "compliance";
export type AnalysisSkillStatus = "published" | "unpublished";
export type ExecutedAnalysisSkillStatus =
  | "completed"
  | "insufficient_evidence"
  | "failed";
export type FeedbackReactionValue = "positive" | "negative";
export type FeedbackItemKind = "recommendation";

export interface FieldErrorContract {
  field: string;
  message: string;
}

export interface ErrorResponseContract {
  code: string;
  message: string;
  traceId?: string | null;
  details?: Record<string, unknown> | null;
}

export interface ValidationErrorResponseContract extends ErrorResponseContract {
  fieldErrors: FieldErrorContract[];
}

export interface RegisterRequestContract {
  displayName: string;
  accountType: AccountType;
  ownerName: string;
  email: string;
  password: string;
}

export interface LoginRequestContract {
  email: string;
  password: string;
}

export interface UpdateAccountProfileRequestContract {
  displayName: string;
  accountType: AccountType;
  ownerName: string;
}

export interface FirebaseEmailLinkSignInRequestContract {
  invitationToken?: string;
  idToken: string;
}

export interface FirebaseSignInRequestContract {
  invitationToken?: string;
  idToken: string;
}

export interface AccountResponseContract {
  id: string;
  displayName: string;
  accountType: AccountType;
  createdAt: string;
  memberCount: number;
}

export interface AccountUserResponseContract {
  id: string;
  name: string;
  email: string;
  role: AccountUserRole;
  createdAt: string;
}

export interface AuthSessionResponseContract {
  brands: BrandContract[];
  accessToken: string;
  tokenType: "Bearer";
  expiresAt: string;
  user: AccountUserResponseContract;
  account: AccountResponseContract;
}

export interface OAuthAuthorizationCodeCreateRequestContract {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  scopes?: string[] | null;
}

export interface OAuthAuthorizationCodeResponseContract {
  code: string;
  redirectUri: string;
  expiresAt: string;
}

export interface OAuthDeviceCodeRequestContract {
  clientId: string;
  scopes?: string[] | null;
}

export interface OAuthDeviceActivationRequestContract {
  userCode: string;
}

export interface OAuthDeviceCodeResponseContract {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  verificationUriComplete: string;
  expiresIn: number;
  interval: number;
  scope: string;
}

export interface OAuthTokenResponseContract {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token: string;
  scope: string;
  user: AccountUserResponseContract;
  account: AccountResponseContract;
}

export interface OAuthSessionResponseContract {
  brands: BrandContract[];
  tokenType: "Bearer";
  expiresAt: string;
  clientId: string | null;
  scopes: string[];
  user: AccountUserResponseContract;
  account: AccountResponseContract;
}

export interface OAuthRevokeRequestContract {
  clientId: string;
  refreshToken: string;
}

export interface AnalysisSkillCatalogResponseContract {
  version: string;
  publishedAt: string;
  items: AnalysisSkillCatalogItemContract[];
}

export interface AnalysisSkillCatalogItemContract {
  id: AnalysisSkillId;
  slug: string;
  name: string;
  description: string;
  coverageSummary: string;
  criteria: string[];
  safeLanguageNotes: string[];
  status: AnalysisSkillStatus;
}

export interface CreateAnalysisFromUrlRequestContract {
  brandId: string;
  url: string;
  skills: AnalysisSkillId[];
  language?: string | null;
  intent?: string | null;
}

export interface CreateAnalysisFromSourceAssetRequestContract {
  brandId: string;
  sourceAssetId: string;
  skills: AnalysisSkillId[];
  language?: string | null;
  intent?: string | null;
}

export type CreateAnalysisRequestContract =
  | CreateAnalysisFromUrlRequestContract
  | CreateAnalysisFromSourceAssetRequestContract;

export interface AnalysisListResponseContract {
  items: AnalysisListItemContract[];
}

export interface LatestAnalysisListOptionsContract {
  limit?: number;
  cursor?: string | null;
  includeSummary?: boolean;
  includeSkillDetails?: boolean;
  includePresentation?: boolean;
}

export interface LatestAnalysisListResponseContract {
  total: number;
  returned: number;
  limit: number;
  sort: "createdAt_desc";
  hasMore: boolean;
  nextCursor: string | null;
  defaultView: "latest_analyses_table";
  message: string;
  summary: string;
  tableColumns: string[];
  recommendedResponse: RecommendedAnalysisResponseContract;
  presentation: AnalysisPresentationContract | null;
  pagination: LatestAnalysisPaginationContract;
  items: LatestAnalysisListItemContract[];
}

export interface LatestAnalysisPaginationContract {
  totalItems: number;
  limit: number;
  returned: number;
  hasMore: boolean;
  nextCursor: string | null;
}

export interface LatestAnalysisListItemContract {
  brandId: string | null;
  id: string;
  createdAt: string;
  completedAt: string | null;
  status: VideoAnalysisStatus;
  fileName: string;
  sourceLabel: string;
  sourceType: AnalysisSourceKind;
  selectedSkills: AnalysisSkillId[];
  executedSkills: string[];
  overallScore: number | null;
  mainOpportunity: string | null;
  oneLineSummary: string;
  detailHint: AnalysisDetailHintContract;
  intent: string | null;
}

export interface RecommendedAnalysisResponseContract {
  format: "table" | "brief" | "detailed";
  columns: string[];
  instructions: string;
}

export interface AnalysisPresentationContract {
  title: string;
  markdownTable: string | null;
  answer: string | null;
  language: "pt-BR" | "en" | "es" | null;
}

export interface AnalysisDetailHintContract {
  analysisId: string;
  tool: string;
  message: string;
}

export interface SummarizeAnalysesResponseContract {
  answer: string;
  itemsUsed: number;
  totalAvailable: number;
  format: "table" | "brief" | "detailed";
  items: LatestAnalysisListItemContract[];
}

export interface AnalysisListItemContract {
  brandId: string | null;
  id: string;
  status: VideoAnalysisStatus;
  sourceType: AnalysisSourceKind;
  sourceLabel: string;
  sourceUrl: string | null;
  platform: VideoPlatform | null;
  contentId: string | null;
  catalogVersion: string;
  selectedSkillIds: AnalysisSkillId[];
  executedSkills: ExecutedAnalysisSkillContract[];
  summary: string;
  overallScore: number | null;
  blobPathPrefix: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
  intent: string | null;
}

export interface AnalysisDetailResponseContract {
  brandId: string | null;
  id: string;
  accountId: string;
  status: VideoAnalysisStatus;
  sourceType: AnalysisSourceKind;
  sourceLabel: string;
  sourceUrl: string | null;
  canonicalUrl: string | null;
  platform: VideoPlatform | null;
  contentId: string | null;
  catalogVersion: string;
  selectedSkillIds: AnalysisSkillId[];
  executedSkills: ExecutedAnalysisSkillContract[];
  summary: string;
  overallScore: number | null;
  artifacts: AnalysisArtifactsContract;
  report: ShortVideoAnalysisReportContract | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
  intent: string | null;
}

export interface FeedbackReactionUpsertRequestContract {
  feedbackItemKind: FeedbackItemKind;
  skillId: AnalysisSkillId;
  itemIndex: number;
  reaction?: FeedbackReactionValue | null;
  comment?: string | null;
}

export interface MyFeedbackReactionListResponseContract {
  items: MyFeedbackReactionContract[];
}

export interface MyFeedbackReactionContract {
  feedbackItemKey: string;
  feedbackItemKind: FeedbackItemKind;
  skillId: AnalysisSkillId;
  itemIndex: number;
  reaction: FeedbackReactionValue | null;
  comment: string | null;
  updatedAt: string;
}

export interface FeedbackReactionReviewResponseContract {
  items: FeedbackReactionReviewItemContract[];
  pagination: FeedbackReactionReviewPaginationContract;
}

export interface FeedbackReactionReviewPaginationContract {
  limit: number;
  returned: number;
  hasMore: boolean;
  nextCursor: string | null;
}

export interface FeedbackReactionReviewItemContract {
  id: string;
  analysisId: string;
  analysisSummary: string;
  sourceLabel: string;
  testerUserId: string;
  testerName: string;
  testerEmail: string;
  feedbackItemKey: string;
  feedbackItemKind: FeedbackItemKind;
  skillId: AnalysisSkillId;
  itemIndex: number;
  feedbackTitleSnapshot: string;
  feedbackActionSnapshot: string | null;
  feedbackRationaleSnapshot: string | null;
  reaction: FeedbackReactionValue | null;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnalysisArtifactsContract {
  blobPathPrefix: string | null;
  files: string[];
  items: AnalysisArtifactItemContract[];
}

export interface AnalysisArtifactItemContract {
  path: string;
  fileName: string;
  category: string;
  mimeType: string;
  downloadUrl: string;
  previewUrl: string;
}

export interface SourceAssetListResponseContract {
  items: SourceAssetItemContract[];
}

export interface SourceAssetItemContract {
  mediaKind: "video" | "image";
  metadataStatus: "pending" | "ready" | "failed";
  metadata: MediaMetadataContract | null;
  variantOfAssetId: string | null;
  brandId: string | null;
  id: string;
  sourceLabel: string;
  contentType: string;
  contentLength: number;
  analysisCount: number;
  createdAt: string;
  lastAnalyzedAt: string | null;
}

export interface SourceAssetDirectUploadCreateRequestContract {
  variantOfAssetId?: string | null;
  brandId: string;
  fileName: string;
  contentType?: string | null;
  contentLength: number;
}

export interface SourceAssetDirectUploadCompleteRequestContract {
  variantOfAssetId?: string | null;
  brandId: string;
  fileName: string;
  contentType?: string | null;
  contentLength: number;
}

export interface SourceAssetDirectUploadResponseContract {
  sourceAssetId: string;
  uploadUrl: string;
  method: "PUT";
  headers: Record<string, string>;
  maxFileSizeBytes: number;
  expiresAt: string;
}

export interface SourceAssetUploadSessionCreateRequestContract {
  brandId: string;
  clientId?: string | null;
}

export interface SourceAssetUploadSessionCompleteRequestContract {
  sourceAssetId: string;
}

export interface SourceAssetUploadSessionResponseContract {
  brandId: string;
  id: string;
  status: "pending" | "completed" | "expired";
  browserUrl: string;
  clientId: string | null;
  sourceAssetId: string | null;
  createdAt: string;
  expiresAt: string;
  completedAt: string | null;
}

export interface TranscriptSegmentContract {
  startSeconds: number;
  endSeconds: number;
  text: string;
}

export interface TranscriptContract {
  text: string;
  language: string;
  segments: TranscriptSegmentContract[];
}

export interface PropertyScoreContract {
  propertyId: string;
  label: string;
  score: number;
  rationale: string;
  confidence: number;
}

export interface TranscriptExcerptContract {
  startSeconds: number;
  endSeconds: number;
  text: string;
  whyItMatters: string;
}

export interface RecommendationContract {
  priority: string;
  title: string;
  rationale: string;
  action: string;
}

export interface ShortVideoAnalysisReportContract {
  source: SourceSectionContract;
  catalogVersion: string;
  selectedSkillIds: AnalysisSkillId[];
  executedSkills: ExecutedAnalysisSkillContract[];
  transcript: TranscriptContract;
  overallScore: number | null;
  warnings: string[];
}

export interface SourceSectionContract {
  sourceType: AnalysisSourceKind;
  sourceLabel: string;
  sourceUrl: string | null;
  canonicalUrl: string | null;
  platform: VideoPlatform | null;
  contentId: string | null;
  durationSeconds: number;
  width: number;
  height: number;
  fps: number;
  hasAudio: boolean;
  ingestStatus: string;
  artifactDirectory: string | null;
}

export interface ExecutedAnalysisSkillContract {
  skillId: AnalysisSkillId;
  status: ExecutedAnalysisSkillStatus;
  evaluatedItems: string[];
  summary: string;
  skillScore: number;
  propertyScores: PropertyScoreContract[];
  detailedAssessment: string;
  strengths: string[];
  improvementOpportunities: string[];
  recommendations: RecommendationContract[];
  keySignals: string[];
  evidence: EvidenceItemContract[];
  evidenceGaps: string[];
  transcriptExcerpts: TranscriptExcerptContract[];
  warnings: string[];
  disclaimer: string | null;
}

export interface EvidenceItemContract {
  timestampSeconds: number;
  kind: string;
  observation: string;
  transcriptQuote: string | null;
}

import type { components } from "./openapi.generated.js";
export type BrandContract = components["schemas"]["Brand"];
export type BrandListResponseContract = components["schemas"]["BrandListResponse"];
export type MediaMetadataContract = components["schemas"]["MediaMetadata"];
export type MemberInvitationContract = components["schemas"]["MemberInvitation"];
export type MemberInvitationCreateRequestContract = components["schemas"]["MemberInvitationCreateRequest"];
export type MemberInvitationCreateResponseContract = components["schemas"]["MemberInvitationCreateResponse"];
export type MemberInvitationAcceptRequestContract = components["schemas"]["MemberInvitationAcceptRequest"];
export type MemberListResponseContract = components["schemas"]["MemberListResponse"];
export type MemberInvitationListResponseContract = components["schemas"]["MemberInvitationListResponse"];
export type UsageResponseContract = components["schemas"]["UsageResponse"];
export type NotificationContract = components["schemas"]["Notification"];
export type AuditEventContract = components["schemas"]["AuditEvent"];
export type NotificationListResponseContract = components["schemas"]["NotificationListResponse"];
export type AuditEventListResponseContract = components["schemas"]["AuditEventListResponse"];
export type BrandCreateRequestContract = components["schemas"]["BrandCreateRequest"];
export type BrandUpdateRequestContract = components["schemas"]["BrandUpdateRequest"];
export type SocialDestinationSettingsContract = components["schemas"]["SocialDestinationSettings"];
export type SocialDestinationInputContract = components["schemas"]["SocialDestinationInput"];
export type SocialAccountContract = components["schemas"]["SocialAccount"];
export type SocialAuthorizationRequestContract = components["schemas"]["SocialAuthorizationRequest"];
export type SocialAuthorizationContract = components["schemas"]["SocialAuthorization"];
export type SocialCapabilitiesContract = components["schemas"]["SocialCapabilities"];
export type SocialDestinationVersionContract = components["schemas"]["SocialDestinationVersion"];
export type SocialDeliveryAttemptContract = components["schemas"]["SocialDeliveryAttempt"];
export type SocialDestinationContract = components["schemas"]["SocialDestination"];
export type SocialPublicationContract = components["schemas"]["SocialPublication"];
export type SocialPublicationCreateContract = components["schemas"]["SocialPublicationCreate"];
export type SocialPreflightContract = components["schemas"]["SocialPreflight"];
export type SocialSubmitContract = components["schemas"]["SocialSubmit"];
export type SocialPendingContract = components["schemas"]["SocialPending"];
export type ExternalPostContract = components["schemas"]["ExternalPost"];
export type ExternalPostImportContract = components["schemas"]["ExternalPostImport"];
export type SocialMetricSnapshotContract = components["schemas"]["SocialMetricSnapshot"];
export type SocialAccountListContract = components["schemas"]["SocialAccountList"];
export type SocialPublicationListContract = components["schemas"]["SocialPublicationList"];
export type ExternalPostListContract = components["schemas"]["ExternalPostList"];
export type SocialMetricListContract = components["schemas"]["SocialMetricList"];
