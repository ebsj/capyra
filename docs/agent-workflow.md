# Agent Workflow

## Leitura por impacto

Use `AGENT.md` como contrato e consulte apenas os documentos que ajudam na
tarefa atual. Instrucoes ja lidas continuam validas; nao ha releitura obrigatoria
por edicao.

- Codigo/comportamento de app: `apps/<app>/AGENT.md`.
- Specs, planos ou fronteiras: constituicao e spec afetada; arquitetura e
  contratos quando houver interacao entre apps.
- Runtime, bindings ou secrets: setup/development e runbook pertinente.
- Texto ou ajuste localizado: arquivo afetado e referencias relevantes.

Para o fluxo Spec Kit e sua manutencao, consulte [Spec Kit](speckit.md).

## Matriz de impacto

| Mudanca | Atualizar junto | Validacao minima |
| --- | --- | --- |
| API/auth | OpenAPI, derivados, consumers | `npm -w @capyra/api test && npm -w @capyra/api run check` |
| Report/skill | Python, JSON Schema, projecao API | `uv run pytest` e testes API |
| D1/R2/Queue | migration, docs e testes de runtime | migration local e Vitest Workers |
| Web | proxy/models se afetados | lint; build para rotas/config/data loading; smoke para fluxo |
| Site | mensagens/rotas/CTA se afetados | lint; build para rotas/config/runtime |
| MCP/CLI | integration-core e docs | typecheck, test e build |
| Security | runner e runbook | comando de baseline afetado |
| Docs/instrucoes | referencias afetadas | links/conteudo e `git diff --check` |

Escolha os checks pelo comportamento alterado. A suite completa abaixo serve
para integracao ampla e CI; nao e um ritual para toda edicao. Corrija falhas
introduzidas pela tarefa e repita os checks afetados. Testes locais usam
fixtures/emulacao; nao deduza autorizacao para producao ou servicos pagos.

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

Informe o resultado, evidencias de validacao e limitacoes materiais. Cite apps,
contratos, migrations e premissas apenas quando afetados. Nao documente
comportamento futuro como concluido. Termine quando o escopo estiver atendido
e verificado, ou descreva o bloqueio concreto e o trabalho restante.
