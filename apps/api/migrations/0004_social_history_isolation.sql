-- A disconnected native identity can later belong to another account/brand.
-- Historical external posts remain permanently scoped to the original tenant.
CREATE TABLE external_posts_scoped (id TEXT PRIMARY KEY,account_id TEXT NOT NULL,brand_id TEXT NOT NULL,social_account_id TEXT NOT NULL,platform TEXT NOT NULL,native_identity_id TEXT NOT NULL,native_post_id TEXT NOT NULL,provider_post_id TEXT,url TEXT,content TEXT NOT NULL DEFAULT '',published_at TEXT NOT NULL,created_at TEXT NOT NULL,UNIQUE(account_id,brand_id,platform,native_identity_id,native_post_id));
INSERT INTO external_posts_scoped SELECT * FROM external_posts;
DROP TABLE external_posts;
ALTER TABLE external_posts_scoped RENAME TO external_posts;
CREATE INDEX external_posts_owner ON external_posts(account_id,brand_id,id);
CREATE TRIGGER IF NOT EXISTS social_asset_delete_guard BEFORE UPDATE OF deleted_at ON source_assets WHEN OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL BEGIN
 SELECT CASE WHEN EXISTS(SELECT 1 FROM social_destinations d WHERE d.account_id=OLD.account_id AND d.status NOT IN ('published','cancelled','failed') AND (json_extract(d.payload_json,'$.coverAssetId')=OLD.id OR EXISTS(SELECT 1 FROM json_each(d.payload_json,'$.mediaAssetIds') m WHERE m.value=OLD.id))) THEN RAISE(ABORT,'source_asset_in_use') END;
END;
