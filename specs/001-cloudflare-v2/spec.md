# Feature Specification: Capyra V2 Cloudflare-first

**Feature Branch**: `main`  
**Created**: 2026-08-30  
**Status**: In progress

## User stories

### P1 - Analyse a short video on the production platform

An authenticated user submits a public short-video URL or a previously uploaded
source asset, receives a `pending` analysis, polls the existing detail endpoint,
and receives the same structured report when processing completes.

**Independent test**: sign in with Google or an email link, let the API provision
the account automatically when needed, upload a source asset directly to R2,
create an analysis, consume the Queue job through the Python Container, and
read the completed report through `/api/v1/analyses/{id}`.

### P2 - Keep integrations compatible

Existing CLI and remote MCP consumers authenticate with the Capyra OAuth flows
and use the existing `/api/v1` contracts without learning about D1, R2, Queues,
or the internal analysis runtime.

**Independent test**: complete authorization-code and device-code flows, then
create and poll an analysis through the CLI and MCP tools.

### P3 - Operate the pilot at low fixed cost

An operator deploys one production environment to Cloudflare, observes API and
job failures, and can recover stale or repeatedly failing analysis jobs without
running SQL Server, Azurite, or an always-on application server.

**Independent test**: deploy with Wrangler, apply D1 migrations, verify health,
force retries and DLQ delivery, and confirm the reconciliation Cron repairs or
fails stale jobs deterministically.

## Functional requirements

- **FR-001**: The public API MUST remain rooted at `/api/v1` and preserve the
  existing request and response contracts except for multipart uploads larger
  than 100 MB.
- **FR-002**: D1 MUST own accounts, users, analyses, feedback reactions, source
  assets, upload sessions, and OAuth grants.
- **FR-003**: Full reports, source videos, and analysis artifacts MUST be private
  R2 objects; API artifact responses MUST stream object bodies.
- **FR-004**: Direct uploads MUST accept MP4, MOV, and WEBM files up to 200 MB.
- **FR-005**: Analysis creation MUST persist `pending` before publishing an
  idempotent Queue message containing only the analysis ID.
- **FR-006**: Queue delivery MUST be safe under duplicates, retries, worker
  interruption, and a crash after artifacts are written but before D1 commits.
- **FR-007**: The Python Container MUST keep the existing snake_case AI report
  contract, call OpenAI directly, and never access D1 or authentication data.
- **FR-008**: Firebase sign-in MUST provision passwordless creator accounts on
  first access and preserve existing accounts by linking their verified email.
  Local password endpoints remain available only for API compatibility. Capyra
  JWTs, PKCE, refresh tokens, and device flow MUST remain compatible.
- **FR-009**: Web and MCP MUST call the API through Service Bindings in
  production; browser requests MUST retain the same-origin `/api/v1` proxy.
- **FR-010**: `content_strategy`, `filming`, `editing`, and `audio_music` MUST be
  published; `compliance` MUST remain valid only for historical data.
- **FR-011**: Soft-deleted analyses MUST be absent from normal reads, feedback,
  and artifact routes.
- **FR-012**: Logs MUST exclude credentials, prompts, transcripts, signed URLs,
  and video contents.

## Success criteria

- All current API contract fixtures pass against the Worker implementation.
- A complete upload-to-report flow works locally through D1, R2, Queue, and the
  Python Container.
- CLI and MCP behavior remains compatible without direct AI or storage access.
- Production requires Workers Paid plus metered usage, with no always-on VM,
  SQL Server, Azurite, or .NET process.
- The canonical validation suite contains no required .NET build or test step.

## Edge cases

- Duplicate Queue messages and stale `pending` rows.
- OAuth code or refresh token redeemed concurrently.
- Concurrent first Firebase sign-ins for the same verified identity.
- R2 object missing, wrong size, wrong media extension, or abandoned staging
  upload.
- Public URL requiring cookies, invalid media, missing OpenAI credentials, and
  processing beyond the Queue consumer wall-time limit.
- Analysis deleted while processing or after artifacts have been written.
