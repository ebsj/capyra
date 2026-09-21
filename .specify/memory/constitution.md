# Constituição Capyra Social

Princípios que o Speckit e o código não podem contradizer. O glossário está em [`CONTEXT.md`](../../CONTEXT.md). O produto está em [`docs/PRD.md`](../../docs/PRD.md). As decisões caras estão em [`docs/adr/`](../../docs/adr/README.md). A stack está em [`docs/stack.md`](../../docs/stack.md). A marca está em [`docs/design/`](../../docs/design/README.md).

Isto **não** é o template Library-First / CLI / TDD do Speckit. Esses padrões foram recusados para o Capyra.

## Core Principles

### I. Glossário e isolamento

O vocabulário canônico é o `CONTEXT.md`. **Conta Capyra** é o único isolamento. **Marca** não é tenant. Um e-mail autenticado é um **Operador** em exatamente uma Conta. Toda ação autenticada (webapp, API, MCP) é desse Operador, com um **Papel** e **Marcas atribuídas**.

### II. Fornecedor social invisível

Toda rede passa por `SocialProvider`. A API pública e a UI falam só tipos Capyra. Uma rede só é vendida depois do **Gate white label** prático. `MockProvider` nunca é fallback silencioso em produção.

### III. Contrato web-standard, nuvem é adapter

API, webapp e MCP usam o contrato Fetch. Cloudflare é o primeiro adapter, não o domínio. Site Next.js é app isolado: sem sessão de Operador, sem `/api/v1` de negócio, sem importar `apps/web` nem `apps/api`. Sem Nest, Express, Prisma, Durable Objects no domínio, Python ou CLI neste corte.

### IV. Auth, cobrança e e-mail nossos

Sessão do **Operador** vive na API (link mágico / código). Sem Firebase, Clerk ou senha na v1. Checkout Stripe em BRL alinhado à **Identidade social do ciclo**. E-mail transacional Resend, remetente Capyra, sem o **Fornecedor social**.

### V. UI stock, marca à parte

Site e webapp usam só shadcn/ui no tema padrão (`packages/ui`). Logo e mascotes vêm de `docs/design/`. Não extrair paleta das ilustrações. Header, PDF e e-mail: capivara-logo + a palavra “Capyra”. MCP não tem UI.

## Constraints

- IDs públicos: `accountId`, `brandId`, `socialAccountId`, `publicationId`, `destinationId` — nunca IDs do fornecedor.
- OpenAPI em `contracts/openapi` é a fonte do contrato `/api/v1`; a API não inventa campo.
- Testes de isolamento por Conta Capyra e Marcas atribuídas; E2E com `MockProvider`.
- Recusar reabrir a tabela “Recusados” de `docs/stack.md` sem ADR novo.

## Workflow

1. Termo de domínio novo ou conflito de linguagem → `CONTEXT.md` (e ADR se for irreversível).
2. Escolha cara de reverter → ADR em `docs/adr/`.
3. Feature → Speckit: specify → (clarify) → plan → tasks → (analyze) → implement, sempre contra esta constituição e o PRD.
4. Rede nova → Gate white label `go` antes de aparecer na UI/billing.

## Governance

Esta constituição prevalece sobre hábito de framework, atalho de fornecedor e o template padrão do Speckit. Emenda exige ADR + atualização deste arquivo. Spec e código que violem I–V não entram.

**Version**: 1.0.0 | **Ratified**: 2026-09-21 | **Last Amended**: 2026-09-21
