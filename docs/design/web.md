# Sistema de marca do produto web

## Proposito

Este documento adapta a marca Capyra para o produto autenticado em `apps/web`.
Ele deriva da fonte visual em `docs/design/`, usa `docs/design/site.md`
como resumo operacional do site publico, reaproveita a tipografia e os tokens
em `apps/site/src/app/layout.tsx` e `apps/site/src/app/globals.css`, e consulta
a copia aprovada do logo em `docs/design/assets/logo.png`.

`apps/web` usa `apps/web/public/brand/logo.png` como copia de runtime. Regras
que nao aparecem literalmente no site sao marcadas como derivadas de produto.

## Fontes

| Fonte | Papel | Herdado |
| --- | --- | --- |
| `docs/design/README.md` | fonte visual primaria | sistema, linguagem visual e assets aprovados |
| `docs/design/site.md` | resumo operacional derivado | voz, paleta, logo e atmosfera do site publico |
| `apps/site/src/app/layout.tsx` | tipografia | `Kanit` e `IBM Plex Sans` |
| `apps/site/src/app/globals.css` | tokens visuais | canvas quente, azul, navy, cocoa e sage |
| `docs/design/assets/logo.png` | referencia visual | logo canonico |

## Posicionamento

Capyra Web deve parecer parte da mesma familia do site publico, nao um console
neutro separado. O produto pode ser mais denso e utilitario, mas deve manter
presenca de marca, calor visual e clareza editorial.

## Tipografia

| Role | Fonte | Uso |
| --- | --- | --- |
| `display` | `Kanit` | headings, titulos de pagina e declaracoes de marca |
| `interface` | `IBM Plex Sans` | corpo, navegacao, forms, cards, tabelas e metadados |

Use `display` apenas para texto de alta atencao. Interfaces densas devem usar
`interface`.

## Logo

| Asset | Doc canonico | Runtime | Superficies permitidas |
| --- | --- | --- | --- |
| `capyra-logo` | `docs/design/assets/logo.png` | `apps/web/public/brand/logo.png` | auth, app shell, drawer mobile e chrome autenticado aprovado |

Nao substitua por iniciais, icones genericos, emoji ou marcas paralelas.

## Mascotes e badges

| Asset | Runtime | Uso |
| --- | --- | --- |
| `capyra-camera.png` | `apps/web/public/brand/capyra-camera.png` | composer e upload de video |
| `capyra-backpack.png` | `apps/web/public/brand/capyra-backpack.png` | historico vazio |
| `capyra-sleeping.png` | `apps/web/public/brand/capyra-sleeping.png` | dashboard sem analises |
| `capyra-traveler.png` | `apps/web/public/brand/capyra-traveler.png` | sessao de upload para integracoes |
| `capyra-suitcase-standing.png` | `apps/web/public/brand/capyra-suitcase-standing.png` | biblioteca de assets vazia |
| `capyra-workout.png` | `apps/web/public/brand/capyra-workout.png` | detalhe da analise |

Badges do produto autenticado seguem `docs/design/preview/components-badges.html`:
status concluido usa `success`, pendente/processando usa `info` ou `warning`,
falha usa `danger`, e skills usam tons fixos por dominio (`brandSoft`, `sage`,
`sand`, `navy` e `warning`).

## Familias semanticas

O tema web usa a mesma familia semantica em light e dark. Os valores mudam, mas
o significado do token permanece.

Roles recomendados:

- `background` e `foreground`: canvas e texto primario.
- `card` e `popover`: superficies elevadas.
- `primary`: acao principal e acento de marca.
- `secondary`, `muted` e `accent`: suporte, hover e metadados.
- `destructive`: erros e acoes destrutivas.
- `border`, `input` e `ring`: limites e foco.
- `sidebar*`: chrome autenticado e navegacao.
- `chart-*`: visualizacao de dados alinhada a marca.

## Orientacao por superficie

| Superficie | Intensidade | Orientacao |
| --- | --- | --- |
| `auth` | alta | entrada quente, com marca clara e form limpo |
| `app-shell` | alta | logo aprovado e navegacao reconhecivel |
| `sidebar` | alta | chrome mais escuro e legivel |
| `cards` | media | superficies quentes, densas e escaneaveis |
| `forms` | contida | foco, validacao e acoes claras |
| `tables` | contida | legibilidade acima de decoracao |
| `dashboard-charts` | media | paleta distinguivel em light e dark |

## Regras derivadas de produto

- O web pode usar navegacao mais escura que o site por necessidade de produto.
- Cores nao presentes literalmente no site devem ter funcao documentada.
- O produto nao deve criar identidade paralela nem parecer console cinza
  generico.
- Light e dark devem preservar roles equivalentes.

## Ordem de leitura

1. Leia `docs/design/README.md`.
2. Leia `docs/design/site.md` para o resumo operacional do site.
3. Leia este documento para a adaptacao autenticada.
4. Confira `apps/web/public/brand/logo.png` e tokens em `apps/web`.
