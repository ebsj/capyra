# AGENT.md

## Escopo

Use este guia para mudancas dentro de `apps/mcp`. Este app e o servidor MCP
remoto da Capyra para ChatGPT, Claude e clientes compativeis.

## Stack e entrypoints

- Cloudflare Worker + TypeScript, com transporte Web Standard stateless.
- Entry point em `src/server.ts`.
- MCP SDK via `@modelcontextprotocol/sdk`.
- Helpers compartilhados em `@capyra/integration-core`.

Rodar no host:

```bash
npm --workspace @capyra/mcp run dev
```

## Mapa critico

- `src/server.ts`: servidor HTTP/MCP, discovery, OAuth metadata e tools.
- `package.json`: scripts, build e dependencias.
- `README.md`: contrato publico de auth, env vars e desenvolvimento.
- `@capyra/integration-core`: HTTP, polling, erros e auth compartilhados.

## Regras locais

- Mantenha o app focado em remote MCP.
- Auth deve usar OAuth da Capyra e tokens emitidos por `apps/api`.
- Tools devem refletir comportamento publico de `apps/api`.
- Reuse `@capyra/integration-core`; nao duplique client HTTP ou polling.
- MCP nao le sessao local da CLI.
- MCP nao chama `apps/ai` diretamente.

## Checklist de sincronizacao

- Mudou OAuth/discovery: atualizar README MCP, API OAuth, setup local e testes.
- Mudou tool: atualizar docs publicos e contratos se o payload mudar.
- Mudou env var/binding: atualizar README MCP, `wrangler.jsonc` e setup.
- Mudou integracao API: conferir `apps/api`, contratos e integration-core.

## Validacao

```bash
npm --workspace @capyra/mcp run typecheck
npm --workspace @capyra/mcp run test
npm --workspace @capyra/mcp run build
```

## Nao faca

- Nao dependa de `capyra login`.
- Nao acesse AI diretamente.
- Nao embuta logica de produto que pertence a API.
- Nao anuncie URLs OAuth inacessiveis pelo cliente local.
