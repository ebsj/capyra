import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const postApiv1authregister_Body = z
  .object({
    displayName: z.string(),
    accountType: z.enum(["agency", "creator", "team"]),
    ownerName: z.string(),
    email: z.string().email(),
    password: z.string().min(8),
  })
  .passthrough();
const postApiv1authlogin_Body = z
  .object({ email: z.string().email(), password: z.string().min(8) })
  .passthrough();
const postApiv1authemailLink_Body = z
  .object({
    idToken: z.string(),
    invitationToken: z.string().min(1).max(256).optional(),
  })
  .passthrough();
const patchApiv1authaccount_Body = z
  .object({
    displayName: z.string().min(2).max(120),
    accountType: z.enum(["agency", "creator", "team"]),
    ownerName: z.string().min(2).max(120),
  })
  .passthrough();
const postApiv1oauthauthorizationCodes_Body = z
  .object({
    clientId: z.string(),
    redirectUri: z.string().url(),
    codeChallenge: z.string(),
    codeChallengeMethod: z.literal("S256"),
    scopes: z.array(z.string()).optional(),
  })
  .passthrough();
const postApiv1oauthdevicecode_Body = z
  .object({ clientId: z.string(), scopes: z.array(z.string()).optional() })
  .passthrough();
const postApiv1oauthtoken_Body = z
  .object({
    grant_type: z.string(),
    client_id: z.string(),
    code: z.string().optional(),
    redirect_uri: z.string().url().optional(),
    code_verifier: z.string().optional(),
    device_code: z.string().optional(),
    refresh_token: z.string().optional(),
  })
  .passthrough();
const postApiv1oauthrevoke_Body = z
  .object({ clientId: z.string(), refreshToken: z.string() })
  .passthrough();
const postApiv1sourceAssets_Body = z
  .object({
    file: z.instanceof(File),
    brandId: z.string().uuid(),
    variantOfAssetId: z.string().uuid().optional(),
  })
  .passthrough();
const postApiv1sourceAssetsdirectUploads_Body = z
  .object({
    fileName: z.string(),
    contentType: z.string().nullish(),
    contentLength: z.number().int().gte(1).lte(209715200),
    brandId: z.string().uuid(),
    variantOfAssetId: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();
const postApiv1integrationssourceAssetSessions_Body = z
  .object({ clientId: z.string().nullish(), brandId: z.string().uuid() })
  .passthrough();
const postApiv1analyses_Body = z.union([
  z
    .object({
      url: z.string().url(),
      skills: z
        .array(
          z.enum([
            "content_strategy",
            "filming",
            "editing",
            "audio_music",
            "compliance",
          ])
        )
        .min(1),
      language: z.string().optional().default("pt-BR"),
      intent: z.string().min(1).max(1000).nullish(),
      brandId: z.string().uuid(),
    })
    .passthrough(),
  z
    .object({
      sourceAssetId: z.string().uuid(),
      skills: z
        .array(
          z.enum([
            "content_strategy",
            "filming",
            "editing",
            "audio_music",
            "compliance",
          ])
        )
        .min(1),
      language: z.string().optional().default("pt-BR"),
      intent: z.string().min(1).max(1000).nullish(),
      brandId: z.string().uuid(),
    })
    .passthrough(),
]);
const putApiv1analysesIdfeedbackReactionsFeedbackItemKey_Body = z
  .object({
    feedbackItemKind: z.literal("recommendation"),
    skillId: z.enum([
      "content_strategy",
      "filming",
      "editing",
      "audio_music",
      "compliance",
    ]),
    itemIndex: z.number().int().gte(0),
    reaction: z.enum(["positive", "negative"]).nullish(),
    comment: z.string().max(1000).nullish(),
  })
  .passthrough();
const postApiv1brands_Body = z.object({
  name: z.string().min(1).max(160),
  timeZone: z.string().min(1).max(80),
});
const patchApiv1brandsId_Body = z
  .object({
    name: z.string().min(1).max(160),
    timeZone: z.string().min(1).max(80),
    confirmed: z.boolean(),
  })
  .partial();
const createSocialAuthorization_Body = z.object({
  platform: z.enum(["instagram", "tiktok", "youtube", "linkedin"]),
  reconnectAccountId: z.string().uuid().optional(),
});
const createSocialPublication_Body = z.object({
  brandId: z.string().uuid(),
  title: z.string().min(1).max(160),
});
const createSocialDestination_Body = z.object({
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
  content: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  mediaAssetIds: z.array(z.string().uuid()),
  coverAssetId: z.string().uuid().optional(),
  analysisId: z.string().uuid().optional(),
  settings: z
    .object({
      privacyLevel: z.enum([
        "PUBLIC_TO_EVERYONE",
        "MUTUAL_FOLLOW_FRIENDS",
        "FOLLOWER_OF_CREATOR",
        "SELF_ONLY",
        "public",
        "private",
        "unlisted",
      ]),
      previewConfirmed: z.boolean(),
      expressConsentGiven: z.boolean(),
      allowComment: z.boolean(),
      allowDuet: z.boolean(),
      allowStitch: z.boolean(),
      isAiGenerated: z.boolean(),
      commercialContentType: z.enum(["none", "brand_organic", "brand_content"]),
      shareToFeed: z.boolean(),
      madeForKids: z.boolean(),
      containsSyntheticMedia: z.boolean(),
      tags: z.array(z.string()),
      coverTimestampMs: z.number(),
    })
    .partial(),
});
const submitSocialDestination_Body = z.object({
  publishNow: z.boolean(),
  localDateTime: z.string().optional(),
});
const importExternalPost_Body = z.object({
  socialAccountId: z.string().uuid(),
  url: z.string().max(2048).url(),
});
const FieldError = z.object({ field: z.string(), message: z.string() });
const ErrorResponse = z.object({
  code: z.string(),
  message: z.string(),
  traceId: z.union([z.string(), z.null()]).optional(),
  details: z.union([z.object({}).partial().passthrough(), z.null()]).optional(),
});
const ValidationErrorResponse = z
  .object({
    code: z.string(),
    message: z.string(),
    traceId: z.union([z.string(), z.null()]).optional(),
    details: z
      .union([z.object({}).partial().passthrough(), z.null()])
      .optional(),
  })
  .and(
    z
      .object({
        fieldErrors: z.array(
          z.object({ field: z.string(), message: z.string() })
        ),
      })
      .passthrough()
  );
const RegisterRequest = z
  .object({
    displayName: z.string(),
    accountType: z.enum(["agency", "creator", "team"]),
    ownerName: z.string(),
    email: z.string().email(),
    password: z.string().min(8),
  })
  .passthrough();
const LoginRequest = z
  .object({ email: z.string().email(), password: z.string().min(8) })
  .passthrough();
const UpdateAccountProfileRequest = z
  .object({
    displayName: z.string().min(2).max(120),
    accountType: z.enum(["agency", "creator", "team"]),
    ownerName: z.string().min(2).max(120),
  })
  .passthrough();
const FirebaseEmailLinkSignInRequest = z
  .object({
    idToken: z.string(),
    invitationToken: z.string().min(1).max(256).optional(),
  })
  .passthrough();
const FirebaseSignInRequest = z
  .object({
    idToken: z.string(),
    invitationToken: z.string().min(1).max(256).optional(),
  })
  .passthrough();
const AuthSessionResponse = z
  .object({
    accessToken: z.string(),
    tokenType: z.string(),
    expiresAt: z.string().datetime({ offset: true }),
    user: z
      .object({
        id: z.string().uuid(),
        name: z.string(),
        email: z.string().email(),
        role: z.enum(["owner", "member"]),
        createdAt: z.string().datetime({ offset: true }),
      })
      .passthrough(),
    account: z
      .object({
        id: z.string().uuid(),
        displayName: z.string(),
        accountType: z.enum(["agency", "creator", "team"]),
        createdAt: z.string().datetime({ offset: true }),
        memberCount: z.number().int().gte(0),
      })
      .passthrough(),
    brands: z.array(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(160),
        timeZone: z.string(),
        confirmedAt: z.union([z.string(), z.null()]),
        status: z.enum(["active", "archiving", "archived"]),
        createdAt: z.string().datetime({ offset: true }),
        archivedAt: z.union([z.string(), z.null()]),
      })
    ),
  })
  .passthrough();
const AccountResponse = z
  .object({
    id: z.string().uuid(),
    displayName: z.string(),
    accountType: z.enum(["agency", "creator", "team"]),
    createdAt: z.string().datetime({ offset: true }),
    memberCount: z.number().int().gte(0),
  })
  .passthrough();
const AccountUserResponse = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    role: z.enum(["owner", "member"]),
    createdAt: z.string().datetime({ offset: true }),
  })
  .passthrough();
const OAuthAuthorizationCodeCreateRequest = z
  .object({
    clientId: z.string(),
    redirectUri: z.string().url(),
    codeChallenge: z.string(),
    codeChallengeMethod: z.literal("S256"),
    scopes: z.array(z.string()).optional(),
  })
  .passthrough();
const OAuthAuthorizationCodeResponse = z
  .object({
    code: z.string(),
    redirectUri: z.string().url(),
    expiresAt: z.string().datetime({ offset: true }),
  })
  .passthrough();
const OAuthDeviceCodeRequest = z
  .object({ clientId: z.string(), scopes: z.array(z.string()).optional() })
  .passthrough();
const OAuthDeviceActivationRequest = z
  .object({ userCode: z.string() })
  .passthrough();
const OAuthDeviceCodeResponse = z
  .object({
    deviceCode: z.string(),
    userCode: z.string(),
    verificationUri: z.string().url(),
    verificationUriComplete: z.string().url(),
    expiresIn: z.number().int().gte(1),
    interval: z.number().int().gte(1),
    scope: z.string(),
  })
  .passthrough();
const OAuthTokenResponse = z
  .object({
    access_token: z.string(),
    token_type: z.literal("Bearer"),
    expires_in: z.number().int().gte(1),
    refresh_token: z.string(),
    scope: z.string(),
    user: z
      .object({
        id: z.string().uuid(),
        name: z.string(),
        email: z.string().email(),
        role: z.enum(["owner", "member"]),
        createdAt: z.string().datetime({ offset: true }),
      })
      .passthrough(),
    account: z
      .object({
        id: z.string().uuid(),
        displayName: z.string(),
        accountType: z.enum(["agency", "creator", "team"]),
        createdAt: z.string().datetime({ offset: true }),
        memberCount: z.number().int().gte(0),
      })
      .passthrough(),
  })
  .passthrough();
const OAuthSessionResponse = z
  .object({
    tokenType: z.literal("Bearer"),
    expiresAt: z.string().datetime({ offset: true }),
    clientId: z.string().nullish(),
    scopes: z.array(z.string()),
    user: z
      .object({
        id: z.string().uuid(),
        name: z.string(),
        email: z.string().email(),
        role: z.enum(["owner", "member"]),
        createdAt: z.string().datetime({ offset: true }),
      })
      .passthrough(),
    account: z
      .object({
        id: z.string().uuid(),
        displayName: z.string(),
        accountType: z.enum(["agency", "creator", "team"]),
        createdAt: z.string().datetime({ offset: true }),
        memberCount: z.number().int().gte(0),
      })
      .passthrough(),
    brands: z.array(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(160),
        timeZone: z.string(),
        confirmedAt: z.union([z.string(), z.null()]),
        status: z.enum(["active", "archiving", "archived"]),
        createdAt: z.string().datetime({ offset: true }),
        archivedAt: z.union([z.string(), z.null()]),
      })
    ),
  })
  .passthrough();
const OAuthRevokeRequest = z
  .object({ clientId: z.string(), refreshToken: z.string() })
  .passthrough();
const CreateAnalysisFromUrlRequest = z
  .object({
    url: z.string().url(),
    skills: z
      .array(
        z.enum([
          "content_strategy",
          "filming",
          "editing",
          "audio_music",
          "compliance",
        ])
      )
      .min(1),
    language: z.string().optional().default("pt-BR"),
    intent: z.string().min(1).max(1000).nullish(),
    brandId: z.string().uuid(),
  })
  .passthrough();
const CreateAnalysisFromSourceAssetRequest = z
  .object({
    sourceAssetId: z.string().uuid(),
    skills: z
      .array(
        z.enum([
          "content_strategy",
          "filming",
          "editing",
          "audio_music",
          "compliance",
        ])
      )
      .min(1),
    language: z.string().optional().default("pt-BR"),
    intent: z.string().min(1).max(1000).nullish(),
    brandId: z.string().uuid(),
  })
  .passthrough();
const CreateAnalysisUploadRequest = z
  .object({
    file: z.instanceof(File),
    skills: z
      .array(
        z.enum([
          "content_strategy",
          "filming",
          "editing",
          "audio_music",
          "compliance",
        ])
      )
      .min(1),
    language: z.string().optional().default("pt-BR"),
    intent: z.string().min(1).max(1000).nullish(),
    brandId: z.string().uuid(),
  })
  .passthrough();
const AnalysisSkillId = z.enum([
  "content_strategy",
  "filming",
  "editing",
  "audio_music",
  "compliance",
]);
const AnalysisSkillStatus = z.enum(["published", "unpublished"]);
const AnalysisSourceKind = z.enum([
  "public_url",
  "public_url_best_effort",
  "file_upload",
  "owned_asset",
  "connected_media",
]);
const ExecutedAnalysisSkillStatus = z.enum([
  "completed",
  "insufficient_evidence",
  "failed",
]);
const FeedbackReactionValue = z.enum(["positive", "negative"]);
const FeedbackItemKind = z.literal("recommendation");
const FeedbackReactionUpsertRequest = z
  .object({
    feedbackItemKind: z.literal("recommendation"),
    skillId: z.enum([
      "content_strategy",
      "filming",
      "editing",
      "audio_music",
      "compliance",
    ]),
    itemIndex: z.number().int().gte(0),
    reaction: z.enum(["positive", "negative"]).nullish(),
    comment: z.string().max(1000).nullish(),
  })
  .passthrough();
const MyFeedbackReactionListResponse = z
  .object({
    items: z.array(
      z
        .object({
          feedbackItemKey: z.string(),
          feedbackItemKind: z.literal("recommendation"),
          skillId: z.enum([
            "content_strategy",
            "filming",
            "editing",
            "audio_music",
            "compliance",
          ]),
          itemIndex: z.number().int().gte(0),
          reaction: z.enum(["positive", "negative"]).nullable(),
          comment: z.string().nullable(),
          updatedAt: z.string().datetime({ offset: true }),
        })
        .passthrough()
    ),
  })
  .passthrough();
const MyFeedbackReaction = z
  .object({
    feedbackItemKey: z.string(),
    feedbackItemKind: z.literal("recommendation"),
    skillId: z.enum([
      "content_strategy",
      "filming",
      "editing",
      "audio_music",
      "compliance",
    ]),
    itemIndex: z.number().int().gte(0),
    reaction: z.enum(["positive", "negative"]).nullable(),
    comment: z.string().nullable(),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .passthrough();
const FeedbackReactionReviewResponse = z
  .object({
    items: z.array(
      z
        .object({
          id: z.string().uuid(),
          analysisId: z.string().uuid(),
          analysisSummary: z.string(),
          sourceLabel: z.string(),
          testerUserId: z.string().uuid(),
          testerName: z.string(),
          testerEmail: z.string().email(),
          feedbackItemKey: z.string(),
          feedbackItemKind: z.literal("recommendation"),
          skillId: z.enum([
            "content_strategy",
            "filming",
            "editing",
            "audio_music",
            "compliance",
          ]),
          itemIndex: z.number().int().gte(0),
          feedbackTitleSnapshot: z.string(),
          feedbackActionSnapshot: z.string().nullish(),
          feedbackRationaleSnapshot: z.string().nullish(),
          reaction: z.enum(["positive", "negative"]).nullable(),
          comment: z.string().nullable(),
          createdAt: z.string().datetime({ offset: true }),
          updatedAt: z.string().datetime({ offset: true }),
        })
        .passthrough()
    ),
    pagination: z
      .object({
        limit: z.number().int().gte(1).lte(100),
        returned: z.number().int().gte(0),
        hasMore: z.boolean(),
        nextCursor: z.string().nullable(),
      })
      .passthrough(),
  })
  .passthrough();
const FeedbackReactionReviewPagination = z
  .object({
    limit: z.number().int().gte(1).lte(100),
    returned: z.number().int().gte(0),
    hasMore: z.boolean(),
    nextCursor: z.string().nullable(),
  })
  .passthrough();
const FeedbackReactionReviewItem = z
  .object({
    id: z.string().uuid(),
    analysisId: z.string().uuid(),
    analysisSummary: z.string(),
    sourceLabel: z.string(),
    testerUserId: z.string().uuid(),
    testerName: z.string(),
    testerEmail: z.string().email(),
    feedbackItemKey: z.string(),
    feedbackItemKind: z.literal("recommendation"),
    skillId: z.enum([
      "content_strategy",
      "filming",
      "editing",
      "audio_music",
      "compliance",
    ]),
    itemIndex: z.number().int().gte(0),
    feedbackTitleSnapshot: z.string(),
    feedbackActionSnapshot: z.string().nullish(),
    feedbackRationaleSnapshot: z.string().nullish(),
    reaction: z.enum(["positive", "negative"]).nullable(),
    comment: z.string().nullable(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .passthrough();
const SourceAssetItem = z
  .object({
    id: z.string().uuid(),
    sourceLabel: z.string(),
    contentType: z.string(),
    contentLength: z.number().int().gte(0),
    analysisCount: z.number().int().gte(0),
    createdAt: z.string().datetime({ offset: true }),
    lastAnalyzedAt: z.string().datetime({ offset: true }).nullish(),
    brandId: z.union([z.string(), z.null()]),
    mediaKind: z.enum(["video", "image"]),
    metadataStatus: z.enum(["pending", "ready", "failed"]),
    metadata: z.union([
      z.object({
        width: z.number().int().gte(1),
        height: z.number().int().gte(1),
        durationSeconds: z.union([z.number(), z.null()]).optional(),
        codec: z.union([z.string(), z.null()]).optional(),
        format: z.union([z.string(), z.null()]).optional(),
      }),
      z.null(),
    ]),
    variantOfAssetId: z.union([z.string(), z.null()]),
  })
  .passthrough();
const SourceAssetListResponse = z
  .object({
    items: z.array(
      z
        .object({
          id: z.string().uuid(),
          sourceLabel: z.string(),
          contentType: z.string(),
          contentLength: z.number().int().gte(0),
          analysisCount: z.number().int().gte(0),
          createdAt: z.string().datetime({ offset: true }),
          lastAnalyzedAt: z.string().datetime({ offset: true }).nullish(),
          brandId: z.union([z.string(), z.null()]),
          mediaKind: z.enum(["video", "image"]),
          metadataStatus: z.enum(["pending", "ready", "failed"]),
          metadata: z.union([
            z.object({
              width: z.number().int().gte(1),
              height: z.number().int().gte(1),
              durationSeconds: z.union([z.number(), z.null()]).optional(),
              codec: z.union([z.string(), z.null()]).optional(),
              format: z.union([z.string(), z.null()]).optional(),
            }),
            z.null(),
          ]),
          variantOfAssetId: z.union([z.string(), z.null()]),
        })
        .passthrough()
    ),
  })
  .passthrough();
const SourceAssetDirectUploadCreateRequest = z
  .object({
    fileName: z.string(),
    contentType: z.string().nullish(),
    contentLength: z.number().int().gte(1).lte(209715200),
    brandId: z.string().uuid(),
    variantOfAssetId: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();
const SourceAssetDirectUploadCompleteRequest = z
  .object({
    fileName: z.string(),
    contentType: z.string().nullish(),
    contentLength: z.number().int().gte(1).lte(209715200),
    brandId: z.string().uuid(),
    variantOfAssetId: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();
const SourceAssetDirectUploadResponse = z
  .object({
    sourceAssetId: z.string().uuid(),
    uploadUrl: z.string().url(),
    method: z.literal("PUT"),
    headers: z.record(z.string()),
    maxFileSizeBytes: z.number().int().gte(1),
    expiresAt: z.string().datetime({ offset: true }),
  })
  .passthrough();
const SourceAssetUploadSessionCreateRequest = z
  .object({ clientId: z.string().nullish(), brandId: z.string().uuid() })
  .passthrough();
const SourceAssetUploadSessionCompleteRequest = z
  .object({ sourceAssetId: z.string().uuid() })
  .passthrough();
const SourceAssetUploadSessionResponse = z
  .object({
    id: z.string().uuid(),
    status: z.enum(["pending", "completed", "expired"]),
    browserUrl: z.string().url(),
    clientId: z.string().nullish(),
    sourceAssetId: z.string().uuid().nullish(),
    createdAt: z.string().datetime({ offset: true }),
    expiresAt: z.string().datetime({ offset: true }),
    completedAt: z.string().datetime({ offset: true }).nullish(),
    brandId: z.string().uuid(),
  })
  .passthrough();
const EvidenceItem = z
  .object({
    timestampSeconds: z.number(),
    kind: z.string(),
    observation: z.string(),
    transcriptQuote: z.string().nullish(),
  })
  .passthrough();
const TranscriptSegment = z
  .object({
    startSeconds: z.number().gte(0),
    endSeconds: z.number().gte(0),
    text: z.string(),
  })
  .passthrough();
const Transcript = z
  .object({
    text: z.string(),
    language: z.string(),
    segments: z.array(
      z
        .object({
          startSeconds: z.number().gte(0),
          endSeconds: z.number().gte(0),
          text: z.string(),
        })
        .passthrough()
    ),
  })
  .passthrough();
const PropertyScore = z
  .object({
    propertyId: z.string(),
    label: z.string(),
    score: z.number().gte(0).lte(10),
    rationale: z.string(),
    confidence: z.number().gte(0).lte(1),
  })
  .passthrough();
const TranscriptExcerpt = z
  .object({
    startSeconds: z.number().gte(0),
    endSeconds: z.number().gte(0),
    text: z.string(),
    whyItMatters: z.string(),
  })
  .passthrough();
const Recommendation = z
  .object({
    priority: z.string(),
    title: z.string(),
    rationale: z.string(),
    action: z.string(),
  })
  .passthrough();
const AnalysisSkillCatalogResponse = z
  .object({
    version: z.string(),
    publishedAt: z.string().datetime({ offset: true }),
    items: z
      .array(
        z
          .object({
            id: z.enum([
              "content_strategy",
              "filming",
              "editing",
              "audio_music",
              "compliance",
            ]),
            slug: z.string(),
            name: z.string(),
            description: z.string(),
            coverageSummary: z.string(),
            criteria: z.array(z.string()),
            safeLanguageNotes: z.array(z.string()),
            status: z.enum(["published", "unpublished"]),
          })
          .passthrough()
      )
      .min(4)
      .max(4),
  })
  .passthrough();
const AnalysisSkillCatalogItem = z
  .object({
    id: z.enum([
      "content_strategy",
      "filming",
      "editing",
      "audio_music",
      "compliance",
    ]),
    slug: z.string(),
    name: z.string(),
    description: z.string(),
    coverageSummary: z.string(),
    criteria: z.array(z.string()),
    safeLanguageNotes: z.array(z.string()),
    status: z.enum(["published", "unpublished"]),
  })
  .passthrough();
const ExecutedAnalysisSkill = z
  .object({
    skillId: z.enum([
      "content_strategy",
      "filming",
      "editing",
      "audio_music",
      "compliance",
    ]),
    status: z.enum(["completed", "insufficient_evidence", "failed"]),
    evaluatedItems: z.array(z.string()),
    summary: z.string(),
    skillScore: z.number().gte(0).lte(10),
    propertyScores: z.array(
      z
        .object({
          propertyId: z.string(),
          label: z.string(),
          score: z.number().gte(0).lte(10),
          rationale: z.string(),
          confidence: z.number().gte(0).lte(1),
        })
        .passthrough()
    ),
    detailedAssessment: z.string(),
    strengths: z.array(z.string()),
    improvementOpportunities: z.array(z.string()),
    recommendations: z.array(
      z
        .object({
          priority: z.string(),
          title: z.string(),
          rationale: z.string(),
          action: z.string(),
        })
        .passthrough()
    ),
    keySignals: z.array(z.string()),
    evidence: z.array(
      z
        .object({
          timestampSeconds: z.number(),
          kind: z.string(),
          observation: z.string(),
          transcriptQuote: z.string().nullish(),
        })
        .passthrough()
    ),
    evidenceGaps: z.array(z.string()),
    transcriptExcerpts: z.array(
      z
        .object({
          startSeconds: z.number().gte(0),
          endSeconds: z.number().gte(0),
          text: z.string(),
          whyItMatters: z.string(),
        })
        .passthrough()
    ),
    warnings: z.array(z.string()),
    disclaimer: z.string().nullish(),
  })
  .passthrough();
const ShortVideoAnalysisReport = z
  .object({
    source: z
      .object({
        sourceType: z.enum([
          "public_url",
          "public_url_best_effort",
          "file_upload",
          "owned_asset",
          "connected_media",
        ]),
        sourceLabel: z.string(),
        sourceUrl: z.string().nullish(),
        canonicalUrl: z.string().nullish(),
        platform: z
          .enum(["instagram_reels", "youtube_shorts", "tiktok"])
          .nullish(),
        contentId: z.string().nullish(),
        durationSeconds: z.number().gte(0),
        width: z.number().int().gte(0),
        height: z.number().int().gte(0),
        fps: z.number().gte(0),
        hasAudio: z.boolean(),
        ingestStatus: z.enum(["downloaded", "uploaded", "partial"]),
        artifactDirectory: z.string().nullish(),
      })
      .passthrough(),
    catalogVersion: z.string(),
    selectedSkillIds: z.array(
      z.enum([
        "content_strategy",
        "filming",
        "editing",
        "audio_music",
        "compliance",
      ])
    ),
    executedSkills: z.array(
      z
        .object({
          skillId: z.enum([
            "content_strategy",
            "filming",
            "editing",
            "audio_music",
            "compliance",
          ]),
          status: z.enum(["completed", "insufficient_evidence", "failed"]),
          evaluatedItems: z.array(z.string()),
          summary: z.string(),
          skillScore: z.number().gte(0).lte(10),
          propertyScores: z.array(
            z
              .object({
                propertyId: z.string(),
                label: z.string(),
                score: z.number().gte(0).lte(10),
                rationale: z.string(),
                confidence: z.number().gte(0).lte(1),
              })
              .passthrough()
          ),
          detailedAssessment: z.string(),
          strengths: z.array(z.string()),
          improvementOpportunities: z.array(z.string()),
          recommendations: z.array(
            z
              .object({
                priority: z.string(),
                title: z.string(),
                rationale: z.string(),
                action: z.string(),
              })
              .passthrough()
          ),
          keySignals: z.array(z.string()),
          evidence: z.array(
            z
              .object({
                timestampSeconds: z.number(),
                kind: z.string(),
                observation: z.string(),
                transcriptQuote: z.string().nullish(),
              })
              .passthrough()
          ),
          evidenceGaps: z.array(z.string()),
          transcriptExcerpts: z.array(
            z
              .object({
                startSeconds: z.number().gte(0),
                endSeconds: z.number().gte(0),
                text: z.string(),
                whyItMatters: z.string(),
              })
              .passthrough()
          ),
          warnings: z.array(z.string()),
          disclaimer: z.string().nullish(),
        })
        .passthrough()
    ),
    transcript: z
      .object({
        text: z.string(),
        language: z.string(),
        segments: z.array(
          z
            .object({
              startSeconds: z.number().gte(0),
              endSeconds: z.number().gte(0),
              text: z.string(),
            })
            .passthrough()
        ),
      })
      .passthrough(),
    overallScore: z.number().gte(0).lte(10).nullish(),
    warnings: z.array(z.string()),
  })
  .passthrough();
const SourceSection = z
  .object({
    sourceType: z.enum([
      "public_url",
      "public_url_best_effort",
      "file_upload",
      "owned_asset",
      "connected_media",
    ]),
    sourceLabel: z.string(),
    sourceUrl: z.string().nullish(),
    canonicalUrl: z.string().nullish(),
    platform: z.enum(["instagram_reels", "youtube_shorts", "tiktok"]).nullish(),
    contentId: z.string().nullish(),
    durationSeconds: z.number().gte(0),
    width: z.number().int().gte(0),
    height: z.number().int().gte(0),
    fps: z.number().gte(0),
    hasAudio: z.boolean(),
    ingestStatus: z.enum(["downloaded", "uploaded", "partial"]),
    artifactDirectory: z.string().nullish(),
  })
  .passthrough();
const AnalysisListResponse = z
  .object({
    items: z.array(
      z
        .object({
          id: z.string().uuid(),
          status: z.enum(["pending", "completed", "failed"]),
          sourceType: z.enum([
            "public_url",
            "public_url_best_effort",
            "file_upload",
            "owned_asset",
            "connected_media",
          ]),
          sourceLabel: z.string(),
          sourceUrl: z.string().nullish(),
          platform: z
            .enum(["instagram_reels", "youtube_shorts", "tiktok"])
            .nullish(),
          contentId: z.string().nullish(),
          catalogVersion: z.string(),
          selectedSkillIds: z.array(
            z.enum([
              "content_strategy",
              "filming",
              "editing",
              "audio_music",
              "compliance",
            ])
          ),
          executedSkills: z.array(
            z
              .object({
                skillId: z.enum([
                  "content_strategy",
                  "filming",
                  "editing",
                  "audio_music",
                  "compliance",
                ]),
                status: z.enum([
                  "completed",
                  "insufficient_evidence",
                  "failed",
                ]),
                evaluatedItems: z.array(z.string()),
                summary: z.string(),
                skillScore: z.number().gte(0).lte(10),
                propertyScores: z.array(
                  z
                    .object({
                      propertyId: z.string(),
                      label: z.string(),
                      score: z.number().gte(0).lte(10),
                      rationale: z.string(),
                      confidence: z.number().gte(0).lte(1),
                    })
                    .passthrough()
                ),
                detailedAssessment: z.string(),
                strengths: z.array(z.string()),
                improvementOpportunities: z.array(z.string()),
                recommendations: z.array(
                  z
                    .object({
                      priority: z.string(),
                      title: z.string(),
                      rationale: z.string(),
                      action: z.string(),
                    })
                    .passthrough()
                ),
                keySignals: z.array(z.string()),
                evidence: z.array(
                  z
                    .object({
                      timestampSeconds: z.number(),
                      kind: z.string(),
                      observation: z.string(),
                      transcriptQuote: z.string().nullish(),
                    })
                    .passthrough()
                ),
                evidenceGaps: z.array(z.string()),
                transcriptExcerpts: z.array(
                  z
                    .object({
                      startSeconds: z.number().gte(0),
                      endSeconds: z.number().gte(0),
                      text: z.string(),
                      whyItMatters: z.string(),
                    })
                    .passthrough()
                ),
                warnings: z.array(z.string()),
                disclaimer: z.string().nullish(),
              })
              .passthrough()
          ),
          summary: z.string(),
          overallScore: z.number().nullish(),
          blobPathPrefix: z.string().nullish(),
          errorMessage: z.string().nullish(),
          createdAt: z.string().datetime({ offset: true }),
          completedAt: z.string().datetime({ offset: true }).nullish(),
          intent: z.string().max(1000).nullable(),
          brandId: z.union([z.string(), z.null()]),
        })
        .passthrough()
    ),
  })
  .passthrough();
const LatestAnalysisListResponse = z
  .object({
    total: z.number().int().gte(0),
    returned: z.number().int().gte(0),
    limit: z.number().int().gte(1).lte(50),
    sort: z.literal("createdAt_desc"),
    hasMore: z.boolean(),
    nextCursor: z.string().nullable(),
    defaultView: z.literal("latest_analyses_table"),
    message: z.string(),
    summary: z.string(),
    tableColumns: z.array(
      z.enum([
        "createdAt",
        "fileName",
        "status",
        "skills",
        "overallScore",
        "mainOpportunity",
      ])
    ),
    recommendedResponse: z
      .object({
        format: z.enum(["table", "brief", "detailed"]),
        columns: z.array(z.string()),
        instructions: z.string(),
      })
      .passthrough(),
    presentation: z
      .object({
        title: z.string(),
        markdownTable: z.string().nullable(),
        answer: z.string().nullable(),
        language: z.enum(["pt-BR", "en", "es"]).nullable(),
      })
      .passthrough()
      .nullish(),
    pagination: z
      .object({
        totalItems: z.number().int().gte(0),
        limit: z.number().int().gte(1).lte(50),
        returned: z.number().int().gte(0),
        hasMore: z.boolean(),
        nextCursor: z.string().nullable(),
      })
      .passthrough(),
    items: z.array(
      z
        .object({
          id: z.string().uuid(),
          createdAt: z.string().datetime({ offset: true }),
          completedAt: z.string().datetime({ offset: true }).nullable(),
          status: z.enum(["pending", "completed", "failed"]),
          fileName: z.string(),
          sourceLabel: z.string(),
          sourceType: z.enum([
            "public_url",
            "public_url_best_effort",
            "file_upload",
            "owned_asset",
            "connected_media",
          ]),
          selectedSkills: z.array(
            z.enum([
              "content_strategy",
              "filming",
              "editing",
              "audio_music",
              "compliance",
            ])
          ),
          executedSkills: z.array(z.string()),
          overallScore: z.number().nullable(),
          mainOpportunity: z.string().nullable(),
          oneLineSummary: z.string(),
          detailHint: z
            .object({
              analysisId: z.string().uuid(),
              tool: z.string(),
              message: z.string(),
            })
            .passthrough(),
          intent: z.string().max(1000).nullable(),
          brandId: z.union([z.string(), z.null()]),
        })
        .passthrough()
    ),
  })
  .passthrough();
const LatestAnalysisPagination = z
  .object({
    totalItems: z.number().int().gte(0),
    limit: z.number().int().gte(1).lte(50),
    returned: z.number().int().gte(0),
    hasMore: z.boolean(),
    nextCursor: z.string().nullable(),
  })
  .passthrough();
const LatestAnalysisListItem = z
  .object({
    id: z.string().uuid(),
    createdAt: z.string().datetime({ offset: true }),
    completedAt: z.string().datetime({ offset: true }).nullable(),
    status: z.enum(["pending", "completed", "failed"]),
    fileName: z.string(),
    sourceLabel: z.string(),
    sourceType: z.enum([
      "public_url",
      "public_url_best_effort",
      "file_upload",
      "owned_asset",
      "connected_media",
    ]),
    selectedSkills: z.array(
      z.enum([
        "content_strategy",
        "filming",
        "editing",
        "audio_music",
        "compliance",
      ])
    ),
    executedSkills: z.array(z.string()),
    overallScore: z.number().nullable(),
    mainOpportunity: z.string().nullable(),
    oneLineSummary: z.string(),
    detailHint: z
      .object({
        analysisId: z.string().uuid(),
        tool: z.string(),
        message: z.string(),
      })
      .passthrough(),
    intent: z.string().max(1000).nullable(),
    brandId: z.union([z.string(), z.null()]),
  })
  .passthrough();
const RecommendedAnalysisResponse = z
  .object({
    format: z.enum(["table", "brief", "detailed"]),
    columns: z.array(z.string()),
    instructions: z.string(),
  })
  .passthrough();
const AnalysisPresentation = z
  .object({
    title: z.string(),
    markdownTable: z.string().nullable(),
    answer: z.string().nullable(),
    language: z.enum(["pt-BR", "en", "es"]).nullable(),
  })
  .passthrough();
const AnalysisDetailHint = z
  .object({
    analysisId: z.string().uuid(),
    tool: z.string(),
    message: z.string(),
  })
  .passthrough();
const AnalysisListItem = z
  .object({
    id: z.string().uuid(),
    status: z.enum(["pending", "completed", "failed"]),
    sourceType: z.enum([
      "public_url",
      "public_url_best_effort",
      "file_upload",
      "owned_asset",
      "connected_media",
    ]),
    sourceLabel: z.string(),
    sourceUrl: z.string().nullish(),
    platform: z.enum(["instagram_reels", "youtube_shorts", "tiktok"]).nullish(),
    contentId: z.string().nullish(),
    catalogVersion: z.string(),
    selectedSkillIds: z.array(
      z.enum([
        "content_strategy",
        "filming",
        "editing",
        "audio_music",
        "compliance",
      ])
    ),
    executedSkills: z.array(
      z
        .object({
          skillId: z.enum([
            "content_strategy",
            "filming",
            "editing",
            "audio_music",
            "compliance",
          ]),
          status: z.enum(["completed", "insufficient_evidence", "failed"]),
          evaluatedItems: z.array(z.string()),
          summary: z.string(),
          skillScore: z.number().gte(0).lte(10),
          propertyScores: z.array(
            z
              .object({
                propertyId: z.string(),
                label: z.string(),
                score: z.number().gte(0).lte(10),
                rationale: z.string(),
                confidence: z.number().gte(0).lte(1),
              })
              .passthrough()
          ),
          detailedAssessment: z.string(),
          strengths: z.array(z.string()),
          improvementOpportunities: z.array(z.string()),
          recommendations: z.array(
            z
              .object({
                priority: z.string(),
                title: z.string(),
                rationale: z.string(),
                action: z.string(),
              })
              .passthrough()
          ),
          keySignals: z.array(z.string()),
          evidence: z.array(
            z
              .object({
                timestampSeconds: z.number(),
                kind: z.string(),
                observation: z.string(),
                transcriptQuote: z.string().nullish(),
              })
              .passthrough()
          ),
          evidenceGaps: z.array(z.string()),
          transcriptExcerpts: z.array(
            z
              .object({
                startSeconds: z.number().gte(0),
                endSeconds: z.number().gte(0),
                text: z.string(),
                whyItMatters: z.string(),
              })
              .passthrough()
          ),
          warnings: z.array(z.string()),
          disclaimer: z.string().nullish(),
        })
        .passthrough()
    ),
    summary: z.string(),
    overallScore: z.number().nullish(),
    blobPathPrefix: z.string().nullish(),
    errorMessage: z.string().nullish(),
    createdAt: z.string().datetime({ offset: true }),
    completedAt: z.string().datetime({ offset: true }).nullish(),
    intent: z.string().max(1000).nullable(),
    brandId: z.union([z.string(), z.null()]),
  })
  .passthrough();
const AnalysisDetailResponse = z
  .object({
    id: z.string().uuid(),
    status: z.enum(["pending", "completed", "failed"]),
    sourceType: z.enum([
      "public_url",
      "public_url_best_effort",
      "file_upload",
      "owned_asset",
      "connected_media",
    ]),
    sourceLabel: z.string(),
    sourceUrl: z.string().nullish(),
    platform: z.enum(["instagram_reels", "youtube_shorts", "tiktok"]).nullish(),
    contentId: z.string().nullish(),
    catalogVersion: z.string(),
    selectedSkillIds: z.array(
      z.enum([
        "content_strategy",
        "filming",
        "editing",
        "audio_music",
        "compliance",
      ])
    ),
    executedSkills: z.array(
      z
        .object({
          skillId: z.enum([
            "content_strategy",
            "filming",
            "editing",
            "audio_music",
            "compliance",
          ]),
          status: z.enum(["completed", "insufficient_evidence", "failed"]),
          evaluatedItems: z.array(z.string()),
          summary: z.string(),
          skillScore: z.number().gte(0).lte(10),
          propertyScores: z.array(
            z
              .object({
                propertyId: z.string(),
                label: z.string(),
                score: z.number().gte(0).lte(10),
                rationale: z.string(),
                confidence: z.number().gte(0).lte(1),
              })
              .passthrough()
          ),
          detailedAssessment: z.string(),
          strengths: z.array(z.string()),
          improvementOpportunities: z.array(z.string()),
          recommendations: z.array(
            z
              .object({
                priority: z.string(),
                title: z.string(),
                rationale: z.string(),
                action: z.string(),
              })
              .passthrough()
          ),
          keySignals: z.array(z.string()),
          evidence: z.array(
            z
              .object({
                timestampSeconds: z.number(),
                kind: z.string(),
                observation: z.string(),
                transcriptQuote: z.string().nullish(),
              })
              .passthrough()
          ),
          evidenceGaps: z.array(z.string()),
          transcriptExcerpts: z.array(
            z
              .object({
                startSeconds: z.number().gte(0),
                endSeconds: z.number().gte(0),
                text: z.string(),
                whyItMatters: z.string(),
              })
              .passthrough()
          ),
          warnings: z.array(z.string()),
          disclaimer: z.string().nullish(),
        })
        .passthrough()
    ),
    summary: z.string(),
    overallScore: z.number().nullish(),
    blobPathPrefix: z.string().nullish(),
    errorMessage: z.string().nullish(),
    createdAt: z.string().datetime({ offset: true }),
    completedAt: z.string().datetime({ offset: true }).nullish(),
    intent: z.string().max(1000).nullable(),
    brandId: z.union([z.string(), z.null()]),
  })
  .passthrough()
  .and(
    z
      .object({
        accountId: z.string().uuid(),
        canonicalUrl: z.string().nullish(),
        artifacts: z.object({
          blobPathPrefix: z.union([z.string(), z.null()]),
          files: z.array(z.string()),
          items: z.array(
            z.object({
              path: z.string(),
              fileName: z.string(),
              category: z.string(),
              mimeType: z.string(),
              downloadUrl: z.string(),
              previewUrl: z.string(),
            })
          ),
        }),
        report: z
          .object({
            source: z.object({
              source_type: z.enum([
                "public_url",
                "public_url_best_effort",
                "file_upload",
                "owned_asset",
                "connected_media",
              ]),
              source_label: z.string(),
              source_url: z.union([z.string(), z.null()]).optional(),
              canonical_url: z.union([z.string(), z.null()]).optional(),
              platform: z
                .union([
                  z.enum(["instagram_reels", "youtube_shorts", "tiktok"]),
                  z.null(),
                ])
                .optional(),
              content_id: z.union([z.string(), z.null()]).optional(),
              duration_seconds: z.number().gte(0),
              width: z.number().int().gte(0),
              height: z.number().int().gte(0),
              fps: z.number().gte(0),
              has_audio: z.boolean(),
              ingest_status: z.enum(["downloaded", "uploaded", "partial"]),
              artifact_directory: z.union([z.string(), z.null()]).optional(),
            }),
            catalog_version: z.string(),
            transcript: z.object({
              text: z.string(),
              language: z.string(),
              segments: z.array(
                z.object({
                  start_seconds: z.number().gte(0),
                  end_seconds: z.number().gte(0),
                  text: z.string(),
                })
              ),
            }),
            selected_skill_ids: z
              .array(
                z.enum([
                  "content_strategy",
                  "filming",
                  "editing",
                  "audio_music",
                  "compliance",
                ])
              )
              .min(1),
            executed_skills: z.array(
              z.object({
                skill_id: z.enum([
                  "content_strategy",
                  "filming",
                  "editing",
                  "audio_music",
                  "compliance",
                ]),
                status: z.enum([
                  "completed",
                  "insufficient_evidence",
                  "failed",
                ]),
                evaluated_items: z.array(z.string()),
                summary: z.string(),
                skill_score: z.number().gte(0).lte(10),
                property_scores: z.array(
                  z.object({
                    property_id: z.string(),
                    label: z.string(),
                    score: z.number().gte(0).lte(10),
                    rationale: z.string(),
                    confidence: z.number().gte(0).lte(1),
                  })
                ),
                detailed_assessment: z.string(),
                strengths: z.array(z.string()),
                improvement_opportunities: z.array(z.string()),
                recommendations: z.array(
                  z.object({
                    priority: z.string(),
                    title: z.string(),
                    rationale: z.string(),
                    action: z.string(),
                  })
                ),
                key_signals: z.array(z.string()),
                evidence: z.array(
                  z.object({
                    timestamp_seconds: z.number().gte(0),
                    kind: z.string(),
                    observation: z.string(),
                    transcript_quote: z
                      .union([z.string(), z.null()])
                      .optional(),
                  })
                ),
                evidence_gaps: z.array(z.string()),
                transcript_excerpts: z.array(
                  z.object({
                    start_seconds: z.number().gte(0),
                    end_seconds: z.number().gte(0),
                    text: z.string(),
                    why_it_matters: z.string(),
                  })
                ),
                warnings: z.array(z.string()),
                disclaimer: z.union([z.string(), z.null()]).optional(),
              })
            ),
            overall_score: z.union([z.number(), z.null()]).optional(),
            warnings: z.array(z.string()),
          })
          .optional(),
      })
      .passthrough()
  );
const Brand = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(160),
  timeZone: z.string(),
  confirmedAt: z.union([z.string(), z.null()]),
  status: z.enum(["active", "archiving", "archived"]),
  createdAt: z.string().datetime({ offset: true }),
  archivedAt: z.union([z.string(), z.null()]),
});
const BrandCreateRequest = z.object({
  name: z.string().min(1).max(160),
  timeZone: z.string().min(1).max(80),
});
const BrandUpdateRequest = z
  .object({
    name: z.string().min(1).max(160),
    timeZone: z.string().min(1).max(80),
    confirmed: z.boolean(),
  })
  .partial();
const BrandListResponse = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(160),
      timeZone: z.string(),
      confirmedAt: z.union([z.string(), z.null()]),
      status: z.enum(["active", "archiving", "archived"]),
      createdAt: z.string().datetime({ offset: true }),
      archivedAt: z.union([z.string(), z.null()]),
    })
  ),
});
const MediaMetadata = z.object({
  width: z.number().int().gte(1),
  height: z.number().int().gte(1),
  durationSeconds: z.union([z.number(), z.null()]).optional(),
  codec: z.union([z.string(), z.null()]).optional(),
  format: z.union([z.string(), z.null()]).optional(),
});
const AssignAnalysisBrandRequest = z.object({ brandId: z.string().uuid() });
const MemberInvitation = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  expiresAt: z.string().datetime({ offset: true }),
  status: z.enum(["pending", "accepted", "revoked", "expired"]),
});
const MemberInvitationCreateRequest = z.object({
  email: z.string().max(254).email(),
});
const MemberInvitationCreateResponse = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  expiresAt: z.string().datetime({ offset: true }),
  inviteUrl: z.string().url(),
});
const MemberInvitationAcceptRequest = z.object({
  token: z.string().min(20).max(200),
});
const MemberListResponse = z.object({
  items: z.array(
    z
      .object({
        id: z.string().uuid(),
        name: z.string(),
        email: z.string().email(),
        role: z.enum(["owner", "member"]),
        createdAt: z.string().datetime({ offset: true }),
      })
      .passthrough()
  ),
});
const MemberInvitationListResponse = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      email: z.string().email(),
      expiresAt: z.string().datetime({ offset: true }),
      status: z.enum(["pending", "accepted", "revoked", "expired"]),
    })
  ),
});
const UsageResponse = z.object({
  cycleStart: z.string().datetime({ offset: true }),
  cycleEnd: z.string().datetime({ offset: true }),
  subscriptionStatus: z.enum(["active", "inactive"]),
  limits: z.object({
    brands: z.number().int().gte(0),
    socialIdentities: z.number().int().gte(0),
    operators: z.number().int().gte(0),
    analyses: z.number().int().gte(0),
  }),
  usage: z.object({
    brands: z.number().int().gte(0),
    socialIdentities: z.number().int().gte(0),
    operators: z.number().int().gte(0),
    analyses: z.number().int().gte(0),
    reservedAnalyses: z.number().int().gte(0),
  }),
  credits: z.object({
    includedRemaining: z.number().int().gte(0),
    purchasedRemaining: z.number().int().gte(0),
  }),
});
const Notification = z.object({
  id: z.string().uuid(),
  code: z.string(),
  message: z.string().max(500),
  brandId: z.union([z.string(), z.null()]),
  resourceId: z.union([z.string(), z.null()]),
  createdAt: z.string().datetime({ offset: true }),
  readAt: z.union([z.string(), z.null()]),
});
const AuditEvent = z.object({
  id: z.string(),
  action: z.string(),
  actorId: z.string(),
  brandId: z.union([z.string(), z.null()]),
  resourceType: z.string(),
  resourceId: z.string(),
  createdAt: z.string().datetime({ offset: true }),
  correlationId: z.string(),
});
const NotificationListResponse = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      code: z.string(),
      message: z.string().max(500),
      brandId: z.union([z.string(), z.null()]),
      resourceId: z.union([z.string(), z.null()]),
      createdAt: z.string().datetime({ offset: true }),
      readAt: z.union([z.string(), z.null()]),
    })
  ),
  nextCursor: z.string().uuid().optional(),
});
const AuditEventListResponse = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      action: z.string(),
      actorId: z.string(),
      brandId: z.union([z.string(), z.null()]),
      resourceType: z.string(),
      resourceId: z.string(),
      createdAt: z.string().datetime({ offset: true }),
      correlationId: z.string(),
    })
  ),
  nextCursor: z.string().uuid().optional(),
});
const SocialDestinationSettings = z
  .object({
    privacyLevel: z.enum([
      "PUBLIC_TO_EVERYONE",
      "MUTUAL_FOLLOW_FRIENDS",
      "FOLLOWER_OF_CREATOR",
      "SELF_ONLY",
      "public",
      "private",
      "unlisted",
    ]),
    previewConfirmed: z.boolean(),
    expressConsentGiven: z.boolean(),
    allowComment: z.boolean(),
    allowDuet: z.boolean(),
    allowStitch: z.boolean(),
    isAiGenerated: z.boolean(),
    commercialContentType: z.enum(["none", "brand_organic", "brand_content"]),
    shareToFeed: z.boolean(),
    madeForKids: z.boolean(),
    containsSyntheticMedia: z.boolean(),
    tags: z.array(z.string()),
    coverTimestampMs: z.number(),
  })
  .partial();
const SocialDestinationInput = z.object({
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
  content: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  mediaAssetIds: z.array(z.string().uuid()),
  coverAssetId: z.string().uuid().optional(),
  analysisId: z.string().uuid().optional(),
  settings: z
    .object({
      privacyLevel: z.enum([
        "PUBLIC_TO_EVERYONE",
        "MUTUAL_FOLLOW_FRIENDS",
        "FOLLOWER_OF_CREATOR",
        "SELF_ONLY",
        "public",
        "private",
        "unlisted",
      ]),
      previewConfirmed: z.boolean(),
      expressConsentGiven: z.boolean(),
      allowComment: z.boolean(),
      allowDuet: z.boolean(),
      allowStitch: z.boolean(),
      isAiGenerated: z.boolean(),
      commercialContentType: z.enum(["none", "brand_organic", "brand_content"]),
      shareToFeed: z.boolean(),
      madeForKids: z.boolean(),
      containsSyntheticMedia: z.boolean(),
      tags: z.array(z.string()),
      coverTimestampMs: z.number(),
    })
    .partial(),
});
const SocialAccount = z.object({
  id: z.string().uuid(),
  brandId: z.string().uuid(),
  platform: z.enum(["instagram", "tiktok", "youtube", "linkedin"]),
  displayName: z.string(),
  status: z.enum([
    "pending",
    "active",
    "requires_action",
    "disconnecting",
    "disconnected",
  ]),
  identityStatus: z.enum(["verified", "unavailable"]),
  createdAt: z.string().datetime({ offset: true }),
});
const SocialAuthorizationRequest = z.object({
  platform: z.enum(["instagram", "tiktok", "youtube", "linkedin"]),
  reconnectAccountId: z.string().uuid().optional(),
});
const SocialAuthorization = z.object({
  id: z.string().uuid(),
  authorizationUrl: z.string().url(),
  expiresAt: z.string().datetime({ offset: true }),
});
const SocialCapabilities = z.object({
  platform: z.enum(["instagram", "tiktok", "youtube", "linkedin"]),
  formats: z.array(z.string()),
  limits: z.object({
    maxBytes: z.number(),
    maxImages: z.number(),
    maxContentLength: z.number(),
    minVideoSeconds: z.number(),
    maxVideoSeconds: z.number(),
  }),
  privacyLevels: z.array(z.string()).optional(),
  identityStatus: z.enum(["verified", "unavailable"]),
  canPost: z.boolean(),
  interactionSettings: z
    .record(z.object({ enabled: z.boolean(), required: z.boolean() }))
    .optional(),
});
const SocialDestinationVersion = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime({ offset: true }),
  scheduledAt: z.union([z.string(), z.null()]),
  snapshot: z.object({
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
    content: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
    mediaAssetIds: z.array(z.string().uuid()),
    coverAssetId: z.string().uuid().optional(),
    analysisId: z.string().uuid().optional(),
    settings: z
      .object({
        privacyLevel: z.enum([
          "PUBLIC_TO_EVERYONE",
          "MUTUAL_FOLLOW_FRIENDS",
          "FOLLOWER_OF_CREATOR",
          "SELF_ONLY",
          "public",
          "private",
          "unlisted",
        ]),
        previewConfirmed: z.boolean(),
        expressConsentGiven: z.boolean(),
        allowComment: z.boolean(),
        allowDuet: z.boolean(),
        allowStitch: z.boolean(),
        isAiGenerated: z.boolean(),
        commercialContentType: z.enum([
          "none",
          "brand_organic",
          "brand_content",
        ]),
        shareToFeed: z.boolean(),
        madeForKids: z.boolean(),
        containsSyntheticMedia: z.boolean(),
        tags: z.array(z.string()),
        coverTimestampMs: z.number(),
      })
      .partial(),
  }),
  timeZone: z.union([z.string(), z.null()]),
  localDateTime: z.union([z.string(), z.null()]),
});
const SocialDeliveryAttempt = z.object({
  id: z.string().uuid(),
  status: z.string(),
  lastError: z.union([z.string(), z.null()]),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});
const SocialDestination = z.object({
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
  content: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  mediaAssetIds: z.array(z.string().uuid()),
  coverAssetId: z.string().uuid().optional(),
  analysisId: z.string().uuid().optional(),
  settings: z
    .object({
      privacyLevel: z.enum([
        "PUBLIC_TO_EVERYONE",
        "MUTUAL_FOLLOW_FRIENDS",
        "FOLLOWER_OF_CREATOR",
        "SELF_ONLY",
        "public",
        "private",
        "unlisted",
      ]),
      previewConfirmed: z.boolean(),
      expressConsentGiven: z.boolean(),
      allowComment: z.boolean(),
      allowDuet: z.boolean(),
      allowStitch: z.boolean(),
      isAiGenerated: z.boolean(),
      commercialContentType: z.enum(["none", "brand_organic", "brand_content"]),
      shareToFeed: z.boolean(),
      madeForKids: z.boolean(),
      containsSyntheticMedia: z.boolean(),
      tags: z.array(z.string()),
      coverTimestampMs: z.number(),
    })
    .partial(),
  id: z.string().uuid(),
  publicationId: z.string().uuid(),
  platform: z.enum(["instagram", "tiktok", "youtube", "linkedin"]),
  status: z.enum([
    "draft",
    "awaiting_handoff",
    "submitting",
    "scheduled",
    "publishing",
    "published",
    "cancellation_requested",
    "cancelled",
    "unknown",
    "failed",
  ]),
  scheduledAt: z.union([z.string(), z.null()]),
  timeZone: z.union([z.string(), z.null()]),
  localDateTime: z.union([z.string(), z.null()]),
  lastError: z.union([z.string(), z.null()]),
  versions: z
    .array(
      z.object({
        id: z.string().uuid(),
        createdAt: z.string().datetime({ offset: true }),
        scheduledAt: z.union([z.string(), z.null()]),
        snapshot: z.object({
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
          content: z.string(),
          title: z.string().optional(),
          description: z.string().optional(),
          mediaAssetIds: z.array(z.string().uuid()),
          coverAssetId: z.string().uuid().optional(),
          analysisId: z.string().uuid().optional(),
          settings: z
            .object({
              privacyLevel: z.enum([
                "PUBLIC_TO_EVERYONE",
                "MUTUAL_FOLLOW_FRIENDS",
                "FOLLOWER_OF_CREATOR",
                "SELF_ONLY",
                "public",
                "private",
                "unlisted",
              ]),
              previewConfirmed: z.boolean(),
              expressConsentGiven: z.boolean(),
              allowComment: z.boolean(),
              allowDuet: z.boolean(),
              allowStitch: z.boolean(),
              isAiGenerated: z.boolean(),
              commercialContentType: z.enum([
                "none",
                "brand_organic",
                "brand_content",
              ]),
              shareToFeed: z.boolean(),
              madeForKids: z.boolean(),
              containsSyntheticMedia: z.boolean(),
              tags: z.array(z.string()),
              coverTimestampMs: z.number(),
            })
            .partial(),
        }),
        timeZone: z.union([z.string(), z.null()]),
        localDateTime: z.union([z.string(), z.null()]),
      })
    )
    .optional(),
  attempts: z
    .array(
      z.object({
        id: z.string().uuid(),
        status: z.string(),
        lastError: z.union([z.string(), z.null()]),
        createdAt: z.string().datetime({ offset: true }),
        updatedAt: z.string().datetime({ offset: true }),
      })
    )
    .optional(),
});
const SocialPublication = z.object({
  id: z.string().uuid(),
  brandId: z.string().uuid(),
  title: z.string(),
  status: z.string(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  destinations: z.array(
    z.object({
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
      content: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      mediaAssetIds: z.array(z.string().uuid()),
      coverAssetId: z.string().uuid().optional(),
      analysisId: z.string().uuid().optional(),
      settings: z
        .object({
          privacyLevel: z.enum([
            "PUBLIC_TO_EVERYONE",
            "MUTUAL_FOLLOW_FRIENDS",
            "FOLLOWER_OF_CREATOR",
            "SELF_ONLY",
            "public",
            "private",
            "unlisted",
          ]),
          previewConfirmed: z.boolean(),
          expressConsentGiven: z.boolean(),
          allowComment: z.boolean(),
          allowDuet: z.boolean(),
          allowStitch: z.boolean(),
          isAiGenerated: z.boolean(),
          commercialContentType: z.enum([
            "none",
            "brand_organic",
            "brand_content",
          ]),
          shareToFeed: z.boolean(),
          madeForKids: z.boolean(),
          containsSyntheticMedia: z.boolean(),
          tags: z.array(z.string()),
          coverTimestampMs: z.number(),
        })
        .partial(),
      id: z.string().uuid(),
      publicationId: z.string().uuid(),
      platform: z.enum(["instagram", "tiktok", "youtube", "linkedin"]),
      status: z.enum([
        "draft",
        "awaiting_handoff",
        "submitting",
        "scheduled",
        "publishing",
        "published",
        "cancellation_requested",
        "cancelled",
        "unknown",
        "failed",
      ]),
      scheduledAt: z.union([z.string(), z.null()]),
      timeZone: z.union([z.string(), z.null()]),
      localDateTime: z.union([z.string(), z.null()]),
      lastError: z.union([z.string(), z.null()]),
      versions: z
        .array(
          z.object({
            id: z.string().uuid(),
            createdAt: z.string().datetime({ offset: true }),
            scheduledAt: z.union([z.string(), z.null()]),
            snapshot: z.object({
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
              content: z.string(),
              title: z.string().optional(),
              description: z.string().optional(),
              mediaAssetIds: z.array(z.string().uuid()),
              coverAssetId: z.string().uuid().optional(),
              analysisId: z.string().uuid().optional(),
              settings: z
                .object({
                  privacyLevel: z.enum([
                    "PUBLIC_TO_EVERYONE",
                    "MUTUAL_FOLLOW_FRIENDS",
                    "FOLLOWER_OF_CREATOR",
                    "SELF_ONLY",
                    "public",
                    "private",
                    "unlisted",
                  ]),
                  previewConfirmed: z.boolean(),
                  expressConsentGiven: z.boolean(),
                  allowComment: z.boolean(),
                  allowDuet: z.boolean(),
                  allowStitch: z.boolean(),
                  isAiGenerated: z.boolean(),
                  commercialContentType: z.enum([
                    "none",
                    "brand_organic",
                    "brand_content",
                  ]),
                  shareToFeed: z.boolean(),
                  madeForKids: z.boolean(),
                  containsSyntheticMedia: z.boolean(),
                  tags: z.array(z.string()),
                  coverTimestampMs: z.number(),
                })
                .partial(),
            }),
            timeZone: z.union([z.string(), z.null()]),
            localDateTime: z.union([z.string(), z.null()]),
          })
        )
        .optional(),
      attempts: z
        .array(
          z.object({
            id: z.string().uuid(),
            status: z.string(),
            lastError: z.union([z.string(), z.null()]),
            createdAt: z.string().datetime({ offset: true }),
            updatedAt: z.string().datetime({ offset: true }),
          })
        )
        .optional(),
    })
  ),
});
const SocialPublicationCreate = z.object({
  brandId: z.string().uuid(),
  title: z.string().min(1).max(160),
});
const SocialPreflight = z.object({
  valid: z.boolean(),
  issues: z.array(
    z.object({ field: z.string(), code: z.string(), message: z.string() })
  ),
  capabilities: z.object({
    platform: z.enum(["instagram", "tiktok", "youtube", "linkedin"]),
    formats: z.array(z.string()),
    limits: z.object({
      maxBytes: z.number(),
      maxImages: z.number(),
      maxContentLength: z.number(),
      minVideoSeconds: z.number(),
      maxVideoSeconds: z.number(),
    }),
    privacyLevels: z.array(z.string()).optional(),
    identityStatus: z.enum(["verified", "unavailable"]),
    canPost: z.boolean(),
    interactionSettings: z
      .record(z.object({ enabled: z.boolean(), required: z.boolean() }))
      .optional(),
  }),
});
const SocialSubmit = z.object({
  publishNow: z.boolean(),
  localDateTime: z.string().optional(),
});
const SocialPending = z.object({ status: z.literal("pending") });
const ExternalPost = z.object({
  id: z.string().uuid(),
  brandId: z.string().uuid(),
  socialAccountId: z.string().uuid(),
  platform: z.enum(["instagram", "tiktok", "youtube", "linkedin"]),
  nativePostId: z.string(),
  url: z.union([z.string(), z.null()]),
  content: z.string(),
  publishedAt: z.string().datetime({ offset: true }),
});
const ExternalPostImport = z.object({
  socialAccountId: z.string().uuid(),
  url: z.string().max(2048).url(),
});
const SocialMetricSnapshot = z.object({
  id: z.string().uuid(),
  brandId: z.string().uuid(),
  socialAccountId: z.string().uuid(),
  destinationId: z.union([z.string(), z.null()]),
  externalPostId: z.union([z.string(), z.null()]),
  platform: z.enum(["instagram", "tiktok", "youtube", "linkedin"]),
  metric: z.string(),
  value: z.union([z.number(), z.null()]),
  availability: z.enum(["available", "unavailable"]),
  periodStart: z.union([z.string(), z.null()]),
  periodEnd: z.union([z.string(), z.null()]),
  observedAt: z.string().datetime({ offset: true }),
  dataThrough: z.union([z.string(), z.null()]),
  source: z.string(),
});
const SocialAccountList = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      brandId: z.string().uuid(),
      platform: z.enum(["instagram", "tiktok", "youtube", "linkedin"]),
      displayName: z.string(),
      status: z.enum([
        "pending",
        "active",
        "requires_action",
        "disconnecting",
        "disconnected",
      ]),
      identityStatus: z.enum(["verified", "unavailable"]),
      createdAt: z.string().datetime({ offset: true }),
    })
  ),
});
const SocialPublicationList = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      brandId: z.string().uuid(),
      title: z.string(),
      status: z.string(),
      createdAt: z.string().datetime({ offset: true }),
      updatedAt: z.string().datetime({ offset: true }),
      destinations: z.array(
        z.object({
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
          content: z.string(),
          title: z.string().optional(),
          description: z.string().optional(),
          mediaAssetIds: z.array(z.string().uuid()),
          coverAssetId: z.string().uuid().optional(),
          analysisId: z.string().uuid().optional(),
          settings: z
            .object({
              privacyLevel: z.enum([
                "PUBLIC_TO_EVERYONE",
                "MUTUAL_FOLLOW_FRIENDS",
                "FOLLOWER_OF_CREATOR",
                "SELF_ONLY",
                "public",
                "private",
                "unlisted",
              ]),
              previewConfirmed: z.boolean(),
              expressConsentGiven: z.boolean(),
              allowComment: z.boolean(),
              allowDuet: z.boolean(),
              allowStitch: z.boolean(),
              isAiGenerated: z.boolean(),
              commercialContentType: z.enum([
                "none",
                "brand_organic",
                "brand_content",
              ]),
              shareToFeed: z.boolean(),
              madeForKids: z.boolean(),
              containsSyntheticMedia: z.boolean(),
              tags: z.array(z.string()),
              coverTimestampMs: z.number(),
            })
            .partial(),
          id: z.string().uuid(),
          publicationId: z.string().uuid(),
          platform: z.enum(["instagram", "tiktok", "youtube", "linkedin"]),
          status: z.enum([
            "draft",
            "awaiting_handoff",
            "submitting",
            "scheduled",
            "publishing",
            "published",
            "cancellation_requested",
            "cancelled",
            "unknown",
            "failed",
          ]),
          scheduledAt: z.union([z.string(), z.null()]),
          timeZone: z.union([z.string(), z.null()]),
          localDateTime: z.union([z.string(), z.null()]),
          lastError: z.union([z.string(), z.null()]),
          versions: z
            .array(
              z.object({
                id: z.string().uuid(),
                createdAt: z.string().datetime({ offset: true }),
                scheduledAt: z.union([z.string(), z.null()]),
                snapshot: z.object({
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
                  content: z.string(),
                  title: z.string().optional(),
                  description: z.string().optional(),
                  mediaAssetIds: z.array(z.string().uuid()),
                  coverAssetId: z.string().uuid().optional(),
                  analysisId: z.string().uuid().optional(),
                  settings: z
                    .object({
                      privacyLevel: z.enum([
                        "PUBLIC_TO_EVERYONE",
                        "MUTUAL_FOLLOW_FRIENDS",
                        "FOLLOWER_OF_CREATOR",
                        "SELF_ONLY",
                        "public",
                        "private",
                        "unlisted",
                      ]),
                      previewConfirmed: z.boolean(),
                      expressConsentGiven: z.boolean(),
                      allowComment: z.boolean(),
                      allowDuet: z.boolean(),
                      allowStitch: z.boolean(),
                      isAiGenerated: z.boolean(),
                      commercialContentType: z.enum([
                        "none",
                        "brand_organic",
                        "brand_content",
                      ]),
                      shareToFeed: z.boolean(),
                      madeForKids: z.boolean(),
                      containsSyntheticMedia: z.boolean(),
                      tags: z.array(z.string()),
                      coverTimestampMs: z.number(),
                    })
                    .partial(),
                }),
                timeZone: z.union([z.string(), z.null()]),
                localDateTime: z.union([z.string(), z.null()]),
              })
            )
            .optional(),
          attempts: z
            .array(
              z.object({
                id: z.string().uuid(),
                status: z.string(),
                lastError: z.union([z.string(), z.null()]),
                createdAt: z.string().datetime({ offset: true }),
                updatedAt: z.string().datetime({ offset: true }),
              })
            )
            .optional(),
        })
      ),
    })
  ),
  nextCursor: z.string().optional(),
});
const ExternalPostList = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      brandId: z.string().uuid(),
      socialAccountId: z.string().uuid(),
      platform: z.enum(["instagram", "tiktok", "youtube", "linkedin"]),
      nativePostId: z.string(),
      url: z.union([z.string(), z.null()]),
      content: z.string(),
      publishedAt: z.string().datetime({ offset: true }),
    })
  ),
  nextCursor: z.string().optional(),
});
const SocialMetricList = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      brandId: z.string().uuid(),
      socialAccountId: z.string().uuid(),
      destinationId: z.union([z.string(), z.null()]),
      externalPostId: z.union([z.string(), z.null()]),
      platform: z.enum(["instagram", "tiktok", "youtube", "linkedin"]),
      metric: z.string(),
      value: z.union([z.number(), z.null()]),
      availability: z.enum(["available", "unavailable"]),
      periodStart: z.union([z.string(), z.null()]),
      periodEnd: z.union([z.string(), z.null()]),
      observedAt: z.string().datetime({ offset: true }),
      dataThrough: z.union([z.string(), z.null()]),
      source: z.string(),
    })
  ),
  nextCursor: z.string().optional(),
});
const analysis_artifacts_v1 = z.object({
  blobPathPrefix: z.union([z.string(), z.null()]),
  files: z.array(z.string()),
  items: z.array(
    z.object({
      path: z.string(),
      fileName: z.string(),
      category: z.string(),
      mimeType: z.string(),
      downloadUrl: z.string(),
      previewUrl: z.string(),
    })
  ),
});
const transcript_segment = z.object({
  start_seconds: z.number().gte(0),
  end_seconds: z.number().gte(0),
  text: z.string(),
});
const analysis_skill_id = z.enum([
  "content_strategy",
  "filming",
  "editing",
  "audio_music",
  "compliance",
]);
const executed_skill_status = z.enum([
  "completed",
  "insufficient_evidence",
  "failed",
]);
const property_score = z.object({
  property_id: z.string(),
  label: z.string(),
  score: z.number().gte(0).lte(10),
  rationale: z.string(),
  confidence: z.number().gte(0).lte(1),
});
const recommendation = z.object({
  priority: z.string(),
  title: z.string(),
  rationale: z.string(),
  action: z.string(),
});
const evidence_item = z.object({
  timestamp_seconds: z.number().gte(0),
  kind: z.string(),
  observation: z.string(),
  transcript_quote: z.union([z.string(), z.null()]).optional(),
});
const transcript_excerpt = z.object({
  start_seconds: z.number().gte(0),
  end_seconds: z.number().gte(0),
  text: z.string(),
  why_it_matters: z.string(),
});
const transcript = z.object({
  text: z.string(),
  language: z.string(),
  segments: z.array(
    z.object({
      start_seconds: z.number().gte(0),
      end_seconds: z.number().gte(0),
      text: z.string(),
    })
  ),
});
const executed_skill_result = z.object({
  skill_id: z.enum([
    "content_strategy",
    "filming",
    "editing",
    "audio_music",
    "compliance",
  ]),
  status: z.enum(["completed", "insufficient_evidence", "failed"]),
  evaluated_items: z.array(z.string()),
  summary: z.string(),
  skill_score: z.number().gte(0).lte(10),
  property_scores: z.array(
    z.object({
      property_id: z.string(),
      label: z.string(),
      score: z.number().gte(0).lte(10),
      rationale: z.string(),
      confidence: z.number().gte(0).lte(1),
    })
  ),
  detailed_assessment: z.string(),
  strengths: z.array(z.string()),
  improvement_opportunities: z.array(z.string()),
  recommendations: z.array(
    z.object({
      priority: z.string(),
      title: z.string(),
      rationale: z.string(),
      action: z.string(),
    })
  ),
  key_signals: z.array(z.string()),
  evidence: z.array(
    z.object({
      timestamp_seconds: z.number().gte(0),
      kind: z.string(),
      observation: z.string(),
      transcript_quote: z.union([z.string(), z.null()]).optional(),
    })
  ),
  evidence_gaps: z.array(z.string()),
  transcript_excerpts: z.array(
    z.object({
      start_seconds: z.number().gte(0),
      end_seconds: z.number().gte(0),
      text: z.string(),
      why_it_matters: z.string(),
    })
  ),
  warnings: z.array(z.string()),
  disclaimer: z.union([z.string(), z.null()]).optional(),
});
const analysis_report_v1 = z.object({
  source: z.object({
    source_type: z.enum([
      "public_url",
      "public_url_best_effort",
      "file_upload",
      "owned_asset",
      "connected_media",
    ]),
    source_label: z.string(),
    source_url: z.union([z.string(), z.null()]).optional(),
    canonical_url: z.union([z.string(), z.null()]).optional(),
    platform: z
      .union([
        z.enum(["instagram_reels", "youtube_shorts", "tiktok"]),
        z.null(),
      ])
      .optional(),
    content_id: z.union([z.string(), z.null()]).optional(),
    duration_seconds: z.number().gte(0),
    width: z.number().int().gte(0),
    height: z.number().int().gte(0),
    fps: z.number().gte(0),
    has_audio: z.boolean(),
    ingest_status: z.enum(["downloaded", "uploaded", "partial"]),
    artifact_directory: z.union([z.string(), z.null()]).optional(),
  }),
  catalog_version: z.string(),
  transcript: z.object({
    text: z.string(),
    language: z.string(),
    segments: z.array(
      z.object({
        start_seconds: z.number().gte(0),
        end_seconds: z.number().gte(0),
        text: z.string(),
      })
    ),
  }),
  selected_skill_ids: z
    .array(
      z.enum([
        "content_strategy",
        "filming",
        "editing",
        "audio_music",
        "compliance",
      ])
    )
    .min(1),
  executed_skills: z.array(
    z.object({
      skill_id: z.enum([
        "content_strategy",
        "filming",
        "editing",
        "audio_music",
        "compliance",
      ]),
      status: z.enum(["completed", "insufficient_evidence", "failed"]),
      evaluated_items: z.array(z.string()),
      summary: z.string(),
      skill_score: z.number().gte(0).lte(10),
      property_scores: z.array(
        z.object({
          property_id: z.string(),
          label: z.string(),
          score: z.number().gte(0).lte(10),
          rationale: z.string(),
          confidence: z.number().gte(0).lte(1),
        })
      ),
      detailed_assessment: z.string(),
      strengths: z.array(z.string()),
      improvement_opportunities: z.array(z.string()),
      recommendations: z.array(
        z.object({
          priority: z.string(),
          title: z.string(),
          rationale: z.string(),
          action: z.string(),
        })
      ),
      key_signals: z.array(z.string()),
      evidence: z.array(
        z.object({
          timestamp_seconds: z.number().gte(0),
          kind: z.string(),
          observation: z.string(),
          transcript_quote: z.union([z.string(), z.null()]).optional(),
        })
      ),
      evidence_gaps: z.array(z.string()),
      transcript_excerpts: z.array(
        z.object({
          start_seconds: z.number().gte(0),
          end_seconds: z.number().gte(0),
          text: z.string(),
          why_it_matters: z.string(),
        })
      ),
      warnings: z.array(z.string()),
      disclaimer: z.union([z.string(), z.null()]).optional(),
    })
  ),
  overall_score: z.union([z.number(), z.null()]).optional(),
  warnings: z.array(z.string()),
});

export const schemas = {
  postApiv1authregister_Body,
  postApiv1authlogin_Body,
  postApiv1authemailLink_Body,
  patchApiv1authaccount_Body,
  postApiv1oauthauthorizationCodes_Body,
  postApiv1oauthdevicecode_Body,
  postApiv1oauthtoken_Body,
  postApiv1oauthrevoke_Body,
  postApiv1sourceAssets_Body,
  postApiv1sourceAssetsdirectUploads_Body,
  postApiv1integrationssourceAssetSessions_Body,
  postApiv1analyses_Body,
  putApiv1analysesIdfeedbackReactionsFeedbackItemKey_Body,
  postApiv1brands_Body,
  patchApiv1brandsId_Body,
  createSocialAuthorization_Body,
  createSocialPublication_Body,
  createSocialDestination_Body,
  submitSocialDestination_Body,
  importExternalPost_Body,
  FieldError,
  ErrorResponse,
  ValidationErrorResponse,
  RegisterRequest,
  LoginRequest,
  UpdateAccountProfileRequest,
  FirebaseEmailLinkSignInRequest,
  FirebaseSignInRequest,
  AuthSessionResponse,
  AccountResponse,
  AccountUserResponse,
  OAuthAuthorizationCodeCreateRequest,
  OAuthAuthorizationCodeResponse,
  OAuthDeviceCodeRequest,
  OAuthDeviceActivationRequest,
  OAuthDeviceCodeResponse,
  OAuthTokenResponse,
  OAuthSessionResponse,
  OAuthRevokeRequest,
  CreateAnalysisFromUrlRequest,
  CreateAnalysisFromSourceAssetRequest,
  CreateAnalysisUploadRequest,
  AnalysisSkillId,
  AnalysisSkillStatus,
  AnalysisSourceKind,
  ExecutedAnalysisSkillStatus,
  FeedbackReactionValue,
  FeedbackItemKind,
  FeedbackReactionUpsertRequest,
  MyFeedbackReactionListResponse,
  MyFeedbackReaction,
  FeedbackReactionReviewResponse,
  FeedbackReactionReviewPagination,
  FeedbackReactionReviewItem,
  SourceAssetItem,
  SourceAssetListResponse,
  SourceAssetDirectUploadCreateRequest,
  SourceAssetDirectUploadCompleteRequest,
  SourceAssetDirectUploadResponse,
  SourceAssetUploadSessionCreateRequest,
  SourceAssetUploadSessionCompleteRequest,
  SourceAssetUploadSessionResponse,
  EvidenceItem,
  TranscriptSegment,
  Transcript,
  PropertyScore,
  TranscriptExcerpt,
  Recommendation,
  AnalysisSkillCatalogResponse,
  AnalysisSkillCatalogItem,
  ExecutedAnalysisSkill,
  ShortVideoAnalysisReport,
  SourceSection,
  AnalysisListResponse,
  LatestAnalysisListResponse,
  LatestAnalysisPagination,
  LatestAnalysisListItem,
  RecommendedAnalysisResponse,
  AnalysisPresentation,
  AnalysisDetailHint,
  AnalysisListItem,
  AnalysisDetailResponse,
  Brand,
  BrandCreateRequest,
  BrandUpdateRequest,
  BrandListResponse,
  MediaMetadata,
  AssignAnalysisBrandRequest,
  MemberInvitation,
  MemberInvitationCreateRequest,
  MemberInvitationCreateResponse,
  MemberInvitationAcceptRequest,
  MemberListResponse,
  MemberInvitationListResponse,
  UsageResponse,
  Notification,
  AuditEvent,
  NotificationListResponse,
  AuditEventListResponse,
  SocialDestinationSettings,
  SocialDestinationInput,
  SocialAccount,
  SocialAuthorizationRequest,
  SocialAuthorization,
  SocialCapabilities,
  SocialDestinationVersion,
  SocialDeliveryAttempt,
  SocialDestination,
  SocialPublication,
  SocialPublicationCreate,
  SocialPreflight,
  SocialSubmit,
  SocialPending,
  ExternalPost,
  ExternalPostImport,
  SocialMetricSnapshot,
  SocialAccountList,
  SocialPublicationList,
  ExternalPostList,
  SocialMetricList,
  analysis_artifacts_v1,
  transcript_segment,
  analysis_skill_id,
  executed_skill_status,
  property_score,
  recommendation,
  evidence_item,
  transcript_excerpt,
  transcript,
  executed_skill_result,
  analysis_report_v1,
};

const endpoints = makeApi([
  {
    method: "get",
    path: "/",
    alias: "get",
    requestFormat: "json",
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/analyses",
    alias: "postApiv1analyses",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: postApiv1analyses_Body,
      },
    ],
    response: z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "completed", "failed"]),
        sourceType: z.enum([
          "public_url",
          "public_url_best_effort",
          "file_upload",
          "owned_asset",
          "connected_media",
        ]),
        sourceLabel: z.string(),
        sourceUrl: z.string().nullish(),
        platform: z
          .enum(["instagram_reels", "youtube_shorts", "tiktok"])
          .nullish(),
        contentId: z.string().nullish(),
        catalogVersion: z.string(),
        selectedSkillIds: z.array(
          z.enum([
            "content_strategy",
            "filming",
            "editing",
            "audio_music",
            "compliance",
          ])
        ),
        executedSkills: z.array(
          z
            .object({
              skillId: z.enum([
                "content_strategy",
                "filming",
                "editing",
                "audio_music",
                "compliance",
              ]),
              status: z.enum(["completed", "insufficient_evidence", "failed"]),
              evaluatedItems: z.array(z.string()),
              summary: z.string(),
              skillScore: z.number().gte(0).lte(10),
              propertyScores: z.array(
                z
                  .object({
                    propertyId: z.string(),
                    label: z.string(),
                    score: z.number().gte(0).lte(10),
                    rationale: z.string(),
                    confidence: z.number().gte(0).lte(1),
                  })
                  .passthrough()
              ),
              detailedAssessment: z.string(),
              strengths: z.array(z.string()),
              improvementOpportunities: z.array(z.string()),
              recommendations: z.array(
                z
                  .object({
                    priority: z.string(),
                    title: z.string(),
                    rationale: z.string(),
                    action: z.string(),
                  })
                  .passthrough()
              ),
              keySignals: z.array(z.string()),
              evidence: z.array(
                z
                  .object({
                    timestampSeconds: z.number(),
                    kind: z.string(),
                    observation: z.string(),
                    transcriptQuote: z.string().nullish(),
                  })
                  .passthrough()
              ),
              evidenceGaps: z.array(z.string()),
              transcriptExcerpts: z.array(
                z
                  .object({
                    startSeconds: z.number().gte(0),
                    endSeconds: z.number().gte(0),
                    text: z.string(),
                    whyItMatters: z.string(),
                  })
                  .passthrough()
              ),
              warnings: z.array(z.string()),
              disclaimer: z.string().nullish(),
            })
            .passthrough()
        ),
        summary: z.string(),
        overallScore: z.number().nullish(),
        blobPathPrefix: z.string().nullish(),
        errorMessage: z.string().nullish(),
        createdAt: z.string().datetime({ offset: true }),
        completedAt: z.string().datetime({ offset: true }).nullish(),
        intent: z.string().max(1000).nullable(),
        brandId: z.union([z.string(), z.null()]),
      })
      .passthrough()
      .and(
        z
          .object({
            accountId: z.string().uuid(),
            canonicalUrl: z.string().nullish(),
            artifacts: z.object({
              blobPathPrefix: z.union([z.string(), z.null()]),
              files: z.array(z.string()),
              items: z.array(
                z.object({
                  path: z.string(),
                  fileName: z.string(),
                  category: z.string(),
                  mimeType: z.string(),
                  downloadUrl: z.string(),
                  previewUrl: z.string(),
                })
              ),
            }),
            report: z
              .object({
                source: z.object({
                  source_type: z.enum([
                    "public_url",
                    "public_url_best_effort",
                    "file_upload",
                    "owned_asset",
                    "connected_media",
                  ]),
                  source_label: z.string(),
                  source_url: z.union([z.string(), z.null()]).optional(),
                  canonical_url: z.union([z.string(), z.null()]).optional(),
                  platform: z
                    .union([
                      z.enum(["instagram_reels", "youtube_shorts", "tiktok"]),
                      z.null(),
                    ])
                    .optional(),
                  content_id: z.union([z.string(), z.null()]).optional(),
                  duration_seconds: z.number().gte(0),
                  width: z.number().int().gte(0),
                  height: z.number().int().gte(0),
                  fps: z.number().gte(0),
                  has_audio: z.boolean(),
                  ingest_status: z.enum(["downloaded", "uploaded", "partial"]),
                  artifact_directory: z
                    .union([z.string(), z.null()])
                    .optional(),
                }),
                catalog_version: z.string(),
                transcript: z.object({
                  text: z.string(),
                  language: z.string(),
                  segments: z.array(
                    z.object({
                      start_seconds: z.number().gte(0),
                      end_seconds: z.number().gte(0),
                      text: z.string(),
                    })
                  ),
                }),
                selected_skill_ids: z
                  .array(
                    z.enum([
                      "content_strategy",
                      "filming",
                      "editing",
                      "audio_music",
                      "compliance",
                    ])
                  )
                  .min(1),
                executed_skills: z.array(
                  z.object({
                    skill_id: z.enum([
                      "content_strategy",
                      "filming",
                      "editing",
                      "audio_music",
                      "compliance",
                    ]),
                    status: z.enum([
                      "completed",
                      "insufficient_evidence",
                      "failed",
                    ]),
                    evaluated_items: z.array(z.string()),
                    summary: z.string(),
                    skill_score: z.number().gte(0).lte(10),
                    property_scores: z.array(
                      z.object({
                        property_id: z.string(),
                        label: z.string(),
                        score: z.number().gte(0).lte(10),
                        rationale: z.string(),
                        confidence: z.number().gte(0).lte(1),
                      })
                    ),
                    detailed_assessment: z.string(),
                    strengths: z.array(z.string()),
                    improvement_opportunities: z.array(z.string()),
                    recommendations: z.array(
                      z.object({
                        priority: z.string(),
                        title: z.string(),
                        rationale: z.string(),
                        action: z.string(),
                      })
                    ),
                    key_signals: z.array(z.string()),
                    evidence: z.array(
                      z.object({
                        timestamp_seconds: z.number().gte(0),
                        kind: z.string(),
                        observation: z.string(),
                        transcript_quote: z
                          .union([z.string(), z.null()])
                          .optional(),
                      })
                    ),
                    evidence_gaps: z.array(z.string()),
                    transcript_excerpts: z.array(
                      z.object({
                        start_seconds: z.number().gte(0),
                        end_seconds: z.number().gte(0),
                        text: z.string(),
                        why_it_matters: z.string(),
                      })
                    ),
                    warnings: z.array(z.string()),
                    disclaimer: z.union([z.string(), z.null()]).optional(),
                  })
                ),
                overall_score: z.union([z.number(), z.null()]).optional(),
                warnings: z.array(z.string()),
              })
              .optional(),
          })
          .passthrough()
      ),
    errors: [
      {
        status: 422,
        description: `Validation error when skills are empty, duplicated, invalid, or retained but unpublished such as &#x60;compliance&#x60;.`,
        schema: z
          .object({
            code: z.string(),
            message: z.string(),
            traceId: z.union([z.string(), z.null()]).optional(),
            details: z
              .union([z.object({}).partial().passthrough(), z.null()])
              .optional(),
          })
          .and(
            z
              .object({
                fieldErrors: z.array(
                  z.object({ field: z.string(), message: z.string() })
                ),
              })
              .passthrough()
          ),
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/analyses",
    alias: "getApiv1analyses",
    requestFormat: "json",
    parameters: [
      {
        name: "brandId",
        type: "Query",
        schema: z.string().uuid().optional(),
      },
    ],
    response: z
      .object({
        items: z.array(
          z
            .object({
              id: z.string().uuid(),
              status: z.enum(["pending", "completed", "failed"]),
              sourceType: z.enum([
                "public_url",
                "public_url_best_effort",
                "file_upload",
                "owned_asset",
                "connected_media",
              ]),
              sourceLabel: z.string(),
              sourceUrl: z.string().nullish(),
              platform: z
                .enum(["instagram_reels", "youtube_shorts", "tiktok"])
                .nullish(),
              contentId: z.string().nullish(),
              catalogVersion: z.string(),
              selectedSkillIds: z.array(
                z.enum([
                  "content_strategy",
                  "filming",
                  "editing",
                  "audio_music",
                  "compliance",
                ])
              ),
              executedSkills: z.array(
                z
                  .object({
                    skillId: z.enum([
                      "content_strategy",
                      "filming",
                      "editing",
                      "audio_music",
                      "compliance",
                    ]),
                    status: z.enum([
                      "completed",
                      "insufficient_evidence",
                      "failed",
                    ]),
                    evaluatedItems: z.array(z.string()),
                    summary: z.string(),
                    skillScore: z.number().gte(0).lte(10),
                    propertyScores: z.array(
                      z
                        .object({
                          propertyId: z.string(),
                          label: z.string(),
                          score: z.number().gte(0).lte(10),
                          rationale: z.string(),
                          confidence: z.number().gte(0).lte(1),
                        })
                        .passthrough()
                    ),
                    detailedAssessment: z.string(),
                    strengths: z.array(z.string()),
                    improvementOpportunities: z.array(z.string()),
                    recommendations: z.array(
                      z
                        .object({
                          priority: z.string(),
                          title: z.string(),
                          rationale: z.string(),
                          action: z.string(),
                        })
                        .passthrough()
                    ),
                    keySignals: z.array(z.string()),
                    evidence: z.array(
                      z
                        .object({
                          timestampSeconds: z.number(),
                          kind: z.string(),
                          observation: z.string(),
                          transcriptQuote: z.string().nullish(),
                        })
                        .passthrough()
                    ),
                    evidenceGaps: z.array(z.string()),
                    transcriptExcerpts: z.array(
                      z
                        .object({
                          startSeconds: z.number().gte(0),
                          endSeconds: z.number().gte(0),
                          text: z.string(),
                          whyItMatters: z.string(),
                        })
                        .passthrough()
                    ),
                    warnings: z.array(z.string()),
                    disclaimer: z.string().nullish(),
                  })
                  .passthrough()
              ),
              summary: z.string(),
              overallScore: z.number().nullish(),
              blobPathPrefix: z.string().nullish(),
              errorMessage: z.string().nullish(),
              createdAt: z.string().datetime({ offset: true }),
              completedAt: z.string().datetime({ offset: true }).nullish(),
              intent: z.string().max(1000).nullable(),
              brandId: z.union([z.string(), z.null()]),
            })
            .passthrough()
        ),
      })
      .passthrough(),
  },
  {
    method: "get",
    path: "/api/v1/analyses/:id",
    alias: "getApiv1analysesId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "completed", "failed"]),
        sourceType: z.enum([
          "public_url",
          "public_url_best_effort",
          "file_upload",
          "owned_asset",
          "connected_media",
        ]),
        sourceLabel: z.string(),
        sourceUrl: z.string().nullish(),
        platform: z
          .enum(["instagram_reels", "youtube_shorts", "tiktok"])
          .nullish(),
        contentId: z.string().nullish(),
        catalogVersion: z.string(),
        selectedSkillIds: z.array(
          z.enum([
            "content_strategy",
            "filming",
            "editing",
            "audio_music",
            "compliance",
          ])
        ),
        executedSkills: z.array(
          z
            .object({
              skillId: z.enum([
                "content_strategy",
                "filming",
                "editing",
                "audio_music",
                "compliance",
              ]),
              status: z.enum(["completed", "insufficient_evidence", "failed"]),
              evaluatedItems: z.array(z.string()),
              summary: z.string(),
              skillScore: z.number().gte(0).lte(10),
              propertyScores: z.array(
                z
                  .object({
                    propertyId: z.string(),
                    label: z.string(),
                    score: z.number().gte(0).lte(10),
                    rationale: z.string(),
                    confidence: z.number().gte(0).lte(1),
                  })
                  .passthrough()
              ),
              detailedAssessment: z.string(),
              strengths: z.array(z.string()),
              improvementOpportunities: z.array(z.string()),
              recommendations: z.array(
                z
                  .object({
                    priority: z.string(),
                    title: z.string(),
                    rationale: z.string(),
                    action: z.string(),
                  })
                  .passthrough()
              ),
              keySignals: z.array(z.string()),
              evidence: z.array(
                z
                  .object({
                    timestampSeconds: z.number(),
                    kind: z.string(),
                    observation: z.string(),
                    transcriptQuote: z.string().nullish(),
                  })
                  .passthrough()
              ),
              evidenceGaps: z.array(z.string()),
              transcriptExcerpts: z.array(
                z
                  .object({
                    startSeconds: z.number().gte(0),
                    endSeconds: z.number().gte(0),
                    text: z.string(),
                    whyItMatters: z.string(),
                  })
                  .passthrough()
              ),
              warnings: z.array(z.string()),
              disclaimer: z.string().nullish(),
            })
            .passthrough()
        ),
        summary: z.string(),
        overallScore: z.number().nullish(),
        blobPathPrefix: z.string().nullish(),
        errorMessage: z.string().nullish(),
        createdAt: z.string().datetime({ offset: true }),
        completedAt: z.string().datetime({ offset: true }).nullish(),
        intent: z.string().max(1000).nullable(),
        brandId: z.union([z.string(), z.null()]),
      })
      .passthrough()
      .and(
        z
          .object({
            accountId: z.string().uuid(),
            canonicalUrl: z.string().nullish(),
            artifacts: z.object({
              blobPathPrefix: z.union([z.string(), z.null()]),
              files: z.array(z.string()),
              items: z.array(
                z.object({
                  path: z.string(),
                  fileName: z.string(),
                  category: z.string(),
                  mimeType: z.string(),
                  downloadUrl: z.string(),
                  previewUrl: z.string(),
                })
              ),
            }),
            report: z
              .object({
                source: z.object({
                  source_type: z.enum([
                    "public_url",
                    "public_url_best_effort",
                    "file_upload",
                    "owned_asset",
                    "connected_media",
                  ]),
                  source_label: z.string(),
                  source_url: z.union([z.string(), z.null()]).optional(),
                  canonical_url: z.union([z.string(), z.null()]).optional(),
                  platform: z
                    .union([
                      z.enum(["instagram_reels", "youtube_shorts", "tiktok"]),
                      z.null(),
                    ])
                    .optional(),
                  content_id: z.union([z.string(), z.null()]).optional(),
                  duration_seconds: z.number().gte(0),
                  width: z.number().int().gte(0),
                  height: z.number().int().gte(0),
                  fps: z.number().gte(0),
                  has_audio: z.boolean(),
                  ingest_status: z.enum(["downloaded", "uploaded", "partial"]),
                  artifact_directory: z
                    .union([z.string(), z.null()])
                    .optional(),
                }),
                catalog_version: z.string(),
                transcript: z.object({
                  text: z.string(),
                  language: z.string(),
                  segments: z.array(
                    z.object({
                      start_seconds: z.number().gte(0),
                      end_seconds: z.number().gte(0),
                      text: z.string(),
                    })
                  ),
                }),
                selected_skill_ids: z
                  .array(
                    z.enum([
                      "content_strategy",
                      "filming",
                      "editing",
                      "audio_music",
                      "compliance",
                    ])
                  )
                  .min(1),
                executed_skills: z.array(
                  z.object({
                    skill_id: z.enum([
                      "content_strategy",
                      "filming",
                      "editing",
                      "audio_music",
                      "compliance",
                    ]),
                    status: z.enum([
                      "completed",
                      "insufficient_evidence",
                      "failed",
                    ]),
                    evaluated_items: z.array(z.string()),
                    summary: z.string(),
                    skill_score: z.number().gte(0).lte(10),
                    property_scores: z.array(
                      z.object({
                        property_id: z.string(),
                        label: z.string(),
                        score: z.number().gte(0).lte(10),
                        rationale: z.string(),
                        confidence: z.number().gte(0).lte(1),
                      })
                    ),
                    detailed_assessment: z.string(),
                    strengths: z.array(z.string()),
                    improvement_opportunities: z.array(z.string()),
                    recommendations: z.array(
                      z.object({
                        priority: z.string(),
                        title: z.string(),
                        rationale: z.string(),
                        action: z.string(),
                      })
                    ),
                    key_signals: z.array(z.string()),
                    evidence: z.array(
                      z.object({
                        timestamp_seconds: z.number().gte(0),
                        kind: z.string(),
                        observation: z.string(),
                        transcript_quote: z
                          .union([z.string(), z.null()])
                          .optional(),
                      })
                    ),
                    evidence_gaps: z.array(z.string()),
                    transcript_excerpts: z.array(
                      z.object({
                        start_seconds: z.number().gte(0),
                        end_seconds: z.number().gte(0),
                        text: z.string(),
                        why_it_matters: z.string(),
                      })
                    ),
                    warnings: z.array(z.string()),
                    disclaimer: z.union([z.string(), z.null()]).optional(),
                  })
                ),
                overall_score: z.union([z.number(), z.null()]).optional(),
                warnings: z.array(z.string()),
              })
              .optional(),
          })
          .passthrough()
      ),
    errors: [
      {
        status: 404,
        description: `Not found.`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "delete",
    path: "/api/v1/analyses/:id",
    alias: "deleteApiv1analysesId",
    requestFormat: "json",
    response: z.void(),
    errors: [
      {
        status: 404,
        description: `Not found.`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/analyses/:id/artifacts/:path",
    alias: "getApiv1analysesIdartifactsPath",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "path",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 404,
        description: `Not found.`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "patch",
    path: "/api/v1/analyses/:id/brand",
    alias: "patchApiv1analysesIdbrand",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ brandId: z.string().uuid() }),
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "completed", "failed"]),
        sourceType: z.enum([
          "public_url",
          "public_url_best_effort",
          "file_upload",
          "owned_asset",
          "connected_media",
        ]),
        sourceLabel: z.string(),
        sourceUrl: z.string().nullish(),
        platform: z
          .enum(["instagram_reels", "youtube_shorts", "tiktok"])
          .nullish(),
        contentId: z.string().nullish(),
        catalogVersion: z.string(),
        selectedSkillIds: z.array(
          z.enum([
            "content_strategy",
            "filming",
            "editing",
            "audio_music",
            "compliance",
          ])
        ),
        executedSkills: z.array(
          z
            .object({
              skillId: z.enum([
                "content_strategy",
                "filming",
                "editing",
                "audio_music",
                "compliance",
              ]),
              status: z.enum(["completed", "insufficient_evidence", "failed"]),
              evaluatedItems: z.array(z.string()),
              summary: z.string(),
              skillScore: z.number().gte(0).lte(10),
              propertyScores: z.array(
                z
                  .object({
                    propertyId: z.string(),
                    label: z.string(),
                    score: z.number().gte(0).lte(10),
                    rationale: z.string(),
                    confidence: z.number().gte(0).lte(1),
                  })
                  .passthrough()
              ),
              detailedAssessment: z.string(),
              strengths: z.array(z.string()),
              improvementOpportunities: z.array(z.string()),
              recommendations: z.array(
                z
                  .object({
                    priority: z.string(),
                    title: z.string(),
                    rationale: z.string(),
                    action: z.string(),
                  })
                  .passthrough()
              ),
              keySignals: z.array(z.string()),
              evidence: z.array(
                z
                  .object({
                    timestampSeconds: z.number(),
                    kind: z.string(),
                    observation: z.string(),
                    transcriptQuote: z.string().nullish(),
                  })
                  .passthrough()
              ),
              evidenceGaps: z.array(z.string()),
              transcriptExcerpts: z.array(
                z
                  .object({
                    startSeconds: z.number().gte(0),
                    endSeconds: z.number().gte(0),
                    text: z.string(),
                    whyItMatters: z.string(),
                  })
                  .passthrough()
              ),
              warnings: z.array(z.string()),
              disclaimer: z.string().nullish(),
            })
            .passthrough()
        ),
        summary: z.string(),
        overallScore: z.number().nullish(),
        blobPathPrefix: z.string().nullish(),
        errorMessage: z.string().nullish(),
        createdAt: z.string().datetime({ offset: true }),
        completedAt: z.string().datetime({ offset: true }).nullish(),
        intent: z.string().max(1000).nullable(),
        brandId: z.union([z.string(), z.null()]),
      })
      .passthrough()
      .and(
        z
          .object({
            accountId: z.string().uuid(),
            canonicalUrl: z.string().nullish(),
            artifacts: z.object({
              blobPathPrefix: z.union([z.string(), z.null()]),
              files: z.array(z.string()),
              items: z.array(
                z.object({
                  path: z.string(),
                  fileName: z.string(),
                  category: z.string(),
                  mimeType: z.string(),
                  downloadUrl: z.string(),
                  previewUrl: z.string(),
                })
              ),
            }),
            report: z
              .object({
                source: z.object({
                  source_type: z.enum([
                    "public_url",
                    "public_url_best_effort",
                    "file_upload",
                    "owned_asset",
                    "connected_media",
                  ]),
                  source_label: z.string(),
                  source_url: z.union([z.string(), z.null()]).optional(),
                  canonical_url: z.union([z.string(), z.null()]).optional(),
                  platform: z
                    .union([
                      z.enum(["instagram_reels", "youtube_shorts", "tiktok"]),
                      z.null(),
                    ])
                    .optional(),
                  content_id: z.union([z.string(), z.null()]).optional(),
                  duration_seconds: z.number().gte(0),
                  width: z.number().int().gte(0),
                  height: z.number().int().gte(0),
                  fps: z.number().gte(0),
                  has_audio: z.boolean(),
                  ingest_status: z.enum(["downloaded", "uploaded", "partial"]),
                  artifact_directory: z
                    .union([z.string(), z.null()])
                    .optional(),
                }),
                catalog_version: z.string(),
                transcript: z.object({
                  text: z.string(),
                  language: z.string(),
                  segments: z.array(
                    z.object({
                      start_seconds: z.number().gte(0),
                      end_seconds: z.number().gte(0),
                      text: z.string(),
                    })
                  ),
                }),
                selected_skill_ids: z
                  .array(
                    z.enum([
                      "content_strategy",
                      "filming",
                      "editing",
                      "audio_music",
                      "compliance",
                    ])
                  )
                  .min(1),
                executed_skills: z.array(
                  z.object({
                    skill_id: z.enum([
                      "content_strategy",
                      "filming",
                      "editing",
                      "audio_music",
                      "compliance",
                    ]),
                    status: z.enum([
                      "completed",
                      "insufficient_evidence",
                      "failed",
                    ]),
                    evaluated_items: z.array(z.string()),
                    summary: z.string(),
                    skill_score: z.number().gte(0).lte(10),
                    property_scores: z.array(
                      z.object({
                        property_id: z.string(),
                        label: z.string(),
                        score: z.number().gte(0).lte(10),
                        rationale: z.string(),
                        confidence: z.number().gte(0).lte(1),
                      })
                    ),
                    detailed_assessment: z.string(),
                    strengths: z.array(z.string()),
                    improvement_opportunities: z.array(z.string()),
                    recommendations: z.array(
                      z.object({
                        priority: z.string(),
                        title: z.string(),
                        rationale: z.string(),
                        action: z.string(),
                      })
                    ),
                    key_signals: z.array(z.string()),
                    evidence: z.array(
                      z.object({
                        timestamp_seconds: z.number().gte(0),
                        kind: z.string(),
                        observation: z.string(),
                        transcript_quote: z
                          .union([z.string(), z.null()])
                          .optional(),
                      })
                    ),
                    evidence_gaps: z.array(z.string()),
                    transcript_excerpts: z.array(
                      z.object({
                        start_seconds: z.number().gte(0),
                        end_seconds: z.number().gte(0),
                        text: z.string(),
                        why_it_matters: z.string(),
                      })
                    ),
                    warnings: z.array(z.string()),
                    disclaimer: z.union([z.string(), z.null()]).optional(),
                  })
                ),
                overall_score: z.union([z.number(), z.null()]).optional(),
                warnings: z.array(z.string()),
              })
              .optional(),
          })
          .passthrough()
      ),
    errors: [
      {
        status: 401,
        description: `Authentication required.`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Role does not permit this operation.`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `Invalid input.`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "put",
    path: "/api/v1/analyses/:id/feedback-reactions/:feedbackItemKey",
    alias: "putApiv1analysesIdfeedbackReactionsFeedbackItemKey",
    description: `Upserts one active reaction and/or comment for the first-party web session user and feedback item.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: putApiv1analysesIdfeedbackReactionsFeedbackItemKey_Body,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "feedbackItemKey",
        type: "Path",
        schema: z.string().min(1).max(256),
      },
    ],
    response: z
      .object({
        feedbackItemKey: z.string(),
        feedbackItemKind: z.literal("recommendation"),
        skillId: z.enum([
          "content_strategy",
          "filming",
          "editing",
          "audio_music",
          "compliance",
        ]),
        itemIndex: z.number().int().gte(0),
        reaction: z.enum(["positive", "negative"]).nullable(),
        comment: z.string().nullable(),
        updatedAt: z.string().datetime({ offset: true }),
      })
      .passthrough(),
    errors: [
      {
        status: 400,
        description: `Invalid feedback item reference or unavailable analysis state.`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Request is not from a first-party authenticated web session.`,
        schema: z.void(),
      },
      {
        status: 404,
        description: `Analysis or feedback item not found.`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `Field validation error such as empty feedback or comment length.`,
        schema: z
          .object({
            code: z.string(),
            message: z.string(),
            traceId: z.union([z.string(), z.null()]).optional(),
            details: z
              .union([z.object({}).partial().passthrough(), z.null()])
              .optional(),
          })
          .and(
            z
              .object({
                fieldErrors: z.array(
                  z.object({ field: z.string(), message: z.string() })
                ),
              })
              .passthrough()
          ),
      },
    ],
  },
  {
    method: "delete",
    path: "/api/v1/analyses/:id/feedback-reactions/:feedbackItemKey",
    alias: "deleteApiv1analysesIdfeedbackReactionsFeedbackItemKey",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "feedbackItemKey",
        type: "Path",
        schema: z.string().min(1).max(256),
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 400,
        description: `Analysis is not available for feedback reactions.`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Request is not from a first-party authenticated web session.`,
        schema: z.void(),
      },
      {
        status: 404,
        description: `Analysis or feedback item not found.`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/analyses/:id/feedback-reactions/mine",
    alias: "getApiv1analysesIdfeedbackReactionsmine",
    description: `Returns only the first-party web session user&#x27;s active reactions for eligible recommendation feedback items.`,
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z
      .object({
        items: z.array(
          z
            .object({
              feedbackItemKey: z.string(),
              feedbackItemKind: z.literal("recommendation"),
              skillId: z.enum([
                "content_strategy",
                "filming",
                "editing",
                "audio_music",
                "compliance",
              ]),
              itemIndex: z.number().int().gte(0),
              reaction: z.enum(["positive", "negative"]).nullable(),
              comment: z.string().nullable(),
              updatedAt: z.string().datetime({ offset: true }),
            })
            .passthrough()
        ),
      })
      .passthrough(),
    errors: [
      {
        status: 400,
        description: `Analysis is not completed or has no generated report available for feedback reactions.`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Request is not from a first-party authenticated web session.`,
        schema: z.void(),
      },
      {
        status: 404,
        description: `Analysis not found.`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/analyses/:id/feedback-reactions/review",
    alias: "getApiv1analysesIdfeedbackReactionsreview",
    description: `Account-owner-only first-party web endpoint for reviewing contextual tester reactions and comments in the owner account.`,
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().gte(1).lte(100).optional().default(50),
      },
      {
        name: "cursor",
        type: "Query",
        schema: z.string().nullish(),
      },
    ],
    response: z
      .object({
        items: z.array(
          z
            .object({
              id: z.string().uuid(),
              analysisId: z.string().uuid(),
              analysisSummary: z.string(),
              sourceLabel: z.string(),
              testerUserId: z.string().uuid(),
              testerName: z.string(),
              testerEmail: z.string().email(),
              feedbackItemKey: z.string(),
              feedbackItemKind: z.literal("recommendation"),
              skillId: z.enum([
                "content_strategy",
                "filming",
                "editing",
                "audio_music",
                "compliance",
              ]),
              itemIndex: z.number().int().gte(0),
              feedbackTitleSnapshot: z.string(),
              feedbackActionSnapshot: z.string().nullish(),
              feedbackRationaleSnapshot: z.string().nullish(),
              reaction: z.enum(["positive", "negative"]).nullable(),
              comment: z.string().nullable(),
              createdAt: z.string().datetime({ offset: true }),
              updatedAt: z.string().datetime({ offset: true }),
            })
            .passthrough()
        ),
        pagination: z
          .object({
            limit: z.number().int().gte(1).lte(100),
            returned: z.number().int().gte(0),
            hasMore: z.boolean(),
            nextCursor: z.string().nullable(),
          })
          .passthrough(),
      })
      .passthrough(),
    errors: [
      {
        status: 400,
        description: `Invalid cursor.`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Authenticated user is not an account owner or request is not first-party web.`,
        schema: z.void(),
      },
      {
        status: 404,
        description: `Analysis not found.`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/analyses/latest",
    alias: "getApiv1analyseslatest",
    description: `Returns the latest visible analyses for the authenticated account with count context, cursor pagination, flattened table fields, and optional presentation helpers. The raw GET /api/v1/analyses response remains unchanged.`,
    requestFormat: "json",
    parameters: [
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().gte(1).lte(50).optional().default(10),
      },
      {
        name: "cursor",
        type: "Query",
        schema: z.string().nullish(),
      },
      {
        name: "includeSummary",
        type: "Query",
        schema: z.boolean().optional().default(true),
      },
      {
        name: "includeSkillDetails",
        type: "Query",
        schema: z.boolean().optional().default(false),
      },
      {
        name: "includePresentation",
        type: "Query",
        schema: z.boolean().optional().default(true),
      },
    ],
    response: z
      .object({
        total: z.number().int().gte(0),
        returned: z.number().int().gte(0),
        limit: z.number().int().gte(1).lte(50),
        sort: z.literal("createdAt_desc"),
        hasMore: z.boolean(),
        nextCursor: z.string().nullable(),
        defaultView: z.literal("latest_analyses_table"),
        message: z.string(),
        summary: z.string(),
        tableColumns: z.array(
          z.enum([
            "createdAt",
            "fileName",
            "status",
            "skills",
            "overallScore",
            "mainOpportunity",
          ])
        ),
        recommendedResponse: z
          .object({
            format: z.enum(["table", "brief", "detailed"]),
            columns: z.array(z.string()),
            instructions: z.string(),
          })
          .passthrough(),
        presentation: z
          .object({
            title: z.string(),
            markdownTable: z.string().nullable(),
            answer: z.string().nullable(),
            language: z.enum(["pt-BR", "en", "es"]).nullable(),
          })
          .passthrough()
          .nullish(),
        pagination: z
          .object({
            totalItems: z.number().int().gte(0),
            limit: z.number().int().gte(1).lte(50),
            returned: z.number().int().gte(0),
            hasMore: z.boolean(),
            nextCursor: z.string().nullable(),
          })
          .passthrough(),
        items: z.array(
          z
            .object({
              id: z.string().uuid(),
              createdAt: z.string().datetime({ offset: true }),
              completedAt: z.string().datetime({ offset: true }).nullable(),
              status: z.enum(["pending", "completed", "failed"]),
              fileName: z.string(),
              sourceLabel: z.string(),
              sourceType: z.enum([
                "public_url",
                "public_url_best_effort",
                "file_upload",
                "owned_asset",
                "connected_media",
              ]),
              selectedSkills: z.array(
                z.enum([
                  "content_strategy",
                  "filming",
                  "editing",
                  "audio_music",
                  "compliance",
                ])
              ),
              executedSkills: z.array(z.string()),
              overallScore: z.number().nullable(),
              mainOpportunity: z.string().nullable(),
              oneLineSummary: z.string(),
              detailHint: z
                .object({
                  analysisId: z.string().uuid(),
                  tool: z.string(),
                  message: z.string(),
                })
                .passthrough(),
              intent: z.string().max(1000).nullable(),
              brandId: z.union([z.string(), z.null()]),
            })
            .passthrough()
        ),
      })
      .passthrough(),
  },
  {
    method: "get",
    path: "/api/v1/analysis-skills",
    alias: "getApiv1analysisSkills",
    description: `Returns selectable skills for new analyses. The &#x60;compliance&#x60; id remains valid for historical analysis data but is not currently published for new analysis creation.`,
    requestFormat: "json",
    response: z
      .object({
        version: z.string(),
        publishedAt: z.string().datetime({ offset: true }),
        items: z
          .array(
            z
              .object({
                id: z.enum([
                  "content_strategy",
                  "filming",
                  "editing",
                  "audio_music",
                  "compliance",
                ]),
                slug: z.string(),
                name: z.string(),
                description: z.string(),
                coverageSummary: z.string(),
                criteria: z.array(z.string()),
                safeLanguageNotes: z.array(z.string()),
                status: z.enum(["published", "unpublished"]),
              })
              .passthrough()
          )
          .min(4)
          .max(4),
      })
      .passthrough(),
  },
  {
    method: "get",
    path: "/api/v1/audit-events",
    alias: "getApiv1auditEvents",
    requestFormat: "json",
    parameters: [
      {
        name: "cursor",
        type: "Query",
        schema: z.string().uuid().optional(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().gte(1).lte(100).optional().default(30),
      },
    ],
    response: z.object({
      items: z.array(
        z.object({
          id: z.string(),
          action: z.string(),
          actorId: z.string(),
          brandId: z.union([z.string(), z.null()]),
          resourceType: z.string(),
          resourceId: z.string(),
          createdAt: z.string().datetime({ offset: true }),
          correlationId: z.string(),
        })
      ),
      nextCursor: z.string().uuid().optional(),
    }),
    errors: [
      {
        status: 401,
        description: `Authentication required.`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Operation forbidden for this member.`,
        schema: z.void(),
      },
      {
        status: 409,
        description: `State, quota or idempotency conflict.`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `Invalid fields.`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "patch",
    path: "/api/v1/auth/account",
    alias: "patchApiv1authaccount",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: patchApiv1authaccount_Body,
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/auth/email-link",
    alias: "postApiv1authemailLink",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: postApiv1authemailLink_Body,
      },
    ],
    response: z
      .object({
        accessToken: z.string(),
        tokenType: z.string(),
        expiresAt: z.string().datetime({ offset: true }),
        user: z
          .object({
            id: z.string().uuid(),
            name: z.string(),
            email: z.string().email(),
            role: z.enum(["owner", "member"]),
            createdAt: z.string().datetime({ offset: true }),
          })
          .passthrough(),
        account: z
          .object({
            id: z.string().uuid(),
            displayName: z.string(),
            accountType: z.enum(["agency", "creator", "team"]),
            createdAt: z.string().datetime({ offset: true }),
            memberCount: z.number().int().gte(0),
          })
          .passthrough(),
        brands: z.array(
          z.object({
            id: z.string().uuid(),
            name: z.string().min(1).max(160),
            timeZone: z.string(),
            confirmedAt: z.union([z.string(), z.null()]),
            status: z.enum(["active", "archiving", "archived"]),
            createdAt: z.string().datetime({ offset: true }),
            archivedAt: z.union([z.string(), z.null()]),
          })
        ),
      })
      .passthrough(),
  },
  {
    method: "post",
    path: "/api/v1/auth/firebase",
    alias: "postApiv1authfirebase",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: postApiv1authemailLink_Body,
      },
    ],
    response: z
      .object({
        accessToken: z.string(),
        tokenType: z.string(),
        expiresAt: z.string().datetime({ offset: true }),
        user: z
          .object({
            id: z.string().uuid(),
            name: z.string(),
            email: z.string().email(),
            role: z.enum(["owner", "member"]),
            createdAt: z.string().datetime({ offset: true }),
          })
          .passthrough(),
        account: z
          .object({
            id: z.string().uuid(),
            displayName: z.string(),
            accountType: z.enum(["agency", "creator", "team"]),
            createdAt: z.string().datetime({ offset: true }),
            memberCount: z.number().int().gte(0),
          })
          .passthrough(),
        brands: z.array(
          z.object({
            id: z.string().uuid(),
            name: z.string().min(1).max(160),
            timeZone: z.string(),
            confirmedAt: z.union([z.string(), z.null()]),
            status: z.enum(["active", "archiving", "archived"]),
            createdAt: z.string().datetime({ offset: true }),
            archivedAt: z.union([z.string(), z.null()]),
          })
        ),
      })
      .passthrough(),
  },
  {
    method: "post",
    path: "/api/v1/auth/login",
    alias: "postApiv1authlogin",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: postApiv1authlogin_Body,
      },
    ],
    response: z
      .object({
        accessToken: z.string(),
        tokenType: z.string(),
        expiresAt: z.string().datetime({ offset: true }),
        user: z
          .object({
            id: z.string().uuid(),
            name: z.string(),
            email: z.string().email(),
            role: z.enum(["owner", "member"]),
            createdAt: z.string().datetime({ offset: true }),
          })
          .passthrough(),
        account: z
          .object({
            id: z.string().uuid(),
            displayName: z.string(),
            accountType: z.enum(["agency", "creator", "team"]),
            createdAt: z.string().datetime({ offset: true }),
            memberCount: z.number().int().gte(0),
          })
          .passthrough(),
        brands: z.array(
          z.object({
            id: z.string().uuid(),
            name: z.string().min(1).max(160),
            timeZone: z.string(),
            confirmedAt: z.union([z.string(), z.null()]),
            status: z.enum(["active", "archiving", "archived"]),
            createdAt: z.string().datetime({ offset: true }),
            archivedAt: z.union([z.string(), z.null()]),
          })
        ),
      })
      .passthrough(),
  },
  {
    method: "post",
    path: "/api/v1/auth/register",
    alias: "postApiv1authregister",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: postApiv1authregister_Body,
      },
    ],
    response: z
      .object({
        accessToken: z.string(),
        tokenType: z.string(),
        expiresAt: z.string().datetime({ offset: true }),
        user: z
          .object({
            id: z.string().uuid(),
            name: z.string(),
            email: z.string().email(),
            role: z.enum(["owner", "member"]),
            createdAt: z.string().datetime({ offset: true }),
          })
          .passthrough(),
        account: z
          .object({
            id: z.string().uuid(),
            displayName: z.string(),
            accountType: z.enum(["agency", "creator", "team"]),
            createdAt: z.string().datetime({ offset: true }),
            memberCount: z.number().int().gte(0),
          })
          .passthrough(),
        brands: z.array(
          z.object({
            id: z.string().uuid(),
            name: z.string().min(1).max(160),
            timeZone: z.string(),
            confirmedAt: z.union([z.string(), z.null()]),
            status: z.enum(["active", "archiving", "archived"]),
            createdAt: z.string().datetime({ offset: true }),
            archivedAt: z.union([z.string(), z.null()]),
          })
        ),
      })
      .passthrough(),
  },
  {
    method: "get",
    path: "/api/v1/brands",
    alias: "getApiv1brands",
    requestFormat: "json",
    response: z.object({
      items: z.array(
        z.object({
          id: z.string().uuid(),
          name: z.string().min(1).max(160),
          timeZone: z.string(),
          confirmedAt: z.union([z.string(), z.null()]),
          status: z.enum(["active", "archiving", "archived"]),
          createdAt: z.string().datetime({ offset: true }),
          archivedAt: z.union([z.string(), z.null()]),
        })
      ),
    }),
    errors: [
      {
        status: 401,
        description: `Authentication required.`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Role does not permit this operation.`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `Invalid input.`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/brands",
    alias: "postApiv1brands",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: postApiv1brands_Body,
      },
    ],
    response: z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(160),
      timeZone: z.string(),
      confirmedAt: z.union([z.string(), z.null()]),
      status: z.enum(["active", "archiving", "archived"]),
      createdAt: z.string().datetime({ offset: true }),
      archivedAt: z.union([z.string(), z.null()]),
    }),
    errors: [
      {
        status: 401,
        description: `Authentication required.`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Role does not permit this operation.`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `Invalid input.`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/brands/:brandId/social-connections",
    alias: "listSocialConnections",
    requestFormat: "json",
    parameters: [
      {
        name: "brandId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.object({
      items: z.array(
        z.object({
          id: z.string().uuid(),
          brandId: z.string().uuid(),
          platform: z.enum(["instagram", "tiktok", "youtube", "linkedin"]),
          displayName: z.string(),
          status: z.enum([
            "pending",
            "active",
            "requires_action",
            "disconnecting",
            "disconnected",
          ]),
          identityStatus: z.enum(["verified", "unavailable"]),
          createdAt: z.string().datetime({ offset: true }),
        })
      ),
    }),
    errors: [
      {
        status: 400,
        description: `Invalid request`,
        schema: z.void(),
      },
      {
        status: 401,
        description: `Authentication required`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Role or scope denied`,
        schema: z.void(),
      },
      {
        status: 404,
        description: `Resource not found in account`,
        schema: z.void(),
      },
      {
        status: 409,
        description: `State, identity, idempotency or quota conflict`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `Preflight or validation rejected`,
        schema: z.void(),
      },
      {
        status: 429,
        description: `Rate limit exceeded`,
        schema: z.void(),
      },
      {
        status: 503,
        description: `Social provider not configured or unavailable`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/brands/:brandId/social-connections",
    alias: "createSocialAuthorization",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: createSocialAuthorization_Body,
      },
      {
        name: "brandId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.object({
      id: z.string().uuid(),
      authorizationUrl: z.string().url(),
      expiresAt: z.string().datetime({ offset: true }),
    }),
    errors: [
      {
        status: 400,
        description: `Invalid request`,
        schema: z.void(),
      },
      {
        status: 401,
        description: `Authentication required`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Role or scope denied`,
        schema: z.void(),
      },
      {
        status: 404,
        description: `Resource not found in account`,
        schema: z.void(),
      },
      {
        status: 409,
        description: `State, identity, idempotency or quota conflict`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `Preflight or validation rejected`,
        schema: z.void(),
      },
      {
        status: 429,
        description: `Rate limit exceeded`,
        schema: z.void(),
      },
      {
        status: 503,
        description: `Social provider not configured or unavailable`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "patch",
    path: "/api/v1/brands/:id",
    alias: "patchApiv1brandsId",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: patchApiv1brandsId_Body,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(160),
      timeZone: z.string(),
      confirmedAt: z.union([z.string(), z.null()]),
      status: z.enum(["active", "archiving", "archived"]),
      createdAt: z.string().datetime({ offset: true }),
      archivedAt: z.union([z.string(), z.null()]),
    }),
    errors: [
      {
        status: 401,
        description: `Authentication required.`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Role does not permit this operation.`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `Invalid input.`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/brands/:id/archive",
    alias: "postApiv1brandsIdarchive",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(160),
      timeZone: z.string(),
      confirmedAt: z.union([z.string(), z.null()]),
      status: z.enum(["active", "archiving", "archived"]),
      createdAt: z.string().datetime({ offset: true }),
      archivedAt: z.union([z.string(), z.null()]),
    }),
    errors: [
      {
        status: 401,
        description: `Authentication required.`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Role does not permit this operation.`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `Invalid input.`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/brands/:id/restore",
    alias: "postApiv1brandsIdrestore",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(160),
      timeZone: z.string(),
      confirmedAt: z.union([z.string(), z.null()]),
      status: z.enum(["active", "archiving", "archived"]),
      createdAt: z.string().datetime({ offset: true }),
      archivedAt: z.union([z.string(), z.null()]),
    }),
    errors: [
      {
        status: 401,
        description: `Authentication required.`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Role does not permit this operation.`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `Invalid input.`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/external-posts",
    alias: "listExternalPosts",
    requestFormat: "json",
    parameters: [
      {
        name: "brandId",
        type: "Query",
        schema: z.string().uuid(),
      },
      {
        name: "cursor",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().gte(1).lte(100).optional().default(20),
      },
    ],
    response: z.object({
      items: z.array(
        z.object({
          id: z.string().uuid(),
          brandId: z.string().uuid(),
          socialAccountId: z.string().uuid(),
          platform: z.enum(["instagram", "tiktok", "youtube", "linkedin"]),
          nativePostId: z.string(),
          url: z.union([z.string(), z.null()]),
          content: z.string(),
          publishedAt: z.string().datetime({ offset: true }),
        })
      ),
      nextCursor: z.string().optional(),
    }),
    errors: [
      {
        status: 400,
        description: `Invalid request`,
        schema: z.void(),
      },
      {
        status: 401,
        description: `Authentication required`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Role or scope denied`,
        schema: z.void(),
      },
      {
        status: 404,
        description: `Resource not found in account`,
        schema: z.void(),
      },
      {
        status: 409,
        description: `State, identity, idempotency or quota conflict`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `Preflight or validation rejected`,
        schema: z.void(),
      },
      {
        status: 429,
        description: `Rate limit exceeded`,
        schema: z.void(),
      },
      {
        status: 503,
        description: `Social provider not configured or unavailable`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/external-posts/import",
    alias: "importExternalPost",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: importExternalPost_Body,
      },
    ],
    response: z.object({ status: z.literal("pending") }),
    errors: [
      {
        status: 400,
        description: `Invalid request`,
        schema: z.void(),
      },
      {
        status: 401,
        description: `Authentication required`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Role or scope denied`,
        schema: z.void(),
      },
      {
        status: 404,
        description: `Resource not found in account`,
        schema: z.void(),
      },
      {
        status: 409,
        description: `State, identity, idempotency or quota conflict`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `Preflight or validation rejected`,
        schema: z.void(),
      },
      {
        status: 429,
        description: `Rate limit exceeded`,
        schema: z.void(),
      },
      {
        status: 503,
        description: `Social provider not configured or unavailable`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/health",
    alias: "getApiv1health",
    requestFormat: "json",
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/integrations/source-asset-sessions",
    alias: "postApiv1integrationssourceAssetSessions",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: postApiv1integrationssourceAssetSessions_Body.optional(),
      },
    ],
    response: z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "completed", "expired"]),
        browserUrl: z.string().url(),
        clientId: z.string().nullish(),
        sourceAssetId: z.string().uuid().nullish(),
        createdAt: z.string().datetime({ offset: true }),
        expiresAt: z.string().datetime({ offset: true }),
        completedAt: z.string().datetime({ offset: true }).nullish(),
        brandId: z.string().uuid(),
      })
      .passthrough(),
  },
  {
    method: "get",
    path: "/api/v1/integrations/source-asset-sessions/:id",
    alias: "getApiv1integrationssourceAssetSessionsId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "completed", "expired"]),
        browserUrl: z.string().url(),
        clientId: z.string().nullish(),
        sourceAssetId: z.string().uuid().nullish(),
        createdAt: z.string().datetime({ offset: true }),
        expiresAt: z.string().datetime({ offset: true }),
        completedAt: z.string().datetime({ offset: true }).nullish(),
        brandId: z.string().uuid(),
      })
      .passthrough(),
  },
  {
    method: "post",
    path: "/api/v1/integrations/source-asset-sessions/:id/complete",
    alias: "postApiv1integrationssourceAssetSessionsIdcomplete",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ sourceAssetId: z.string().uuid() }).passthrough(),
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "completed", "expired"]),
        browserUrl: z.string().url(),
        clientId: z.string().nullish(),
        sourceAssetId: z.string().uuid().nullish(),
        createdAt: z.string().datetime({ offset: true }),
        expiresAt: z.string().datetime({ offset: true }),
        completedAt: z.string().datetime({ offset: true }).nullish(),
        brandId: z.string().uuid(),
      })
      .passthrough(),
  },
  {
    method: "get",
    path: "/api/v1/member-invitations",
    alias: "getApiv1memberInvitations",
    requestFormat: "json",
    response: z.object({
      items: z.array(
        z.object({
          id: z.string().uuid(),
          email: z.string().email(),
          expiresAt: z.string().datetime({ offset: true }),
          status: z.enum(["pending", "accepted", "revoked", "expired"]),
        })
      ),
    }),
    errors: [
      {
        status: 401,
        description: `Authentication required.`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Operation forbidden for this member.`,
        schema: z.void(),
      },
      {
        status: 409,
        description: `State, quota or idempotency conflict.`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `Invalid fields.`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/member-invitations",
    alias: "postApiv1memberInvitations",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ email: z.string().max(254).email() }),
      },
    ],
    response: z.object({
      id: z.string().uuid(),
      email: z.string().email(),
      expiresAt: z.string().datetime({ offset: true }),
      inviteUrl: z.string().url(),
    }),
    errors: [
      {
        status: 401,
        description: `Authentication required.`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Operation forbidden for this member.`,
        schema: z.void(),
      },
      {
        status: 409,
        description: `State, quota or idempotency conflict.`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `Invalid fields.`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "delete",
    path: "/api/v1/member-invitations/:id",
    alias: "deleteApiv1memberInvitationsId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 401,
        description: `Authentication required.`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Operation forbidden for this member.`,
        schema: z.void(),
      },
      {
        status: 409,
        description: `State, quota or idempotency conflict.`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `Invalid fields.`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/member-invitations/accept",
    alias: "postApiv1memberInvitationsaccept",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ token: z.string().min(20).max(200) }),
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 401,
        description: `Authentication required.`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Operation forbidden for this member.`,
        schema: z.void(),
      },
      {
        status: 409,
        description: `State, quota or idempotency conflict.`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `Invalid fields.`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/members",
    alias: "getApiv1members",
    requestFormat: "json",
    response: z.object({
      items: z.array(
        z
          .object({
            id: z.string().uuid(),
            name: z.string(),
            email: z.string().email(),
            role: z.enum(["owner", "member"]),
            createdAt: z.string().datetime({ offset: true }),
          })
          .passthrough()
      ),
    }),
    errors: [
      {
        status: 401,
        description: `Authentication required.`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Operation forbidden for this member.`,
        schema: z.void(),
      },
      {
        status: 409,
        description: `State, quota or idempotency conflict.`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `Invalid fields.`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "delete",
    path: "/api/v1/members/:id",
    alias: "deleteApiv1membersId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 401,
        description: `Authentication required.`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Operation forbidden for this member.`,
        schema: z.void(),
      },
      {
        status: 409,
        description: `State, quota or idempotency conflict.`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `Invalid fields.`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/notifications",
    alias: "getApiv1notifications",
    requestFormat: "json",
    parameters: [
      {
        name: "cursor",
        type: "Query",
        schema: z.string().uuid().optional(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().gte(1).lte(100).optional().default(30),
      },
    ],
    response: z.object({
      items: z.array(
        z.object({
          id: z.string().uuid(),
          code: z.string(),
          message: z.string().max(500),
          brandId: z.union([z.string(), z.null()]),
          resourceId: z.union([z.string(), z.null()]),
          createdAt: z.string().datetime({ offset: true }),
          readAt: z.union([z.string(), z.null()]),
        })
      ),
      nextCursor: z.string().uuid().optional(),
    }),
    errors: [
      {
        status: 401,
        description: `Authentication required.`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Operation forbidden for this member.`,
        schema: z.void(),
      },
      {
        status: 409,
        description: `State, quota or idempotency conflict.`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `Invalid fields.`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/notifications/:id/read",
    alias: "postApiv1notificationsIdread",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 401,
        description: `Authentication required.`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Operation forbidden for this member.`,
        schema: z.void(),
      },
      {
        status: 409,
        description: `State, quota or idempotency conflict.`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `Invalid fields.`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/oauth/authorization-codes",
    alias: "postApiv1oauthauthorizationCodes",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: postApiv1oauthauthorizationCodes_Body,
      },
    ],
    response: z
      .object({
        code: z.string(),
        redirectUri: z.string().url(),
        expiresAt: z.string().datetime({ offset: true }),
      })
      .passthrough(),
  },
  {
    method: "post",
    path: "/api/v1/oauth/device/activate",
    alias: "postApiv1oauthdeviceactivate",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ userCode: z.string() }).passthrough(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/oauth/device/code",
    alias: "postApiv1oauthdevicecode",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: postApiv1oauthdevicecode_Body,
      },
    ],
    response: z
      .object({
        deviceCode: z.string(),
        userCode: z.string(),
        verificationUri: z.string().url(),
        verificationUriComplete: z.string().url(),
        expiresIn: z.number().int().gte(1),
        interval: z.number().int().gte(1),
        scope: z.string(),
      })
      .passthrough(),
  },
  {
    method: "post",
    path: "/api/v1/oauth/revoke",
    alias: "postApiv1oauthrevoke",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: postApiv1oauthrevoke_Body,
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/oauth/session",
    alias: "getApiv1oauthsession",
    requestFormat: "json",
    response: z
      .object({
        tokenType: z.literal("Bearer"),
        expiresAt: z.string().datetime({ offset: true }),
        clientId: z.string().nullish(),
        scopes: z.array(z.string()),
        user: z
          .object({
            id: z.string().uuid(),
            name: z.string(),
            email: z.string().email(),
            role: z.enum(["owner", "member"]),
            createdAt: z.string().datetime({ offset: true }),
          })
          .passthrough(),
        account: z
          .object({
            id: z.string().uuid(),
            displayName: z.string(),
            accountType: z.enum(["agency", "creator", "team"]),
            createdAt: z.string().datetime({ offset: true }),
            memberCount: z.number().int().gte(0),
          })
          .passthrough(),
        brands: z.array(
          z.object({
            id: z.string().uuid(),
            name: z.string().min(1).max(160),
            timeZone: z.string(),
            confirmedAt: z.union([z.string(), z.null()]),
            status: z.enum(["active", "archiving", "archived"]),
            createdAt: z.string().datetime({ offset: true }),
            archivedAt: z.union([z.string(), z.null()]),
          })
        ),
      })
      .passthrough(),
  },
  {
    method: "post",
    path: "/api/v1/oauth/token",
    alias: "postApiv1oauthtoken",
    requestFormat: "form-url",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: postApiv1oauthtoken_Body,
      },
    ],
    response: z
      .object({
        access_token: z.string(),
        token_type: z.literal("Bearer"),
        expires_in: z.number().int().gte(1),
        refresh_token: z.string(),
        scope: z.string(),
        user: z
          .object({
            id: z.string().uuid(),
            name: z.string(),
            email: z.string().email(),
            role: z.enum(["owner", "member"]),
            createdAt: z.string().datetime({ offset: true }),
          })
          .passthrough(),
        account: z
          .object({
            id: z.string().uuid(),
            displayName: z.string(),
            accountType: z.enum(["agency", "creator", "team"]),
            createdAt: z.string().datetime({ offset: true }),
            memberCount: z.number().int().gte(0),
          })
          .passthrough(),
      })
      .passthrough(),
  },
  {
    method: "get",
    path: "/api/v1/social-connections/:id/capabilities",
    alias: "getSocialCapabilities",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.object({
      platform: z.enum(["instagram", "tiktok", "youtube", "linkedin"]),
      formats: z.array(z.string()),
      limits: z.object({
        maxBytes: z.number(),
        maxImages: z.number(),
        maxContentLength: z.number(),
        minVideoSeconds: z.number(),
        maxVideoSeconds: z.number(),
      }),
      privacyLevels: z.array(z.string()).optional(),
      identityStatus: z.enum(["verified", "unavailable"]),
      canPost: z.boolean(),
      interactionSettings: z
        .record(z.object({ enabled: z.boolean(), required: z.boolean() }))
        .optional(),
    }),
    errors: [
      {
        status: 400,
        description: `Invalid request`,
        schema: z.void(),
      },
      {
        status: 401,
        description: `Authentication required`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Role or scope denied`,
        schema: z.void(),
      },
      {
        status: 404,
        description: `Resource not found in account`,
        schema: z.void(),
      },
      {
        status: 409,
        description: `State, identity, idempotency or quota conflict`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `Preflight or validation rejected`,
        schema: z.void(),
      },
      {
        status: 429,
        description: `Rate limit exceeded`,
        schema: z.void(),
      },
      {
        status: 503,
        description: `Social provider not configured or unavailable`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/social-connections/:id/disconnect",
    alias: "disconnectSocialAccount",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.object({
      id: z.string().uuid(),
      brandId: z.string().uuid(),
      platform: z.enum(["instagram", "tiktok", "youtube", "linkedin"]),
      displayName: z.string(),
      status: z.enum([
        "pending",
        "active",
        "requires_action",
        "disconnecting",
        "disconnected",
      ]),
      identityStatus: z.enum(["verified", "unavailable"]),
      createdAt: z.string().datetime({ offset: true }),
    }),
    errors: [
      {
        status: 400,
        description: `Invalid request`,
        schema: z.void(),
      },
      {
        status: 401,
        description: `Authentication required`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Role or scope denied`,
        schema: z.void(),
      },
      {
        status: 404,
        description: `Resource not found in account`,
        schema: z.void(),
      },
      {
        status: 409,
        description: `State, identity, idempotency or quota conflict`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `Preflight or validation rejected`,
        schema: z.void(),
      },
      {
        status: 429,
        description: `Rate limit exceeded`,
        schema: z.void(),
      },
      {
        status: 503,
        description: `Social provider not configured or unavailable`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/social-connections/:id/sync",
    alias: "syncSocialAccount",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.object({ status: z.literal("pending") }),
    errors: [
      {
        status: 400,
        description: `Invalid request`,
        schema: z.void(),
      },
      {
        status: 401,
        description: `Authentication required`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Role or scope denied`,
        schema: z.void(),
      },
      {
        status: 404,
        description: `Resource not found in account`,
        schema: z.void(),
      },
      {
        status: 409,
        description: `State, identity, idempotency or quota conflict`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `Preflight or validation rejected`,
        schema: z.void(),
      },
      {
        status: 429,
        description: `Rate limit exceeded`,
        schema: z.void(),
      },
      {
        status: 503,
        description: `Social provider not configured or unavailable`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/social-connections/callback",
    alias: "completeSocialAuthorizationGet",
    requestFormat: "json",
    response: z.void(),
    errors: [
      {
        status: 302,
        description: `Redirect to brand connections`,
        schema: z.void(),
      },
      {
        status: 400,
        description: `Invalid or expired session`,
        schema: z.void(),
      },
      {
        status: 409,
        description: `Identity verification failed`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/social-connections/callback",
    alias: "completeSocialAuthorizationPost",
    requestFormat: "json",
    response: z.void(),
    errors: [
      {
        status: 302,
        description: `Redirect to brand connections`,
        schema: z.void(),
      },
      {
        status: 400,
        description: `Invalid or expired session`,
        schema: z.void(),
      },
      {
        status: 409,
        description: `Identity verification failed`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/social-metrics",
    alias: "listSocialMetrics",
    requestFormat: "json",
    parameters: [
      {
        name: "brandId",
        type: "Query",
        schema: z.string().uuid(),
      },
      {
        name: "cursor",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().gte(1).lte(100).optional().default(20),
      },
      {
        name: "socialAccountId",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "destinationId",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "metric",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: z.object({
      items: z.array(
        z.object({
          id: z.string().uuid(),
          brandId: z.string().uuid(),
          socialAccountId: z.string().uuid(),
          destinationId: z.union([z.string(), z.null()]),
          externalPostId: z.union([z.string(), z.null()]),
          platform: z.enum(["instagram", "tiktok", "youtube", "linkedin"]),
          metric: z.string(),
          value: z.union([z.number(), z.null()]),
          availability: z.enum(["available", "unavailable"]),
          periodStart: z.union([z.string(), z.null()]),
          periodEnd: z.union([z.string(), z.null()]),
          observedAt: z.string().datetime({ offset: true }),
          dataThrough: z.union([z.string(), z.null()]),
          source: z.string(),
        })
      ),
      nextCursor: z.string().optional(),
    }),
    errors: [
      {
        status: 400,
        description: `Invalid request`,
        schema: z.void(),
      },
      {
        status: 401,
        description: `Authentication required`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Role or scope denied`,
        schema: z.void(),
      },
      {
        status: 404,
        description: `Resource not found in account`,
        schema: z.void(),
      },
      {
        status: 409,
        description: `State, identity, idempotency or quota conflict`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `Preflight or validation rejected`,
        schema: z.void(),
      },
      {
        status: 429,
        description: `Rate limit exceeded`,
        schema: z.void(),
      },
      {
        status: 503,
        description: `Social provider not configured or unavailable`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/social-publications",
    alias: "listSocialPublications",
    requestFormat: "json",
    parameters: [
      {
        name: "brandId",
        type: "Query",
        schema: z.string().uuid(),
      },
      {
        name: "cursor",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().gte(1).lte(100).optional().default(20),
      },
    ],
    response: z.object({
      items: z.array(
        z.object({
          id: z.string().uuid(),
          brandId: z.string().uuid(),
          title: z.string(),
          status: z.string(),
          createdAt: z.string().datetime({ offset: true }),
          updatedAt: z.string().datetime({ offset: true }),
          destinations: z.array(
            z.object({
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
              content: z.string(),
              title: z.string().optional(),
              description: z.string().optional(),
              mediaAssetIds: z.array(z.string().uuid()),
              coverAssetId: z.string().uuid().optional(),
              analysisId: z.string().uuid().optional(),
              settings: z
                .object({
                  privacyLevel: z.enum([
                    "PUBLIC_TO_EVERYONE",
                    "MUTUAL_FOLLOW_FRIENDS",
                    "FOLLOWER_OF_CREATOR",
                    "SELF_ONLY",
                    "public",
                    "private",
                    "unlisted",
                  ]),
                  previewConfirmed: z.boolean(),
                  expressConsentGiven: z.boolean(),
                  allowComment: z.boolean(),
                  allowDuet: z.boolean(),
                  allowStitch: z.boolean(),
                  isAiGenerated: z.boolean(),
                  commercialContentType: z.enum([
                    "none",
                    "brand_organic",
                    "brand_content",
                  ]),
                  shareToFeed: z.boolean(),
                  madeForKids: z.boolean(),
                  containsSyntheticMedia: z.boolean(),
                  tags: z.array(z.string()),
                  coverTimestampMs: z.number(),
                })
                .partial(),
              id: z.string().uuid(),
              publicationId: z.string().uuid(),
              platform: z.enum(["instagram", "tiktok", "youtube", "linkedin"]),
              status: z.enum([
                "draft",
                "awaiting_handoff",
                "submitting",
                "scheduled",
                "publishing",
                "published",
                "cancellation_requested",
                "cancelled",
                "unknown",
                "failed",
              ]),
              scheduledAt: z.union([z.string(), z.null()]),
              timeZone: z.union([z.string(), z.null()]),
              localDateTime: z.union([z.string(), z.null()]),
              lastError: z.union([z.string(), z.null()]),
              versions: z
                .array(
                  z.object({
                    id: z.string().uuid(),
                    createdAt: z.string().datetime({ offset: true }),
                    scheduledAt: z.union([z.string(), z.null()]),
                    snapshot: z.object({
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
                      content: z.string(),
                      title: z.string().optional(),
                      description: z.string().optional(),
                      mediaAssetIds: z.array(z.string().uuid()),
                      coverAssetId: z.string().uuid().optional(),
                      analysisId: z.string().uuid().optional(),
                      settings: z
                        .object({
                          privacyLevel: z.enum([
                            "PUBLIC_TO_EVERYONE",
                            "MUTUAL_FOLLOW_FRIENDS",
                            "FOLLOWER_OF_CREATOR",
                            "SELF_ONLY",
                            "public",
                            "private",
                            "unlisted",
                          ]),
                          previewConfirmed: z.boolean(),
                          expressConsentGiven: z.boolean(),
                          allowComment: z.boolean(),
                          allowDuet: z.boolean(),
                          allowStitch: z.boolean(),
                          isAiGenerated: z.boolean(),
                          commercialContentType: z.enum([
                            "none",
                            "brand_organic",
                            "brand_content",
                          ]),
                          shareToFeed: z.boolean(),
                          madeForKids: z.boolean(),
                          containsSyntheticMedia: z.boolean(),
                          tags: z.array(z.string()),
                          coverTimestampMs: z.number(),
                        })
                        .partial(),
                    }),
                    timeZone: z.union([z.string(), z.null()]),
                    localDateTime: z.union([z.string(), z.null()]),
                  })
                )
                .optional(),
              attempts: z
                .array(
                  z.object({
                    id: z.string().uuid(),
                    status: z.string(),
                    lastError: z.union([z.string(), z.null()]),
                    createdAt: z.string().datetime({ offset: true }),
                    updatedAt: z.string().datetime({ offset: true }),
                  })
                )
                .optional(),
            })
          ),
        })
      ),
      nextCursor: z.string().optional(),
    }),
    errors: [
      {
        status: 400,
        description: `Invalid request`,
        schema: z.void(),
      },
      {
        status: 401,
        description: `Authentication required`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Role or scope denied`,
        schema: z.void(),
      },
      {
        status: 404,
        description: `Resource not found in account`,
        schema: z.void(),
      },
      {
        status: 409,
        description: `State, identity, idempotency or quota conflict`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `Preflight or validation rejected`,
        schema: z.void(),
      },
      {
        status: 429,
        description: `Rate limit exceeded`,
        schema: z.void(),
      },
      {
        status: 503,
        description: `Social provider not configured or unavailable`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/social-publications",
    alias: "createSocialPublication",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: createSocialPublication_Body,
      },
    ],
    response: z.object({
      id: z.string().uuid(),
      brandId: z.string().uuid(),
      title: z.string(),
      status: z.string(),
      createdAt: z.string().datetime({ offset: true }),
      updatedAt: z.string().datetime({ offset: true }),
      destinations: z.array(
        z.object({
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
          content: z.string(),
          title: z.string().optional(),
          description: z.string().optional(),
          mediaAssetIds: z.array(z.string().uuid()),
          coverAssetId: z.string().uuid().optional(),
          analysisId: z.string().uuid().optional(),
          settings: z
            .object({
              privacyLevel: z.enum([
                "PUBLIC_TO_EVERYONE",
                "MUTUAL_FOLLOW_FRIENDS",
                "FOLLOWER_OF_CREATOR",
                "SELF_ONLY",
                "public",
                "private",
                "unlisted",
              ]),
              previewConfirmed: z.boolean(),
              expressConsentGiven: z.boolean(),
              allowComment: z.boolean(),
              allowDuet: z.boolean(),
              allowStitch: z.boolean(),
              isAiGenerated: z.boolean(),
              commercialContentType: z.enum([
                "none",
                "brand_organic",
                "brand_content",
              ]),
              shareToFeed: z.boolean(),
              madeForKids: z.boolean(),
              containsSyntheticMedia: z.boolean(),
              tags: z.array(z.string()),
              coverTimestampMs: z.number(),
            })
            .partial(),
          id: z.string().uuid(),
          publicationId: z.string().uuid(),
          platform: z.enum(["instagram", "tiktok", "youtube", "linkedin"]),
          status: z.enum([
            "draft",
            "awaiting_handoff",
            "submitting",
            "scheduled",
            "publishing",
            "published",
            "cancellation_requested",
            "cancelled",
            "unknown",
            "failed",
          ]),
          scheduledAt: z.union([z.string(), z.null()]),
          timeZone: z.union([z.string(), z.null()]),
          localDateTime: z.union([z.string(), z.null()]),
          lastError: z.union([z.string(), z.null()]),
          versions: z
            .array(
              z.object({
                id: z.string().uuid(),
                createdAt: z.string().datetime({ offset: true }),
                scheduledAt: z.union([z.string(), z.null()]),
                snapshot: z.object({
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
                  content: z.string(),
                  title: z.string().optional(),
                  description: z.string().optional(),
                  mediaAssetIds: z.array(z.string().uuid()),
                  coverAssetId: z.string().uuid().optional(),
                  analysisId: z.string().uuid().optional(),
                  settings: z
                    .object({
                      privacyLevel: z.enum([
                        "PUBLIC_TO_EVERYONE",
                        "MUTUAL_FOLLOW_FRIENDS",
                        "FOLLOWER_OF_CREATOR",
                        "SELF_ONLY",
                        "public",
                        "private",
                        "unlisted",
                      ]),
                      previewConfirmed: z.boolean(),
                      expressConsentGiven: z.boolean(),
                      allowComment: z.boolean(),
                      allowDuet: z.boolean(),
                      allowStitch: z.boolean(),
                      isAiGenerated: z.boolean(),
                      commercialContentType: z.enum([
                        "none",
                        "brand_organic",
                        "brand_content",
                      ]),
                      shareToFeed: z.boolean(),
                      madeForKids: z.boolean(),
                      containsSyntheticMedia: z.boolean(),
                      tags: z.array(z.string()),
                      coverTimestampMs: z.number(),
                    })
                    .partial(),
                }),
                timeZone: z.union([z.string(), z.null()]),
                localDateTime: z.union([z.string(), z.null()]),
              })
            )
            .optional(),
          attempts: z
            .array(
              z.object({
                id: z.string().uuid(),
                status: z.string(),
                lastError: z.union([z.string(), z.null()]),
                createdAt: z.string().datetime({ offset: true }),
                updatedAt: z.string().datetime({ offset: true }),
              })
            )
            .optional(),
        })
      ),
    }),
    errors: [
      {
        status: 400,
        description: `Invalid request`,
        schema: z.void(),
      },
      {
        status: 401,
        description: `Authentication required`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Role or scope denied`,
        schema: z.void(),
      },
      {
        status: 404,
        description: `Resource not found in account`,
        schema: z.void(),
      },
      {
        status: 409,
        description: `State, identity, idempotency or quota conflict`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `Preflight or validation rejected`,
        schema: z.void(),
      },
      {
        status: 429,
        description: `Rate limit exceeded`,
        schema: z.void(),
      },
      {
        status: 503,
        description: `Social provider not configured or unavailable`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/social-publications/:id",
    alias: "getSocialPublication",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.object({
      id: z.string().uuid(),
      brandId: z.string().uuid(),
      title: z.string(),
      status: z.string(),
      createdAt: z.string().datetime({ offset: true }),
      updatedAt: z.string().datetime({ offset: true }),
      destinations: z.array(
        z.object({
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
          content: z.string(),
          title: z.string().optional(),
          description: z.string().optional(),
          mediaAssetIds: z.array(z.string().uuid()),
          coverAssetId: z.string().uuid().optional(),
          analysisId: z.string().uuid().optional(),
          settings: z
            .object({
              privacyLevel: z.enum([
                "PUBLIC_TO_EVERYONE",
                "MUTUAL_FOLLOW_FRIENDS",
                "FOLLOWER_OF_CREATOR",
                "SELF_ONLY",
                "public",
                "private",
                "unlisted",
              ]),
              previewConfirmed: z.boolean(),
              expressConsentGiven: z.boolean(),
              allowComment: z.boolean(),
              allowDuet: z.boolean(),
              allowStitch: z.boolean(),
              isAiGenerated: z.boolean(),
              commercialContentType: z.enum([
                "none",
                "brand_organic",
                "brand_content",
              ]),
              shareToFeed: z.boolean(),
              madeForKids: z.boolean(),
              containsSyntheticMedia: z.boolean(),
              tags: z.array(z.string()),
              coverTimestampMs: z.number(),
            })
            .partial(),
          id: z.string().uuid(),
          publicationId: z.string().uuid(),
          platform: z.enum(["instagram", "tiktok", "youtube", "linkedin"]),
          status: z.enum([
            "draft",
            "awaiting_handoff",
            "submitting",
            "scheduled",
            "publishing",
            "published",
            "cancellation_requested",
            "cancelled",
            "unknown",
            "failed",
          ]),
          scheduledAt: z.union([z.string(), z.null()]),
          timeZone: z.union([z.string(), z.null()]),
          localDateTime: z.union([z.string(), z.null()]),
          lastError: z.union([z.string(), z.null()]),
          versions: z
            .array(
              z.object({
                id: z.string().uuid(),
                createdAt: z.string().datetime({ offset: true }),
                scheduledAt: z.union([z.string(), z.null()]),
                snapshot: z.object({
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
                  content: z.string(),
                  title: z.string().optional(),
                  description: z.string().optional(),
                  mediaAssetIds: z.array(z.string().uuid()),
                  coverAssetId: z.string().uuid().optional(),
                  analysisId: z.string().uuid().optional(),
                  settings: z
                    .object({
                      privacyLevel: z.enum([
                        "PUBLIC_TO_EVERYONE",
                        "MUTUAL_FOLLOW_FRIENDS",
                        "FOLLOWER_OF_CREATOR",
                        "SELF_ONLY",
                        "public",
                        "private",
                        "unlisted",
                      ]),
                      previewConfirmed: z.boolean(),
                      expressConsentGiven: z.boolean(),
                      allowComment: z.boolean(),
                      allowDuet: z.boolean(),
                      allowStitch: z.boolean(),
                      isAiGenerated: z.boolean(),
                      commercialContentType: z.enum([
                        "none",
                        "brand_organic",
                        "brand_content",
                      ]),
                      shareToFeed: z.boolean(),
                      madeForKids: z.boolean(),
                      containsSyntheticMedia: z.boolean(),
                      tags: z.array(z.string()),
                      coverTimestampMs: z.number(),
                    })
                    .partial(),
                }),
                timeZone: z.union([z.string(), z.null()]),
                localDateTime: z.union([z.string(), z.null()]),
              })
            )
            .optional(),
          attempts: z
            .array(
              z.object({
                id: z.string().uuid(),
                status: z.string(),
                lastError: z.union([z.string(), z.null()]),
                createdAt: z.string().datetime({ offset: true }),
                updatedAt: z.string().datetime({ offset: true }),
              })
            )
            .optional(),
        })
      ),
    }),
    errors: [
      {
        status: 400,
        description: `Invalid request`,
        schema: z.void(),
      },
      {
        status: 401,
        description: `Authentication required`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Role or scope denied`,
        schema: z.void(),
      },
      {
        status: 404,
        description: `Resource not found in account`,
        schema: z.void(),
      },
      {
        status: 409,
        description: `State, identity, idempotency or quota conflict`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `Preflight or validation rejected`,
        schema: z.void(),
      },
      {
        status: 429,
        description: `Rate limit exceeded`,
        schema: z.void(),
      },
      {
        status: 503,
        description: `Social provider not configured or unavailable`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/social-publications/:id/destinations",
    alias: "createSocialDestination",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: createSocialDestination_Body,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.object({
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
      content: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      mediaAssetIds: z.array(z.string().uuid()),
      coverAssetId: z.string().uuid().optional(),
      analysisId: z.string().uuid().optional(),
      settings: z
        .object({
          privacyLevel: z.enum([
            "PUBLIC_TO_EVERYONE",
            "MUTUAL_FOLLOW_FRIENDS",
            "FOLLOWER_OF_CREATOR",
            "SELF_ONLY",
            "public",
            "private",
            "unlisted",
          ]),
          previewConfirmed: z.boolean(),
          expressConsentGiven: z.boolean(),
          allowComment: z.boolean(),
          allowDuet: z.boolean(),
          allowStitch: z.boolean(),
          isAiGenerated: z.boolean(),
          commercialContentType: z.enum([
            "none",
            "brand_organic",
            "brand_content",
          ]),
          shareToFeed: z.boolean(),
          madeForKids: z.boolean(),
          containsSyntheticMedia: z.boolean(),
          tags: z.array(z.string()),
          coverTimestampMs: z.number(),
        })
        .partial(),
      id: z.string().uuid(),
      publicationId: z.string().uuid(),
      platform: z.enum(["instagram", "tiktok", "youtube", "linkedin"]),
      status: z.enum([
        "draft",
        "awaiting_handoff",
        "submitting",
        "scheduled",
        "publishing",
        "published",
        "cancellation_requested",
        "cancelled",
        "unknown",
        "failed",
      ]),
      scheduledAt: z.union([z.string(), z.null()]),
      timeZone: z.union([z.string(), z.null()]),
      localDateTime: z.union([z.string(), z.null()]),
      lastError: z.union([z.string(), z.null()]),
      versions: z
        .array(
          z.object({
            id: z.string().uuid(),
            createdAt: z.string().datetime({ offset: true }),
            scheduledAt: z.union([z.string(), z.null()]),
            snapshot: z.object({
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
              content: z.string(),
              title: z.string().optional(),
              description: z.string().optional(),
              mediaAssetIds: z.array(z.string().uuid()),
              coverAssetId: z.string().uuid().optional(),
              analysisId: z.string().uuid().optional(),
              settings: z
                .object({
                  privacyLevel: z.enum([
                    "PUBLIC_TO_EVERYONE",
                    "MUTUAL_FOLLOW_FRIENDS",
                    "FOLLOWER_OF_CREATOR",
                    "SELF_ONLY",
                    "public",
                    "private",
                    "unlisted",
                  ]),
                  previewConfirmed: z.boolean(),
                  expressConsentGiven: z.boolean(),
                  allowComment: z.boolean(),
                  allowDuet: z.boolean(),
                  allowStitch: z.boolean(),
                  isAiGenerated: z.boolean(),
                  commercialContentType: z.enum([
                    "none",
                    "brand_organic",
                    "brand_content",
                  ]),
                  shareToFeed: z.boolean(),
                  madeForKids: z.boolean(),
                  containsSyntheticMedia: z.boolean(),
                  tags: z.array(z.string()),
                  coverTimestampMs: z.number(),
                })
                .partial(),
            }),
            timeZone: z.union([z.string(), z.null()]),
            localDateTime: z.union([z.string(), z.null()]),
          })
        )
        .optional(),
      attempts: z
        .array(
          z.object({
            id: z.string().uuid(),
            status: z.string(),
            lastError: z.union([z.string(), z.null()]),
            createdAt: z.string().datetime({ offset: true }),
            updatedAt: z.string().datetime({ offset: true }),
          })
        )
        .optional(),
    }),
    errors: [
      {
        status: 400,
        description: `Invalid request`,
        schema: z.void(),
      },
      {
        status: 401,
        description: `Authentication required`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Role or scope denied`,
        schema: z.void(),
      },
      {
        status: 404,
        description: `Resource not found in account`,
        schema: z.void(),
      },
      {
        status: 409,
        description: `State, identity, idempotency or quota conflict`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `Preflight or validation rejected`,
        schema: z.void(),
      },
      {
        status: 429,
        description: `Rate limit exceeded`,
        schema: z.void(),
      },
      {
        status: 503,
        description: `Social provider not configured or unavailable`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "patch",
    path: "/api/v1/social-publications/:id/destinations/:destinationId",
    alias: "updateSocialDestination",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: createSocialDestination_Body,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "destinationId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.object({
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
      content: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      mediaAssetIds: z.array(z.string().uuid()),
      coverAssetId: z.string().uuid().optional(),
      analysisId: z.string().uuid().optional(),
      settings: z
        .object({
          privacyLevel: z.enum([
            "PUBLIC_TO_EVERYONE",
            "MUTUAL_FOLLOW_FRIENDS",
            "FOLLOWER_OF_CREATOR",
            "SELF_ONLY",
            "public",
            "private",
            "unlisted",
          ]),
          previewConfirmed: z.boolean(),
          expressConsentGiven: z.boolean(),
          allowComment: z.boolean(),
          allowDuet: z.boolean(),
          allowStitch: z.boolean(),
          isAiGenerated: z.boolean(),
          commercialContentType: z.enum([
            "none",
            "brand_organic",
            "brand_content",
          ]),
          shareToFeed: z.boolean(),
          madeForKids: z.boolean(),
          containsSyntheticMedia: z.boolean(),
          tags: z.array(z.string()),
          coverTimestampMs: z.number(),
        })
        .partial(),
      id: z.string().uuid(),
      publicationId: z.string().uuid(),
      platform: z.enum(["instagram", "tiktok", "youtube", "linkedin"]),
      status: z.enum([
        "draft",
        "awaiting_handoff",
        "submitting",
        "scheduled",
        "publishing",
        "published",
        "cancellation_requested",
        "cancelled",
        "unknown",
        "failed",
      ]),
      scheduledAt: z.union([z.string(), z.null()]),
      timeZone: z.union([z.string(), z.null()]),
      localDateTime: z.union([z.string(), z.null()]),
      lastError: z.union([z.string(), z.null()]),
      versions: z
        .array(
          z.object({
            id: z.string().uuid(),
            createdAt: z.string().datetime({ offset: true }),
            scheduledAt: z.union([z.string(), z.null()]),
            snapshot: z.object({
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
              content: z.string(),
              title: z.string().optional(),
              description: z.string().optional(),
              mediaAssetIds: z.array(z.string().uuid()),
              coverAssetId: z.string().uuid().optional(),
              analysisId: z.string().uuid().optional(),
              settings: z
                .object({
                  privacyLevel: z.enum([
                    "PUBLIC_TO_EVERYONE",
                    "MUTUAL_FOLLOW_FRIENDS",
                    "FOLLOWER_OF_CREATOR",
                    "SELF_ONLY",
                    "public",
                    "private",
                    "unlisted",
                  ]),
                  previewConfirmed: z.boolean(),
                  expressConsentGiven: z.boolean(),
                  allowComment: z.boolean(),
                  allowDuet: z.boolean(),
                  allowStitch: z.boolean(),
                  isAiGenerated: z.boolean(),
                  commercialContentType: z.enum([
                    "none",
                    "brand_organic",
                    "brand_content",
                  ]),
                  shareToFeed: z.boolean(),
                  madeForKids: z.boolean(),
                  containsSyntheticMedia: z.boolean(),
                  tags: z.array(z.string()),
                  coverTimestampMs: z.number(),
                })
                .partial(),
            }),
            timeZone: z.union([z.string(), z.null()]),
            localDateTime: z.union([z.string(), z.null()]),
          })
        )
        .optional(),
      attempts: z
        .array(
          z.object({
            id: z.string().uuid(),
            status: z.string(),
            lastError: z.union([z.string(), z.null()]),
            createdAt: z.string().datetime({ offset: true }),
            updatedAt: z.string().datetime({ offset: true }),
          })
        )
        .optional(),
    }),
    errors: [
      {
        status: 400,
        description: `Invalid request`,
        schema: z.void(),
      },
      {
        status: 401,
        description: `Authentication required`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Role or scope denied`,
        schema: z.void(),
      },
      {
        status: 404,
        description: `Resource not found in account`,
        schema: z.void(),
      },
      {
        status: 409,
        description: `State, identity, idempotency or quota conflict`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `Preflight or validation rejected`,
        schema: z.void(),
      },
      {
        status: 429,
        description: `Rate limit exceeded`,
        schema: z.void(),
      },
      {
        status: 503,
        description: `Social provider not configured or unavailable`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/social-publications/:id/destinations/:destinationId/cancel",
    alias: "cancelSocialDestination",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "destinationId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "Idempotency-Key",
        type: "Header",
        schema: z.string().min(1).max(200),
      },
    ],
    response: z.object({
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
      content: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      mediaAssetIds: z.array(z.string().uuid()),
      coverAssetId: z.string().uuid().optional(),
      analysisId: z.string().uuid().optional(),
      settings: z
        .object({
          privacyLevel: z.enum([
            "PUBLIC_TO_EVERYONE",
            "MUTUAL_FOLLOW_FRIENDS",
            "FOLLOWER_OF_CREATOR",
            "SELF_ONLY",
            "public",
            "private",
            "unlisted",
          ]),
          previewConfirmed: z.boolean(),
          expressConsentGiven: z.boolean(),
          allowComment: z.boolean(),
          allowDuet: z.boolean(),
          allowStitch: z.boolean(),
          isAiGenerated: z.boolean(),
          commercialContentType: z.enum([
            "none",
            "brand_organic",
            "brand_content",
          ]),
          shareToFeed: z.boolean(),
          madeForKids: z.boolean(),
          containsSyntheticMedia: z.boolean(),
          tags: z.array(z.string()),
          coverTimestampMs: z.number(),
        })
        .partial(),
      id: z.string().uuid(),
      publicationId: z.string().uuid(),
      platform: z.enum(["instagram", "tiktok", "youtube", "linkedin"]),
      status: z.enum([
        "draft",
        "awaiting_handoff",
        "submitting",
        "scheduled",
        "publishing",
        "published",
        "cancellation_requested",
        "cancelled",
        "unknown",
        "failed",
      ]),
      scheduledAt: z.union([z.string(), z.null()]),
      timeZone: z.union([z.string(), z.null()]),
      localDateTime: z.union([z.string(), z.null()]),
      lastError: z.union([z.string(), z.null()]),
      versions: z
        .array(
          z.object({
            id: z.string().uuid(),
            createdAt: z.string().datetime({ offset: true }),
            scheduledAt: z.union([z.string(), z.null()]),
            snapshot: z.object({
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
              content: z.string(),
              title: z.string().optional(),
              description: z.string().optional(),
              mediaAssetIds: z.array(z.string().uuid()),
              coverAssetId: z.string().uuid().optional(),
              analysisId: z.string().uuid().optional(),
              settings: z
                .object({
                  privacyLevel: z.enum([
                    "PUBLIC_TO_EVERYONE",
                    "MUTUAL_FOLLOW_FRIENDS",
                    "FOLLOWER_OF_CREATOR",
                    "SELF_ONLY",
                    "public",
                    "private",
                    "unlisted",
                  ]),
                  previewConfirmed: z.boolean(),
                  expressConsentGiven: z.boolean(),
                  allowComment: z.boolean(),
                  allowDuet: z.boolean(),
                  allowStitch: z.boolean(),
                  isAiGenerated: z.boolean(),
                  commercialContentType: z.enum([
                    "none",
                    "brand_organic",
                    "brand_content",
                  ]),
                  shareToFeed: z.boolean(),
                  madeForKids: z.boolean(),
                  containsSyntheticMedia: z.boolean(),
                  tags: z.array(z.string()),
                  coverTimestampMs: z.number(),
                })
                .partial(),
            }),
            timeZone: z.union([z.string(), z.null()]),
            localDateTime: z.union([z.string(), z.null()]),
          })
        )
        .optional(),
      attempts: z
        .array(
          z.object({
            id: z.string().uuid(),
            status: z.string(),
            lastError: z.union([z.string(), z.null()]),
            createdAt: z.string().datetime({ offset: true }),
            updatedAt: z.string().datetime({ offset: true }),
          })
        )
        .optional(),
    }),
    errors: [
      {
        status: 400,
        description: `Invalid request`,
        schema: z.void(),
      },
      {
        status: 401,
        description: `Authentication required`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Role or scope denied`,
        schema: z.void(),
      },
      {
        status: 404,
        description: `Resource not found in account`,
        schema: z.void(),
      },
      {
        status: 409,
        description: `State, identity, idempotency or quota conflict`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `Preflight or validation rejected`,
        schema: z.void(),
      },
      {
        status: 429,
        description: `Rate limit exceeded`,
        schema: z.void(),
      },
      {
        status: 503,
        description: `Social provider not configured or unavailable`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/social-publications/:id/destinations/:destinationId/preflight",
    alias: "preflightSocialDestination",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "destinationId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.object({
      valid: z.boolean(),
      issues: z.array(
        z.object({ field: z.string(), code: z.string(), message: z.string() })
      ),
      capabilities: z.object({
        platform: z.enum(["instagram", "tiktok", "youtube", "linkedin"]),
        formats: z.array(z.string()),
        limits: z.object({
          maxBytes: z.number(),
          maxImages: z.number(),
          maxContentLength: z.number(),
          minVideoSeconds: z.number(),
          maxVideoSeconds: z.number(),
        }),
        privacyLevels: z.array(z.string()).optional(),
        identityStatus: z.enum(["verified", "unavailable"]),
        canPost: z.boolean(),
        interactionSettings: z
          .record(z.object({ enabled: z.boolean(), required: z.boolean() }))
          .optional(),
      }),
    }),
    errors: [
      {
        status: 400,
        description: `Invalid request`,
        schema: z.void(),
      },
      {
        status: 401,
        description: `Authentication required`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Role or scope denied`,
        schema: z.void(),
      },
      {
        status: 404,
        description: `Resource not found in account`,
        schema: z.void(),
      },
      {
        status: 409,
        description: `State, identity, idempotency or quota conflict`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `Preflight or validation rejected`,
        schema: z.void(),
      },
      {
        status: 429,
        description: `Rate limit exceeded`,
        schema: z.void(),
      },
      {
        status: 503,
        description: `Social provider not configured or unavailable`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/social-publications/:id/destinations/:destinationId/retry",
    alias: "retrySocialDestination",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "destinationId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "Idempotency-Key",
        type: "Header",
        schema: z.string().min(1).max(200),
      },
    ],
    response: z.object({
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
      content: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      mediaAssetIds: z.array(z.string().uuid()),
      coverAssetId: z.string().uuid().optional(),
      analysisId: z.string().uuid().optional(),
      settings: z
        .object({
          privacyLevel: z.enum([
            "PUBLIC_TO_EVERYONE",
            "MUTUAL_FOLLOW_FRIENDS",
            "FOLLOWER_OF_CREATOR",
            "SELF_ONLY",
            "public",
            "private",
            "unlisted",
          ]),
          previewConfirmed: z.boolean(),
          expressConsentGiven: z.boolean(),
          allowComment: z.boolean(),
          allowDuet: z.boolean(),
          allowStitch: z.boolean(),
          isAiGenerated: z.boolean(),
          commercialContentType: z.enum([
            "none",
            "brand_organic",
            "brand_content",
          ]),
          shareToFeed: z.boolean(),
          madeForKids: z.boolean(),
          containsSyntheticMedia: z.boolean(),
          tags: z.array(z.string()),
          coverTimestampMs: z.number(),
        })
        .partial(),
      id: z.string().uuid(),
      publicationId: z.string().uuid(),
      platform: z.enum(["instagram", "tiktok", "youtube", "linkedin"]),
      status: z.enum([
        "draft",
        "awaiting_handoff",
        "submitting",
        "scheduled",
        "publishing",
        "published",
        "cancellation_requested",
        "cancelled",
        "unknown",
        "failed",
      ]),
      scheduledAt: z.union([z.string(), z.null()]),
      timeZone: z.union([z.string(), z.null()]),
      localDateTime: z.union([z.string(), z.null()]),
      lastError: z.union([z.string(), z.null()]),
      versions: z
        .array(
          z.object({
            id: z.string().uuid(),
            createdAt: z.string().datetime({ offset: true }),
            scheduledAt: z.union([z.string(), z.null()]),
            snapshot: z.object({
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
              content: z.string(),
              title: z.string().optional(),
              description: z.string().optional(),
              mediaAssetIds: z.array(z.string().uuid()),
              coverAssetId: z.string().uuid().optional(),
              analysisId: z.string().uuid().optional(),
              settings: z
                .object({
                  privacyLevel: z.enum([
                    "PUBLIC_TO_EVERYONE",
                    "MUTUAL_FOLLOW_FRIENDS",
                    "FOLLOWER_OF_CREATOR",
                    "SELF_ONLY",
                    "public",
                    "private",
                    "unlisted",
                  ]),
                  previewConfirmed: z.boolean(),
                  expressConsentGiven: z.boolean(),
                  allowComment: z.boolean(),
                  allowDuet: z.boolean(),
                  allowStitch: z.boolean(),
                  isAiGenerated: z.boolean(),
                  commercialContentType: z.enum([
                    "none",
                    "brand_organic",
                    "brand_content",
                  ]),
                  shareToFeed: z.boolean(),
                  madeForKids: z.boolean(),
                  containsSyntheticMedia: z.boolean(),
                  tags: z.array(z.string()),
                  coverTimestampMs: z.number(),
                })
                .partial(),
            }),
            timeZone: z.union([z.string(), z.null()]),
            localDateTime: z.union([z.string(), z.null()]),
          })
        )
        .optional(),
      attempts: z
        .array(
          z.object({
            id: z.string().uuid(),
            status: z.string(),
            lastError: z.union([z.string(), z.null()]),
            createdAt: z.string().datetime({ offset: true }),
            updatedAt: z.string().datetime({ offset: true }),
          })
        )
        .optional(),
    }),
    errors: [
      {
        status: 400,
        description: `Invalid request`,
        schema: z.void(),
      },
      {
        status: 401,
        description: `Authentication required`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Role or scope denied`,
        schema: z.void(),
      },
      {
        status: 404,
        description: `Resource not found in account`,
        schema: z.void(),
      },
      {
        status: 409,
        description: `State, identity, idempotency or quota conflict`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `Preflight or validation rejected`,
        schema: z.void(),
      },
      {
        status: 429,
        description: `Rate limit exceeded`,
        schema: z.void(),
      },
      {
        status: 503,
        description: `Social provider not configured or unavailable`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/social-publications/:id/destinations/:destinationId/submit",
    alias: "submitSocialDestination",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: submitSocialDestination_Body,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "destinationId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "Idempotency-Key",
        type: "Header",
        schema: z.string().min(1).max(200),
      },
    ],
    response: z.object({
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
      content: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      mediaAssetIds: z.array(z.string().uuid()),
      coverAssetId: z.string().uuid().optional(),
      analysisId: z.string().uuid().optional(),
      settings: z
        .object({
          privacyLevel: z.enum([
            "PUBLIC_TO_EVERYONE",
            "MUTUAL_FOLLOW_FRIENDS",
            "FOLLOWER_OF_CREATOR",
            "SELF_ONLY",
            "public",
            "private",
            "unlisted",
          ]),
          previewConfirmed: z.boolean(),
          expressConsentGiven: z.boolean(),
          allowComment: z.boolean(),
          allowDuet: z.boolean(),
          allowStitch: z.boolean(),
          isAiGenerated: z.boolean(),
          commercialContentType: z.enum([
            "none",
            "brand_organic",
            "brand_content",
          ]),
          shareToFeed: z.boolean(),
          madeForKids: z.boolean(),
          containsSyntheticMedia: z.boolean(),
          tags: z.array(z.string()),
          coverTimestampMs: z.number(),
        })
        .partial(),
      id: z.string().uuid(),
      publicationId: z.string().uuid(),
      platform: z.enum(["instagram", "tiktok", "youtube", "linkedin"]),
      status: z.enum([
        "draft",
        "awaiting_handoff",
        "submitting",
        "scheduled",
        "publishing",
        "published",
        "cancellation_requested",
        "cancelled",
        "unknown",
        "failed",
      ]),
      scheduledAt: z.union([z.string(), z.null()]),
      timeZone: z.union([z.string(), z.null()]),
      localDateTime: z.union([z.string(), z.null()]),
      lastError: z.union([z.string(), z.null()]),
      versions: z
        .array(
          z.object({
            id: z.string().uuid(),
            createdAt: z.string().datetime({ offset: true }),
            scheduledAt: z.union([z.string(), z.null()]),
            snapshot: z.object({
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
              content: z.string(),
              title: z.string().optional(),
              description: z.string().optional(),
              mediaAssetIds: z.array(z.string().uuid()),
              coverAssetId: z.string().uuid().optional(),
              analysisId: z.string().uuid().optional(),
              settings: z
                .object({
                  privacyLevel: z.enum([
                    "PUBLIC_TO_EVERYONE",
                    "MUTUAL_FOLLOW_FRIENDS",
                    "FOLLOWER_OF_CREATOR",
                    "SELF_ONLY",
                    "public",
                    "private",
                    "unlisted",
                  ]),
                  previewConfirmed: z.boolean(),
                  expressConsentGiven: z.boolean(),
                  allowComment: z.boolean(),
                  allowDuet: z.boolean(),
                  allowStitch: z.boolean(),
                  isAiGenerated: z.boolean(),
                  commercialContentType: z.enum([
                    "none",
                    "brand_organic",
                    "brand_content",
                  ]),
                  shareToFeed: z.boolean(),
                  madeForKids: z.boolean(),
                  containsSyntheticMedia: z.boolean(),
                  tags: z.array(z.string()),
                  coverTimestampMs: z.number(),
                })
                .partial(),
            }),
            timeZone: z.union([z.string(), z.null()]),
            localDateTime: z.union([z.string(), z.null()]),
          })
        )
        .optional(),
      attempts: z
        .array(
          z.object({
            id: z.string().uuid(),
            status: z.string(),
            lastError: z.union([z.string(), z.null()]),
            createdAt: z.string().datetime({ offset: true }),
            updatedAt: z.string().datetime({ offset: true }),
          })
        )
        .optional(),
    }),
    errors: [
      {
        status: 400,
        description: `Invalid request`,
        schema: z.void(),
      },
      {
        status: 401,
        description: `Authentication required`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Role or scope denied`,
        schema: z.void(),
      },
      {
        status: 404,
        description: `Resource not found in account`,
        schema: z.void(),
      },
      {
        status: 409,
        description: `State, identity, idempotency or quota conflict`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `Preflight or validation rejected`,
        schema: z.void(),
      },
      {
        status: 429,
        description: `Rate limit exceeded`,
        schema: z.void(),
      },
      {
        status: 503,
        description: `Social provider not configured or unavailable`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/social-webhooks/zernio",
    alias: "receiveSocialWebhook",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ id: z.string(), event: z.string() }).passthrough(),
      },
      {
        name: "X-Zernio-Signature",
        type: "Header",
        schema: z.string(),
      },
    ],
    response: z.object({ received: z.boolean() }),
    errors: [
      {
        status: 400,
        description: `Invalid event`,
        schema: z.void(),
      },
      {
        status: 401,
        description: `Invalid signature`,
        schema: z.void(),
      },
      {
        status: 413,
        description: `Event too large`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/source-assets",
    alias: "getApiv1sourceAssets",
    requestFormat: "json",
    parameters: [
      {
        name: "brandId",
        type: "Query",
        schema: z.string().uuid().optional(),
      },
    ],
    response: z
      .object({
        items: z.array(
          z
            .object({
              id: z.string().uuid(),
              sourceLabel: z.string(),
              contentType: z.string(),
              contentLength: z.number().int().gte(0),
              analysisCount: z.number().int().gte(0),
              createdAt: z.string().datetime({ offset: true }),
              lastAnalyzedAt: z.string().datetime({ offset: true }).nullish(),
              brandId: z.union([z.string(), z.null()]),
              mediaKind: z.enum(["video", "image"]),
              metadataStatus: z.enum(["pending", "ready", "failed"]),
              metadata: z.union([
                z.object({
                  width: z.number().int().gte(1),
                  height: z.number().int().gte(1),
                  durationSeconds: z.union([z.number(), z.null()]).optional(),
                  codec: z.union([z.string(), z.null()]).optional(),
                  format: z.union([z.string(), z.null()]).optional(),
                }),
                z.null(),
              ]),
              variantOfAssetId: z.union([z.string(), z.null()]),
            })
            .passthrough()
        ),
      })
      .passthrough(),
  },
  {
    method: "post",
    path: "/api/v1/source-assets",
    alias: "postApiv1sourceAssets",
    requestFormat: "form-data",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: postApiv1sourceAssets_Body,
      },
    ],
    response: z
      .object({
        id: z.string().uuid(),
        sourceLabel: z.string(),
        contentType: z.string(),
        contentLength: z.number().int().gte(0),
        analysisCount: z.number().int().gte(0),
        createdAt: z.string().datetime({ offset: true }),
        lastAnalyzedAt: z.string().datetime({ offset: true }).nullish(),
        brandId: z.union([z.string(), z.null()]),
        mediaKind: z.enum(["video", "image"]),
        metadataStatus: z.enum(["pending", "ready", "failed"]),
        metadata: z.union([
          z.object({
            width: z.number().int().gte(1),
            height: z.number().int().gte(1),
            durationSeconds: z.union([z.number(), z.null()]).optional(),
            codec: z.union([z.string(), z.null()]).optional(),
            format: z.union([z.string(), z.null()]).optional(),
          }),
          z.null(),
        ]),
        variantOfAssetId: z.union([z.string(), z.null()]),
      })
      .passthrough(),
  },
  {
    method: "get",
    path: "/api/v1/source-assets/:id",
    alias: "getApiv1sourceAssetsId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z
      .object({
        id: z.string().uuid(),
        sourceLabel: z.string(),
        contentType: z.string(),
        contentLength: z.number().int().gte(0),
        analysisCount: z.number().int().gte(0),
        createdAt: z.string().datetime({ offset: true }),
        lastAnalyzedAt: z.string().datetime({ offset: true }).nullish(),
        brandId: z.union([z.string(), z.null()]),
        mediaKind: z.enum(["video", "image"]),
        metadataStatus: z.enum(["pending", "ready", "failed"]),
        metadata: z.union([
          z.object({
            width: z.number().int().gte(1),
            height: z.number().int().gte(1),
            durationSeconds: z.union([z.number(), z.null()]).optional(),
            codec: z.union([z.string(), z.null()]).optional(),
            format: z.union([z.string(), z.null()]).optional(),
          }),
          z.null(),
        ]),
        variantOfAssetId: z.union([z.string(), z.null()]),
      })
      .passthrough(),
    errors: [
      {
        status: 401,
        description: `Authentication required.`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Operation forbidden for this member.`,
        schema: z.void(),
      },
      {
        status: 409,
        description: `State, quota or idempotency conflict.`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `Invalid fields.`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "delete",
    path: "/api/v1/source-assets/:id",
    alias: "deleteApiv1sourceAssetsId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 401,
        description: `Authentication required.`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Operation forbidden for this member.`,
        schema: z.void(),
      },
      {
        status: 409,
        description: `State, quota or idempotency conflict.`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `Invalid fields.`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "get",
    path: "/api/v1/source-assets/:id/content",
    alias: "getApiv1sourceAssetsIdcontent",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "Range",
        type: "Header",
        schema: z.string().optional(),
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 401,
        description: `Authentication required.`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Operation forbidden for this member.`,
        schema: z.void(),
      },
      {
        status: 409,
        description: `State, quota or idempotency conflict.`,
        schema: z.void(),
      },
      {
        status: 416,
        description: `Range not satisfiable.`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `Invalid fields.`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "post",
    path: "/api/v1/source-assets/direct-uploads",
    alias: "postApiv1sourceAssetsdirectUploads",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: postApiv1sourceAssetsdirectUploads_Body,
      },
    ],
    response: z
      .object({
        sourceAssetId: z.string().uuid(),
        uploadUrl: z.string().url(),
        method: z.literal("PUT"),
        headers: z.record(z.string()),
        maxFileSizeBytes: z.number().int().gte(1),
        expiresAt: z.string().datetime({ offset: true }),
      })
      .passthrough(),
  },
  {
    method: "post",
    path: "/api/v1/source-assets/direct-uploads/:sourceAssetId/complete",
    alias: "postApiv1sourceAssetsdirectUploadsSourceAssetIdcomplete",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: postApiv1sourceAssetsdirectUploads_Body,
      },
      {
        name: "sourceAssetId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z
      .object({
        id: z.string().uuid(),
        sourceLabel: z.string(),
        contentType: z.string(),
        contentLength: z.number().int().gte(0),
        analysisCount: z.number().int().gte(0),
        createdAt: z.string().datetime({ offset: true }),
        lastAnalyzedAt: z.string().datetime({ offset: true }).nullish(),
        brandId: z.union([z.string(), z.null()]),
        mediaKind: z.enum(["video", "image"]),
        metadataStatus: z.enum(["pending", "ready", "failed"]),
        metadata: z.union([
          z.object({
            width: z.number().int().gte(1),
            height: z.number().int().gte(1),
            durationSeconds: z.union([z.number(), z.null()]).optional(),
            codec: z.union([z.string(), z.null()]).optional(),
            format: z.union([z.string(), z.null()]).optional(),
          }),
          z.null(),
        ]),
        variantOfAssetId: z.union([z.string(), z.null()]),
      })
      .passthrough(),
  },
  {
    method: "get",
    path: "/api/v1/usage",
    alias: "getApiv1usage",
    requestFormat: "json",
    response: z.object({
      cycleStart: z.string().datetime({ offset: true }),
      cycleEnd: z.string().datetime({ offset: true }),
      subscriptionStatus: z.enum(["active", "inactive"]),
      limits: z.object({
        brands: z.number().int().gte(0),
        socialIdentities: z.number().int().gte(0),
        operators: z.number().int().gte(0),
        analyses: z.number().int().gte(0),
      }),
      usage: z.object({
        brands: z.number().int().gte(0),
        socialIdentities: z.number().int().gte(0),
        operators: z.number().int().gte(0),
        analyses: z.number().int().gte(0),
        reservedAnalyses: z.number().int().gte(0),
      }),
      credits: z.object({
        includedRemaining: z.number().int().gte(0),
        purchasedRemaining: z.number().int().gte(0),
      }),
    }),
    errors: [
      {
        status: 401,
        description: `Authentication required.`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Operation forbidden for this member.`,
        schema: z.void(),
      },
      {
        status: 409,
        description: `State, quota or idempotency conflict.`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `Invalid fields.`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "get",
    path: "/health/live",
    alias: "getHealthlive",
    requestFormat: "json",
    response: z.void(),
  },
  {
    method: "get",
    path: "/health/ready",
    alias: "getHealthready",
    requestFormat: "json",
    response: z.void(),
  },
]);

export const api = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
