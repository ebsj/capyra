# Data Model: Capyra Social v1

Fonte de domínio: [`CONTEXT.md`](../../CONTEXT.md). IDs públicos nunca são do Fornecedor social. Binários não entram no SQL.

Convenções:

- PK interna opaca; IDs públicos: `accountId`, `brandId`, `socialAccountId`, `publicationId`, `destinationId` (ULID/UUID opaco, camelCase na API).
- Toda linha de negócio autenticada carrega `accountId`.
- Timestamps em UTC; horário de Destino também guarda o `IANA` do **Fuso da marca** no momento da gravação.
- Soft-delete só onde o PRD pede arquivo (Marca); Operador removido perde autorização na hora.

## Entities

### Account (Conta Capyra)

| Campo | Regras |
| --- | --- |
| `accountId` | público, único |
| `type` | `agency` \| `creator`; o Proprietário pode alterar; não muda preço/Papel/Marcas/políticas já gravadas |
| `billingStatus` | `ok` \| `delinquent` (Inadimplência) |
| `createdAt` | UTC |

Relacionamentos: 1..n Marcas; 1..n Operadores; exatamente 1 Proprietário.

### Operator

| Campo | Regras |
| --- | --- |
| `operatorId` | interno |
| `accountId` | exatamente uma Conta |
| `email` | único no produto; lowercase |
| `role` | `owner` \| `creator` \| `approver` \| `viewer` |
| `locale` | `pt-BR` \| `en` \| `es`; padrão `pt-BR` |
| `brandIds` | Marcas atribuídas; vazia permitida; ignorada se `owner` (opera todas) |
| `disabledAt` | preenchido na remoção; sessões falham no próximo request |

Constraint: um e-mail → no máximo um Operador.

### Session

| Campo | Regras |
| --- | --- |
| `sessionId` | cookie httpOnly |
| `operatorId` | |
| `expiresAt` | |
| `revokedAt` | logout local ou remoção do Operador |

### MagicCredential (link / código)

| Campo | Regras |
| --- | --- |
| `email` | |
| `kind` | `link` \| `code` |
| `hash` | nunca o valor em claro |
| `expiresAt` | minutos (código) / minutos a poucas horas (link) |
| `consumedAt` | um uso |
| `inviteId` | opcional; se presente, o e-mail precisa coincidir |

Último pedido do e-mail invalida os anteriores. Rate limit por e-mail e origem.

### Invitation

| Campo | Regras |
| --- | --- |
| `inviteId` | |
| `accountId` | |
| `email` | |
| `role` | `creator` \| `approver` \| `viewer` (nunca `owner`) |
| `brandIds` | pode ser `[]` |
| `localeAtSend` | Idioma do Proprietário |
| `expiresAt` | +7 dias |
| `acceptedAt` / `consumedAt` | uso único |

### Brand (Marca)

| Campo | Regras |
| --- | --- |
| `brandId` | público, único |
| `accountId` | exatamente uma Conta |
| `name` | placeholder inicial (`Minha marca` em `pt-BR`); não vazio para agendar |
| `timezone` | IANA; default `America/Sao_Paulo` |
| `approvalPolicy` | `required` \| `optional`; default `required` se Conta `agency`, `optional` se `creator` |
| `archivedAt` | Marca arquivada = somente leitura |

Nova Conta nasce com uma Marca. Arquivar cancela Destinos futuros e desconecta Contas sociais.

### SocialAccount (Conta social + Conexão)

| Campo | Regras |
| --- | --- |
| `socialAccountId` | público |
| `accountId`, `brandId` | |
| `network` | `instagram` \| `tiktok` \| `linkedin` na v1 |
| `nativeIdentity` | Identidade nativa estável da rede; **única** entre conexões ativas no produto |
| `displayHandle` | não é chave |
| `status` | `pending_verification` \| `active` \| `action_required` \| `disconnecting` \| `disconnected` |
| `connectedAt` | entra na Identidade social do ciclo |
| `providerProfileRef` | **interno**, nunca público |

Unicidade: (`brandId`, `network`) ativo ≤ 1. LinkedIn página e perfil ocupam o mesmo slot (`linkedin`).

### AuthorizationSession

Sessão OAuth headless: uso único, expira, vincula Operador (Proprietário), Conta, Marca, rede, `redirect` no domínio Capyra. Callback não aceita identidade diferente da gravada no slot sem desconexão.

### MediaAsset

| Campo | Regras |
| --- | --- |
| `mediaId` | |
| `accountId`, `brandId` | biblioteca privada |
| `kind` | `original` \| `variant` |
| `blobKey` | referência no blob store (não o bytes no SQL) |
| `contentType`, `byteSize` | `byteSize` ≤ 200 MB |
| `expiresAt` | +30 dias se Marca arquivada, salvo Destino não concluído |
| `uploadedByOperatorId` | só `owner` ou `creator` |

### Publication

| Campo | Regras |
| --- | --- |
| `publicationId` | público |
| `accountId`, `brandId` | |
| `createdByOperatorId` | |

1..n Destinos.

### Destination

| Campo | Regras |
| --- | --- |
| `destinationId` | público |
| `publicationId`, `socialAccountId`, `brandId`, `accountId` | |
| `state` | ver máquina abaixo |
| `copy`, `hashtags`, `mediaIds` | por Destino |
| `scheduledAtUtc` | opcional |
| `timezoneAtWrite` | IANA copiado da Marca; mudar o fuso da Marca **não** altera este nem `scheduledAtUtc` |
| `currentVersionId` | Versão de destino vigente, se submetido |

DST inexistente/ambíguo: recusar na escrita.

### DestinationVersion

Retrato imutável (copy, mídia, horário, rede, chave de idempotência) criado ao agendar ou publicar.

### DeliveryAttempt

Uma tentativa de envio da Versão. Resultado: aceite da rede, `delivery_unknown`, `platform_rejected` / falha definitiva, cancelamento confirmado. Não reenvia Destinos em estado terminal concluído.

### Comment

Pertence a exatamente um Destino. Autor = Proprietário, Criador ou Aprovador das Marcas atribuídas. Visualizador só lê.

### ExternalPost

Post fora do Capyra, importação inicial 90 dias, metadados + métricas, sem binário. Sem Tentativa de entrega Capyra.

### MetricSnapshot

| Campo | Regras |
| --- | --- |
| alvo | Conta social ou Destino |
| `metric` | código estável (impressions, reach, …) |
| `value` | numérico **ou ausente** (NULL); ausência ≠ 0 |
| `observedAt`, `updatedAt`, `source` | |

### BillingCycle / CycleSocialIdentity

Ciclo mensal BRL. Identidade social do ciclo = `nativeIdentity` conectada ao menos uma vez no ciclo. Reconectar a mesma não duplica. Desconectar não remove até o fechamento. Unidade de preço: R$ 49,90.

Mapeamento interno para o trilho de pagamento (customer/subscription) fica na porta `billing`, não na API pública.

### Notification / AuditEvent

Notificação in-app + e-mail Capyra (FR-056). AuditEvent: ator, Conta, Marca, recurso, horário, correlação; sem credenciais, mídia bruta, tokens, URL assinada.

### CompetitorAdResult

Modelo Capyra da busca (Meta exige Instagram na Marca; LinkedIn exige LinkedIn). IDs do fornecedor não persistem como identificadores públicos.

## State machine — Destination

```text
rascunho
  → em_revisao                 (enviar para aprovação)
  → agendado                   (agendar sem exigência)
  → publicado                  (publicar agora sem exigência)
em_revisao
  → aprovado                   (aprovar; se já tem horário → agendado)
  → rejeitado
  → alteracoes_solicitadas
alteracoes_solicitadas
  → em_revisao                 (reenviar)
aprovado
  → agendado                   (agendar sem mudar conteúdo; não reabre)
  → publicado                  (publicar agora)
  → em_revisao                 (editar texto/mídia/horário/canal com política ligada)
agendado
  → publicado                  (entrega confirmada)
  → cancelado                  (cancelamento confirmado pela rede)
  → falha_definitiva
  → entrega_desconhecida
rejeitado
  → rascunho                   (reabrir)
entrega_desconhecida
  → publicado | cancelado | falha_definitiva   (reconciliação; nunca retry automático)
falha_definitiva
  → (nova Versão só por retry explícito do Operador autorizado)
publicado | cancelado          terminais; eventos fora de ordem não regridem
```

Inadimplência: transições que agendam ou publicam (incluindo aprovar **com** horário) são recusadas. Aprovar sem horário, rejeitar, comentar e ler seguem.

Conexão com ação necessária: bloqueia novas Tentativas de entrega daquela Conta social.

## Isolation rules (every query)

1. `accountId` da sessão = `accountId` do recurso.
2. Se Papel ≠ Proprietário, `brandId` ∈ Marcas atribuídas (lista vazia → nenhum recurso de Marca).
3. MCP usa a mesma sessão/token de Operador; sem Papel extra.
4. Tenant do Fornecedor social **nunca** resolve Conta ou Marca.

## Mapping to SocialProvider (internal)

| Capyra | Provider (interno) |
| --- | --- |
| Marca | perfil interno (nome não exibido) |
| Conexão social | conta da rede + tokens |
| Destino / Versão | job de publicação |
| Post externo / Snapshot | analytics import |
| CompetitorAdResult | ad library search |

Erros mapeados para códigos Capyra: `authorization_required`, `identity_unverified`, `delivery_unknown`, `platform_rejected`, `identity_taken`, `slot_occupied`, `approval_required`, `delinquent`, `forbidden_role`, `brand_not_assigned`.
