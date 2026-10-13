# Interface agreement — Capyra Social

Canonical HTTP schemas live in `contracts/openapi/capyra-api.v1.yaml`; this document fixes module ownership and the initial contract for concurrent implementation. All routes below are under `/api/v1`, authenticated unless explicitly stated. IDs are Capyra UUIDs. Date-times are ISO UTC; local scheduling uses an offset-free localDateTime plus the Brand IANA timeZone.

## Shared foundations

`apps/api/src/foundations.ts` exports:
- `ensureAccountFoundations(env, accountId): Promise<void>` — idempotent Brand and pilot entitlement creation (also after auth account creation).
- `requireActiveBrand(env, accountId, brandId, options?: { confirmed?: boolean }): Promise<BrandRow>` — requires valid nonempty UUID, same account, active; optionally confirmed.
- `requireOwner(principal): void`.
- `recordAudit(env, principal, action, resourceType, resourceId, brandId?: string | null): Promise<void>`.
- `notifyOwners(env, accountId, brandId, code, message, resourceId?): Promise<void>` — sanitized internal notifications.

BrandRow SQL columns: id, account_id, name, time_zone, confirmed_at, status(active|archiving|archived), created_at, updated_at, archived_at. Frontend representation: id, name, timeZone, confirmedAt(nullable), status, createdAt, archivedAt(nullable).

Foundation routes module `routes/foundations.ts`, mounted `/api/v1`; owner-only brand creation/update/archive/restore and members administration. `GET /brands` => `{items: Brand[]}`; `POST /brands` `{name,timeZone}` => Brand; `PATCH /brands/:id` `{name?,timeZone?,confirmed?:boolean}` => Brand. `POST /brands/:id/archive|restore` => Brand (archive may return 202 with archiving).

`GET /members` => `{items:[{id,name,email,role,createdAt}]}`; `DELETE /members/:id` => 204. `GET /member-invitations` => `{items:[{id,email,expiresAt,status}]}`; `POST /member-invitations` `{email}` => `{id,email,expiresAt,inviteUrl}`; `DELETE /member-invitations/:id` => 204. Firebase sign-in accepts optional invitationToken BEFORE account creation; authenticated acceptance `POST /member-invitations/accept` `{token}` for matching existing membership scenarios only.

`GET /usage` => `{cycleStart,cycleEnd,subscriptionStatus,limits:{brands,socialIdentities,operators,analyses},usage:{brands,socialIdentities,operators,analyses,reservedAnalyses},credits:{includedRemaining,purchasedRemaining}}`.
`GET /notifications` => `{items:[{id,code,message,brandId,resourceId,createdAt,readAt}],nextCursor?}`; `POST /notifications/:id/read` => 204.
`GET /audit-events` => `{items:[{id,action,actorId,brandId,resourceType,resourceId,createdAt,correlationId}],nextCursor?}`, owner only.

All new upload/create analysis inputs require brandId. Asset output extends current with brandId(nullable legacy), mediaKind(video|image), metadataStatus(pending|ready|failed), metadata nullable `{width,height,durationSeconds?,codec?,format?}`, variantOfAssetId nullable. `GET /source-assets/:id/content` streams private media. `DELETE /source-assets/:id` schedules expiry subject to open destination block. `PATCH /analyses/:id/brand` `{brandId}` assigns a legacy analysis and compatible legacy source, never changes a non-legacy analysis's Brand.

## Social

Provider/public enums use instagram|tiktok|youtube. Social implementation owns `src/social/*`, `routes/social.ts`, migration `0002_capyra_social.sql`, tests `test/social*.test.ts`. It supplies route contract fragment to root for canonical integration.

SocialAccount public shape: `{id,brandId,platform,displayName,status,identityStatus,createdAt}` with status pending|active|requires_action|disconnecting|disconnected and identityStatus verified|unavailable. No provider IDs exposed.
`GET /brands/:brandId/social-connections` => `{items:SocialAccount[]}`.
`POST /brands/:brandId/social-connections` `{platform,reconnectAccountId?}` => `{id,authorizationUrl,expiresAt}`. Explicit local mock can return Capyra callback URL. `GET /social-connections/callback` is unauthenticated but validates one-use session, actor association, and provider data; redirects to brand connections.
`POST /social-connections/:id/disconnect` => SocialAccount (202 while pending).
`GET /social-connections/:id/capabilities` => `{platform,formats,limits,privacyLevels?,identityStatus}`.

`GET /social-publications?brandId=&cursor=&limit=` => `{items:Publication[],nextCursor?}`; `POST /social-publications` `{brandId,title}` => Publication. `GET /social-publications/:id` => Publication. Publication `{id,brandId,title,status,createdAt,updatedAt,destinations:Destination[]}`.
`POST /social-publications/:id/destinations` and `PATCH /social-publications/:id/destinations/:destinationId` accept `{socialAccountId,format,content,title?,description?,mediaAssetIds,coverAssetId?,analysisId?,settings}`. Settings are platform-specific validated properties; TikTok requires privacyLevel, previewConfirmed and expressConsentGiven at submission. Draft may be incomplete, submission may not.
Destination `{id,publicationId,socialAccountId,platform,format,content,title?,description?,mediaAssetIds,coverAssetId?,analysisId?,settings,status,scheduledAt?,timeZone?,localDateTime?,lastError?,versions?,attempts?}`.
Destination states: draft|awaiting_handoff|submitting|scheduled|publishing|published|cancellation_requested|cancelled|unknown|failed.
`POST /social-publications/:id/destinations/:destinationId/preflight` => `{valid,issues:[{field,code,message}],capabilities}`.
`POST /social-publications/:id/destinations/:destinationId/submit` `{publishNow:boolean,localDateTime?:string}` with Idempotency-Key => Destination; API derives timeZone from Brand.
`POST .../:destinationId/cancel|retry` with Idempotency-Key => Destination. Retry eligible failed only; cancel external must be confirmed, no unpublish.

`GET /external-posts?brandId=&cursor=&limit=` => `{items:[{id,brandId,socialAccountId,platform,nativePostId,url,content,publishedAt}],nextCursor?}`.
`POST /external-posts/import` `{socialAccountId,url}` => 202 `{status:'pending'}`.
`POST /social-connections/:id/sync` => 202 `{status:'pending'}`.
`GET /social-metrics?brandId=&socialAccountId=&destinationId=&metric=&cursor=&limit=` => `{items:[{id,brandId,socialAccountId,destinationId?,externalPostId?,platform,metric,value:null|number,availability,periodStart?,periodEnd?,observedAt,dataThrough?,source}],nextCursor?}`.
`POST /social-webhooks/zernio` unauthenticated bearer but mandatory HMAC raw-body signature; durable inbox then queued processing, response <5 seconds.

Social exports `consumeSocialMessage(env,message)`, `markSocialDlqFailure(env,message)`, `reconcileSocial(env)`, `syncSocialMetrics(env)`, `cancelBrandDestinations(env,accountId,brandId): Promise<boolean>`, `disconnectBrandAccounts(env,accountId,brandId): Promise<boolean>`. Foundation archive invokes these sequentially; circular dependencies avoided by social reading foundations helper only, archive route imports lifecycle social helpers.
Queue binding SOCIAL_QUEUE; queue names capyra-social and capyra-social-dlq. Discriminated payload `{kind:'destination'|'webhook'|'sync'|'import'|'probe',id:string}`; media probe dispatcher belongs foundation, root routes probe messages to foundation handler.

## Parallel ownership

Foundation agent owns migration 0001, foundations helper/routes, auth integration, assets/analyses/processor and Python probe, foundation tests. Social agent owns migration 0002, social routes/modules/tests. Web agent owns apps/web and tests/web. Root owns canonical OpenAPI/generated contracts, db/schema.ts coordination, index.ts runtime dispatch, Wrangler/runtime bindings, CLI/MCP/integration-core, scripts and cross-cutting docs/verification. Agents must not edit root-owned files; request interface changes by message. Auth/ledger and social processes use D1 constraints, conditional statements and atomic batches, never check-then-insert as sole concurrency protection.
