# Persistencia V2

## D1

`apps/api/migrations/` e a fonte das migrations. UUIDv7 usa `TEXT`; timestamps
sao UTC; foreign keys e indices sao obrigatorios. Drizzle serve como query
builder e gerador SQL, nao como executor automatico de producao.

As tabelas cobrem contas, usuarios, analyses, feedback, assets, sessoes de
upload e grants OAuth. Toda operacao de negocio inclui `account_id`. Soft delete
mantem historico e filtros normais omitem linhas removidas. Codes e tokens de
uso unico sao consumidos por update condicional, evitando dupla troca.

```bash
npm --workspace @capyra/api run db:generate
npm --workspace @capyra/api run db:migrate:local
npm --workspace @capyra/api run db:migrate:remote
```

## R2

D1 guarda somente referencias e campos consultaveis. Reports completos e
artefatos ficam no bucket privado. A API transmite objetos sem bufferizar o
conteudo inteiro. Lifecycle expira `staging/` em 24 horas; uma rotina de purge
remove artefatos de analyses excluidas apos 30 dias.

Migrations remotas antecedem o deploy e seguem expand/contract.


## Modelo Social

As migrations expandem o modelo com Marcas, convites, entitlements/lotes/reservas/ledger, auditoria e notificações, seguidos de perfis/conexões, Publicações/Destinos/versões/tentativas, inbox de webhook, importação e snapshots nativos. Registros legados de análise/mídia preservam `brand_id` nulo até atribuição; novos registros exigem Marca na API. Constraints/índices e operações atômicas protegem quotas, identidade, Proprietário e idempotência.


Migrations Social na ordem de aplicação:

| Migration | Responsabilidade |
| --- | --- |
| 0001 | Marcas, mídia, equipe, franquias e reservas atômicas |
| 0002 | Conexões, entregas, webhook e métricas |
| 0003 | Provisionamento operacional idempotente |
| 0004 | Histórico externo isolado por Conta/Marca e proteção de mídia em uso |
| 0005 | IDs de auditoria compatíveis com paginação UUID |
| 0006 | Notificações atômicas de falha definitiva |
| 0007 | Correlação de entregas com ID nativo/URL publicada |

O espelho Drizzle fica em `apps/api/src/db/schema.ts` e `social-schema.ts`; triggers são definidos nas migrations. A deduplicação de posts inclui Conta e Marca para preservar o histórico quando uma identidade desconectada passa a outro cliente. A concessão de adicionais usa `tools/provision-social.mjs`; não existe API pública para conceder saldo. A validação desta feature aplicou as migrations somente no D1 local.
