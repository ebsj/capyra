# AGENT.md

## Escopo

Use este guia para mudancas dentro de `apps/cli`. Este app publica a CLI
`@capyra/cli` para terminal, Codex, Claude Code e automacoes.

## Stack e entrypoints

- Node.js + TypeScript.
- Commander em `src/cli.ts`.
- Contratos de `@capyra/contracts`.
- Helpers de `@capyra/integration-core`.

Rodar/buildar:

```bash
npm --workspace @capyra/cli run build
```

## Mapa critico

- `src/cli.ts`: comandos, parsing, output e auth flow.
- `README.md`: contrato publico de instalacao e comandos.
- `scripts/fix-bin.mjs`: ajuste do binario depois do build.
- `package.json`: versao, bin, publish config e scripts.
- `@capyra/integration-core`: HTTP, token store, polling e erros.

## Regras locais

- CLI fala somente com `apps/api`.
- Nao chame `apps/ai` diretamente.
- Saida default deve continuar JSON machine-readable.
- Saida humana e opcional e nao pode quebrar o contrato JSON.
- Browser/device login e o fluxo suportado.
- Reuse `@capyra/integration-core` para HTTP, polling e token store.

## Checklist de sincronizacao

- Mudou comando: atualizar README e testes.
- Mudou payload/API: atualizar contratos e integration-core se necessario.
- Mudou auth/session: atualizar README, API OAuth e testes.

## Validacao

```bash
npm --workspace @capyra/cli run typecheck
npm --workspace @capyra/cli run test
```

## Nao faca

- Nao mude o output default para texto humano.
- Nao armazene tokens fora do token store compartilhado sem documentar.
- Nao crie comportamento CLI que diverge da API canonica.
