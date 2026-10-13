# Capyra MCP

Servidor MCP remoto da Capyra para ChatGPT, Claude e clientes compativeis. O
MCP e um adaptador sobre `apps/api`; ele nao chama `apps/ai` diretamente e nao
le sessao local da CLI.

## Autenticacao

O fluxo principal e OAuth Authorization Code com PKCE. Clientes MCP que
suportam descoberta OAuth abrem o navegador, enviam o usuario para a Capyra e
recebem tokens pelo callback configurado pelo cliente.

Fallback suportado: Device Authorization Grant. O cliente mostra um codigo, o
usuario autoriza no navegador e o host MCP conclui a sessao.

## Endpoints anunciados

- `issuer`: `CAPYRA_OAUTH_ISSUER_URL` quando informado; senao
  `CAPYRA_WEB_BASE_URL`.
- `authorization_endpoint`: `${CAPYRA_WEB_BASE_URL}/oauth/authorize`
- `device_authorization_endpoint`:
  `${CAPYRA_OAUTH_API_PUBLIC_BASE_URL}/oauth/device/code`
- `token_endpoint`: `${CAPYRA_OAUTH_API_PUBLIC_BASE_URL}/oauth/token`
- `revocation_endpoint`: `${CAPYRA_OAUTH_API_PUBLIC_BASE_URL}/oauth/revoke`
- MCP endpoint local: `http://localhost:5090/mcp`
- Health local: `http://localhost:5090/healthz`

## Tools

- `auth_status`: descreve a sessao OAuth autenticada vinculada a requisicao MCP.
- `list_analysis_skills`: lista o catalogo publicado de skills de analise.
- `list_source_assets`: lista assets reutilizaveis da conta autenticada.
- `start_source_asset_upload_session`: cria uma sessao de upload no navegador e
  retorna uma URL que resolve para `sourceAssetId`.
- `get_source_asset_upload_session`: consulta o estado de uma sessao de upload.
- `create_analysis_from_url`: cria analysis a partir de URL publica best effort.
- `create_analysis_from_source_asset`: cria analysis a partir de
  `sourceAssetId`.
- `list_analyses`: lista analyses da conta autenticada no formato raw
  compatível de `/api/v1/analyses`.
- `list_latest_analyses`: lista as analyses mais recentes com `total`,
  `returned`, `limit`, `hasMore`, `nextCursor`, campos achatados para tabela e
  orientação explícita para não responder "sem dados" quando `items` vier
  preenchido.
- `summarize_analyses`: retorna uma resposta pronta em formato `table`,
  `brief` ou `detailed`, com `itemsUsed`, `totalAvailable` e os mesmos itens
  leves usados por `list_latest_analyses`.
- `get_analysis`: busca uma analysis por id.
- `wait_for_analysis`: faz polling ate a analysis sair de `pending`.

### Skills publicadas

`list_analysis_skills` reflete o catalogo publicado atual da API. Para novas
analyses, o MCP anuncia e seleciona por default apenas `content_strategy`,
`filming`, `editing` e `audio_music`. O id historico `compliance` continua
retido para resultados antigos, mas esta temporariamente indisponivel para
novas analyses enquanto a skill e melhorada.

Quando `skills` e omitido, ou quando uma chamada pede `all` ou `recommended`,
o MCP resolve os ids publicados via API e nao inclui `compliance`. Se uma
chamada antiga ou explicita enviar `skills: ["compliance"]`, o MCP retorna:

```json
{
  "error": "skill_temporarily_unavailable",
  "message": "The compliance/copywriting legal skill is temporarily unavailable for new analyses.",
  "unavailableSkills": ["compliance"],
  "analysisCreated": false
}
```

Esse retorno acontece antes da criacao da analysis; a API continua sendo a
autoridade final de validacao.

### Analyses recentes

Use `list_latest_analyses` ou `summarize_analyses` quando o usuario pedir
"minhas ultimas analises", "liste analises recentes" ou uma tabela. O default
retorna 10 itens em ordem `createdAt_desc`, com `includeSummary=true`,
`includeSkillDetails=false` e `includePresentation=true` quando solicitado pelo
cliente.

Exemplo de chamada:

```json
{
  "limit": 10,
  "includeSummary": true,
  "includeSkillDetails": false
}
```

Resposta esperada para tabela:

```md
Foram encontradas 50 analises. Mostrando 10 mais recentes primeiro.

| Data | Arquivo | Status | Skills | Score | Principal oportunidade |
|---|---|---|---|---:|---|
```

Quando o usuario escolher uma linha, use `get_analysis` com o `id` listado para
buscar report, artefatos e demais campos de detalhe. Mantenha `list_analyses`
para consumidores que precisam do historico raw compatível.

## Bindings e variaveis

- `CAPYRA_API_BASE_URL`: API Capyra. Default:
  `http://127.0.0.1:5080/api/v1`.
- `CAPYRA_OAUTH_API_PUBLIC_BASE_URL`: API Capyra publica anunciada no
  discovery OAuth. Default: `CAPYRA_API_BASE_URL`.
- `CAPYRA_WEB_BASE_URL`: app web para login/autorizacao. Default:
  `http://127.0.0.1:3000`.
- `CAPYRA_OAUTH_ISSUER_URL`: issuer anunciado. Default:
  `CAPYRA_WEB_BASE_URL`.
- `CAPYRA_MCP_PUBLIC_BASE_URL`: URL publica do MCP. Default:
  `http://127.0.0.1:5090`.
- `CAPYRA_MCP_HOST`: bind host. Default: `127.0.0.1`.
- `CAPYRA_MCP_PORT`: porta. Default: `5090`.
- `CAPYRA_MCP_RESOURCE_NAME`: nome exibido. Default: `Capyra MCP`.
- `CAPYRA_MCP_DOCUMENTATION_URL`: URL de docs anunciada. Default:
  `CAPYRA_WEB_BASE_URL`.

Producao (`wrangler.jsonc`):

```bash
CAPYRA_API_BASE_URL=https://api.capyra.co/api/v1
CAPYRA_OAUTH_API_PUBLIC_BASE_URL=https://api.capyra.co/api/v1
CAPYRA_WEB_BASE_URL=https://web.capyra.co
CAPYRA_MCP_PUBLIC_BASE_URL=https://mcp.capyra.co
```

Chamadas internas usam o Service Binding `API`; URLs publicas do discovery
continuam acessiveis aos clientes externos.

## Desenvolvimento

```bash
npm install
npm --workspace @capyra/mcp run dev
```

Runtime local completo:

```bash
npm run dev:cloudflare
```

## Validacao

```bash
npm --workspace @capyra/mcp run typecheck
npm --workspace @capyra/mcp run test
curl http://localhost:5090/healthz
```

## Regras para agentes

- Leia [AGENT.md](AGENT.md) antes de editar.
- Reuse `@capyra/integration-core`.
- Mantenha OAuth e tool semantics alinhados com `apps/api`.
- Atualize `docs/setup.md` e `wrangler.jsonc` quando discovery, bindings, env vars ou URLs
  anunciadas mudarem.


## Capyra Social: Brand context

`auth_status` returns available Brands under `session.brands`. Pass a Brand UUID in `brandId` to `create_analysis_from_url`, `create_analysis_from_source_asset` and `start_source_asset_upload_session`. Missing Brand is a validation error; no default Brand is silently selected. Existing OAuth and polling remain; no social publishing tools are introduced.
