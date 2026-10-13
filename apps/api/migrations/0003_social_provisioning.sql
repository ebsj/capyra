-- Local/manual provision requests are atomic and replay-safe. No customer API grants credits.
CREATE TABLE social_provisioning_operations (
 idempotency_key TEXT PRIMARY KEY,
 account_id TEXT NOT NULL REFERENCES account_entitlements(account_id),
 add_brands INTEGER NOT NULL DEFAULT 0 CHECK(add_brands >= 0 AND add_brands <= 1000),
 analysis_packs INTEGER NOT NULL DEFAULT 0 CHECK(analysis_packs >= 0 AND analysis_packs <= 1000),
 subscription_status TEXT CHECK(subscription_status IN ('active','inactive')),
 reason TEXT NOT NULL CHECK(length(reason) BETWEEN 1 AND 500),
 created_at TEXT NOT NULL
);
CREATE TRIGGER social_provision_replay BEFORE INSERT ON social_provisioning_operations
WHEN EXISTS(SELECT 1 FROM social_provisioning_operations WHERE idempotency_key=NEW.idempotency_key AND
 (account_id!=NEW.account_id OR add_brands!=NEW.add_brands OR analysis_packs!=NEW.analysis_packs
 OR subscription_status IS NOT NEW.subscription_status OR reason!=NEW.reason))
BEGIN SELECT RAISE(ABORT,'provisioning_idempotency_conflict'); END;
CREATE TRIGGER social_provision_apply AFTER INSERT ON social_provisioning_operations BEGIN
 UPDATE account_entitlements SET brand_limit=brand_limit+NEW.add_brands,
 identity_limit=identity_limit+NEW.add_brands*3,
 subscription_status=COALESCE(NEW.subscription_status,subscription_status)
 WHERE account_id=NEW.account_id;
 INSERT INTO credit_lots(id,account_id,kind,cycle_start,expires_at,granted,remaining,created_at)
 SELECT 'provision:'||NEW.idempotency_key,NEW.account_id,'purchased',NULL,NULL,
 NEW.analysis_packs*50,NEW.analysis_packs*50,NEW.created_at WHERE NEW.analysis_packs>0;
 INSERT INTO audit_events(id,account_id,actor_id,brand_id,action,resource_type,resource_id,correlation_id,created_at)
 VALUES('provision:'||NEW.idempotency_key,NEW.account_id,'operator',NULL,'usage.provisioned','account',NEW.account_id,NEW.idempotency_key,NEW.created_at);
END;
