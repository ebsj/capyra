# AGENT.md

## Escopo

Contrato operacional do monorepo Capyra. Para codigo ou comportamento de um
app, consulte seu `AGENT.md`. Para specs, planos ou mudancas de fronteira,
consulte a [constituicao](.specify/memory/constitution.md) e a spec afetada.
O [workflow](docs/agent-workflow.md) orienta leitura e validacao por impacto.

## Execucao e conclusao

Conclua o escopo solicitado, incluindo verificacao do resultado e correcao das
falhas causadas pela mudanca. Edicoes reversiveis e validacoes locais pertinentes
podem continuar sem nova confirmacao. Nao encerre na primeira implementacao
se ainda houver trabalho autorizado; pare diante de um bloqueio concreto ou
de uma decisao que dependa do usuario. Uma etapa de skill concluida nao encerra
as demais etapas que o usuario ja pediu.

Use fixtures descartaveis e emulacao local para testes. Acesso a producao,
migrations remotas, publicacao e chamadas pagas exigem escopo autorizado; os
comandos abaixo nao concedem essa autorizacao. Rode os checks afetados e amplie
a validacao apenas se o impacto ou os resultados justificarem. Para texto sem
efeito no runtime, revise links/conteudo e use `git diff --check`.

## Arquitetura oficial

- `apps/api`: Cloudflare Worker TypeScript/Hono; unica fronteira de negocio.
- `apps/ai`: Cloudflare Container Python; R2 e OpenAI apenas, sem D1/auth.
- `apps/web` e `apps/site`: Next.js compilado por vinext para Workers.
- `apps/mcp`: MCP Worker-native; usa Service Binding da API.
- `apps/cli`: cliente Node da API publica.
- `contracts/openapi/capyra-api.v1.yaml`: contrato HTTP canonico.
- `contracts/schemas`: schemas de reports; `contracts/typescript`: derivados.

## Runtime e comandos

Wrangler e o runtime local oficial para Workers/D1/R2/Queues. Docker serve
somente ao Container Python.

```bash
npm ci
npm run contracts:generate
npm run dev:cloudflare
npm run typecheck
npm run test
npm run check:cloudflare
cd apps/ai && uv run pytest
```

URLs locais: API `5080`, MCP `5090`, web `3000`, site `3001`.

## Regras

- Preserve `/api/v1`, payloads camelCase, OAuth, reports, polling, CLI e MCP.
- `POST /analyses` cria `pending`; Queues processa; `GET /analyses/{id}` faz polling.
- D1 guarda apenas estado consultavel; report completo e artefatos ficam no R2.
- A AI nunca acessa D1, JWT, Firebase ou OAuth.
- `content_strategy`, `filming`, `editing` e `audio_music` sao publicados;
  `compliance` e ID historico nao publicado.
- MCP e CLI nunca chamam a AI diretamente.
- Toda mudanca de fronteira atualiza OpenAPI, schemas, derivados e testes.
- Migrations de producao sao aplicadas antes do Worker e seguem expand/contract.
- Nao reintroduza .NET, SQL Server, Azurite ou Compose integrado.

## Handoff

- [API](apps/api/AGENT.md), [AI](apps/ai/AGENT.md), [web](apps/web/AGENT.md),
  [site](apps/site/AGENT.md), [MCP](apps/mcp/AGENT.md), [CLI](apps/cli/AGENT.md).
- Mudancas de runtime atualizam README, `docs/setup.md`,
  `docs/development.md`, arquitetura e baseline de seguranca.
