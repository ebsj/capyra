import { sql } from "drizzle-orm";
import * as socialSchema from "./social-schema";
export * from "./social-schema";
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex, type AnySQLiteColumn } from "drizzle-orm/sqlite-core";

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  accountType: text("account_type", { enum: ["agency", "creator", "team"] }).notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const accountUsers = sqliteTable("account_users", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  normalizedEmail: text("normalized_email").notNull(),
  passwordHash: text("password_hash"),
  firebaseUid: text("firebase_uid"),
  role: text("role", { enum: ["owner", "member"] }).notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  uniqueIndex("ux_account_users_normalized_email").on(table.normalizedEmail),
  uniqueIndex("ux_account_users_firebase_uid").on(table.firebaseUid),
  index("ix_account_users_account_id").on(table.accountId),
  uniqueIndex("ux_account_owner").on(table.accountId).where(sql`role = 'owner'`),
]);

export const sourceAssets = sqliteTable("source_assets", {
  brandId: text("brand_id").references((): AnySQLiteColumn => socialSchema.brands.id),
  mediaKind: text("media_kind", { enum: ["video", "image"] }).notNull().default("video"),
  metadataStatus: text("metadata_status", { enum: ["pending", "ready", "failed"] }).notNull().default("pending"),
  metadataJson: text("metadata_json"),
  variantOfAssetId: text("variant_of_asset_id").references((): AnySQLiteColumn => sourceAssets.id),
  purgeAfter: text("purge_after"),
  probeAttempts: integer("probe_attempts").notNull().default(0),
  probeLeaseExpiresAt: text("probe_lease_expires_at"),
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  sourceLabel: text("source_label").notNull(),
  contentType: text("content_type").notNull(),
  contentLength: integer("content_length").notNull(),
  objectKey: text("object_key").notNull(),
  uploadStatus: text("upload_status", { enum: ["pending", "completed", "expired"] }).notNull(),
  createdAt: text("created_at").notNull(),
  completedAt: text("completed_at"),
  deletedAt: text("deleted_at"),
}, (table) => [
  index("ix_source_assets_account_created").on(table.accountId, table.createdAt),
  index("ix_assets_brand").on(table.accountId, table.brandId, table.createdAt),
  uniqueIndex("ux_source_assets_object_key").on(table.objectKey),
]);

export const analyses = sqliteTable("video_analyses", {
  brandId: text("brand_id").references((): AnySQLiteColumn => socialSchema.brands.id),
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  sourceAssetId: text("source_asset_id").references(() => sourceAssets.id),
  status: text("status", { enum: ["pending", "completed", "failed"] }).notNull(),
  sourceType: text("source_type").notNull(),
  sourceLabel: text("source_label").notNull(),
  sourceUrl: text("source_url"),
  canonicalUrl: text("canonical_url"),
  platform: text("platform"),
  contentId: text("content_id"),
  language: text("language").notNull(),
  intent: text("intent"),
  catalogVersion: text("catalog_version").notNull(),
  selectedSkillIdsJson: text("selected_skill_ids_json").notNull(),
  executedSkillsJson: text("executed_skills_json").notNull().default("[]"),
  summary: text("summary").notNull().default(""),
  overallScore: integer("overall_score"),
  reportObjectKey: text("report_object_key"),
  artifactPrefix: text("artifact_prefix"),
  artifactFilesJson: text("artifact_files_json").notNull().default("[]"),
  errorMessage: text("error_message"),
  attempts: integer("attempts").notNull().default(0),
  leaseExpiresAt: text("lease_expires_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  completedAt: text("completed_at"),
  deletedAt: text("deleted_at"),
  purgeAfter: text("purge_after"),
}, (table) => [
  index("ix_video_analyses_account_created").on(table.accountId, table.createdAt),
  index("ix_analyses_brand").on(table.accountId, table.brandId, table.createdAt),
  index("ix_video_analyses_pending_lease").on(table.status, table.leaseExpiresAt),
  index("ix_video_analyses_purge_after").on(table.purgeAfter),
]);

export const feedbackReactions = sqliteTable("feedback_reactions", {
  id: text("id").primaryKey(),
  analysisId: text("analysis_id").notNull().references(() => analyses.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  accountUserId: text("account_user_id").notNull().references(() => accountUsers.id, { onDelete: "cascade" }),
  feedbackItemKey: text("feedback_item_key").notNull(),
  feedbackItemKind: text("feedback_item_kind").notNull(),
  skillId: text("skill_id").notNull(),
  itemIndex: integer("item_index").notNull(),
  titleSnapshot: text("title_snapshot").notNull(),
  actionSnapshot: text("action_snapshot"),
  rationaleSnapshot: text("rationale_snapshot"),
  reaction: text("reaction"),
  comment: text("comment"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  uniqueIndex("ux_feedback_reaction_item_user").on(table.analysisId, table.accountUserId, table.feedbackItemKey),
  index("ix_feedback_reactions_account_analysis").on(table.accountId, table.analysisId),
]);

export const uploadSessions = sqliteTable("upload_sessions", {
  brandId: text("brand_id").references((): AnySQLiteColumn => socialSchema.brands.id),
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  accountUserId: text("account_user_id").notNull().references(() => accountUsers.id, { onDelete: "cascade" }),
  clientId: text("client_id"),
  status: text("status", { enum: ["pending", "completed", "expired"] }).notNull(),
  sourceAssetId: text("source_asset_id").references(() => sourceAssets.id),
  createdAt: text("created_at").notNull(),
  expiresAt: text("expires_at").notNull(),
  completedAt: text("completed_at"),
}, (table) => [index("ix_upload_sessions_account_created").on(table.accountId, table.createdAt)]);

export const oauthAuthorizationCodes = sqliteTable("oauth_authorization_codes", {
  codeHash: text("code_hash").primaryKey(),
  clientId: text("client_id").notNull(),
  accountId: text("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  accountUserId: text("account_user_id").notNull().references(() => accountUsers.id, { onDelete: "cascade" }),
  redirectUri: text("redirect_uri").notNull(),
  codeChallenge: text("code_challenge").notNull(),
  scopes: text("scopes").notNull(),
  expiresAt: text("expires_at").notNull(),
  consumedAt: text("consumed_at"),
  createdAt: text("created_at").notNull(),
}, (table) => [index("ix_oauth_codes_expiry").on(table.expiresAt)]);

export const oauthDeviceCodes = sqliteTable("oauth_device_codes", {
  deviceCodeHash: text("device_code_hash").primaryKey(),
  userCode: text("user_code").notNull(),
  clientId: text("client_id").notNull(),
  scopes: text("scopes").notNull(),
  accountId: text("account_id").references(() => accounts.id, { onDelete: "cascade" }),
  accountUserId: text("account_user_id").references(() => accountUsers.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["pending", "authorized", "consumed", "denied"] }).notNull(),
  expiresAt: text("expires_at").notNull(),
  lastPolledAt: text("last_polled_at"),
  createdAt: text("created_at").notNull(),
}, (table) => [
  uniqueIndex("ux_oauth_device_user_code").on(table.userCode),
  index("ix_oauth_device_expiry").on(table.expiresAt),
]);

export const oauthRefreshTokens = sqliteTable("oauth_refresh_tokens", {
  tokenHash: text("token_hash").primaryKey(),
  familyId: text("family_id").notNull(),
  clientId: text("client_id").notNull(),
  accountId: text("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  accountUserId: text("account_user_id").notNull().references(() => accountUsers.id, { onDelete: "cascade" }),
  scopes: text("scopes").notNull(),
  expiresAt: text("expires_at").notNull(),
  consumedAt: text("consumed_at"),
  revokedAt: text("revoked_at"),
  createdAt: text("created_at").notNull(),
}, (table) => [
  index("ix_oauth_refresh_family").on(table.familyId),
  index("ix_oauth_refresh_expiry").on(table.expiresAt),
]);

export const schema = {
  ...socialSchema,
  accounts,
  accountUsers,
  sourceAssets,
  analyses,
  feedbackReactions,
  uploadSessions,
  oauthAuthorizationCodes,
  oauthDeviceCodes,
  oauthRefreshTokens,
};
