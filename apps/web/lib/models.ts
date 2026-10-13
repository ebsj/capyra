import type {
  BrandContract,
  AccountResponseContract,
  AccountType,
  AccountUserRole,
  AccountUserResponseContract,
  AnalysisSkillCatalogItemContract,
  AnalysisSkillCatalogResponseContract,
  AnalysisSkillId,
  AnalysisSkillStatus,
  AnalysisArtifactsContract,
  AnalysisArtifactItemContract,
  CreateAnalysisFromSourceAssetRequestContract,
  CreateAnalysisFromUrlRequestContract,
  AnalysisDetailResponseContract,
  AnalysisListItemContract,
  AnalysisListResponseContract,
  AnalysisSourceKind,
  AuthSessionResponseContract,
  CreateAnalysisRequestContract,
  ErrorResponseContract,
  EvidenceItemContract,
  PropertyScoreContract,
  ExecutedAnalysisSkillContract,
  ExecutedAnalysisSkillStatus,
  FeedbackItemKind,
  FeedbackReactionReviewItemContract,
  FeedbackReactionReviewPaginationContract,
  FeedbackReactionReviewResponseContract,
  FeedbackReactionUpsertRequestContract,
  FeedbackReactionValue,
  FieldErrorContract,
  FirebaseEmailLinkSignInRequestContract,
  FirebaseSignInRequestContract,
  MyFeedbackReactionContract,
  MyFeedbackReactionListResponseContract,
  OAuthAuthorizationCodeCreateRequestContract,
  OAuthAuthorizationCodeResponseContract,
  OAuthDeviceActivationRequestContract,
  OAuthSessionResponseContract,
  RecommendationContract,
  SourceAssetItemContract,
  SourceAssetDirectUploadCompleteRequestContract,
  SourceAssetDirectUploadCreateRequestContract,
  SourceAssetDirectUploadResponseContract,
  SourceAssetListResponseContract,
  SourceAssetUploadSessionCompleteRequestContract,
  SourceAssetUploadSessionCreateRequestContract,
  SourceAssetUploadSessionResponseContract,
  ShortVideoAnalysisReportContract,
  SourceSectionContract,
  TranscriptContract,
  TranscriptExcerptContract,
  TranscriptSegmentContract,
  UpdateAccountProfileRequestContract,
  ValidationErrorResponseContract,
  VideoAnalysisStatus,
  VideoPlatform,
} from "@capyra/contracts";

export type {
  BrandContract,
  AccountResponseContract,
  AccountType,
  AccountUserRole,
  AccountUserResponseContract,
  AnalysisSkillCatalogItemContract,
  AnalysisSkillCatalogResponseContract,
  AnalysisSkillId,
  AnalysisSkillStatus,
  AnalysisArtifactsContract,
  AnalysisArtifactItemContract,
  CreateAnalysisFromSourceAssetRequestContract,
  CreateAnalysisFromUrlRequestContract,
  AnalysisDetailResponseContract,
  AnalysisListItemContract,
  AnalysisListResponseContract,
  AnalysisSourceKind,
  AuthSessionResponseContract,
  CreateAnalysisRequestContract,
  ErrorResponseContract,
  EvidenceItemContract,
  PropertyScoreContract,
  ExecutedAnalysisSkillContract,
  ExecutedAnalysisSkillStatus,
  FeedbackItemKind,
  FeedbackReactionReviewItemContract,
  FeedbackReactionReviewPaginationContract,
  FeedbackReactionReviewResponseContract,
  FeedbackReactionUpsertRequestContract,
  FeedbackReactionValue,
  FieldErrorContract,
  FirebaseEmailLinkSignInRequestContract,
  FirebaseSignInRequestContract,
  MyFeedbackReactionContract,
  MyFeedbackReactionListResponseContract,
  OAuthAuthorizationCodeCreateRequestContract,
  OAuthAuthorizationCodeResponseContract,
  OAuthDeviceActivationRequestContract,
  OAuthSessionResponseContract,
  RecommendationContract,
  SourceAssetItemContract,
  SourceAssetDirectUploadCompleteRequestContract,
  SourceAssetDirectUploadCreateRequestContract,
  SourceAssetDirectUploadResponseContract,
  SourceAssetListResponseContract,
  SourceAssetUploadSessionCompleteRequestContract,
  SourceAssetUploadSessionCreateRequestContract,
  SourceAssetUploadSessionResponseContract,
  ShortVideoAnalysisReportContract,
  SourceSectionContract,
  TranscriptContract,
  TranscriptExcerptContract,
  TranscriptSegmentContract,
  UpdateAccountProfileRequestContract,
  ValidationErrorResponseContract,
  VideoAnalysisStatus,
  VideoPlatform,
};

export type AnalysisSkillCatalog = AnalysisSkillCatalogResponseContract;
export type AnalysisSkillCatalogItem = AnalysisSkillCatalogItemContract;
export type SelectedAnalysisSkillId = AnalysisSkillId;
export type ExecutedAnalysisSkill = ExecutedAnalysisSkillContract;
export type CreateAnalysisUrlRequest = CreateAnalysisFromUrlRequestContract;
export type CreateAnalysisSourceAssetRequest = CreateAnalysisFromSourceAssetRequestContract;
export type SourceAssetList = SourceAssetListResponseContract;
export type SourceAssetItem = SourceAssetItemContract;

export interface CreateAnalysisFileRequest {
  brandId: string;
  file: File;
  skills: SelectedAnalysisSkillId[];
  language?: string | null;
  intent?: string | null;
}

export interface HealthResponseContract {
  service: string;
  status: "healthy" | "ready";
  timestamp: string;
}

export interface ApiInfoResponseContract {
  service: string;
  version: string;
  environment: string;
  apiBasePath: string;
}

export type {
  SocialDestinationSettingsContract,
  SocialDestinationInputContract,
  SocialAccountContract,
  SocialAuthorizationRequestContract,
  SocialAuthorizationContract,
  SocialCapabilitiesContract,
  SocialDestinationVersionContract,
  SocialDeliveryAttemptContract,
  SocialDestinationContract,
  SocialPublicationContract,
  SocialPublicationCreateContract,
  SocialPreflightContract,
  SocialSubmitContract,
  SocialPendingContract,
  ExternalPostContract,
  ExternalPostImportContract,
  SocialMetricSnapshotContract,
  SocialAccountListContract,
  SocialPublicationListContract,
  ExternalPostListContract,
  SocialMetricListContract,
  MemberInvitationContract,
  MemberInvitationCreateResponseContract,
  UsageResponseContract,
  NotificationContract,
  AuditEventContract
} from "@capyra/contracts";
