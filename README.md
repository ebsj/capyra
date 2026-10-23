# Capyra Monorepo

Capyra V2 e uma plataforma Cloudflare-first para analise de videos curtos. A
API publica roda em Cloudflare Workers; D1 guarda estado consultavel; R2 guarda
videos, reports e artefatos; Queues coordena processamento; e um Cloudflare
Container Python executa `yt-dlp`, `ffmpeg` e chamadas diretas a OpenAI.

## Comece por aqui

- [AGENT.md](AGENT.md): contrato operacional do repositorio.
- [docs/architecture.md](docs/architecture.md): arquitetura e fluxos.
- [docs/setup.md](docs/setup.md): setup local e producao.
- [docs/development.md](docs/development.md): runbook de desenvolvimento.
- [docs/security-baseline.md](docs/security-baseline.md): baseline de seguranca.

## Mapa

- `apps/api`: Worker TypeScript/Hono, D1, R2, Queues, Cron e Container binding.
- `apps/ai`: container Python privado, com acesso somente a R2 e OpenAI.
- `apps/web`: produto autenticado Next.js/vinext em Worker.
- `apps/site`: site localizado Next.js/vinext em Worker.
- `apps/mcp`: MCP Worker-native.
- `apps/cli`: CLI publica Node, apontando para `https://api.capyra.co/api/v1`.
- `contracts`: OpenAPI canonico, JSON Schemas e tipos/validadores gerados.
- `infra/cloudflare`: configuracao operacional Cloudflare.

## Desenvolvimento local

```bash
npm ci
cd apps/ai && UV_CACHE_DIR=/tmp/capyra-uv-cache uv sync --frozen --group dev && cd ../..
npm run contracts:generate
npm run dev:cloudflare
```

O comando aplica migrations locais, inicia API, MCP, web e site, e espera o
health de cada servico. Wrangler simula Workers, D1, R2 e Queues e usa Docker
somente para construir e executar o Container Python. Veja
[docs/setup.md](docs/setup.md) para secrets, URLs e troubleshooting.

## Validacao

```bash
npm run typecheck
npm run test
npm run check:cloudflare
cd apps/ai && uv run pytest
npm run security:local
```

O contrato publico permanece `/api/v1`. A paridade V1/V2 foi validada pelo
harness em `tests/characterization/`; os runtimes .NET/SQL Server/Azurite foram
removidos do repositorio.


## Capyra Social

O [plano Capyra Social](docs/plans/capyra-social.md) registra decisões de produto
e gates do piloto; o [runbook de desenvolvimento](docs/development.md) orienta
o uso local. Marcas são explícitas em novas análises e uploads, incluindo
CLI/MCP. O teste real do Zernio e o gate white label permanecem pendentes;
esta entrega não realiza deploy.
