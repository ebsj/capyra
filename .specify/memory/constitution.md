# Capyra Constitution

## Core Principles

### I. Canonical API and Contract Integrity

`apps/api` is the only business boundary for web, MCP, CLI, and external
consumers. It MUST expose the public versioned API under `/api/v1`, own
authorization, persistence, source assets, analyses, artifacts, OAuth, and the
skill catalog. `apps/web`, `apps/mcp`, and `apps/cli` MUST NOT call the AI
container, D1, R2, or Queues directly. Boundary changes MUST update the OpenAPI,
JSON Schemas, TypeScript contracts, consumers, and contract tests together.

Rationale: one public boundary keeps all surfaces behaviorally aligned while
the implementation uses several Cloudflare products.

### II. Runtime Boundary Discipline

The supported production topology is Cloudflare-first: TypeScript Workers for
API and MCP, Next.js/vinext Workers for web and site, D1 for relational state,
R2 for private binary/report storage, Queues for analysis jobs, and Cloudflare
Containers for the internal Python media pipeline. The Python container MAY
call OpenAI and access only its assigned R2 job data; it MUST NOT access D1,
authentication, or public product routes. Firebase and OpenAI remain external
providers. The CLI remains a Node.js package that calls the public API.

The supported local topology MUST emulate Worker bindings through Wrangler and
use Docker only for the Container runtime. Public URL ingestion remains best
effort; direct upload and `sourceAssetId` are the durable paths.

Rationale: bindings and scale-to-zero services minimize fixed cost while keeping
media tooling in the runtime it requires.

### III. Independently Deliverable User Stories

Spec-driven work MUST use prioritized stories that can be implemented, tested,
and demonstrated independently after shared foundations are complete. P1 MUST
cover the end-to-end user value path. Foundations MUST be limited to blockers
shared by multiple stories; cross-story dependencies and rollout gates MUST be
explicit.

Rationale: vertical slices reduce risk across API, storage, jobs, AI, web, MCP,
and CLI.

### IV. Validation and Security Evidence

Every change MUST run validation proportional to impact. API changes require
Worker and contract tests; D1 changes require local migration and constraint
tests; R2 changes require ownership, upload, and streaming tests; Queue and
Container changes require duplicate, retry, timeout, and reconciliation tests;
web/site changes require lint for source changes, build for routing, configuration
or data-loading changes, and smoke coverage for affected user flows; MCP/CLI
changes require workspace typecheck and tests. Deployment preparation requires
Wrangler config/type checks and a deployment dry run. Authorized production
deployment requires applicable remote migrations
and post-deploy smoke evidence. Documentation-only changes require content/link
review and diff checks; they do not require application test suites.

Security-sensitive work MUST preserve no-secrets-in-git, account isolation,
OAuth/PKCE constraints, Firebase verification, SSRF and upload defenses, R2
privacy, least-privilege bindings, structured redacted logs, dependency/image
scanning, and DAST restricted to local or explicitly authorized targets.

Rationale: distributed serverless systems need boundary and failure evidence,
not only unit tests.

### V. Documentation and Handoff Integrity

Stable behavior, architecture, setup, production operation, security posture,
cost controls, and public contracts MUST be documented with the implementation.
Contributors MUST consult the affected app instructions for code or behavior
changes. Architecture, specs, and operational references are loaded according
to the task impact, without mandatory repeated reading. Handoffs MUST state the
result, relevant validation evidence, and material limitations; include bindings,
contracts, migrations, and assumptions only when affected.

Rationale: documentation is the operational source of truth for humans and
agents.

### VI. Cost and Failure Discipline

Production design MUST prefer direct bindings, static assets, scale-to-zero
compute, bounded concurrency, idempotent jobs, and private object storage.
Work that can outlive an HTTP request MUST use Queues or another durable
primitive. Every Queue consumer MUST define retry, DLQ, idempotency, and stale
job recovery behavior. Large request/response bodies MUST be streamed or sent
directly to R2. Logs and traces MUST be sampled and MUST exclude user media,
prompts, transcripts, credentials, and signed URLs.

Rationale: low fixed cost is only sustainable when retries, storage growth,
observability, and abuse are explicitly bounded.

## Platform Constraints

- Public routes stay under `/api/v1`; the only compatibility exception is that
  multipart bodies above 100 MB must use the 200 MB direct-R2 upload flow.
- `POST /api/v1/analyses` creates `pending`; Queue processing completes or
  fails it; `GET /api/v1/analyses/{id}` remains the polling contract.
- Published skills are `content_strategy`, `filming`, `editing`, and
  `audio_music`; `compliance` remains historical and unpublished.
- D1 owns queryable state. Full reports and artifacts belong in private R2.
- Browser API traffic uses the web `/api/v1` proxy; production Worker-to-Worker
  calls use Service Bindings. MCP and CLI never call AI directly.
- Secrets live in Workers/Container secrets and untracked local `.dev.vars`.
- Production is deployed from the canonical repository after validation and
  D1 migrations; schema evolution uses expand/contract migrations.
- UI changes preserve the documented feature-folder and shadcn boundaries.

## Development Workflow and Quality Gates

- Use `AGENT.md` as the operational entrypoint. Read this constitution for
  spec-driven work or boundary changes, and other documents according to impact.
- Continue authorized reversible work through implementation and relevant
  verification, fixing failures introduced by the change. A completed workflow
  stage is not completion of a broader requested task. Stop when the requested
  outcome is verified or a concrete blocker requires user input.
- Local validation uses disposable fixtures/emulation. Production access, remote
  migrations, publication, and paid calls require authorization for that scope.
- Skill descriptions MUST identify a narrow purpose. Conditional procedures
  belong in linked references; retain project invariants without generic recipes.
- For full SDD delivery, repeat implementation and convergence until the specified
  scope converges or an unresolved blocker is reported. Stage-only requests end
  after their requested artifact; do not expand them into implementation.
- Specs and plans MUST include Constitution Check, contracts, data/storage,
  failure modes, security, cost, validation, and documentation impact.
- Run generated binding type checks after every Wrangler binding change.
- Do not remove a legacy runtime until replacement characterization, contract,
  integration, and consumer tests pass.
- A change is not ready until evidence and skipped-test rationale are recorded.

## Governance

This constitution supersedes informal repository practices. Amendments MUST
update this file and provide a Sync Impact Report for review, outside permanent
governance content. Dependent commands read the constitution at runtime; do not
copy principles into managed templates. Keep affected canonical guidance aligned
when the requested task includes those changes.

Versioning follows semantic versioning:

- MAJOR: incompatible governance or platform-boundary redefinition.
- MINOR: new mandatory principle or materially expanded gate.
- PATCH: clarification without semantic change.

Compliance review is required during planning, review, deployment, and handoff.
Exceptions MUST name an owner, risk, expiration or revisit trigger, and
remediation path.

**Version**: 3.1.0 | **Ratified**: 2026-06-28 | **Last Amended**: 2026-09-12
