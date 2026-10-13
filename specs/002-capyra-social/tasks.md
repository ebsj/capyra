# Tasks: Capyra Social

**Input**: spec.md, plan.md, data-model.md, research.md and contracts/interfaces.md. Tests explicitly required by approved plan.

## Phase 1: Setup

- [x] T001 Create and validate Spec Kit artifacts in `specs/002-capyra-social/spec.md` (FR-030).
- [x] T002 Freeze shared interfaces and analyze requirement coverage in `specs/002-capyra-social/contracts/interfaces.md` (FR-001–030).

## Phase 2: Foundations

- [x] T003 Create D1 foundation migration and legacy Brand backfill in `apps/api/migrations/0001_capyra_foundations.sql` (FR-001–011).
- [x] T004 Create D1 social migration with ownership and identity constraints in `apps/api/migrations/0002_capyra_social.sql` (FR-012–027).
- [x] T005 Extend canonical HTTP contracts, generated schemas and exports in `contracts/openapi/capyra-api.v1.yaml` (FR-001–030).
- [x] T006 Wire runtime social queues, DLQ, cron and explicit provider configuration in `apps/api/src/index.ts` (FR-019–024).

## Phase 3: Marcas e equipe

**Independent acceptance**: execute US1 scenarios in spec.md with isolated fixtures.

- [x] T007 [US1] Implement foundation helpers and Brand CRUD/onboarding in `apps/api/src/foundations.ts` (FR-001–004).
- [x] T008 [US1] Implement seven-day single-use invitations and live membership checks in `apps/api/src/routes/foundations.ts` (FR-004–006).
- [x] T009 [US1] Integrate invitation acceptance before Firebase account provisioning in `apps/api/src/auth.ts` (FR-005–006).
- [x] T010 [P] [US1] Test Brand isolation, migration, owner/member and concurrent invitations in `apps/api/test/foundations.test.ts` (FR-001–006).
- [x] T011 [P] [US1] Build Brand selector/onboarding and team invitation UI in `apps/web/features/brands/index.ts` (FR-001–006,028).

## Phase 4: Mídia análises e créditos

**Independent acceptance**: execute US2 scenarios in spec.md with isolated fixtures.

- [x] T012 [US2] Extend private assets for images/variants, brand ownership and metadata in `apps/api/src/routes/assets.ts` (FR-007–008).
- [x] T013 [US2] Implement internal metadata probe without OpenAI and 180-second analysis limit in `apps/ai/src/capyra_analytic_agent/cloudflare_jobs.py` (FR-007–008).
- [x] T014 [US2] Integrate atomic analysis credit reservation, consumption and release in `apps/api/src/processor.ts` (FR-009–011).
- [x] T015 [US2] Implement explicit Brand analysis creation and manual legacy assignment in `apps/api/src/routes/analyses.ts` (FR-001–002,009).
- [x] T016 [US2] Update CLI/MCP/integration-core to require Brand and expose available Brands in `packages/capyra-integration-core/src/index.ts` (FR-029).
- [x] T017 [P] [US2] Test media validation, credits races, completion/failure/DLQ and cycle expiry in `apps/api/test/usage.test.ts` (FR-007–011).
- [x] T018 [P] [US2] Build Brand-scoped library and analysis composition with legacy assignment in `apps/web/features/source-assets/index.ts` (FR-001–002,007–009,028).

## Phase 5: Conexões protegidas

**Independent acceptance**: execute US3 scenarios in spec.md with isolated fixtures.

- [x] T019 [US3] Implement real Zernio provider and explicit deterministic local mock in `apps/api/src/social/provider.ts` (FR-012–014,030).
- [x] T020 [US3] Implement one-use authorization, verified identities and protected reconnection in `apps/api/src/routes/social.ts` (FR-012–014).
- [x] T021 [P] [US3] Test native identity uniqueness, expired/reused state and unsafe reconnect blocking in `apps/api/test/social-connections.test.ts` (FR-012–014).
- [x] T022 [P] [US3] Build social connection/capability/status UI in `apps/web/features/social/index.ts` (FR-012–014,028).

## Phase 6: Publicação e agendamento

**Independent acceptance**: execute US4 scenarios in spec.md with isolated fixtures.

- [x] T023 [US4] Implement publication/destination CRUD, immutable versions and per-network preflight in `apps/api/src/social/publications.ts` (FR-015–018).
- [x] T024 [US4] Implement durable idempotency, media handoff, queue leases and reconciliation in `apps/api/src/social/worker.ts` (FR-019–021).
- [x] T025 [US4] Implement confirmed cancellation, selective retry and archive/disconnect cooperation in `apps/api/src/social/lifecycle.ts` (FR-020–021,026).
- [x] T026 [US4] Implement raw-body HMAC webhook inbox, dedup and ordered state application in `apps/api/src/social/webhooks.ts` (FR-022).
- [x] T027 [P] [US4] Test three-network formats, consent, 207/429/timeouts, DST, T−6d, DLQ and duplicate delivery in `apps/api/test/social-publications.test.ts` (FR-015–022).
- [x] T028 [P] [US4] Build destination compositor, preview, schedule/list and version/attempt detail UI in `apps/web/features/social/index.ts` (FR-015–022,028).

## Phase 7: Posts externos e métricas

**Independent acceptance**: execute US5 scenarios in spec.md with isolated fixtures.

- [x] T029 [US5] Implement resumable ninety-day import, URL import and native dedup in `apps/api/src/social/analytics.ts` (FR-023).
- [x] T030 [US5] Implement daily native metric snapshots and explicit unavailable/stale data in `apps/api/src/social/analytics.ts` (FR-024–025).
- [x] T031 [P] [US5] Test paginated imports, snapshots and non-causal association in `apps/api/test/social-analytics.test.ts` (FR-023–025).
- [x] T032 [P] [US5] Build external post library and native metrics views in `apps/web/features/social/index.ts` (FR-023–025,028).

## Phase 8: Operação e retenção

**Independent acceptance**: execute US6 scenarios in spec.md with isolated fixtures.

- [x] T033 [US6] Implement operational entitlement/package provisioning and usage/account-days in `tools/provision-social.mjs` (FR-010–011,027).
- [x] T034 [US6] Implement archiving/restore and thirty-day original media retention with open-publication guard in `apps/api/src/routes/foundations.ts` (FR-026).
- [x] T035 [US6] Implement sanitized twelve-month audit and owner notifications in `apps/api/src/foundations.ts` (FR-027).
- [x] T036 [P] [US6] Build usage/notification/audit views and restricted account administration in `apps/web/features/usage/index.ts` (FR-010–011,027–028).
- [x] T037 [P] [US6] Test retention, quota identity cycles and operational provisioning in `apps/api/test/retention.test.ts` (FR-010–011,026–027).

## Phase 9: Integration and validation

- [x] T038 Update proxy idempotency headers and permission-vs-session behavior in `apps/web/lib/http.ts` (FR-006,021).
- [x] T039 Align Drizzle schema, bindings, generated contracts and affected app guidance in `apps/api/src/db/schema.ts` (FR-001–030).
- [x] T040 Run local Worker/consumer/Python/web checks and behavioral UI smoke in `specs/002-capyra-social/quickstart.md` (SC-001–004).
- [x] T041 Run relevant security checks and local dry-run packaging; record skipped live provider proof in `specs/002-capyra-social/validation.md` (SC-004–005).
- [x] T042 Update source plan, setup/development/architecture/database/security and consumer docs in `docs/plans/capyra-social.md` (FR-029–030).
- [x] T043 Run convergence and implement every remaining technical gap in `specs/002-capyra-social/tasks.md` (SC-001–005).

## Dependencies and parallel strategy

Setup and interface freeze precede implementation. US1 establishes Brands/members; US2 adds assets/ledger. US3 supplies accounts for US4; US5 consumes accounts/destinations. US6 closes cross-cutting retention and operation. API foundations, social modules and web run in three disjoint agent ownership areas from interfaces.md; UI can develop against frozen contracts while services are built. Root serializes canonical contracts, wiring and consumer changes. Tests marked [P] run alongside implementation in other files after their own subsystem is ready. All stories remain required; the P1 path is an integration milestone, not an early completion boundary.

## Phase 10: Convergence

- [x] T044 Make operational provisioning audit IDs compatible with UUID pagination, migrate existing local records and verify visibility in `apps/api/migrations/0005_social_audit_ids.sql` per FR-027/US6 (contradicts, HIGH).
- [x] T045 Complete audit coverage for account changes/analysis deletion and actionable owner notifications for final analysis/probe failures in `apps/api/src/processor.ts` and affected routes per FR-027 (partial, MEDIUM).
- [x] T046 Preserve cancellation idempotency after rejected preconditions and expose immutable version snapshots in destination details, with regressions in `apps/api/test/social.test.ts` per FR-018/FR-020/FR-021 and US4/AC2–3 (partial, HIGH).
- [x] T047 Snapshot already-connected native identities when a monthly cycle starts and before disconnect/archive, preventing quota bypass before daily sync, in `apps/api/src/foundations.ts` and social lifecycle per FR-010/US6/AC2 (partial, HIGH).
- [x] T048 Correlate native metric imports to Capyra delivery by provider post, verified native post ID or URL within the same account/connection, and preserve terminal attempt state under concurrent events in `apps/api/src/social/analytics.ts` and worker per FR-022–025/US5 (partial, HIGH).


## Implementation evidence mapping

The focused social test tasks T021/T027/T031 are implemented together in `apps/api/test/social.test.ts` (connections, publication failure/retry/webhooks and analytics groups), rather than separate files. Full Worker boundary contracts are exercised in `apps/api/test/social-contracts.test.ts`. Foundation test coverage also includes `foundation-migration`, `analysis-brands`, `media-probe`, `usage` and `retention`. This consolidation does not reduce their acceptance scope. T033/T037 also use `tests/infra/social-provisioning.test.mjs`. Final commands, results and real-provider exclusions are recorded in `validation.md`.
