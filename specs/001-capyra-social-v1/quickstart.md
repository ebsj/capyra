# Quickstart: Capyra Social v1

Validação local do recorte US1–US7 (+ contrato). Não é guia de implementação: o código vive em `tasks.md`.

## Prerequisites

- Node.js 22+
- Wrangler (API, MCP, D1, R2, Queues)
- Contas de teste Stripe e Resend **ou** adapters `local` que gravam e-mail/checkout em arquivo
- `MockProvider` ligado (`SOCIAL_PROVIDER=mock`). Credencial real do fornecedor só no Gate white label.

## Setup (depois das tasks de Phase 1–2)

```bash
npm install
npm run db:migrate          # Drizzle via adapter local/D1
npm run contracts:generate  # OpenAPI → packages/contracts
npm run dev:api             # Wrangler, apps/api
npm run dev:web             # Vite, apps/web
npm run dev:site            # Next, apps/site
npm run dev:mcp             # Wrangler, apps/mcp
```

Contrato canônico: [`contracts/openapi/capyra-api.v1.yaml`](../../contracts/openapi/capyra-api.v1.yaml).

## Jornadas de aceite (MockProvider)

Use e-mails distintos. Tipo de conta `agency`. Fuso da Marca: não mude o navegador e espere `America/Sao_Paulo`.

1. **US1** — Pedir acesso, abrir o link **e** (em outro e-mail) usar o código. Conta + Marca placeholder. Segundo uso do fator falha.
2. **US2** — Confirmar nome da Marca. Convidar Criador, Aprovador, Visualizador (Marcas vazias no Visualizador). Atribuir Marcas. Visualizador não vê a segunda Marca. Remover o Criador: próximo request autenticado falha.
3. **US3** — Como Proprietário, conectar Instagram, TikTok e LinkedIn simulados. Recusar a mesma identidade em outra Conta. Criador não inicia OAuth. URLs de autorização não nomeiam o Fornecedor social.
4. **US4** — Criador sobe mídia ≤ 200 MB e cria Publicação com dois Destinos divergentes. Aprovador não envia arquivo.
5. **US5** — Política obrigatória. Aprovar Destino **com** horário → agendado. Editar legenda do aprovado → volta para revisão. Segundo Destino permanece em revisão.
6. **US6** — Calendário lista o item. Simular `delivery_unknown` e `falha_definitiva`. Retry só no falho. Cancelamento só fecha após confirmação do mock.
7. **US7** — Três Instagrams em três Marcas → lista R$ 149,70. Reconectar o mesmo não duplica. Marcar Conta `delinquent` no adapter local: aprovar com horário falha; comentar segue.

## Relatórios, concorrentes, MCP, site

8. **US8** — Relatório com métrica `null` não vira `0`. PDF = capivara-logo + “Capyra”. CSV só dados.
9. **US9** — Busca Meta exige Instagram na Marca; LinkedIn exige LinkedIn. IDs públicos são Capyra.
10. **US10** — MCP com token do Criador: calendário das Marcas atribuídas; conectar rede recusado.
11. **US11** — `/pt-br`, `/en`, `/es` no site; sem cookie de Operador.

## Testes automatizados

```bash
npm run test                # Vitest: unidade + isolamento + contrato
npm run test:isolation      # Conta cruzada e Marca não atribuída
npm run test:contract       # OpenAPI (packages/contracts)
npm run test:e2e            # Playwright + MockProvider
```

Esperado: 100% das mutações de isolamento recusadas (SC-006); nenhum ID/nome de Fornecedor social no contrato público.

## Gate white label (não é este quickstart)

Prova prática por rede (Instagram, TikTok, LinkedIn) com evidência. Sem `go`, a rede permanece oculta na UI. Não usar `MockProvider` como evidência comercial.

## Done when

Os oito critérios de aceite do PRD §17 passam neste ambiente local (1–7 + testes de contrato/isolamento com MockProvider). Critério 2 de publicação no prazo em produção espera o Gate `go`.
