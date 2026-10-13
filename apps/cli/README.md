# Capyra CLI

CLI publica da plataforma Capyra para autenticacao, assets e analyses. A CLI e
um adaptador sobre `apps/api`; ela nao chama `apps/ai` diretamente.

## Requisitos

- Node.js 20 ou superior.
- Uma conta Capyra.

## Instalacao

Global:

```bash
npm install -g @capyra/cli
capyra --help
```

Sem instalacao global:

```bash
npx @capyra/cli --help
```

## Login

```bash
capyra login
capyra whoami
capyra logout
```

O login usa device flow. O comando tenta abrir o navegador e tambem imprime a
URL de verificacao.

## Comandos principais

```bash
capyra skills list
capyra assets list
capyra assets upload ./video.mp4
capyra analyses create --url "https://example.com/video.mp4"
capyra analyses create --asset "<sourceAssetId>"
capyra analyses create --file ./video.mp4
capyra analyses list
capyra analyses latest --limit 10 --format json
capyra analyses get "<analysisId>"
capyra analyses wait "<analysisId>"
```

Saida default e JSON machine-readable. Para saida legivel:

```bash
capyra --format human analyses list
capyra --format human analyses latest --limit 10
```

`capyra analyses list` preserva o formato raw compatível da API. Para pedidos
de "ultimas analises", prefira `capyra analyses latest`: ele retorna `total`,
`returned`, `limit`, `sort`, `hasMore`, `nextCursor`, campos achatados em
`items` e, no modo humano, uma tabela com data, arquivo, status, skills, score
e principal oportunidade. Use `capyra analyses get "<analysisId>"` para buscar o
report completo de uma linha selecionada.

## Variaveis de ambiente

- `CAPYRA_API_BASE_URL`: sobrescreve a API. Default:
  `https://api.capyra.co/api/v1`.
- `CAPYRA_OUTPUT_FORMAT`: `json` ou `human`.
- `CAPYRA_CLI_SESSION_FILE`: caminho alternativo para sessao local.

## Desenvolvimento

```bash
npm install
npm --workspace @capyra/cli run build
npm --workspace @capyra/cli run typecheck
npm --workspace @capyra/cli run test
```

## Regras para agentes

- Leia [AGENT.md](AGENT.md) antes de editar.
- Preserve JSON como formato default.
- Reuse `@capyra/integration-core`.
- Atualize este README quando comandos ou auth mudarem.


## Capyra Social: Marca explícita

Use `capyra whoami` para consultar IDs das Marcas. `capyra assets upload video.mp4 --brand-id <UUID>` e `capyra analyses create --url <URL> --brand-id <UUID>` exigem Marca ativa. Requisições antigas sem Marca deixam de ser aceitas. Output JSON, OAuth e polling são preservados; a CLI não publica em redes sociais.
