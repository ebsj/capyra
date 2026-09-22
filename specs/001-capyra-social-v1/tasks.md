---
description: Task list for Capyra Social v1 implementation
---

# Tasks: Capyra Social v1

**Input**: Design documents from `/specs/001-capyra-social-v1/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/capyra-api.v1.yaml](./contracts/capyra-api.v1.yaml)

**Tests**: Obrigatórios (FR-063, constituição). Contrato OpenAPI, isolamento Conta/Marca, E2E Playwright + `MockProvider`.

**MVP**: Phase 1 + Phase 2 + US1–US7. US8–US11 depois.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: paralelo (arquivos diferentes, sem depender de task incompleta)
- **[Story]**: US1…US11 nas fases de história
- Toda task tem file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Monorepo npm workspaces conforme plan.md

- [ ] T001 Create npm workspaces root `package.json` with apps `api`, `web`, `site`, `mcp` and packages `platform`, `ui`, `i18n`, `contracts`
- [ ] T002 [P] Scaffold `apps/api/src/index.ts` Hono Worker entry without Cloudflare APIs in domain
- [ ] T003 [P] Scaffold `apps/web/src/main.tsx` Vite + React + TanStack Router talking only to `/api/v1`
- [ ] T004 [P] Scaffold `apps/site` Next.js app with locale prefixes `pt-br`, `en`, `es` and no operator session
- [ ] T005 [P] Scaffold `apps/mcp/src/index.ts` MCP Worker using `@modelcontextprotocol/server` + `createMcpHandler` (stateless, no Durable Object)
- [ ] T006 [P] Add TypeScript strict configs in `apps/api/tsconfig.json`, `apps/web/tsconfig.json`, `apps/site/tsconfig.json`, `apps/mcp/tsconfig.json`, `packages/*/tsconfig.json`
- [ ] T007 [P] Add ESLint + Prettier in `package.json` and `.github/workflows/ci.yml` (typecheck + OpenAPI check)
- [ ] T008 Wire OpenAPI generate script `packages/contracts` reading `contracts/openapi/capyra-api.v1.yaml`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Adapters, contrato, auth shell, `SocialProvider` — bloqueia todas as histórias

**⚠️ CRITICAL**: Nenhuma user story começa antes deste checkpoint

- [ ] T009 Create Drizzle kit + migrations folder `packages/platform/src/db/schema.ts` and `packages/platform/src/db/migrations/`
- [ ] T010 [P] Implement `db` port D1 adapter in `packages/platform/src/adapters/cloudflare/db.ts` and local SQLite adapter in `packages/platform/src/adapters/local/db.ts`
- [ ] T011 [P] Implement `blob` port R2 in `packages/platform/src/adapters/cloudflare/blob.ts` and local disk in `packages/platform/src/adapters/local/blob.ts` (binaries never in SQL)
- [ ] T012 [P] Implement `queue` + `scheduler` ports in `packages/platform/src/adapters/cloudflare/queue.ts` and `packages/platform/src/adapters/local/queue.ts`
- [ ] T013 [P] Implement `email` port interface + Resend adapter in `packages/platform/src/email/resend.ts` and file sink in `packages/platform/src/adapters/local/email.ts`
- [ ] T014 [P] Implement `billing` port interface + Stripe adapter in `packages/platform/src/billing/stripe.ts` and local fake in `packages/platform/src/adapters/local/billing.ts`
- [ ] T015 [P] Implement `secrets` port in `packages/platform/src/secrets.ts`
- [ ] T016 Add Hono error mapper to Capyra `code` (english) + localized `message` in `apps/api/src/http/errors.ts` (`unauthenticated`, `forbidden_role`, `brand_not_assigned`, `delinquent`, `authorization_required`, `identity_unverified`, `identity_taken`, `slot_occupied`, `delivery_unknown`, `platform_rejected`)
- [ ] T017 Add session cookie middleware (`cookie httpOnly` `capyra_session`) in `apps/api/src/http/session.ts` resolving Operator + Account + role + brandIds
- [ ] T018 Add authorization helper enforcing accountId match and brand assignment (empty brandIds → no brand resources) in `apps/api/src/authz/guard.ts`
- [ ] T019 Define `SocialProvider` interface in `apps/api/src/social/social-provider.ts` (connect, capabilities, publish, cancel, analytics, ad library, webhooks) mapping only Capyra types
- [ ] T020 Implement `MockProvider` in `apps/api/src/social/mock-provider.ts` (never silent production fallback; require `SOCIAL_PROVIDER=mock` in local/CI)
- [ ] T021 [P] Add i18n catalogs `pt-BR`, `en`, `es` in `packages/i18n/src/` for API messages, web, site, email, MCP tool descriptions
- [ ] T022 [P] Initialize shadcn/ui default theme only in `packages/ui/` (no custom Capyra tokens; logo from `docs/design/assets/logo.png`)
- [ ] T023 Generate Zod/types from OpenAPI into `packages/contracts/src/`
- [ ] T024 Add isolation test helpers in `tests/isolation/harness.ts` (two Contas, two Marcas, four roles)
- [ ] T025 Add contract test harness in `tests/contract/openapi.test.ts` asserting public IDs `accountId` `brandId` `socialAccountId` `publicationId` `destinationId` and rejecting vendor id fields
- [ ] T026 Add Playwright config `tests/e2e/playwright.config.ts` targeting Vite + Wrangler + MockProvider
- [ ] T027 Create Drizzle tables skeleton for Account, Operator, Session in `packages/platform/src/db/schema.ts` (`email` unique; `role` owner|creator|approver|viewer; `locale` pt-BR|en|es default pt-BR)

**Checkpoint**: Foundation ready

---

## Phase 3: User Story 1 - Entrar sem senha e abrir a Conta (Priority: P1) 🎯 MVP

**Goal**: Link mágico ou código cria sessão; e-mail novo provisiona Conta + Marca placeholder (FR-001, FR-002, FR-007, FR-008, FR-009)

**Independent Test**: Quickstart passo 1

### Tests for User Story 1

- [ ] T028 [P] [US1] Contract tests for `POST /auth/request` `POST /auth/complete` `POST /auth/logout` `GET /auth/me` in `tests/contract/auth.test.ts`
- [ ] T029 [P] [US1] Isolation test: same email cannot join a second Conta in `tests/isolation/one-email-one-conta.test.ts` (FR-004)
- [ ] T030 [P] [US1] E2E Playwright magic-link and code in `tests/e2e/us1-access.spec.ts`

### Implementation for User Story 1

- [ ] T031 [P] [US1] Add MagicCredential table (kind link|code, hash, expiresAt, consumedAt; last request invalidates previous) in `packages/platform/src/db/schema.ts`
- [ ] T032 [P] [US1] Add Brand table (`name` placeholder `Minha marca` for pt-BR, `timezone` default `America/Sao_Paulo`, `approvalPolicy` required if agency else optional) in `packages/platform/src/db/schema.ts`
- [ ] T033 [US1] Implement request/complete access use cases in `apps/api/src/auth/access.ts` (no password; one-time; consume link XOR code)
- [ ] T034 [US1] Implement `POST /auth/request` `POST /auth/complete` `POST /auth/logout` `GET /auth/me` in `apps/api/src/http/auth.routes.ts`
- [ ] T035 [US1] Send Capyra transactional email (capivara-logo + word Capyra, no mascot, no social vendor) via email port in `apps/api/src/auth/access-email.ts` (FR-009)
- [ ] T036 [US1] Provision Account `type` agency|creator, exactly one owner, initial Brand on first successful access in `apps/api/src/auth/provision.ts`
- [ ] T037 [US1] Rate-limit access requests per email and origin in `apps/api/src/auth/rate-limit.ts`
- [ ] T038 [US1] Web login screens (email, wait, paste code) in `apps/web/src/routes/login.tsx` using `packages/ui` only
- [ ] T039 [US1] Persist operator locale default `pt-BR` selector stub in `apps/web/src/routes/settings-locale.tsx` without changing brand timezone (FR-061)

**Checkpoint**: US1 independently testable

---

## Phase 4: User Story 2 - Organizar Marcas e equipe (Priority: P1) 🎯 MVP

**Goal**: Convites, Papel, Marcas atribuídas, arquivo de Marca (FR-003, FR-005, FR-006, FR-006b, FR-010–FR-013)

**Independent Test**: Quickstart passo 2

### Tests for User Story 2

- [ ] T040 [P] [US2] Contract tests for `/brands` `/members` `/member-invitations` in `tests/contract/brands-members.test.ts`
- [ ] T041 [P] [US2] Isolation tests: creator cannot see unassigned brand; empty brandIds sees none; removed operator fails next request in `tests/isolation/brand-assignment.test.ts`
- [ ] T042 [P] [US2] E2E invite + empty brands + promote viewer→approver in `tests/e2e/us2-team.spec.ts`

### Implementation for User Story 2

- [ ] T043 [P] [US2] Add Invitation table (role creator|approver|viewer never owner, brandIds may be `[]`, expiresAt +7 days, unique use, localeAtSend = owner locale) in `packages/platform/src/db/schema.ts`
- [ ] T044 [US2] Implement brand CRUD/archive/restore (owner only archive; restore requires new connections; name non-empty before schedule) in `apps/api/src/brands/brand-service.ts`
- [ ] T045 [US2] Implement member invite/update/remove (cannot promote to owner; removal revokes all sessions) in `apps/api/src/members/member-service.ts`
- [ ] T046 [US2] Routes `/brands` `/brands/{brandId}` archive/restore `/members` `/member-invitations` in `apps/api/src/http/brands.routes.ts` and `apps/api/src/http/members.routes.ts`
- [ ] T047 [US2] Reject invite email already in another Conta with `email_in_other_account` in `apps/api/src/members/member-service.ts`
- [ ] T048 [US2] Web brand settings + members UI in `apps/web/src/routes/brands.tsx` and `apps/web/src/routes/members.tsx`
- [ ] T049 [US2] Media expiry 30 days on archived brand unless unfinished Destination in `apps/api/src/media/expiry.ts` (FR-012)

**Checkpoint**: US2 independently testable

---

## Phase 5: User Story 3 - Conectar Instagram, TikTok e LinkedIn (Priority: P1) 🎯 MVP

**Goal**: OAuth headless, slot por rede, identidade global exclusiva, action_required (FR-014–FR-020, FR-032, FR-057–FR-059)

**Independent Test**: Quickstart passo 3

### Tests for User Story 3

- [ ] T050 [P] [US3] Contract tests for social-connections and callback in `tests/contract/social-connections.test.ts` (no vendor fields)
- [ ] T051 [P] [US3] Isolation: creator cannot start OAuth; native identity unique across Contas; one slot per network per brand in `tests/isolation/social-identity.test.ts`
- [ ] T052 [P] [US3] E2E MockProvider connect three networks + hidden network without gate go in `tests/e2e/us3-connect.spec.ts`

### Implementation for User Story 3

- [ ] T053 [P] [US3] Add SocialAccount + AuthorizationSession tables (`network` instagram|tiktok|linkedin; `nativeIdentity` unique among active; handle not key) in `packages/platform/src/db/schema.ts`
- [ ] T054 [US3] Implement headless connect/reconnect/disconnect in `apps/api/src/social/connect-service.ts` (owner only; callback on Capyra domain; LinkedIn target selection in Capyra UI)
- [ ] T055 [US3] Block unsafe reconnect (identity swap) and unverified identity as `pending_verification` in `apps/api/src/social/connect-service.ts`
- [ ] T056 [US3] Mark `action_required` on lost auth, block new deliveries, notify owner in `apps/api/src/social/reconnect-watch.ts` (FR-019)
- [ ] T057 [US3] Disconnect completes only after confirmed cancel of future Destinations in `apps/api/src/social/disconnect-service.ts` (FR-018)
- [ ] T058 [US3] Routes in `apps/api/src/http/social.routes.ts` including `/authz/callback` and LinkedIn target
- [ ] T059 [US3] Import 90 days ExternalPost metadata (no binary download) in `apps/api/src/social/import-external-posts.ts` (FR-032)
- [ ] T060 [US3] Hide networks without white-label gate `go` from UI/billing in `apps/api/src/social/network-catalog.ts`
- [ ] T061 [US3] Web connect flow `apps/web/src/routes/brands.$brandId.connect.tsx` (authorizationUrl is official network URL only)
- [ ] T062 [US3] Stub `ZernioProvider` behind the same interface in `apps/api/src/social/zernio-provider.ts` without leaking types to HTTP

**Checkpoint**: US3 independently testable with MockProvider

---

## Phase 6: User Story 4 - Compor Publicação e Destinos (Priority: P1) 🎯 MVP

**Goal**: Publicação agrupa Destinos; mídia original/variante; sem transcode (FR-021–FR-025)

**Independent Test**: Quickstart passo 4

### Tests for User Story 4

- [ ] T063 [P] [US4] Contract tests `/media` `/publications` in `tests/contract/publications-media.test.ts`
- [ ] T064 [P] [US4] Isolation: approver/viewer cannot upload; media in use cannot delete in `tests/isolation/media-roles.test.ts`
- [ ] T065 [P] [US4] E2E composer two destinations in `tests/e2e/us4-composer.spec.ts`

### Implementation for User Story 4

- [ ] T066 [P] [US4] Add MediaAsset, Publication, Destination tables in `packages/platform/src/db/schema.ts` (`byteSize` ≤ 209715200; kind original|variant)
- [ ] T067 [US4] Implement media upload to blob port in `apps/api/src/media/media-service.ts` (owner/creator only; no transcode/crop/compress)
- [ ] T068 [US4] Implement publication/destination draft writes with per-destination copy/media in `apps/api/src/publications/draft-service.ts`
- [ ] T069 [US4] Validate destination capabilities via SocialProvider before submit/schedule in `apps/api/src/publications/capabilities.ts`
- [ ] T070 [US4] Routes `/media` `/publications` `PATCH /destinations/{id}` in `apps/api/src/http/media.routes.ts` and `apps/api/src/http/publications.routes.ts`
- [ ] T071 [US4] Web composer `apps/web/src/routes/brands.$brandId.composer.tsx`

**Checkpoint**: US4 independently testable

---

## Phase 7: User Story 5 - Aprovar conteúdo por Destino (Priority: P1) 🎯 MVP

**Goal**: Política por Marca; aprovação por Destino; comentário no Destino (FR-034–FR-039, FR-036)

**Independent Test**: Quickstart passo 5

### Tests for User Story 5

- [ ] T072 [P] [US5] Contract tests submit/approve/reject/request-changes/comments in `tests/contract/approval.test.ts`
- [ ] T073 [P] [US5] Isolation: viewer cannot comment write or approve; creator cannot approve; approving one destination does not release the other in `tests/isolation/approval-roles.test.ts`
- [ ] T074 [P] [US5] E2E approval with scheduled time vs edit-reopens in `tests/e2e/us5-approval.spec.ts`

### Implementation for User Story 5

- [ ] T075 [P] [US5] Add Comment table (belongs to destinationId) and Destination.state enum from data-model.md in `packages/platform/src/db/schema.ts`
- [ ] T076 [US5] Implement approval state machine in `apps/api/src/publications/approval-service.ts` (approve with time → scheduled; edit copy/media/time/channel reopens if policy on; schedule without content change does not)
- [ ] T077 [US5] Implement comments (owner/creator/approver write; viewer read) in `apps/api/src/publications/comment-service.ts`
- [ ] T078 [US5] Notify in-app + email on pending approval and decision in `apps/api/src/notifications/approval-notify.ts` (FR-056)
- [ ] T079 [US5] Routes approve/reject/request-changes/submit/comments in `apps/api/src/http/approval.routes.ts`
- [ ] T080 [US5] Web review UI `apps/web/src/routes/brands.$brandId.review.tsx`

**Checkpoint**: US5 independently testable

---

## Phase 8: User Story 6 - Agendar, publicar e calendário (Priority: P1) 🎯 MVP

**Goal**: Versão imutável, fuso da marca, cancelamento confirmado, entrega desconhecida, retry seletivo (FR-026–FR-031, FR-033)

**Independent Test**: Quickstart passo 6

### Tests for User Story 6

- [ ] T081 [P] [US6] Contract tests schedule/publish/cancel/retry/calendar in `tests/contract/delivery.test.ts`
- [ ] T082 [P] [US6] Isolation + timezone: changing brand timezone does not move existing scheduledAtUtc in `tests/isolation/timezone.test.ts`
- [ ] T083 [P] [US6] E2E calendar + mock delivery_unknown + selective retry in `tests/e2e/us6-calendar.spec.ts`

### Implementation for User Story 6

- [ ] T084 [P] [US6] Add DestinationVersion + DeliveryAttempt tables (idempotency key) in `packages/platform/src/db/schema.ts`
- [ ] T085 [US6] Interpret scheduledLocal in brand IANA timezone; reject nonexistent/ambiguous DST in `apps/api/src/publications/schedule-time.ts`
- [ ] T086 [US6] Create immutable DestinationVersion on schedule/publish and reject edit/delete of posts already published on the network in `apps/api/src/publications/version-service.ts` (FR-026, FR-033)
- [ ] T087 [US6] Enqueue deliveries inside 6-day window; keep farther jobs in Capyra until window in `apps/api/src/publications/delivery-window.ts` (FR-030)
- [ ] T088 [US6] Reconcile webhooks/timeouts to `entrega_desconhecida` without auto-retry; terminal states irreversible in `apps/api/src/publications/reconcile.ts` (FR-028)
- [ ] T089 [US6] Cancel only completes after provider confirmation in `apps/api/src/publications/cancel-service.ts`
- [ ] T090 [US6] Retry only `falha_definitiva` and never completed destinations in `apps/api/src/publications/retry-service.ts` (FR-029)
- [ ] T091 [US6] Calendar query by day/network/state in `apps/api/src/publications/calendar-service.ts`
- [ ] T092 [US6] Internal HMAC webhook endpoint for SocialProvider in `apps/api/src/http/webhooks.social.ts` (dedupe by event id; not a public vendor URL)
- [ ] T093 [US6] Routes schedule/publish/cancel/retry `/calendar` in `apps/api/src/http/delivery.routes.ts`
- [ ] T094 [US6] Web calendar `apps/web/src/routes/brands.$brandId.calendar.tsx`

**Checkpoint**: US6 independently testable

---

## Phase 9: User Story 7 - Cobrar Identidades sociais do ciclo (Priority: P1) 🎯 MVP

**Goal**: R$ 49,90 / identidade / mês; pró-rata; inadimplência (FR-049–FR-054)

**Independent Test**: Quickstart passo 7

### Tests for User Story 7

- [ ] T095 [P] [US7] Contract tests `/billing` checkout/portal in `tests/contract/billing.test.ts` (Capyra vocabulary, not subscription-item jargon)
- [ ] T096 [P] [US7] Isolation: only owner sees billing; delinquent blocks schedule/publish/approve-with-time and new connections in `tests/isolation/billing.test.ts`
- [ ] T097 [P] [US7] E2E three Instagrams → R$ 149.70 list; reconnect same identity once; disconnect no refund in `tests/e2e/us7-billing.spec.ts`

### Implementation for User Story 7

- [ ] T098 [P] [US7] Add BillingCycle + CycleSocialIdentity tables in `packages/platform/src/db/schema.ts` (reconnect same nativeIdentity does not duplicate)
- [ ] T099 [US7] Sync subscription on connect/disconnect via billing port (prorate connect; no refund on disconnect) in `apps/api/src/billing/cycle-service.ts`
- [ ] T100 [US7] Map payment failure to Account.billingStatus `delinquent` in `apps/api/src/billing/entitlement.ts`
- [ ] T101 [US7] Guard delinquent in authz for connect/schedule/publish/approve-with-time in `apps/api/src/authz/guard.ts` (FR-053)
- [ ] T102 [US7] Internal Stripe webhook HMAC in `apps/api/src/http/webhooks.billing.ts`
- [ ] T103 [US7] Routes `/billing` `/billing/checkout` `/billing/portal` owner-only in `apps/api/src/http/billing.routes.ts`
- [ ] T104 [US7] Web billing UI `apps/web/src/routes/billing.tsx` (list identities by brand/network/handle/connectedAt)

**Checkpoint**: US1–US7 form the commercial MVP

---

## Phase 10: User Story 8 - Relatórios e exportação (Priority: P2)

**Goal**: Snapshots; ausência ≠ zero; PDF logo+Capyra; CSV data only (FR-040–FR-044)

**Independent Test**: Quickstart passo 8

### Tests for User Story 8

- [ ] T105 [P] [US8] Contract tests `/reports` `/reports/export` `/metrics` with nullable value in `tests/contract/reports.test.ts`
- [ ] T106 [P] [US8] Isolation: viewer can read assigned brand report only in `tests/isolation/reports.test.ts`
- [ ] T107 [P] [US8] E2E missing metric stays missing; PDF/CSV in `tests/e2e/us8-reports.spec.ts`

### Implementation for User Story 8

- [ ] T108 [P] [US8] Add MetricSnapshot table (`value` nullable, never coerced to 0) in `packages/platform/src/db/schema.ts`
- [ ] T109 [US8] Pull native metrics via SocialProvider into snapshots in `apps/api/src/reports/snapshot-service.ts`
- [ ] T110 [US8] Report filters brand/network/period/destination; no causal claims in `apps/api/src/reports/report-service.ts`
- [ ] T111 [US8] PDF export capivara-logo + word Capyra default type; CSV data only in `apps/api/src/reports/export.ts` (FR-043)
- [ ] T112 [US8] Routes in `apps/api/src/http/reports.routes.ts`
- [ ] T113 [US8] Web reports `apps/web/src/routes/brands.$brandId.reports.tsx`

---

## Phase 11: User Story 9 - Anúncios públicos de concorrentes (Priority: P2)

**Goal**: Meta precisa Instagram; LinkedIn precisa LinkedIn; modelo Capyra; não veicula ads (FR-045–FR-048)

**Independent Test**: Quickstart passo 9

### Tests for User Story 9

- [ ] T114 [P] [US9] Contract tests `/competitors/ads` in `tests/contract/competitors.test.ts`
- [ ] T115 [P] [US9] Isolation: search without required connection returns Capyra error; no vendor ids in `tests/isolation/competitors.test.ts`
- [ ] T116 [P] [US9] E2E Meta search with mock Instagram in `tests/e2e/us9-competitors.spec.ts`

### Implementation for User Story 9

- [ ] T117 [US9] Ad library search via SocialProvider mapped to Capyra adId in `apps/api/src/competitors/ads-search.ts`
- [ ] T118 [US9] Route `/competitors/ads` in `apps/api/src/http/competitors.routes.ts`
- [ ] T119 [US9] Web search UI `apps/web/src/routes/brands.$brandId.competitors.tsx` (no import-to-calendar, no campaign create)

---

## Phase 12: User Story 10 - MCP headless (Priority: P2)

**Goal**: Mesmo Operador/Papel/Marcas; só `/api/v1` (FR-062)

**Independent Test**: Quickstart passo 10

### Tests for User Story 10

- [ ] T120 [P] [US10] Contract/isolation: MCP creator cannot connect network; cannot see unassigned brand in `tests/isolation/mcp-roles.test.ts`
- [ ] T121 [P] [US10] Tool descriptions follow operator locale in `tests/contract/mcp-i18n.test.ts`

### Implementation for User Story 10

- [ ] T122 [US10] Verify operator token **before** `createMcpHandler` in `apps/mcp/src/auth.ts`
- [ ] T123 [US10] MCP tools calendar/draft/metrics calling `/api/v1` only in `apps/mcp/src/tools.ts` (no db, blob, billing, email, SocialProvider)
- [ ] T124 [US10] Localize tool descriptions from operator locale in `apps/mcp/src/i18n.ts`

---

## Phase 13: User Story 11 - Site público i18n (Priority: P3)

**Goal**: Marketing `pt-BR`/`en`/`es`; sem sessão (FR-060)

**Independent Test**: Quickstart passo 11

### Tests for User Story 11

- [ ] T125 [P] [US11] E2E site locales and no `capyra_session` cookie in `tests/e2e/us11-site.spec.ts`

### Implementation for User Story 11

- [ ] T126 [P] [US11] Locale routes `/pt-br` `/en` `/es` default pt-BR in `apps/site/app/[locale]/page.tsx`
- [ ] T127 [US11] Header capivara-logo + word Capyra from `docs/design/assets/logo.png`; hero `docs/design/assets/mascots/capyra-hero.png` in `apps/site/components/header.tsx`
- [ ] T128 [US11] CTA to webapp only; no import of `apps/web` or `apps/api` in `apps/site/`

---

## Phase 14: Polish & Cross-Cutting Concerns

**Purpose**: Auditoria, Gate checklist, E2E full, docs

- [ ] T129 [P] Implement AuditEvent writer (no credentials, raw media, tokens, signed URLs) and owner-only `GET /audit-events` in `apps/api/src/audit/audit-service.ts` and `apps/api/src/http/audit.routes.ts` (FR-055)
- [ ] T130 [P] Notifications in-app list `/notifications` in `apps/api/src/http/notifications.routes.ts` (FR-056)
- [ ] T131 [P] Account type change by owner without mutating price/roles/brands/policies in `apps/api/src/brands/account-type.ts`
- [ ] T132 White-label evidence checklist template (go/no-go per network, not commercial go) in `docs/gate-white-label.md`
- [ ] T133 Run Playwright suite `tests/e2e/` covering US1–US11 against MockProvider
- [ ] T134 [P] Empty/error states using `docs/design/assets/mascots/capyra-front.png` and `capyra-sleeping.png` in `apps/web/src/components/states.tsx`
- [ ] T135 Validate `quickstart.md` commands and update `README.md` links
- [ ] T136 Confirm OpenAPI and HTTP handlers invent no extra public fields (`packages/contracts` vs `apps/api/src/http`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: imediato
- **Foundational (Phase 2)**: depende de Setup; **bloqueia** todas as histórias
- **US1–US11**: após Phase 2; ordem sugerida P1 → P2 → P3; US3 precisa de MockProvider (T020); US7 acopla connect (US3) à fatura
- **Polish**: após histórias desejadas

### User Story Dependencies

- **US1**: após Phase 2
- **US2**: após US1 (Convite usa o mesmo acesso)
- **US3**: após US1 (Proprietário); billing hook pode ser stub até US7
- **US4**: após US2 (Marca nomeada) e US3 (Conta social para Destino); drafts locais possíveis sem publicar
- **US5**: após US4
- **US6**: após US4; aprovação se política on (US5)
- **US7**: após US3
- **US8**: após US6 (Destinos publicados / snapshots)
- **US9**: após US3
- **US10**: após US1 (token de Operador); tools limitadas ao que já existir em `/api/v1`
- **US11**: após Phase 1 site scaffold (T004); independente do webapp autenticado

### Parallel Opportunities

- T002–T005, T010–T015, T021–T022, T028–T030, T040–T042, T050–T052 em paralelo
- Depois da Phase 2, US8/US9/US10/US11 podem avançar em paralelo com o restante se a API já expuser os recursos

---

## Parallel Example: User Story 1

```bash
# testes em paralelo
Task: "Contract tests auth in tests/contract/auth.test.ts"
Task: "Isolation one-email-one-conta in tests/isolation/one-email-one-conta.test.ts"
Task: "E2E us1-access in tests/e2e/us1-access.spec.ts"

# schema em paralelo
Task: "MagicCredential table in packages/platform/src/db/schema.ts"
Task: "Brand table in packages/platform/src/db/schema.ts"
```

---

## Implementation Strategy

### MVP First (US1–US7)

1. Phase 1 Setup
2. Phase 2 Foundational
3. US1 → US2 → US3 → US4 → US5 → US6 → US7
4. STOP: critérios PRD §17.1–17.4 e §17.7 + testes MockProvider

### Incremental Delivery

5. US8 relatórios (PRD §17.5)
6. US9 concorrentes (PRD §17.6)
7. US10 MCP
8. US11 site
9. Gate white label evidência (T132) — `go` real fora deste recorte de código

### Parallel Team Strategy

Após Phase 2: A = US1–US2, B = US3+US7, C = US4–US6, depois D = US8–US11.

---

## Notes

- IDs públicos só Capyra. `ZernioProvider` não aparece em OpenAPI, UI, e-mail ou MCP.
- `MockProvider` nunca é fallback silencioso em produção.
- Publicado na rede não se edita/apaga na v1 (FR-033).
- Contagem: **T001–T136**. Testes por história P1 estão nas fases 3–9.
