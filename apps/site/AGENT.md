# AGENT.md

## Escopo

Use este guia para mudancas dentro de `apps/site`. Este app e o site
institucional localizado e deve apontar usuarios para `apps/web`.

## Stack e entrypoints

- Next.js `16` com App Router, compilado por vinext para Cloudflare Workers.
- React `19` e TypeScript.
- Rotas localizadas em `src/app/[locale]/`: landing em `page.tsx` e guias de
  integracao em `integracoes/page.tsx`.
- `next-intl` para mensagens.

Rodar no host:

```bash
cd apps/site && npm run dev -- --port 3001
```

## Mapa critico

- `src/app/[locale]/`: landing localizada e rota `/integracoes`.
- `src/app/api/health/route.ts`: health local.
- `src/components/`: secoes de marketing e chrome.
- `src/i18n/`, `messages/` e `src/proxy.ts`: roteamento e mensagens.
- `src/lib/routes.ts`: mapa canonico de rotas e destino do web app.
- `public/brand/`: assets de marca usados pelo site.

## Regras locais

- Preserve locale-prefixed routing e locales `pt-br`, `en` e `es` salvo pedido
  explicito.
- Sincronize `src/lib/routes.ts`, `src/proxy.ts`, paginas e mensagens quando
  rotas mudarem.
- Sincronize copy funcional em `messages/pt-br.json`, `messages/en.json` e
  `messages/es.json`.
- CTAs com impacto funcional devem continuar apontando para o destino correto
  do web app.
- Para mudancas visuais, consulte `docs/design/site.md` e os assets relevantes
  em `docs/design/`.
- Preserve linguagem visual de marketing salvo pedido explicito de redesign.

## Checklist de sincronizacao

- Mudou rota: atualizar routes helper, proxy, paginas e mensagens.
- Mudou CTA: atualizar mensagens localizadas e docs se o destino funcional
  mudou.
- Mudou brand visual: conferir `docs/design/` e os assets ativos de runtime.
- Mudou runtime: atualizar setup/development docs.

## Validacao

```bash
cd apps/site && npm run lint
cd apps/site && npm run build
cd apps/site && npm run deploy -- --dry-run
```

## Nao faca

- Nao introduza dependencia de auth no site sem pedido explicito.
- Nao crie webhook de leads como requisito implicito.
- Nao altere suporte de locale sem atualizar mensagens e proxy.
