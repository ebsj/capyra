# Implementation Plan: Capyra V2 Cloudflare-first

## Technical context

- API and background consumer: TypeScript, Hono, Cloudflare Workers.
- Relational persistence: D1 with Drizzle schema and SQL migrations.
- Object storage: private R2 bucket with direct S3-compatible upload tickets.
- Async processing: Cloudflare Queue, DLQ, and reconciliation Cron.
- Media runtime: existing Python 3.12 application in Cloudflare Containers.
- Product surfaces: Next.js on vinext Workers; remote MCP on a Worker-native
  transport; existing Node CLI.
- External providers: Firebase and direct OpenAI API.

## Constitution check

- Canonical API remains the only business boundary for web, MCP, and CLI.
- Public OpenAPI, JSON Schemas, and TypeScript contracts remain synchronized.
- Runtime boundaries change only because this feature explicitly introduces a
  production target and amends the constitution in the same change.
- P1, P2, and P3 remain independently testable after the shared D1/R2 Worker
  foundation is complete.
- Account isolation, OAuth, SSRF, upload defenses, secrets policy, validation,
  security evidence, and documentation remain mandatory gates.

## Target topology

`site -> web -> API Worker -> D1/R2/Queue -> Python Container -> OpenAI`, with
MCP reaching the API through a Service Binding and CLI reaching the public API
domain.

## Delivery order

1. Add Worker workspace, D1 schema, R2 key policy, contracts, and auth helpers.
2. Port API routes and characterization tests.
3. Add Queue consumer, DLQ/reconciliation behavior, and Container adapter.
4. Move web/site to vinext and MCP to a Worker-native transport.
5. Replace local orchestration and validation, deploy production, then remove
   the legacy .NET/SQL Server/Azurite implementation.

