# Desenvolvimento

## Fluxo diario

```bash
npm ci
npm run contracts:generate
npm run dev:cloudflare
```

`dev:cloudflare` e o caminho local canonico: Wrangler executa Workers, D1, R2
e Queues, enquanto Docker executa apenas o Container Python. O script reserva
inspectors distintos para API e MCP, espera os cinco health checks e finaliza
todo o conjunto quando qualquer processo falha. Os logs ficam em
`${TMPDIR:-/tmp}/capyra-cloudflare-dev/`.

`OPENAI_API_KEY` e opcional para subir e navegar na solucao, mas obrigatoria
para concluir uma analise. O upload direto local usa o binding R2 local; nao
configure credenciais R2 remotas para desenvolvimento.

O OpenAPI e a fonte canonica. Edite-o antes de mudar payloads, execute a geracao
e nao altere manualmente os arquivos `*.generated.ts`.

Validacao recomendada:

```bash
npm run typecheck
npm run test
npm run check:cloudflare
cd apps/ai && uv run pytest
```

API/D1 isolados:

```bash
npm --workspace @capyra/api run db:migrate:local
npm --workspace @capyra/api run test
npm --workspace @capyra/api run dev
```

O teste de paridade usa `CAPYRA_LEGACY_API_BASE_URL` e
`CAPYRA_WORKER_API_BASE_URL`. O gate foi executado antes da exclusao do legado;
mantenha o harness para regressao contra releases arquivadas. Nao use dados de
usuarios nos fixtures.

Artefatos gerados (`.wrangler`, `.vinext`, `dist`) nao sao fonte. Types do
Wrangler devem ser gerados com `--env-file /dev/null` para nao ler secrets.


## Desenvolvimento do Capyra Social

A visibilidade da análise de vídeo no webapp é controlada por
`VIDEO_ANALYSIS_ENABLED` em `apps/web/lib/features.ts` (atualmente `false`).
Com o módulo oculto, a entrada abre Publicações e as URLs antigas redirecionam
para essa tela após autenticação. Reative alterando a configuração para `true`
e reconstruindo/reiniciando a web. Dados, vínculos existentes, API, CLI, MCP e
site público permanecem preservados.

O [setup Social](setup.md#capyra-social-local) orienta a configuração do simulador
local e do fornecedor real. A Queue `capyra-social`/DLQ processa entregas,
importações, webhooks e probe de mídia sem misturar o consumer de análises.
O dispatcher/reconciliador roda a cada cinco minutos; snapshots e retenção
diariamente. A simulação deve ser explicitamente configurada e não comprova
viabilidade do fornecedor; a homologação segue os [gates do piloto](plans/capyra-social.md#5-gate-de-viabilidade-com-o-zernio).

Provisionamento de adicionais: `node tools/provision-social.mjs --help`. Sem `--apply`, o comando apenas apresenta SQL; com `--apply`, opera exclusivamente no D1 local. Uma Marca adicional concede três identidades; um pacote concede cinquenta análises. Cada operação exige UUID de idempotência e motivo. Não há endpoint público concedendo créditos.
