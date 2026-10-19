ALTER TABLE social_delivery_attempts ADD COLUMN native_post_id TEXT;
ALTER TABLE social_delivery_attempts ADD COLUMN published_url TEXT;
CREATE INDEX social_attempt_native_post ON social_delivery_attempts(native_post_id);
