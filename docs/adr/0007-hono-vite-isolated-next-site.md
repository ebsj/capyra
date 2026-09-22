# Hono API, Vite webapp, isolated Next.js site

`apps/api` uses Hono. `apps/web` is Vite + React + TanStack Router. `apps/site` is Next.js in its own app: no operator session, no `/api/v1` business calls, no import of `apps/web` or `apps/api`. Nest.js is out. Next.js is out of the webapp. MCP is a fourth app (ADR 0010), not a Next or Nest surface.

An authenticated product does not need App Router SEO. A marketing site does, and keeping it in a separate Next.js app avoids mixing session and SEO in one runtime. Astro was the earlier portable-static pick; the review replaced it with isolated Next.js. FastAPI/Python remains deferred.
