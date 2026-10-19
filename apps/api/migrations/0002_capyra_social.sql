CREATE TABLE social_profiles (brand_id TEXT PRIMARY KEY REFERENCES brands(id), provider_profile_id TEXT, request_key TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL);
CREATE TABLE social_accounts (
 id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id), brand_id TEXT NOT NULL REFERENCES brands(id),
 platform TEXT NOT NULL CHECK(platform IN ('instagram','tiktok','youtube')), provider_profile_id TEXT, provider_account_id TEXT,
 native_identity_id TEXT, display_name TEXT NOT NULL DEFAULT '', identity_status TEXT NOT NULL DEFAULT 'unavailable' CHECK(identity_status IN ('verified','unavailable')),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','requires_action','disconnecting','disconnected')),
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL, CHECK(status != 'active' OR (native_identity_id IS NOT NULL AND identity_status = 'verified'))
);
CREATE UNIQUE INDEX social_slot ON social_accounts(brand_id,platform) WHERE status != 'disconnected';
CREATE UNIQUE INDEX social_native_identity ON social_accounts(platform,native_identity_id) WHERE status != 'disconnected' AND native_identity_id IS NOT NULL;
CREATE UNIQUE INDEX social_provider_account ON social_accounts(provider_account_id) WHERE provider_account_id IS NOT NULL;
CREATE INDEX social_accounts_owner ON social_accounts(account_id,brand_id);
CREATE TABLE social_authorizations (id TEXT PRIMARY KEY,state_hash TEXT NOT NULL UNIQUE,account_id TEXT NOT NULL,brand_id TEXT NOT NULL,actor_id TEXT NOT NULL,platform TEXT NOT NULL,social_account_id TEXT NOT NULL REFERENCES social_accounts(id),expected_identity TEXT,expires_at TEXT NOT NULL,used_at TEXT,created_at TEXT NOT NULL);
CREATE TABLE social_publications (id TEXT PRIMARY KEY,account_id TEXT NOT NULL REFERENCES accounts(id),brand_id TEXT NOT NULL REFERENCES brands(id),title TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE INDEX social_publications_owner ON social_publications(account_id,brand_id,id);
CREATE TABLE social_destinations (id TEXT PRIMARY KEY,account_id TEXT NOT NULL,brand_id TEXT NOT NULL,publication_id TEXT NOT NULL REFERENCES social_publications(id),social_account_id TEXT NOT NULL REFERENCES social_accounts(id),platform TEXT NOT NULL,payload_json TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','awaiting_handoff','submitting','scheduled','publishing','published','cancellation_requested','cancelled','unknown','failed')),current_version_id TEXT,scheduled_at TEXT,time_zone TEXT,local_date_time TEXT,last_error TEXT,lease_until TEXT,lease_token TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE INDEX social_destinations_owner ON social_destinations(account_id,brand_id,publication_id);
CREATE INDEX social_destinations_jobs ON social_destinations(status,scheduled_at,lease_until);
CREATE TABLE social_destination_versions (id TEXT PRIMARY KEY,destination_id TEXT NOT NULL REFERENCES social_destinations(id),account_id TEXT NOT NULL,payload_json TEXT NOT NULL,scheduled_at TEXT,time_zone TEXT,local_date_time TEXT,idempotency_key TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TRIGGER social_versions_immutable BEFORE UPDATE ON social_destination_versions BEGIN SELECT RAISE(ABORT,'immutable_destination_version'); END;
CREATE TABLE social_delivery_attempts (id TEXT PRIMARY KEY,destination_id TEXT NOT NULL REFERENCES social_destinations(id),version_id TEXT NOT NULL REFERENCES social_destination_versions(id),account_id TEXT NOT NULL,request_key TEXT NOT NULL UNIQUE,provider_post_id TEXT,transfers_json TEXT NOT NULL DEFAULT '{}',state TEXT NOT NULL DEFAULT 'pending',error_code TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,submitted_at TEXT,retry_after TEXT,retry_count INTEGER NOT NULL DEFAULT 0);
CREATE INDEX social_attempt_destination ON social_delivery_attempts(destination_id,created_at);
CREATE INDEX social_attempt_provider ON social_delivery_attempts(provider_post_id);
CREATE TABLE social_operations (account_id TEXT NOT NULL,operation_key TEXT NOT NULL,resource_id TEXT NOT NULL,action TEXT NOT NULL,request_hash TEXT NOT NULL,created_at TEXT NOT NULL,PRIMARY KEY(account_id,operation_key));
CREATE TABLE social_webhook_inbox (id TEXT PRIMARY KEY,event_id TEXT NOT NULL UNIQUE,body_json TEXT NOT NULL,created_at TEXT NOT NULL,processed_at TEXT);
CREATE TABLE social_sync_jobs (id TEXT PRIMARY KEY,account_id TEXT NOT NULL,social_account_id TEXT NOT NULL REFERENCES social_accounts(id),kind TEXT NOT NULL,url TEXT,from_date TEXT NOT NULL,to_date TEXT NOT NULL,page INTEGER NOT NULL DEFAULT 1,state TEXT NOT NULL DEFAULT 'pending',created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE UNIQUE INDEX social_sync_pending ON social_sync_jobs(social_account_id,kind) WHERE state IN ('pending','running') AND kind='sync';
CREATE TABLE external_posts (id TEXT PRIMARY KEY,account_id TEXT NOT NULL,brand_id TEXT NOT NULL,social_account_id TEXT NOT NULL,platform TEXT NOT NULL,native_identity_id TEXT NOT NULL,native_post_id TEXT NOT NULL,provider_post_id TEXT,url TEXT,content TEXT NOT NULL DEFAULT '',published_at TEXT NOT NULL,created_at TEXT NOT NULL,UNIQUE(platform,native_identity_id,native_post_id));
CREATE INDEX external_posts_owner ON external_posts(account_id,brand_id,id);
CREATE TABLE metric_snapshots (id TEXT PRIMARY KEY,account_id TEXT NOT NULL,brand_id TEXT NOT NULL,social_account_id TEXT NOT NULL,destination_id TEXT,external_post_id TEXT,platform TEXT NOT NULL,metric TEXT NOT NULL,value REAL,availability TEXT NOT NULL,period_start TEXT,period_end TEXT,observed_at TEXT NOT NULL,data_through TEXT,source TEXT NOT NULL);
CREATE INDEX social_metrics_owner ON metric_snapshots(account_id,brand_id,id);
CREATE TABLE social_identity_usage (account_id TEXT NOT NULL,cycle_start TEXT NOT NULL,platform TEXT NOT NULL,native_identity_id TEXT NOT NULL,created_at TEXT NOT NULL,PRIMARY KEY(account_id,cycle_start,platform,native_identity_id));
CREATE TRIGGER social_identity_quota BEFORE INSERT ON social_identity_usage WHEN NOT EXISTS(SELECT 1 FROM social_identity_usage WHERE account_id=NEW.account_id AND cycle_start=NEW.cycle_start AND platform=NEW.platform AND native_identity_id=NEW.native_identity_id) BEGIN
 SELECT CASE WHEN (SELECT COUNT(*) FROM social_identity_usage WHERE account_id=NEW.account_id AND cycle_start=NEW.cycle_start) >= COALESCE((SELECT identity_limit FROM account_entitlements WHERE account_id=NEW.account_id AND subscription_status='active'),0) THEN RAISE(ABORT,'social_identity_quota') END;
END;
CREATE TABLE social_account_days (account_id TEXT NOT NULL,social_account_id TEXT NOT NULL,day TEXT NOT NULL,PRIMARY KEY(account_id,social_account_id,day));
CREATE TABLE social_mock_posts (id TEXT PRIMARY KEY,request_key TEXT NOT NULL UNIQUE,body_json TEXT NOT NULL,status TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TRIGGER social_version_draft_guard BEFORE INSERT ON social_destination_versions BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM social_destinations WHERE id=NEW.destination_id AND account_id=NEW.account_id AND status IN ('draft','cancelled') AND payload_json=NEW.payload_json) THEN RAISE(ABORT,'destination_state_conflict') END;
END;
CREATE UNIQUE INDEX social_attempt_single_open ON social_delivery_attempts(destination_id) WHERE state IN ('pending','retry_pending','submitting');
CREATE TRIGGER social_destination_assets_insert BEFORE INSERT ON social_destinations BEGIN
 SELECT CASE WHEN EXISTS(SELECT 1 FROM json_each(NEW.payload_json,'$.mediaAssetIds') m WHERE NOT EXISTS(SELECT 1 FROM source_assets s WHERE s.id=m.value AND s.account_id=NEW.account_id AND s.brand_id=NEW.brand_id AND s.deleted_at IS NULL AND s.upload_status='completed')) THEN RAISE(ABORT,'social_asset_invalid') END;
 SELECT CASE WHEN json_extract(NEW.payload_json,'$.coverAssetId') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM source_assets s WHERE s.id=json_extract(NEW.payload_json,'$.coverAssetId') AND s.account_id=NEW.account_id AND s.brand_id=NEW.brand_id AND s.deleted_at IS NULL AND s.upload_status='completed') THEN RAISE(ABORT,'social_asset_invalid') END;
END;
CREATE TRIGGER social_destination_assets_update BEFORE UPDATE OF payload_json ON social_destinations BEGIN
 SELECT CASE WHEN EXISTS(SELECT 1 FROM json_each(NEW.payload_json,'$.mediaAssetIds') m WHERE NOT EXISTS(SELECT 1 FROM source_assets s WHERE s.id=m.value AND s.account_id=NEW.account_id AND s.brand_id=NEW.brand_id AND s.deleted_at IS NULL AND s.upload_status='completed')) THEN RAISE(ABORT,'social_asset_invalid') END;
 SELECT CASE WHEN json_extract(NEW.payload_json,'$.coverAssetId') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM source_assets s WHERE s.id=json_extract(NEW.payload_json,'$.coverAssetId') AND s.account_id=NEW.account_id AND s.brand_id=NEW.brand_id AND s.deleted_at IS NULL AND s.upload_status='completed') THEN RAISE(ABORT,'social_asset_invalid') END;
END;
CREATE TRIGGER social_asset_delete_guard BEFORE UPDATE OF deleted_at ON source_assets WHEN OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL BEGIN
 SELECT CASE WHEN EXISTS(SELECT 1 FROM social_destinations d WHERE d.account_id=OLD.account_id AND d.status NOT IN ('published','cancelled','failed') AND (json_extract(d.payload_json,'$.coverAssetId')=OLD.id OR EXISTS(SELECT 1 FROM json_each(d.payload_json,'$.mediaAssetIds') m WHERE m.value=OLD.id))) THEN RAISE(ABORT,'source_asset_in_use') END;
END;
