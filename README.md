# Capyra

Gestão das mídias sociais de marcas para agências e criadores. White label: o Operador identifica só **Capyra** e a rede (Instagram, TikTok, LinkedIn na v1).

Este repositório está na fase de spec. Não há `apps/` ainda.

## Documentos

| Documento | Papel |
| --- | --- |
| [CONTEXT.md](CONTEXT.md) | Glossário canônico |
| [docs/PRD.md](docs/PRD.md) | Produto do primeiro lançamento |
| [docs/stack.md](docs/stack.md) | Stack e adapters |
| [docs/adr/](docs/adr/README.md) | Decisões caras de reverter |
| [docs/design/](docs/design/README.md) | Logo e mascotes |
| [.specify/memory/constitution.md](.specify/memory/constitution.md) | Constituição Speckit |
| [specs/001-capyra-social-v1/](specs/001-capyra-social-v1/) | Spec da solução, plano, OpenAPI, tasks |
| [contracts/openapi/capyra-api.v1.yaml](contracts/openapi/capyra-api.v1.yaml) | Contrato público `/api/v1` |

## Speckit

Feature ativa: `specs/001-capyra-social-v1`.

1. `spec.md` — o que o Operador precisa (US1–US11, FR-001–FR-063)
2. `plan.md` + `research.md` + `data-model.md` + `quickstart.md` — como construir
3. `tasks.md` — T001–T136; MVP = Setup + Foundational + US1–US7
4. Implementação: `/speckit-implement` (ainda não executado)

Validação local prevista: [specs/001-capyra-social-v1/quickstart.md](specs/001-capyra-social-v1/quickstart.md).
