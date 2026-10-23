# Agent Workflow

## Leitura por impacto

Use `AGENT.md` como contrato e consulte apenas os documentos que ajudam na
tarefa atual. Instrucoes ja lidas continuam validas; nao ha releitura obrigatoria
por edicao.

- Codigo/comportamento de app: `apps/<app>/AGENT.md`.
- Planos ou fronteiras: arquitetura, contratos e decisoes de produto afetadas.
- Runtime, bindings ou secrets: setup/development e runbook pertinente.
- Texto ou ajuste localizado: arquivo afetado e referencias relevantes.

## Planejamento por impacto

Planeje entregas que possam ser implementadas, testadas e demonstradas de ponta
a ponta. Explicite dependencias e gates de rollout; limite fundacoes ao que
bloqueia as entregas. Considere contratos, dados/storage, modos de falha,
seguranca, custo, validacao e documentacao conforme o impacto. Pedidos apenas
de plano ou revisao terminam no artefato solicitado.

## Matriz de impacto

| Mudanca | Atualizar junto | Validacao minima |
| --- | --- | --- |
| API/auth | OpenAPI, derivados, consumers | `npm -w @capyra/api test && npm -w @capyra/api run check` |
| Report/skill | Python, JSON Schema, projecao API | `uv run pytest` e testes API |
| D1 | migration, docs e testes de runtime | migration local, constraints e Vitest Workers |
| R2 | contratos de upload/storage e docs | ownership, upload e streaming |
| Queue/Container | consumer, docs e testes de runtime | duplicatas, retries, timeout e reconciliacao |
| Web | proxy/models se afetados | lint; build para rotas/config/data loading; smoke para fluxo |
| Site | mensagens/rotas/CTA se afetados | lint; build para rotas/config/runtime |
| MCP/CLI | integration-core e docs | typecheck, test e build |
| Security | runner e runbook | comando de baseline afetado |
| Docs/instrucoes | referencias afetadas | links/conteudo e `git diff --check` |

Escolha os checks pelo comportamento alterado. A suite completa abaixo serve
para integracao ampla e CI; nao e um ritual para toda edicao. Corrija falhas
introduzidas pela tarefa e repita os checks afetados. Testes locais usam
fixtures/emulacao; nao deduza autorizacao para producao ou servicos pagos.

Mudancas em bindings Wrangler exigem geracao e verificacao dos tipos. Prepare
deploy com checks de configuracao e dry-run; um deploy autorizado inclui
migrations remotas aplicaveis e smoke posterior. A substituicao de runtime
exige testes de caracterizacao, contrato, integracao e consumers antes de
remover o anterior.

## Comandos canonicos

```bash
npm ci
npm run contracts:generate
npm run typecheck
npm run test
npm run check:cloudflare
cd apps/ai && uv sync --frozen --group dev && uv run pytest
```

Runtime local:

```bash
npm run dev:cloudflare
curl http://localhost:5080/health/live
curl http://localhost:3000/api/health
curl http://localhost:3001/api/health
curl http://localhost:5090/healthz
```

## Handoff

Informe o resultado, evidencias de validacao, motivo dos checks nao executados
e limitacoes materiais. Cite apps, contratos, migrations e premissas apenas
quando afetados. Nao documente
comportamento futuro como concluido. Termine quando o escopo estiver atendido
e verificado, ou descreva o bloqueio concreto e o trabalho restante.
