# Sistema de marca do site Capyra

## Snapshot

O site publico agora e uma landing localizada com uma pagina curta de
integracoes. Ele apresenta a Capyra para creators e agencias como uma ferramenta
que transforma URL publica ou arquivo de video curto em leitura estruturada,
skills executadas, evidencias, recomendacoes, limites explicitos e snapshot
compartilhavel.

Este documento e um resumo derivado do estado publico do site. `docs/design/` e
a fonte de verdade visual; o runtime ativo vive em `apps/site/public/brand/`.
Assets aprovados ficam em `docs/design/assets/` e
`docs/design/assets/mascots/`. Historicos de geracao e uploads brutos nao fazem
parte da fonte canonica versionada.

## Inventario de assets ativos

| Asset | Status | Runtime | Documentacao | Uso |
| --- | --- | --- | --- | --- |
| `logo.png` | ativo | `apps/site/public/brand/logo.png` | `docs/design/assets/logo.png` | header, footer, Open Graph e produto web |
| `capyra-camera.png` | ativo | `apps/site/public/brand/capyra-camera.png` | `docs/design/assets/mascots/capyra-camera.png` | creators e sinais de captura |
| `capyra-workout.png` | ativo | `apps/site/public/brand/capyra-workout.png` | `docs/design/assets/mascots/capyra-workout.png` | agencias |
| `capyra-suitcase-standing.png` | ativo | `apps/site/public/brand/capyra-suitcase-standing.png` | `docs/design/assets/mascots/capyra-suitcase-standing.png` | times internos e CTA de integracoes |
| `capyra-traveler.png` | ativo | `apps/site/public/brand/capyra-traveler.png` | `docs/design/assets/mascots/capyra-traveler.png` | hero de integracoes |
| `capyra-backpack.png` | ativo | `apps/site/public/brand/capyra-backpack.png` | `docs/design/assets/mascots/capyra-backpack.png` | guia ChatGPT |
| `capyra-avocado-standing.png` | ativo | `apps/site/public/brand/capyra-avocado-standing.png` | `docs/design/assets/mascots/capyra-avocado-standing.png` | guia Claude |
| `capyra-watermelon.png` | ativo | `apps/site/public/brand/capyra-watermelon.png` | `docs/design/assets/mascots/capyra-watermelon.png` | CTA final da landing |

## Publico

- Creators: entender o que o video comunica, onde perde forca e qual ajuste
  testar depois.
- Agencias: explicar performance e feedback com evidencias por skill,
  timestamps e snapshots.
- Times internos e agentes: usar web, MCP ou CLI quando o fluxo pedir
  automacao ou analise assistida.

## Voz e mensagem

- Tom claro, util e orientado a decisao.
- Evitar hype abstrato de AI; explicar entrada, leitura, evidencia e retorno.
- CTAs principais levam ao produto web.
- Cards de integracao apontam para guias curtos em `/integracoes`.
- PT-BR e EN compartilham estrutura e promessa; apenas o idioma muda.

## Sistema visual

- A landing usa hero e blocos de suporte em navy escuro, inspirados em
  `docs/design/ui_kits/site/index.html`.
- Secoes claras preservam base creme quente, cards com borda bege, sombras
  leves e acentos em azul, sage e sand.
- Tipografia segue `Kanit` para display e `IBM Plex Sans` para corpo e UI.
- Imagens de mascote aparecem como sinal de produto, nao como galeria publica.
- Badges, paineis e highlights devem usar `brand`, `brand-soft`, `sage`,
  `sage-soft`, `sand`, `cocoa` e `navy` de forma semantica, seguindo
  `docs/design/preview/components-badges.html`.

## Rotas publicas

- `/:locale`: landing unica.
- `/:locale/integracoes`: guias curtos para ChatGPT, Claude e CLI.
- Rotas antigas `/:locale/produto`, `/:locale/casos-de-uso` e
  `/:locale/relatorio` nao fazem mais parte do site publico e retornam 404.

## Evidencias

Este resumo se baseia em:

- `docs/design/README.md`
- `docs/design/ui_kits/site/index.html`
- `apps/site/src/app/[locale]/page.tsx`
- `apps/site/src/app/[locale]/integracoes/page.tsx`
- `apps/site/src/components/site-header.tsx`
- `apps/site/src/components/site-footer.tsx`
- `apps/site/messages/pt-br.json`
- `apps/site/messages/en.json`
- `apps/site/public/brand/`
