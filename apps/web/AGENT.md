# AGENT.md — Web

`apps/web` is the authenticated product UI: Next.js App Router, React,
TypeScript and shadcn, compiled by vinext for Cloudflare Workers.

## Architecture and contracts

- Product code belongs in `features/<feature>/`. Routes orchestrate and import
  public feature UI or explicit feature API aggregators; shared primitives stay
  free of product/auth/locale logic. Extract shared code for cross-feature use.
- Feature API operations wrap `createBrowserApiRequest` or
  `createServerApiRequest`; `lib/http.ts` stays transport-only. Browser traffic
  uses `/api/v1`; trusted server calls use the API Service Binding.
- Preserve generated/shared payloads from `@/lib/models`, existing session
  redirects, and analysis locale propagation through `@/lib/analysis-language`.
- Never keep request-specific user/session data in mutable module-level state.
- Keep Server Components by default and client boundaries for interactivity.
- Framework/state additions (Server Actions, React Query, SWR, RHF, Zod,
  Zustand) require a project decision. Add folders only for actual code and keep
  new code files under 300 lines.
- Preserve shadcn tokens, `lucide-react` icons, and localized product copy.
  Preserve the current visual language unless a redesign is requested. Surface
  failed API contracts instead of inventing mock/default data.
- Do not add `.skills`, `skills-lock.json`, or `SKILL.md` inside this app.

For new features, code moves, or data-loading changes, consult
[web architecture](../../docs/web-architecture.md). For visual work, consult
[web design](../../docs/design/web.md). These references are contextual;
small edits do not require reading the full architecture or design inventory.

Feedback behavior lives in `features/analyses`: route reads use `analyses-api`,
mutations use feature API wrappers, and item keys come from
`features/analyses/utils/analysis-feedback-items.ts`.

## Validation by impact

- Text/docs only: content/link review and `git diff --check`.
- Source change: `npm -w @capyra/web run lint` and affected tests.
- Routes, build config, data loading or dependencies: also `npm -w @capyra/web run build`.
- User flow or architecture: also `npm -w @capyra/web run smoke` and relevant
  `tests/web/*.mjs`; inspect the running UI when the change affects it.
- Contract changes update feature API wrappers, models, proxy behavior and
  contract tests as applicable.

Correct failures caused by the change and repeat affected checks. Deployment
preparation uses `npm -w @capyra/web run deploy -- --dry-run`; live deployment
requires authorization for that scope.

## Social product flows

- `features/brands`, `team`, `social`, `usage`, and `notifications` own the Social UI.
  Use canonical contracts through `lib/models`; preserve native metric availability
  and destination states instead of optimistic cancellation or cross-network scores.
- New analysis and media requests carry an explicit active `brandId`; legacy analyses
  are assigned once. Archived Brands are historical, read-only contexts.
- Invitation tokens travel through the login return URL into Firebase session creation
  before account provisioning. Preserve query parameters and never display the token.
- Owner-only permission errors do not invalidate valid sessions. The browser proxy
  forwards `Idempotency-Key` and exposes `Retry-After`; retain a submission key while
  its transport outcome is uncertain.
- Local UI validation uses the explicit mock provider through the real API. Never
  expose provider IDs, call social providers from the browser, or substitute mock
  responses for failed production API contracts.
