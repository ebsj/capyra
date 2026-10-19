CREATE TABLE brands (
 id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
 name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 160), time_zone TEXT NOT NULL,
 confirmed_at TEXT, status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','archiving','archived')),
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL, archived_at TEXT
);
CREATE INDEX ix_brands_account ON brands(account_id,status);
CREATE UNIQUE INDEX ux_account_owner ON account_users(account_id) WHERE role='owner';
CREATE TABLE account_entitlements (
 account_id TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
 cycle_anchor TEXT NOT NULL, subscription_status TEXT NOT NULL DEFAULT 'active' CHECK(subscription_status IN ('active','inactive')),
 brand_limit INTEGER NOT NULL DEFAULT 5 CHECK(brand_limit>=0), identity_limit INTEGER NOT NULL DEFAULT 15 CHECK(identity_limit>=0),
 operator_limit INTEGER NOT NULL DEFAULT 5 CHECK(operator_limit>=1), analysis_limit INTEGER NOT NULL DEFAULT 50 CHECK(analysis_limit>=0)
);
CREATE TRIGGER brand_quota_insert BEFORE INSERT ON brands WHEN NEW.status='active' AND EXISTS(SELECT 1 FROM account_entitlements WHERE account_id=NEW.account_id)
BEGIN SELECT CASE WHEN (SELECT COUNT(*) FROM brands WHERE account_id=NEW.account_id AND status IN ('active','archiving')) >= (SELECT brand_limit FROM account_entitlements WHERE account_id=NEW.account_id) THEN RAISE(ABORT,'brand_quota_exceeded') END; END;
CREATE TRIGGER brand_quota_restore BEFORE UPDATE OF status ON brands WHEN OLD.status='archived' AND NEW.status='active'
BEGIN SELECT CASE WHEN (SELECT COUNT(*) FROM brands WHERE account_id=NEW.account_id AND status IN ('active','archiving')) >= (SELECT brand_limit FROM account_entitlements WHERE account_id=NEW.account_id) THEN RAISE(ABORT,'brand_quota_exceeded') END; END;
CREATE TRIGGER member_quota_insert BEFORE INSERT ON account_users WHEN NEW.role='member'
BEGIN SELECT CASE WHEN (SELECT COUNT(*) FROM account_users WHERE account_id=NEW.account_id) >= (SELECT operator_limit FROM account_entitlements WHERE account_id=NEW.account_id) THEN RAISE(ABORT,'operator_quota_exceeded') END; END;
CREATE TABLE member_invitations (
 id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
 email TEXT NOT NULL, normalized_email TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE,
 status TEXT NOT NULL CHECK(status IN ('pending','accepted','revoked')), created_by TEXT NOT NULL,
 created_at TEXT NOT NULL, expires_at TEXT NOT NULL, accepted_at TEXT, accepted_user_id TEXT
);
CREATE INDEX ix_invitations_account ON member_invitations(account_id,created_at);
CREATE TABLE credit_lots (
 id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
 kind TEXT NOT NULL CHECK(kind IN ('included','purchased')), cycle_start TEXT, expires_at TEXT,
 granted INTEGER NOT NULL CHECK(granted>=0), remaining INTEGER NOT NULL CHECK(remaining>=0), created_at TEXT NOT NULL,
 UNIQUE(account_id,kind,cycle_start)
);
CREATE TABLE analysis_credit_reservations (
 analysis_id TEXT PRIMARY KEY REFERENCES video_analyses(id) ON DELETE CASCADE,
 account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
 lot_id TEXT NOT NULL REFERENCES credit_lots(id), state TEXT NOT NULL DEFAULT 'reserved' CHECK(state IN ('reserved','consumed','released')),
 created_at TEXT NOT NULL, settled_at TEXT
);
CREATE TABLE usage_ledger (
 id INTEGER PRIMARY KEY AUTOINCREMENT, account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
 lot_id TEXT, analysis_id TEXT, event TEXT NOT NULL CHECK(event IN ('granted','reserved','consumed','released','expired')),
 quantity INTEGER NOT NULL, created_at TEXT NOT NULL
);
CREATE TRIGGER credit_lot_granted AFTER INSERT ON credit_lots BEGIN
 INSERT INTO usage_ledger(account_id,lot_id,event,quantity,created_at) VALUES(NEW.account_id,NEW.id,'granted',NEW.granted,NEW.created_at);
END;
CREATE TRIGGER credit_reserve BEFORE INSERT ON analysis_credit_reservations BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM credit_lots l JOIN account_entitlements e ON e.account_id=l.account_id WHERE l.id=NEW.lot_id AND l.account_id=NEW.account_id AND l.remaining>0 AND (l.expires_at IS NULL OR l.expires_at>NEW.created_at) AND e.subscription_status='active') THEN RAISE(ABORT,'analysis_credit_exhausted') END;
 UPDATE credit_lots SET remaining=remaining-1 WHERE id=NEW.lot_id;
END;
CREATE TRIGGER credit_reserved AFTER INSERT ON analysis_credit_reservations BEGIN
 INSERT INTO usage_ledger(account_id,lot_id,analysis_id,event,quantity,created_at) VALUES(NEW.account_id,NEW.lot_id,NEW.analysis_id,'reserved',1,NEW.created_at);
END;
CREATE TRIGGER credit_settled AFTER UPDATE OF state ON analysis_credit_reservations WHEN OLD.state='reserved' AND NEW.state IN ('released','consumed') BEGIN
 UPDATE credit_lots SET remaining=remaining+1 WHERE id=NEW.lot_id AND NEW.state='released';
 INSERT INTO usage_ledger(account_id,lot_id,analysis_id,event,quantity,created_at) VALUES(NEW.account_id,NEW.lot_id,NEW.analysis_id,NEW.state,1,NEW.settled_at);
END;
CREATE TRIGGER analysis_credit_completed AFTER UPDATE OF status ON video_analyses WHEN NEW.status='completed' AND OLD.status='pending' BEGIN
 UPDATE analysis_credit_reservations SET state='consumed',settled_at=NEW.updated_at WHERE analysis_id=NEW.id AND state='reserved';
END;
CREATE TRIGGER analysis_credit_failed AFTER UPDATE OF status ON video_analyses WHEN NEW.status='failed' AND OLD.status='pending' BEGIN
 UPDATE analysis_credit_reservations SET state='released',settled_at=NEW.updated_at WHERE analysis_id=NEW.id AND state='reserved';
END;
CREATE TRIGGER analysis_credit_deleted AFTER UPDATE OF deleted_at ON video_analyses WHEN NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL AND OLD.status='pending' BEGIN
 UPDATE analysis_credit_reservations SET state='released',settled_at=NEW.updated_at WHERE analysis_id=NEW.id AND state='reserved';
END;
ALTER TABLE source_assets ADD COLUMN brand_id TEXT REFERENCES brands(id);
ALTER TABLE source_assets ADD COLUMN media_kind TEXT NOT NULL DEFAULT 'video' CHECK(media_kind IN ('video','image'));
ALTER TABLE source_assets ADD COLUMN metadata_status TEXT NOT NULL DEFAULT 'pending' CHECK(metadata_status IN ('pending','ready','failed'));
ALTER TABLE source_assets ADD COLUMN metadata_json TEXT;
ALTER TABLE source_assets ADD COLUMN variant_of_asset_id TEXT REFERENCES source_assets(id);
ALTER TABLE source_assets ADD COLUMN purge_after TEXT;
ALTER TABLE source_assets ADD COLUMN probe_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE source_assets ADD COLUMN probe_lease_expires_at TEXT;
ALTER TABLE video_analyses ADD COLUMN brand_id TEXT REFERENCES brands(id);
ALTER TABLE upload_sessions ADD COLUMN brand_id TEXT REFERENCES brands(id);
CREATE INDEX ix_assets_brand ON source_assets(account_id,brand_id,created_at);
CREATE INDEX ix_analyses_brand ON video_analyses(account_id,brand_id,created_at);
CREATE TABLE audit_events (
 id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
 actor_id TEXT NOT NULL, brand_id TEXT REFERENCES brands(id), action TEXT NOT NULL,
 resource_type TEXT NOT NULL, resource_id TEXT NOT NULL, correlation_id TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX ix_audit_account ON audit_events(account_id,created_at);
CREATE TABLE notifications (
 id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
 owner_id TEXT NOT NULL REFERENCES account_users(id) ON DELETE CASCADE, brand_id TEXT REFERENCES brands(id),
 code TEXT NOT NULL, message TEXT NOT NULL, resource_id TEXT, created_at TEXT NOT NULL, read_at TEXT
);
CREATE INDEX ix_notifications_owner ON notifications(account_id,owner_id,created_at);
INSERT INTO brands(id,account_id,name,time_zone,status,created_at,updated_at)
 SELECT lower(hex(randomblob(4)))||'-'||lower(hex(randomblob(2)))||'-4'||substr(lower(hex(randomblob(2))),2)||'-a'||substr(lower(hex(randomblob(2))),2)||'-'||lower(hex(randomblob(6))),id,display_name,'America/Recife','active',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now') FROM accounts;
INSERT INTO account_entitlements(account_id,cycle_anchor) SELECT id,strftime('%Y-%m-%dT%H:%M:%fZ','now') FROM accounts;
CREATE TRIGGER source_asset_brand_insert BEFORE INSERT ON source_assets WHEN NEW.brand_id IS NOT NULL BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM brands WHERE id=NEW.brand_id AND account_id=NEW.account_id AND status='active') THEN RAISE(ABORT,'brand_not_active') END;
 SELECT CASE WHEN NEW.variant_of_asset_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM source_assets WHERE id=NEW.variant_of_asset_id AND account_id=NEW.account_id AND brand_id=NEW.brand_id AND deleted_at IS NULL AND upload_status='completed') THEN RAISE(ABORT,'variant_source_not_found') END;
END;
CREATE TRIGGER source_asset_brand_update BEFORE UPDATE OF brand_id ON source_assets WHEN NEW.brand_id IS NOT OLD.brand_id BEGIN
 SELECT CASE WHEN OLD.brand_id IS NOT NULL OR NOT EXISTS(SELECT 1 FROM brands WHERE id=NEW.brand_id AND account_id=NEW.account_id AND status='active') THEN RAISE(ABORT,'asset_brand_conflict') END;
END;
CREATE TRIGGER analysis_brand_insert BEFORE INSERT ON video_analyses WHEN NEW.brand_id IS NOT NULL BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM brands WHERE id=NEW.brand_id AND account_id=NEW.account_id AND status='active') THEN RAISE(ABORT,'brand_not_active') END;
 SELECT CASE WHEN NEW.source_asset_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM source_assets WHERE id=NEW.source_asset_id AND account_id=NEW.account_id AND brand_id=NEW.brand_id AND deleted_at IS NULL AND upload_status='completed') THEN RAISE(ABORT,'asset_brand_conflict') END;
END;
CREATE TRIGGER analysis_brand_update BEFORE UPDATE OF brand_id ON video_analyses WHEN NEW.brand_id IS NOT OLD.brand_id BEGIN
 SELECT CASE WHEN OLD.brand_id IS NOT NULL OR NOT EXISTS(SELECT 1 FROM brands WHERE id=NEW.brand_id AND account_id=NEW.account_id AND status='active') THEN RAISE(ABORT,'analysis_brand_immutable') END;
 SELECT CASE WHEN NEW.source_asset_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM source_assets WHERE id=NEW.source_asset_id AND account_id=NEW.account_id AND brand_id=NEW.brand_id) THEN RAISE(ABORT,'asset_brand_conflict') END;
END;
CREATE TRIGGER source_asset_analysis_delete_guard BEFORE UPDATE OF deleted_at ON source_assets WHEN OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL BEGIN
 SELECT CASE WHEN EXISTS(SELECT 1 FROM video_analyses WHERE source_asset_id=OLD.id AND status='pending' AND deleted_at IS NULL) THEN RAISE(ABORT,'source_asset_in_use') END;
END;
