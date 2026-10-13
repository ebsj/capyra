PRAGMA foreign_keys = ON;

CREATE TABLE accounts (
  id TEXT PRIMARY KEY NOT NULL,
  display_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK(account_type IN ('agency','creator','team')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE account_users (
  id TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  normalized_email TEXT NOT NULL,
  password_hash TEXT,
  firebase_uid TEXT,
  role TEXT NOT NULL CHECK(role IN ('owner','member')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX ux_account_users_normalized_email ON account_users(normalized_email);
CREATE UNIQUE INDEX ux_account_users_firebase_uid ON account_users(firebase_uid) WHERE firebase_uid IS NOT NULL;
CREATE INDEX ix_account_users_account_id ON account_users(account_id);

CREATE TABLE source_assets (
  id TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  source_label TEXT NOT NULL,
  content_type TEXT NOT NULL,
  content_length INTEGER NOT NULL CHECK(content_length > 0 AND content_length <= 209715200),
  object_key TEXT NOT NULL UNIQUE,
  upload_status TEXT NOT NULL CHECK(upload_status IN ('pending','completed','expired')),
  created_at TEXT NOT NULL,
  completed_at TEXT,
  deleted_at TEXT
);
CREATE INDEX ix_source_assets_account_created ON source_assets(account_id, created_at DESC);

CREATE TABLE video_analyses (
  id TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  source_asset_id TEXT REFERENCES source_assets(id),
  status TEXT NOT NULL CHECK(status IN ('pending','completed','failed')),
  source_type TEXT NOT NULL,
  source_label TEXT NOT NULL,
  source_url TEXT,
  canonical_url TEXT,
  platform TEXT,
  content_id TEXT,
  language TEXT NOT NULL,
  intent TEXT,
  catalog_version TEXT NOT NULL,
  selected_skill_ids_json TEXT NOT NULL,
  executed_skills_json TEXT NOT NULL DEFAULT '[]',
  summary TEXT NOT NULL DEFAULT '',
  overall_score INTEGER,
  report_object_key TEXT,
  artifact_prefix TEXT,
  artifact_files_json TEXT NOT NULL DEFAULT '[]',
  error_message TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  lease_expires_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  deleted_at TEXT,
  purge_after TEXT
);
CREATE INDEX ix_video_analyses_account_created ON video_analyses(account_id, created_at DESC);
CREATE INDEX ix_video_analyses_pending_lease ON video_analyses(status, lease_expires_at);
CREATE INDEX ix_video_analyses_purge_after ON video_analyses(purge_after);

CREATE TABLE feedback_reactions (
  id TEXT PRIMARY KEY NOT NULL,
  analysis_id TEXT NOT NULL REFERENCES video_analyses(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  account_user_id TEXT NOT NULL REFERENCES account_users(id) ON DELETE CASCADE,
  feedback_item_key TEXT NOT NULL,
  feedback_item_kind TEXT NOT NULL,
  skill_id TEXT NOT NULL,
  item_index INTEGER NOT NULL,
  title_snapshot TEXT NOT NULL,
  action_snapshot TEXT,
  rationale_snapshot TEXT,
  reaction TEXT CHECK(reaction IS NULL OR reaction IN ('positive','negative')),
  comment TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(analysis_id, account_user_id, feedback_item_key)
);
CREATE INDEX ix_feedback_reactions_account_analysis ON feedback_reactions(account_id, analysis_id);

CREATE TABLE upload_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  account_user_id TEXT NOT NULL REFERENCES account_users(id) ON DELETE CASCADE,
  client_id TEXT,
  status TEXT NOT NULL CHECK(status IN ('pending','completed','expired')),
  source_asset_id TEXT REFERENCES source_assets(id),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  completed_at TEXT
);
CREATE INDEX ix_upload_sessions_account_created ON upload_sessions(account_id, created_at DESC);

CREATE TABLE oauth_authorization_codes (
  code_hash TEXT PRIMARY KEY NOT NULL,
  client_id TEXT NOT NULL,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  account_user_id TEXT NOT NULL REFERENCES account_users(id) ON DELETE CASCADE,
  redirect_uri TEXT NOT NULL,
  code_challenge TEXT NOT NULL,
  scopes TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX ix_oauth_codes_expiry ON oauth_authorization_codes(expires_at);

CREATE TABLE oauth_device_codes (
  device_code_hash TEXT PRIMARY KEY NOT NULL,
  user_code TEXT NOT NULL UNIQUE,
  client_id TEXT NOT NULL,
  scopes TEXT NOT NULL,
  account_id TEXT REFERENCES accounts(id) ON DELETE CASCADE,
  account_user_id TEXT REFERENCES account_users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK(status IN ('pending','authorized','consumed','denied')),
  expires_at TEXT NOT NULL,
  last_polled_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX ix_oauth_device_expiry ON oauth_device_codes(expires_at);

CREATE TABLE oauth_refresh_tokens (
  token_hash TEXT PRIMARY KEY NOT NULL,
  family_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  account_user_id TEXT NOT NULL REFERENCES account_users(id) ON DELETE CASCADE,
  scopes TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  revoked_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX ix_oauth_refresh_family ON oauth_refresh_tokens(family_id);
CREATE INDEX ix_oauth_refresh_expiry ON oauth_refresh_tokens(expires_at);
