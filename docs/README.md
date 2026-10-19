# Documentacao do projeto

`docs/` e a fonte canonica para estado estavel de produto, arquitetura, setup,
operacao e processo. READMEs locais e `apps/*/AGENT.md` complementam estes docs
com detalhes de implementacao por app.

## Referencias por necessidade

Escolha pelo impacto da tarefa; esta lista nao e uma sequencia obrigatoria.

1. [Agent workflow](agent-workflow.md)
2. [Constituicao Spec Kit](../.specify/memory/constitution.md)
3. [Arquitetura](architecture.md)
4. [Setup local](setup.md)
5. [Runbook de desenvolvimento](development.md)
6. [Security baseline](security-baseline.md)
7. [Fundacao do banco](database-foundation.md)
8. [Plano Capyra Social](plans/capyra-social.md)

## Documentacao global

- [Agent workflow](agent-workflow.md): matriz de impacto, comandos canonicos e
  criterios de handoff para agentes.
- [Spec Kit](speckit.md): versao, atualizacao e uso das skills do projeto.
- [Constituicao Spec Kit](../.specify/memory/constitution.md): principios,
  constraints e gates obrigatorios para specs, planos e tarefas.
- [Arquitetura](architecture.md): mapa de apps, dependencias e fluxos de
  analyses.
- [Setup local](setup.md): Wrangler, bindings, secrets, URLs e troubleshooting.
- [Runbook de desenvolvimento](development.md): comandos, validacoes, scripts e
  convencoes operacionais.
- [Security baseline](security-baseline.md): SAST, secrets, dependencias,
  containers e DAST local.
- [Fundacao do banco](database-foundation.md): D1, migrations e storage R2.
- [Plano Capyra Social](plans/capyra-social.md): proposta revisada de dominio,
  integracao, publicacao, metricas, oferta e gates do piloto social.
- [Glossario do Capyra](../CONTEXT.md): linguagem canonica do dominio social.
- [Decisoes do Capyra Social](adr/README.md): indice dos registros curtos de
  decisoes arquiteturais e de produto.

## Contratos canonicos

- [TypeScript shared contracts](../contracts/typescript/src/index.ts)
- [OpenAPI](../contracts/openapi/capyra-api.v1.yaml)
- [JSON Schemas](../contracts/schemas/)

## Documentacao por app

- `apps/api`: [AGENT](../apps/api/AGENT.md)
- `apps/ai`: [README](../apps/ai/README.md), [AGENT](../apps/ai/AGENT.md)
- `apps/web`: [AGENT](../apps/web/AGENT.md)
- `apps/site`: [AGENT](../apps/site/AGENT.md)
- `apps/mcp`: [README](../apps/mcp/README.md), [AGENT](../apps/mcp/AGENT.md)
- `apps/cli`: [README](../apps/cli/README.md), [AGENT](../apps/cli/AGENT.md)

## Brand

- [Design system source of truth](design/README.md)
- [Site brand runtime summary](design/site.md)
- [Web derived brand system](design/web.md)

## Convencoes

- `README.md` e ponto de entrada; nao deve virar backlog ou runbook longo.
- `AGENT.md` na raiz e o contrato operacional padrao para agentes; `AGENTS.md`
  e `CLAUDE.md` sao entrypoints finos para Codex App e Claude Code.
- `.specify/memory/constitution.md` define os gates obrigatorios para specs,
  planos, tarefas e handoff.
- `docs/agent-workflow.md` define como escolher docs, testes e contratos
  afetados.
- Mudancas cross-app devem atualizar docs globais, docs locais, contratos e
  testes no mesmo change.
- URL publica para video continua best effort; upload direto e `sourceAssetId`
  sao caminhos mais estaveis.
