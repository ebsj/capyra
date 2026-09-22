# Identidade visual — Capyra

Fonte canônica da **logo** e dos **mascotes** usados no site e no webapp. Não redefine o domínio. Não substitui o tema shadcn ([ADR 0011](../adr/0011-shadcn-default-ui.md), [`stack.md`](../stack.md) §3.2.1).

A UI continua shadcn/ui no tema padrão. Estes arquivos são ilustração e marca — `img`, empty states, marketing — não tokens, não variantes de componente, não paleta paralela.

PDF de relatório: capivara-logo + a palavra “Capyra” no tipo padrão (o mesmo da UI shadcn). CSV é só dados, sem capa. E-mail Resend pode usar a mesma logo. MCP não tem UI.

## Uso

| Pode | Não pode |
| --- | --- |
| Colocar `logo.png` no header, favicon, splash, PDF e e-mail Capyra, ao lado da palavra “Capyra” em texto | Extrair cores da ilustração para o tema shadcn ou para uma paleta de PDF |
| Usar mascotes em hero, onboarding e estados vazios | Inventar mascote novo só no app, sem gravar aqui |
| Copiar ou importar estes PNG em `apps/site` e `apps/web` | Forkar shadcn, criar `packages/ui` “Capyra themed” |
| Recortar/redimensionar na composição | Trocar o traço, recolorir ou misturar outro estilo |

Formato atual: PNG 500×500, RGBA (fundo transparente).

Não existe wordmark ilustrado neste corte. `logo.png` é a capivara-marca (sentada). No header do site e do webapp ela aparece **junto** da palavra “Capyra” no tipo padrão. Favicon é a capivara sozinha. Wordmark desenhado, se existir, entra nesta pasta.

## Inventário

### Logo

| Arquivo | O que é |
| --- | --- |
| [`assets/logo.png`](assets/logo.png) | Marca Capyra: capivara sentada, frente/três quartos |

### Mascotes

Todos em [`assets/mascots/`](assets/mascots/). Mesma capivara, poses diferentes.

| Arquivo | Pose |
| --- | --- |
| `capyra-front.png` | De frente, em pé |
| `capyra-hero.png` | Três quartos, mochila verde |
| `capyra-backpack.png` | Com mochila |
| `capyra-traveler.png` | Viajante |
| `capyra-suitcase.png` | Com mala |
| `capyra-suitcase-standing.png` | Em pé com mala |
| `capyra-camera.png` | Com câmera |
| `capyra-car.png` | Com carro |
| `capyra-drink.png` | Com bebida |
| `capyra-avocado.png` | Com abacate |
| `capyra-avocado-standing.png` | Em pé com abacate |
| `capyra-watermelon.png` | Com melancia |
| `capyra-turtle.png` | Com tartaruga |
| `capyra-workout.png` | Treino |
| `capyra-sleeping.png` | Dormindo |

Novo asset: gravar o PNG aqui e uma linha nesta tabela **antes** de usar no site ou no webapp.

## v1 — onde cada um entra

| Superfície | Asset |
| --- | --- |
| Header (site e webapp) | `logo.png` + a palavra “Capyra” |
| Favicon | `logo.png` |
| PDF de relatório | `logo.png` + a palavra “Capyra” |
| E-mail Resend | `logo.png` + a palavra “Capyra” (sem mascote no corpo) |
| Marketing / hero do site | `capyra-hero.png` |
| Estado vazio | `capyra-front.png` |
| Erro / falha | `capyra-sleeping.png` |

Os demais mascotes ficam no catálogo até um uso concreto. Não inventar pose nova no app.
