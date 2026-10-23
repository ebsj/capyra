# Setup Cloudflare-first

## Pre-requisitos

- Node.js 22 e npm;
- Wrangler autenticado para provisionar/deploy;
- Python 3.12 e `uv`;
- Docker apenas para construir/executar o Container Python.

```bash
npm ci
cd apps/ai
UV_CACHE_DIR=/tmp/capyra-uv-cache uv sync --frozen --group dev
cd ../..
npm run contracts:generate
```

## Local

Para executar analises reais, copie `apps/api/.dev.vars.example` para
`apps/api/.dev.vars` (nao versionado) e configure `OPENAI_API_KEY`. Sem ela, o
ambiente ainda sobe e emite um aviso; somente a analise falha explicitamente.
Inicie toda a solucao com:

```bash
npm run dev:cloudflare
```

O script valida Docker, aplica D1 local, inicia API `5080`, MCP `5090`, web
`3000` e site `3001`, e so anuncia sucesso depois de todos os health checks. O
health do container tambem forca o build/start de `apps/ai/Dockerfile.cloudflare`.
Se um processo morrer, o comando encerra os demais e mostra o log relevante em
`${TMPDIR:-/tmp}/capyra-cloudflare-dev/`.

No modo local, tickets de upload direto apontam para um relay assinado e
restrito da API, que grava no mesmo binding R2 simulado usado por Queue e
Container. A CSP da web permite `http://localhost:5080` para esse upload
somente em paginas locais; `CAPYRA_SOURCE_ASSET_UPLOAD_ORIGIN` pode substituir
essa origem por outro endereco de loopback. Em producao, os tickets continuam
sendo URLs R2 presignadas. O container acessa R2 por um host privado interceptado
pelo Worker e nao recebe
credenciais do bucket.

Health checks:

- API: `http://localhost:5080/api/v1/health`
- Container AI: `http://localhost:5080/__dev/container-health`
- MCP: `http://localhost:5090/healthz`
- Web: `http://localhost:3000/api/health`
- Site: `http://localhost:3001/api/health`

## Producao

Antes do primeiro deploy, execute `infra/scripts/provision-production.sh`,
substitua os IDs marcados no `wrangler.jsonc` e grave secrets com
`wrangler secret put`. O provisionador cria D1, R2, Queue/DLQ com retencao de
quatro dias e aplica CORS/lifecycle do bucket.

Configure no environment `production` do GitHub os secrets
`CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID`. O token deve ter somente as
permissoes de conta Workers Scripts, Containers, D1, Queues e Workers R2
Storage como `Edit`, Account Settings como `Read`; na zona `capyra.co`, Workers
Routes como `Edit`; e no usuario, User Details e Memberships como `Read`.

O Worker `capyra-api` exige `CAPYRA_AUTH_SIGNING_KEY`,
`CAPYRA_R2_ACCESS_KEY_ID`, `CAPYRA_R2_SECRET_ACCESS_KEY` e `OPENAI_API_KEY`.
A chave OpenAI pertence logicamente ao runtime AI, mas fica armazenada como
Worker Secret da API porque esse Worker inicia o Container e repassa a chave
por `envVars`.

As configuracoes publicas Firebase ficam em `apps/web/wrangler.jsonc`. O
preflight de deploy rejeita placeholders, valores
publicos vazios, credenciais GitHub ausentes e Worker Secrets obrigatorios
ausentes. Nenhum secret deve aparecer em `vars`, logs ou arquivos versionados;
somente `.dev.vars.example` e versionado para desenvolvimento local.

Depois do primeiro deploy, crie uma conta exclusiva de smoke e configure no
environment `production` os secrets `CAPYRA_SMOKE_EMAIL`,
`CAPYRA_SMOKE_PASSWORD` e `CAPYRA_SMOKE_VIDEO_URL`. Defina a variable
`CAPYRA_REQUIRE_ANALYSIS_SMOKE=true` depois de validar essa conta. O smoke passa
a criar, acompanhar e remover uma analise real, cobrindo Queue, Container, R2 e
OpenAI; antes desse bootstrap, o pipeline registra explicitamente que executou
somente o smoke HTTP.

A ordem de release e: testes → migration D1 remota → API/container → web → site
→ MCP → smoke. Produção e disparada apenas pela branch principal. Migrations
posteriores devem usar expand/contract, pois rollback de Worker nao reverte D1.


## Capyra Social local

Selecione explicitamente `CAPYRA_SOCIAL_PROVIDER=mock` em `apps/api/.dev.vars` para testes locais sem Zernio. O simulador não pode ser usado fora do ambiente local. Para o teste real posterior, configure `CAPYRA_SOCIAL_PROVIDER=zernio`, `ZERNIO_API_KEY` e `ZERNIO_WEBHOOK_SECRET`. Consulte os [gates do piloto Social](plans/capyra-social.md#5-gate-de-viabilidade-com-o-zernio). Ausência de token gera erro de configuração, sem fallback silencioso. Não é necessário configurar OpenAI para validar metadados de mídia. Nunca copie credenciais reais para arquivos `.example`.
