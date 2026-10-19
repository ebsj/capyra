# AGENT.md — API

`apps/api` e o Worker Hono que implementa a API publica `/api/v1`.

## Stack

- TypeScript, Hono, Zod, Web Crypto/Jose.
- D1 via Drizzle query builder e migrations SQL.
- R2 privado para uploads, reports e artefatos.
- Queues, Cron e Cloudflare Container binding para processamento.

```bash
npm --workspace @capyra/api run dev
npm --workspace @capyra/api run test
npm --workspace @capyra/api run check
```

## Regras

- Preserve as rotas e shapes descritos em `contracts/openapi/capyra-api.v1.yaml`.
- Derive validadores/tipos do contrato e complemente-os com invariantes de dominio.
- Toda query autenticada deve filtrar `account_id`; soft delete fica invisivel.
- Tokens/codes de uso unico exigem update condicional atomico.
- Nao coloque report completo ou binarios no D1.
- Upload direto aceita ate 200 MB; multipart legado, 100 MB.
- Mensagens da fila de analises carregam somente `analysisId`; a fila social separada
  carrega `kind` e ID interno. Ambas exigem idempotencia, lease, DLQ e reconciliacao.
- Novas analises/uploads exigem `brandId`; validacao de Conta/Marca e papel pertence a API.
- SocialProvider e privado; identidade nao comprovada bloqueia publicacao.
- A associacao atual do Operador deve ser validada mesmo com JWT ainda valido.
- O consumer valida o report contra JSON Schema antes do update atomico.
- Nunca logue tokens, prompts, transcricoes ou URLs assinadas.
- Use `wrangler types ... --env-file /dev/null`; secrets nao pertencem ao repo.
