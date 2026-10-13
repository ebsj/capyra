# Web Architecture

This document defines the architecture for `apps/web`. It should be read before
adding a new web feature, moving feature code, or changing the data-loading
shape of authenticated product screens.

## Goal

`apps/web` is the authenticated Capyra product app. The architecture optimizes
for feature ownership, predictable routing, fast React rendering, and a stable
API boundary over the canonical backend.

The app follows FDD: each product capability is owned by a feature folder. A
feature owns its UI, request wrappers, private helpers, and private types. The
route layer composes those pieces but does not become the place where domain
logic accumulates.

## Current platform

- Next.js `16` App Router.
- React `19`.
- TypeScript strict mode.
- Tailwind CSS with shadcn/ui primitives.
- Firebase-backed auth/session helpers.
- Browser API calls through the local Next proxy at `/api/v1`.
- Server API calls through the same Cloudflare API Service Binding as the browser proxy.

## Layer model

```text
app/ routes
  -> features/<feature> public UI exports
  -> features/<feature>/api explicit request aggregators
  -> lib/http transport
  -> app/api/v1 proxy for browser requests
  -> canonical backend API

components/ui and components/i18n
  -> shared, domain-free UI/application primitives

lib/
  -> transport, session, i18n, config, generated/shared contracts
```

Import direction should stay one-way. Shared code can be used by features, but
shared code must not import feature code. Features should not import internals
from other features.

## Route layer

The `app/` folder owns URL structure, route groups, layouts, metadata, loading
and error states, redirects, and initial server-side data loading.

Route files should stay thin:

- Read `params` and `searchParams`.
- Resolve locale through the existing i18n helpers.
- Resolve session through `lib/session.server`.
- Redirect unauthenticated users with existing login helpers.
- Start independent requests early and await them with `Promise.all`.
- Render a feature view exported by `features/<feature>/index.ts`.
- Use feature API aggregators for route-level data fetching when needed.

Route files should not own reusable domain components, field mapping, API
payload construction, feature-specific formatting, or copy-heavy UI.

## Feature layer

Use this default shape for a new feature:

```text
apps/web/features/<feature>/
  index.ts
  components/
  api/
    <operation>.ts
    <feature>-api.ts
  utils/
  types/
```

Only create folders that contain real code. Do not create placeholder folders.

### `index.ts`

The feature index is the public UI boundary consumed by routes. Export screens
and feature-level view components from here. Keep request functions out of this
index so client bundles do not accidentally pull server-oriented code.

### `components/`

Feature components own product screens and feature-specific UI. They may import
shared primitives from `@/components/ui`, app i18n from `@/components/i18n`, and
their own feature helpers.

Group larger flows by subfolder, as in:

```text
features/analyses/components/composer/
features/analyses/components/detail/
features/auth/components/login/
features/source-assets/components/upload-session/
```

### `api/`

Feature API modules are thin wrappers over `@/lib/http`. Use one file per API
operation:

```text
features/analyses/api/create-analysis-from-url.ts
features/analyses/api/list-analysis-skills.ts
features/source-assets/api/get-source-asset-upload-session.ts
```

An explicit `<feature>-api.ts` aggregator is allowed for stable route imports.
Use named exports only. Do not use broad `export *` barrels.

Browser-facing functions should call `createBrowserApiRequest`. Server-facing
functions should call `createServerApiRequest` or expose a clearly named
server variant such as `listAnalysisSkillsForServer`.

Do not put fetch calls directly in components when the operation belongs to a
feature. Components call feature API functions.

### `utils/`

Use feature `utils/` for pure helpers owned by one feature: field-error mapping,
formatters, payload preparation, small workflow decisions, and derived values.

Keep helpers private until there is a real second consumer. When a helper is
promoted, move it to an intentional shared module and update imports.

### `types/`

Use feature `types/` for local UI/workflow types. Prefer shared contracts from
`@/lib/models` for API payloads and responses.

### Hooks and model folders

Do not add `model/`, `actions/`, or template `hooks/` folders by default. The
current web architecture uses `components/`, `api/`, `utils/`, and `types/` as
the default feature shape.

Create `features/<feature>/hooks/` only when a reusable React hook is the right
abstraction. Do not turn plain mapping or orchestration code into hooks just to
name a layer.

## Shared code

### `components/ui`

`components/ui` contains shadcn-style primitives. These components must stay
domain-free:

- No API calls.
- No auth/session decisions.
- No feature copy.
- No locale-specific text.
- No imports from `features/*`.

If a primitive needs product-specific labels or behavior, pass that from the
feature consumer.

### `components/i18n`

This layer owns app-wide i18n context and locale switching. Feature copy should
come from message files or translation helpers, not from shared UI primitives.

### `lib`

`lib` is for app infrastructure and shared contracts:

- `lib/http.ts`: transport, API error shape, browser/server request factories.
- `lib/models.ts`: API contracts used by web features.
- `lib/session*`: session cookie and redirect behavior.
- `lib/i18n/*`: locale config, messages, server locale helpers.
- `lib/firebase*`: Firebase public config and client integration.

Do not let `lib/http.ts` become a product API catalog. Product operations belong
to feature `api/` modules.

## API flow

Browser request flow:

```text
client component
  -> features/<feature>/api/<operation>.ts
  -> createBrowserApiRequest(...)
  -> /api/v1
  -> app/api/v1 proxy
  -> canonical backend
```

Server request flow:

```text
server route/page
  -> features/<feature>/api/<feature>-api.ts
  -> createServerApiRequest(...)
  -> lib/http.server.ts
  -> Cloudflare API Service Binding
  -> canonical backend
```

Rules:

- Keep the browser proxy. Do not call the backend cross-origin from client code.
- Server operations import `createServerApiRequest` from `lib/http.server.ts`.
  Both that client and the browser proxy use the API Service Binding; the
  configured `CAPYRA_API_BASE_URL` is an HTTP fallback only when no binding exists.
- Keep Worker imports out of browser modules. Operations with browser and server
  callers use separate `.ts` and `.server.ts` modules. Client components import
  browser operations directly or through a browser-only aggregator.
- Keep `cache: "no-store"` unless a specific route gets a caching decision.
- Keep request/response contracts aligned with `@/lib/models` and backend
  contracts.
- Handle auth failures through existing session redirect helpers.
- Let real contract failures surface during development. Do not add silent
  fallbacks or mock defaults in production code paths.

## React and Next.js performance rules

These rules are based on the Vercel React best-practices skill and should guide
new code and reviews.

### Eliminate waterfalls

Start independent async operations before awaiting dependent work. In routes and
route handlers, use `Promise.all` for unrelated requests:

```ts
const [catalog, assets] = await Promise.all([
  listAnalysisSkillsForServer(accessToken),
  listSourceAssetsForServer(accessToken),
]);
```

When one operation depends on another, start the independent work first and
await it late.

### Keep client boundaries small

Default to Server Components. Add `"use client"` only for interactivity,
browser APIs, local state, or effects.

When passing data from server to client, pass only fields used by the client.
Avoid handing large API response objects to client components when the client
renders only a few values.

### Avoid shared request state

Never store user, account, session, locale, or request-specific data in mutable
module-level variables. Server renders can overlap in the same process. Keep
request data local to the render tree or pass it explicitly.

Module scope is fine for immutable config, static maps, and caches deliberately
keyed for cross-request reuse.

### Keep bundles narrow

- Prefer statically analyzable import paths.
- Avoid broad `export *` barrels for feature API and large libraries.
- Keep `index.ts` feature exports intentionally small.
- Use `next/dynamic` for heavy browser-only UI not needed on initial render.
- Do not compose dynamic import paths from arbitrary strings.

### Reduce re-renders

- Do not define components inside components.
- Derive state during render instead of syncing derived values with effects.
- Use primitive effect dependencies, such as `user.id` instead of `user`.
- Use functional state updates when a callback only needs previous state.
- Keep transient frequent values in refs when they do not affect rendering.
- Use `startTransition` or deferred values for non-urgent expensive UI updates.
- Use explicit ternaries instead of `&&` when a falsy value might render.

### Browser-side effects

- Clean up global event listeners.
- Use passive listeners for scroll and touch work.
- Keep localStorage/sessionStorage reads narrow and cache them if repeated.
- Version persisted client data when the shape can change.

## New feature checklist

Use this checklist before implementing a new web feature:

- Identify the feature owner under `features/<feature>`.
- Add route files under `app/` only for URL/layout orchestration.
- Export the route-facing view from `features/<feature>/index.ts`.
- Put every backend operation in `features/<feature>/api/<operation>.ts`.
- Use `createBrowserApiRequest` for client-triggered calls.
- Use `createServerApiRequest` for server route data.
- Keep feature helpers in `utils/` and private types in `types/`.
- Keep components split before new files pass 300 lines.
- Add message keys for locale-aware text.
- Reuse shadcn primitives and existing design tokens.
- Update tests or smoke coverage when behavior changes.
- Run `npm run lint`; run `npm run build` when routes/config/data loading
  changed.

## Existing feature map

- `features/analyses`: dashboard, list, create composer, detail view, analysis
  API operations, analysis-only helpers.
- `features/auth`: Google and email-link login, email-link confirmation, auth
  intro UI, auth API operations, and auth-only field helpers. First access is
  provisioned automatically by the API without a password form.
- `features/account`: profile UI, profile API operations, account form helpers.
- `features/source-assets`: upload session UI, source asset API operations, and
  upload helpers.
- `features/oauth`: OAuth browser authorization and device activation screens.

## Anti-patterns

- Domain UI in shared `components/`.
- Feature A importing private files from Feature B.
- API request functions added to `lib/http.ts`.
- Browser code bypassing `/api/v1`.
- New framework-level state/data libraries without an explicit decision.
- Silent catches, empty `try/catch`, and fake defaults for missing API data.
- Components nested inside components.
- Effects used only to mirror derived state.
- Route files that grow into feature implementation files.
