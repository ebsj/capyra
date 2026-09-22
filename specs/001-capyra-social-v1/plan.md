# Implementation Plan: Capyra Social v1

**Branch**: `001-capyra-social-v1` | **Date**: 2026-09-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-capyra-social-v1/spec.md`

**Note**: Preenchido por `/speckit-plan`. Stack canônica em [`docs/stack.md`](../../docs/stack.md). Constituição em [`.specify/memory/constitution.md`](../../.specify/memory/constitution.md).

## Summary

Entregar o ciclo autenticar → conectar Instagram/TikTok/LinkedIn → criar → aprovar → publicar → cobrar (US1–US7), depois relatórios, anúncios públicos, MCP e site (US8–US11), sem o Operador identificar o Fornecedor social.

Abordagem: monorepo TypeScript web-standard. `apps/api` (Hono) é a única fronteira de negócio. `apps/web` (Vite + React + TanStack) e `apps/mcp` (SDK v2 stateless) falam só `/api/v1`. `apps/site` (Next.js) é marketing isolado. Nuvem é adapter Cloudflare (D1, R2, Queues, Cron) atrás de `packages/platform`. Redes passam por `SocialProvider` (`ZernioProvider` + `MockProvider`). Cobrança Stripe em BRL; e-mail Resend; UI shadcn default.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), contrato Fetch (`Request` / `Response`, Web Crypto)

**Primary Dependencies**: Hono; Vite + React + TanStack Router/Query; Next.js (somente `apps/site`); `@modelcontextprotocol/server` + `createMcpHandler`; Drizzle ORM; Zod (contrato gerado); Resend; Stripe; shadcn/ui em `packages/ui`

**Storage**: Drizzle + D1 (SQLite) no v1; R2 para mídia e PDF; Postgres fica atrás da mesma porta `db`

**Testing**: Vitest (unidade, isolamento, contrato OpenAPI); Playwright E2E do webapp contra API + `MockProvider`

**Target Platform**: Cloudflare Workers (API, MCP) + assets estáticos (web) + host Next do site; desenvolvimento local via Wrangler + Vite + Next

**Project Type**: Monorepo npm workspaces — API + webapp autenticado + site público + MCP headless

**Performance Goals**: Jornadas autenticadas de aceite (primeiro acesso, compositor, calendário) respondem de forma utilizável em condições de rede típicas de escritório; publicação no prazo ≥ 95% dos Destinos não cancelados após Gate `go` (SC-002)

**Constraints**: Sem APIs só-Cloudflare no domínio; sem IDs do Fornecedor social na API pública; sem Nest/Express/Prisma/Firebase/Clerk; sem Durable Objects no domínio; sem `McpAgent`; sem senha na v1; sem Python/CLI neste corte; UI só shadcn default; redes da v1 = Instagram, TikTok, LinkedIn

**Scale/Scope**: Primeiro lançamento — agências e criadores, três redes, papéis Proprietário/Criador/Aprovador/Visualizador, cobrança por Identidade social do ciclo a R$ 49,90 / mês

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Evidência |
| --- | --- | --- |
| I. Glossário e isolamento | PASS | Data model e OpenAPI usam Conta Capyra como único isolamento; Operador em uma Conta; Papel + Marcas atribuídas em webapp, API e MCP |
| II. Fornecedor social invisível | PASS | `SocialProvider` interno; contrato público só tipos Capyra; `MockProvider` obrigatório em local/CI, nunca fallback de produção; Gate white label por rede |
| III. Contrato web-standard, nuvem é adapter | PASS | Hono + Vite + MCP Fetch; Cloudflare só em `packages/platform` adapters; Site Next isolado (ADR 0007) — não é violação |
| IV. Auth, cobrança e e-mail nossos | PASS | Link mágico/código na API; Stripe na porta `billing`; Resend na porta `email` |
| V. UI stock, marca à parte | PASS | `packages/ui` shadcn default; logo/mascotes em `docs/design/`; MCP sem UI |
| IDs públicos Capyra | PASS | `accountId`, `brandId`, `socialAccountId`, `publicationId`, `destinationId` no OpenAPI |
| OpenAPI canônico | PASS | `contracts/openapi/capyra-api.v1.yaml` + cópia em `specs/001-capyra-social-v1/contracts/` |
| Testes de isolamento + E2E MockProvider | PASS | Pedidos em spec FR-063; tasks por história |
| Redes v1 | PASS | Instagram, TikTok, LinkedIn; demais fora do OpenAPI vendável |

**Re-check pós-Phase 1:** PASS. Site Next isolado não viola III. Quatro apps são o desenho ratificado (ADR 0007 + 0010), não complexidade extra a justificar.

## Project Structure

### Documentation (this feature)

```text
specs/001-capyra-social-v1/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── capyra-api.v1.yaml
├── checklists/
│   └── requirements.md
├── spec.md
└── tasks.md
```

Contrato canônico da constituição: `contracts/openapi/capyra-api.v1.yaml` (cópia idêntica do YAML da feature).

### Source Code (repository root)

```text
apps/api/                 Hono, domínio, rotas /api/v1, SocialProvider
apps/web/                 Vite, React, TanStack Router/Query
apps/site/                Next.js isolado (marketing, i18n)
apps/mcp/                 MCP headless (SDK v2 + createMcpHandler)
packages/platform/        portas db, blob, queue, scheduler, email, billing, secrets, auth
                          adapters: cloudflare/, local/
packages/ui/              shadcn/ui tema padrão — site e webapp
packages/i18n/            catálogos pt-BR, en, es
packages/contracts/       tipos/validadores gerados do OpenAPI
contracts/openapi/        capyra-api.v1.yaml (fonte)
docs/                     PRD, stack, adr, design
CONTEXT.md
tests/
├── contract/             conformidade OpenAPI
├── isolation/            Conta Capyra / Marcas atribuídas
└── e2e/                  Playwright + MockProvider
```

**Structure Decision**: Monorepo npm workspaces exatamente como [`docs/stack.md`](../../docs/stack.md) §9. Sem `apps/ai`. Sem CLI.

## Complexity Tracking

Nenhuma violação da constituição a justificar. Site Next isolado e MCP como quarto app já estão em ADR 0007 e ADR 0010.
