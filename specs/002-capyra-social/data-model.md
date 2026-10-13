# Data model

All authenticated reads/writes scope account_id and validate referenced brand ownership. UUIDs are internal public identifiers; provider references are private.

## Foundation (migration 0001)

Brands: id, account_id, name (1–160), time_zone (valid IANA), confirmed_at nullable, status active|archiving|archived, timestamps. Existing accounts get one provisional America/Recife Brand; existing analyses/assets have nullable brand_id. New application writes require active brand_id. Partial unique index enforces one active owner per account.

Invitations: account, normalized email, hashed unique token, seven-day expiry, pending|accepted|revoked status, creator and timestamps. Membership email remains globally unique. Conditional acceptance and quota guards protect concurrent acceptance. Removed members no longer satisfy authenticated membership checks.

Entitlements: one per account, active subscription status, monthly UTC cycle anchor, limits (5 brands,15 identities,5 operators,50 analyses), purchased credits; cycle/lots/ledger preserve granted, reserved, consumed, released and expired credit events. Reservation is unique per analysis. Conditional debit and insertion are atomic; completion/release is idempotent. Included credits first, package credits afterward. Cycle anniversary clamps day in short months without moving original anchor.

Assets extend current metadata with brand_id, kind, variant origin, probe state/result, deletion and expiry. New R2 keys partition account/brand; legacy keys remain readable. Media metadata is inspected server-side. Legacy analysis assignment rejects already assigned records and cross-brand asset sharing.

Audit: actor, account, optional brand, action/resource/correlation/time, twelve-month retention. Notifications: owner, account/brand, code, sanitized message, resource, created/read timestamps.

## Social (migration 0002)

Social accounts: internal ID, account/brand, platform enum instagram|tiktok|youtube, provider profile/account references, verified native identity nullable, display name, identity status, connection state and timestamps. Partial uniqueness protects occupied brand/platform slots and verified platform/native identity globally. Unknown identity is never active.

Authorization sessions: hashed single-use state, actor/account/brand/platform, expected identity for safe reconnect, expiry and provider references; no persisted OAuth social access tokens.

Publications: account/brand/title/timestamps; aggregate state derived from destinations. Destinations: account/brand/publication/social account, editable draft payload, state, current immutable version, schedule, error and lease. Versions snapshot media references, per-network content/settings, analysis link, local time, timezone and UTC, consent, idempotency key. Attempts reference version, stable request key, persisted transfer URLs/provider post ID, verified native post ID/published URL for import correlation, state/retry/lease timestamps.

Destination transitions: draft→awaiting_handoff→submitting→scheduled|publishing|published|unknown|failed. Scheduled→publishing→published. Eligible nonterminal→cancellation_requested→cancelled only after confirmed cancellation; uncertain result→unknown. Unknown→reconciled state only after evidence, never direct manual resend. Failed→new attempt by operator. Published/cancelled do not regress from stale events. Editing a scheduled destination waits for confirmed cancellation then creates a new draft/version; old version remains immutable.

Inbox receipt: unique provider event ID, verified body held privately for processing, received/processed timestamps; account resolved through internal references. Queue messages only contain job kind and internal ID.

External posts: account/brand/platform/native identity/native post unique, account/brand/social account, URL/text/date; readonly, no delivery attempts. Metrics: account/brand/social account, optional destination/external post, native metric/source/period/value nullable/availability/observed_at/data_through. No cross-network aggregate without documented equivalence/additivity. Sync jobs store cursor/window/state so ninety-day imports resume safely.

Connection usage: unique account/cycle/platform/native identity; reconnect same identity is one unit. Already-connected identities are inserted into each new cycle before disconnect/rotation. Daily account-days records permit cost reconciliation. Open publication references block source deletion. Archive transitions active→archiving→archived only after cancellation and disconnect completion; restore requires new social connection and active brand quota.
