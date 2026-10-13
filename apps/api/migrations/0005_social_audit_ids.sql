-- Provisioning audit IDs must participate in UUID cursor pagination.
UPDATE audit_events SET id=substr(id,11) WHERE action='usage.provisioned' AND id LIKE 'provision:%';
DROP TRIGGER social_provision_apply;
CREATE TRIGGER social_provision_apply AFTER INSERT ON social_provisioning_operations BEGIN
 UPDATE account_entitlements SET brand_limit=brand_limit+NEW.add_brands,
 identity_limit=identity_limit+NEW.add_brands*3,
 subscription_status=COALESCE(NEW.subscription_status,subscription_status)
 WHERE account_id=NEW.account_id;
 INSERT INTO credit_lots(id,account_id,kind,cycle_start,expires_at,granted,remaining,created_at)
 SELECT 'provision:'||NEW.idempotency_key,NEW.account_id,'purchased',NULL,NULL,
 NEW.analysis_packs*50,NEW.analysis_packs*50,NEW.created_at WHERE NEW.analysis_packs>0;
 INSERT INTO audit_events(id,account_id,actor_id,brand_id,action,resource_type,resource_id,correlation_id,created_at)
 VALUES(NEW.idempotency_key,NEW.account_id,'operator',NULL,'usage.provisioned','account',NEW.account_id,NEW.idempotency_key,NEW.created_at);
END;
