-- Add LinkedIn while retaining existing accounts and referencing history.
PRAGMA defer_foreign_keys = ON;
CREATE TABLE social_accounts_linkedin (
 id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id), brand_id TEXT NOT NULL REFERENCES brands(id),
 platform TEXT NOT NULL CHECK(platform IN ('instagram','tiktok','youtube','linkedin')), provider_profile_id TEXT, provider_account_id TEXT,
 native_identity_id TEXT, display_name TEXT NOT NULL DEFAULT '', identity_status TEXT NOT NULL DEFAULT 'unavailable' CHECK(identity_status IN ('verified','unavailable')),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','requires_action','disconnecting','disconnected')),
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL, CHECK(status != 'active' OR (native_identity_id IS NOT NULL AND identity_status = 'verified'))
);
INSERT INTO social_accounts_linkedin SELECT * FROM social_accounts;
DROP TABLE social_accounts;
ALTER TABLE social_accounts_linkedin RENAME TO social_accounts;
CREATE UNIQUE INDEX social_slot ON social_accounts(brand_id,platform) WHERE status != 'disconnected';
CREATE UNIQUE INDEX social_native_identity ON social_accounts(platform,native_identity_id) WHERE status != 'disconnected' AND native_identity_id IS NOT NULL;
CREATE UNIQUE INDEX social_provider_account ON social_accounts(provider_account_id) WHERE provider_account_id IS NOT NULL;
CREATE INDEX social_accounts_owner ON social_accounts(account_id,brand_id);
PRAGMA defer_foreign_keys = OFF;
