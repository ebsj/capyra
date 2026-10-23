// Column/constraint mirror of reviewed SQL migrations; triggers remain canonical in migrations.
import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real, index, uniqueIndex, primaryKey, check, type AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import { accounts, accountUsers, sourceAssets, analyses } from "./schema";

export const brands = sqliteTable("brands", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull().references((): AnySQLiteColumn => accounts.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  timeZone: text("time_zone").notNull(),
  confirmedAt: text("confirmed_at"),
  status: text("status").notNull().default(sql`'active'`),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  archivedAt: text("archived_at"),
}, (table) => [
  index("ix_brands_account").on(table.accountId, table.status),
  check("brands_check_1", sql`length(name) BETWEEN 1 AND 160`),
  check("brands_check_2", sql`status IN ('active','archiving','archived')`),
]);

export const accountEntitlements = sqliteTable("account_entitlements", {
  accountId: text("account_id").primaryKey().references((): AnySQLiteColumn => accounts.id, { onDelete: "cascade" }),
  cycleAnchor: text("cycle_anchor").notNull(),
  subscriptionStatus: text("subscription_status").notNull().default(sql`'active'`),
  brandLimit: integer("brand_limit").notNull().default(sql`5`),
  identityLimit: integer("identity_limit").notNull().default(sql`15`),
  operatorLimit: integer("operator_limit").notNull().default(sql`5`),
  analysisLimit: integer("analysis_limit").notNull().default(sql`50`),
}, (table) => [
  check("account_entitlements_check_1", sql`subscription_status IN ('active','inactive')`),
  check("account_entitlements_check_2", sql`brand_limit>=0`),
  check("account_entitlements_check_3", sql`identity_limit>=0`),
  check("account_entitlements_check_4", sql`operator_limit>=1`),
  check("account_entitlements_check_5", sql`analysis_limit>=0`),
]);

export const memberInvitations = sqliteTable("member_invitations", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull().references((): AnySQLiteColumn => accounts.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  normalizedEmail: text("normalized_email").notNull(),
  tokenHash: text("token_hash").notNull(),
  status: text("status").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
  expiresAt: text("expires_at").notNull(),
  acceptedAt: text("accepted_at"),
  acceptedUserId: text("accepted_user_id"),
}, (table) => [
  index("ix_invitations_account").on(table.accountId, table.createdAt),
  uniqueIndex("ux_member_invitations_token_hash").on(table.tokenHash),
  check("member_invitations_check_1", sql`status IN ('pending','accepted','revoked')`),
]);

export const creditLots = sqliteTable("credit_lots", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull().references((): AnySQLiteColumn => accounts.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  cycleStart: text("cycle_start"),
  expiresAt: text("expires_at"),
  granted: integer("granted").notNull(),
  remaining: integer("remaining").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [
  uniqueIndex("ux_credit_lots_account_id_kind_cycle_start").on(table.accountId, table.kind, table.cycleStart),
  check("credit_lots_check_1", sql`kind IN ('included','purchased')`),
  check("credit_lots_check_2", sql`granted>=0`),
  check("credit_lots_check_3", sql`remaining>=0`),
]);

export const analysisCreditReservations = sqliteTable("analysis_credit_reservations", {
  analysisId: text("analysis_id").primaryKey().references((): AnySQLiteColumn => analyses.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull().references((): AnySQLiteColumn => accounts.id, { onDelete: "cascade" }),
  lotId: text("lot_id").notNull().references((): AnySQLiteColumn => creditLots.id),
  state: text("state").notNull().default(sql`'reserved'`),
  createdAt: text("created_at").notNull(),
  settledAt: text("settled_at"),
}, (table) => [
  check("analysis_credit_reservations_check_1", sql`state IN ('reserved','consumed','released')`),
]);

export const usageLedger = sqliteTable("usage_ledger", {
  id: integer("id").primaryKey(),
  accountId: text("account_id").notNull().references((): AnySQLiteColumn => accounts.id, { onDelete: "cascade" }),
  lotId: text("lot_id"),
  analysisId: text("analysis_id"),
  event: text("event").notNull(),
  quantity: integer("quantity").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [
  check("usage_ledger_check_1", sql`event IN ('granted','reserved','consumed','released','expired')`),
]);

export const auditEvents = sqliteTable("audit_events", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull().references((): AnySQLiteColumn => accounts.id, { onDelete: "cascade" }),
  actorId: text("actor_id").notNull(),
  brandId: text("brand_id").references((): AnySQLiteColumn => brands.id),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id").notNull(),
  correlationId: text("correlation_id").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [
  index("ix_audit_account").on(table.accountId, table.createdAt),
]);

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull().references((): AnySQLiteColumn => accounts.id, { onDelete: "cascade" }),
  ownerId: text("owner_id").notNull().references((): AnySQLiteColumn => accountUsers.id, { onDelete: "cascade" }),
  brandId: text("brand_id").references((): AnySQLiteColumn => brands.id),
  code: text("code").notNull(),
  message: text("message").notNull(),
  resourceId: text("resource_id"),
  createdAt: text("created_at").notNull(),
  readAt: text("read_at"),
}, (table) => [
  index("ix_notifications_owner").on(table.accountId, table.ownerId, table.createdAt),
]);

export const socialProfiles = sqliteTable("social_profiles", {
  brandId: text("brand_id").primaryKey().references((): AnySQLiteColumn => brands.id),
  providerProfileId: text("provider_profile_id"),
  requestKey: text("request_key").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [
  uniqueIndex("ux_social_profiles_request_key").on(table.requestKey),
]);

export const socialAccounts = sqliteTable("social_accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull().references((): AnySQLiteColumn => accounts.id),
  brandId: text("brand_id").notNull().references((): AnySQLiteColumn => brands.id),
  platform: text("platform").notNull(),
  providerProfileId: text("provider_profile_id"),
  providerAccountId: text("provider_account_id"),
  nativeIdentityId: text("native_identity_id"),
  displayName: text("display_name").notNull().default(sql`''`),
  identityStatus: text("identity_status").notNull().default(sql`'unavailable'`),
  status: text("status").notNull().default(sql`'pending'`),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  index("social_accounts_owner").on(table.accountId, table.brandId),
  uniqueIndex("social_provider_account").on(table.providerAccountId).where(sql`provider_account_id IS NOT NULL`),
  uniqueIndex("social_native_identity").on(table.platform, table.nativeIdentityId).where(sql`status != 'disconnected' AND native_identity_id IS NOT NULL`),
  uniqueIndex("social_slot").on(table.brandId, table.platform).where(sql`status != 'disconnected'`),
  check("social_accounts_check_1", sql`platform IN ('instagram','tiktok','youtube','linkedin')`),
  check("social_accounts_check_2", sql`identity_status IN ('verified','unavailable')`),
  check("social_accounts_check_3", sql`status IN ('pending','active','requires_action','disconnecting','disconnected')`),
  check("social_accounts_check_4", sql`status != 'active' OR (native_identity_id IS NOT NULL AND identity_status = 'verified')`),
]);

export const socialAuthorizations = sqliteTable("social_authorizations", {
  id: text("id").primaryKey(),
  stateHash: text("state_hash").notNull(),
  accountId: text("account_id").notNull(),
  brandId: text("brand_id").notNull(),
  actorId: text("actor_id").notNull(),
  platform: text("platform").notNull(),
  socialAccountId: text("social_account_id").notNull().references((): AnySQLiteColumn => socialAccounts.id),
  expectedIdentity: text("expected_identity"),
  expiresAt: text("expires_at").notNull(),
  usedAt: text("used_at"),
  createdAt: text("created_at").notNull(),
}, (table) => [
  uniqueIndex("ux_social_authorizations_state_hash").on(table.stateHash),
]);

export const socialPublications = sqliteTable("social_publications", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull().references((): AnySQLiteColumn => accounts.id),
  brandId: text("brand_id").notNull().references((): AnySQLiteColumn => brands.id),
  title: text("title").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  index("social_publications_owner").on(table.accountId, table.brandId, table.id),
]);

export const socialDestinations = sqliteTable("social_destinations", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  brandId: text("brand_id").notNull(),
  publicationId: text("publication_id").notNull().references((): AnySQLiteColumn => socialPublications.id),
  socialAccountId: text("social_account_id").notNull().references((): AnySQLiteColumn => socialAccounts.id),
  platform: text("platform").notNull(),
  payloadJson: text("payload_json").notNull(),
  status: text("status").notNull().default(sql`'draft'`),
  currentVersionId: text("current_version_id"),
  scheduledAt: text("scheduled_at"),
  timeZone: text("time_zone"),
  localDateTime: text("local_date_time"),
  lastError: text("last_error"),
  leaseUntil: text("lease_until"),
  leaseToken: text("lease_token"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  index("social_destinations_jobs").on(table.status, table.scheduledAt, table.leaseUntil),
  index("social_destinations_owner").on(table.accountId, table.brandId, table.publicationId),
  check("social_destinations_check_1", sql`status IN ('draft','awaiting_handoff','submitting','scheduled','publishing','published','cancellation_requested','cancelled','unknown','failed')`),
]);

export const socialDestinationVersions = sqliteTable("social_destination_versions", {
  id: text("id").primaryKey(),
  destinationId: text("destination_id").notNull().references((): AnySQLiteColumn => socialDestinations.id),
  accountId: text("account_id").notNull(),
  payloadJson: text("payload_json").notNull(),
  scheduledAt: text("scheduled_at"),
  timeZone: text("time_zone"),
  localDateTime: text("local_date_time"),
  idempotencyKey: text("idempotency_key").notNull(),
  createdAt: text("created_at").notNull(),
});

export const socialDeliveryAttempts = sqliteTable("social_delivery_attempts", {
  id: text("id").primaryKey(),
  destinationId: text("destination_id").notNull().references((): AnySQLiteColumn => socialDestinations.id),
  versionId: text("version_id").notNull().references((): AnySQLiteColumn => socialDestinationVersions.id),
  accountId: text("account_id").notNull(),
  requestKey: text("request_key").notNull(),
  providerPostId: text("provider_post_id"),
  nativePostId: text("native_post_id"),
  publishedUrl: text("published_url"),
  transfersJson: text("transfers_json").notNull().default(sql`'{}'`),
  state: text("state").notNull().default(sql`'pending'`),
  errorCode: text("error_code"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  submittedAt: text("submitted_at"),
  retryAfter: text("retry_after"),
  retryCount: integer("retry_count").notNull().default(sql`0`),
}, (table) => [
  uniqueIndex("social_attempt_single_open").on(table.destinationId).where(sql`state IN ('pending','retry_pending','submitting')`),
  index("social_attempt_provider").on(table.providerPostId),
  index("social_attempt_native_post").on(table.nativePostId),
  index("social_attempt_destination").on(table.destinationId, table.createdAt),
  uniqueIndex("ux_social_delivery_attempts_request_key").on(table.requestKey),
]);

export const socialOperations = sqliteTable("social_operations", {
  accountId: text("account_id").notNull(),
  operationKey: text("operation_key").notNull(),
  resourceId: text("resource_id").notNull(),
  action: text("action").notNull(),
  requestHash: text("request_hash").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [
  primaryKey({ columns: [table.accountId, table.operationKey] }),
]);

export const socialWebhookInbox = sqliteTable("social_webhook_inbox", {
  id: text("id").primaryKey(),
  eventId: text("event_id").notNull(),
  bodyJson: text("body_json").notNull(),
  createdAt: text("created_at").notNull(),
  processedAt: text("processed_at"),
}, (table) => [
  uniqueIndex("ux_social_webhook_inbox_event_id").on(table.eventId),
]);

export const socialSyncJobs = sqliteTable("social_sync_jobs", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  socialAccountId: text("social_account_id").notNull().references((): AnySQLiteColumn => socialAccounts.id),
  kind: text("kind").notNull(),
  url: text("url"),
  fromDate: text("from_date").notNull(),
  toDate: text("to_date").notNull(),
  page: integer("page").notNull().default(sql`1`),
  state: text("state").notNull().default(sql`'pending'`),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  uniqueIndex("social_sync_pending").on(table.socialAccountId, table.kind).where(sql`state IN ('pending','running') AND kind='sync'`),
]);

export const externalPosts = sqliteTable("external_posts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  brandId: text("brand_id").notNull(),
  socialAccountId: text("social_account_id").notNull(),
  platform: text("platform").notNull(),
  nativeIdentityId: text("native_identity_id").notNull(),
  nativePostId: text("native_post_id").notNull(),
  providerPostId: text("provider_post_id"),
  url: text("url"),
  content: text("content").notNull().default(sql`''`),
  publishedAt: text("published_at").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [
  index("external_posts_owner").on(table.accountId, table.brandId, table.id),
  uniqueIndex("ux_external_posts_account_brand_native_post").on(table.accountId, table.brandId, table.platform, table.nativeIdentityId, table.nativePostId),
]);

export const metricSnapshots = sqliteTable("metric_snapshots", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  brandId: text("brand_id").notNull(),
  socialAccountId: text("social_account_id").notNull(),
  destinationId: text("destination_id"),
  externalPostId: text("external_post_id"),
  platform: text("platform").notNull(),
  metric: text("metric").notNull(),
  value: real("value"),
  availability: text("availability").notNull(),
  periodStart: text("period_start"),
  periodEnd: text("period_end"),
  observedAt: text("observed_at").notNull(),
  dataThrough: text("data_through"),
  source: text("source").notNull(),
}, (table) => [
  index("social_metrics_owner").on(table.accountId, table.brandId, table.id),
]);

export const socialIdentityUsage = sqliteTable("social_identity_usage", {
  accountId: text("account_id").notNull(),
  cycleStart: text("cycle_start").notNull(),
  platform: text("platform").notNull(),
  nativeIdentityId: text("native_identity_id").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [
  primaryKey({ columns: [table.accountId, table.cycleStart, table.platform, table.nativeIdentityId] }),
]);

export const socialAccountDays = sqliteTable("social_account_days", {
  accountId: text("account_id").notNull(),
  socialAccountId: text("social_account_id").notNull(),
  day: text("day").notNull(),
}, (table) => [
  primaryKey({ columns: [table.accountId, table.socialAccountId, table.day] }),
]);

export const socialMockPosts = sqliteTable("social_mock_posts", {
  id: text("id").primaryKey(),
  requestKey: text("request_key").notNull(),
  bodyJson: text("body_json").notNull(),
  status: text("status").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [
  uniqueIndex("ux_social_mock_posts_request_key").on(table.requestKey),
]);

export const socialProvisioningOperations = sqliteTable("social_provisioning_operations", {
  idempotencyKey: text("idempotency_key").primaryKey(),
  accountId: text("account_id").notNull().references((): AnySQLiteColumn => accountEntitlements.accountId),
  addBrands: integer("add_brands").notNull().default(sql`0`),
  analysisPacks: integer("analysis_packs").notNull().default(sql`0`),
  subscriptionStatus: text("subscription_status"),
  reason: text("reason").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [
  check("social_provisioning_operations_check_1", sql`add_brands >= 0 AND add_brands <= 1000`),
  check("social_provisioning_operations_check_2", sql`analysis_packs >= 0 AND analysis_packs <= 1000`),
  check("social_provisioning_operations_check_3", sql`subscription_status IN ('active','inactive')`),
  check("social_provisioning_operations_check_4", sql`length(reason) BETWEEN 1 AND 500`),
]);
