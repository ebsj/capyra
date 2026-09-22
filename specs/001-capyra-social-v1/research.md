# Research: Capyra Social v1

Phase 0 de `/speckit-plan`. Consolida ADRs 0001–0011 e a stack. **Não reabre** a tabela Recusados de [`docs/stack.md`](../../docs/stack.md).

## R1. Isolamento e pessoas

**Decision**: **Conta Capyra** é o único isolamento e quem paga. **Marca** não é tenant. Um e-mail autenticado é um **Operador** em exatamente uma Conta, com um **Papel** e **Marcas atribuídas**.

**Rationale**: Agências falam “cliente”, mas faturar e logar por Marca explode convite, preço (R$ 49,90 por Conta social) e a regra de um e-mail. Freelancer em duas agências fica fora da v1 (outro e-mail).

**Alternatives considered**: Tenant por Marca; um e-mail em várias Contas; Papel diferente por Marca. Recusados em ADR 0001 e 0002 e no CONTEXT.

**Sources**: [ADR 0001](../../docs/adr/0001-conta-capyra-is-the-isolation-boundary.md), [ADR 0002](../../docs/adr/0002-one-email-one-conta.md), CONTEXT.

## R2. Identidade nativa exclusiva

**Decision**: Uma **Identidade nativa** verificada tem no máximo uma **Conexão social** ativa em todo o Capyra. Handle não é a chave. Só o Proprietário conecta.

**Rationale**: Duas Contas publicando o mesmo Instagram deixam cobrança, revogação e “qual app está no Instagram?” ambíguos. Renomear handle não pode substituir a identidade.

**Alternatives considered**: Mesmo perfil em agência e criador ao mesmo tempo; identidade = @handle.

**Sources**: [ADR 0003](../../docs/adr/0003-native-identity-is-globally-exclusive.md).

## R3. Fornecedor social como adapter

**Decision**: Toda rede passa por `SocialProvider`. Produção v1: `ZernioProvider`. Testes/local: `MockProvider` (nunca fallback silencioso em produção). API/UI só tipos Capyra.

**Rationale**: White label e troca futura de fornecedor. Chamar o vendor da UI acopla cada tela.

**Alternatives considered**: SDK do vendor no webapp; IDs do vendor como IDs públicos.

**Sources**: [ADR 0004](../../docs/adr/0004-social-provider-is-an-internal-adapter.md).

## R4. Gate white label comercial

**Decision**: Rede só é vendida depois de Gate prático `go` (conexão, consentimento, seleção, callback, reconexão, revogação, erros, e-mails, apps autorizados, post). Docs do vendor não aprovam. OAuth headless é necessário e não suficiente.

**Rationale**: Dashboard rebranded falha o bar. Aceita-se entrega mais lenta e go/no-go por rede.

**Alternatives considered**: White label só de UI; ligar a rede com evidência documental.

**Sources**: [ADR 0005](../../docs/adr/0005-white-label-journey-is-a-commercial-gate.md).

## R5. Runtime web-standard

**Decision**: TypeScript no contrato Fetch. Cloudflare é o primeiro adapter (Workers, D1, R2, Queues, Cron). Domínio não importa APIs só-Cloudflare. Sem Nest, Express, Prisma, Durable Objects no domínio, Python ou CLI neste corte.

**Rationale**: Trocar de nuvem é reimplementar adapters, não a API. “Docker Node + Nest + Prisma” joga fora o motivo de começar na Cloudflare.

**Alternatives considered**: Nest + Prisma + Postgres em VM; Python/FastAPI neste repo.

**Sources**: [ADR 0006](../../docs/adr/0006-web-standard-runtime-and-cloud-adapters.md), stack §1 e §10.

## R6. Quatro apps

**Decision**: `apps/api` Hono; `apps/web` Vite + React + TanStack Router; `apps/site` Next.js isolado; `apps/mcp` Worker MCP. Site sem sessão de Operador, sem `/api/v1` de negócio, sem importar web/api.

**Rationale**: Webapp autenticado não precisa de SEO de App Router. Site precisa. Misturar sessão e SEO no mesmo Next fura o isolamento.

**Alternatives considered**: Next no webapp; Astro no site; um único Next para os dois; MCP dentro da API.

**Sources**: [ADR 0007](../../docs/adr/0007-hono-vite-isolated-next-site.md), [ADR 0010](../../docs/adr/0010-mcp-stateless-sdk-v2.md).

## R7. Drizzle e auth na API

**Decision**: Drizzle + SQL (D1/SQLite agora, Postgres depois na mesma porta `db`). Auth de Operador na API: link mágico ou código; sessão em cookie httpOnly nas nossas tabelas. Sem Firebase, Clerk, Auth0, senha, Google/Apple, SSO na v1.

**Rationale**: Prisma é pesado no Worker e D1 de segunda classe. IdP externo é mais um vendor para white-label.

**Alternatives considered**: Prisma; Clerk/Firebase; senha local.

**Sources**: [ADR 0008](../../docs/adr/0008-drizzle-and-in-api-auth.md).

## R8. Stripe e Resend

**Decision**: Porta `billing` = Stripe Checkout/Billing, BRL, recorrente, alinhado à Identidade social do ciclo. Porta `email` = Resend, remetente e templates Capyra. Domínio não importa SDKs Stripe/Resend nos handlers de rota.

**Rationale**: Fecha checkout e transacional agora, com portas trocáveis. Stripe pode aparecer na página hospedada de checkout (exigência deles).

**Alternatives considered**: Pagar.me; SES / e-mail no Worker / SMTP avulso; billing manual.

**Sources**: [ADR 0009](../../docs/adr/0009-stripe-checkout-and-resend-email.md).

## R9. MCP stateless SDK v2

**Decision**: `@modelcontextprotocol/server` + `createMcpHandler`. Um servidor por request. Sem Durable Object. Auth do Operador **antes** do handler. Tools só `/api/v1`.

**Rationale**: `McpAgent` / SDK v1 com sessão = Durable Object por sessão (caro e legado). Stdio não roda em Workers.

**Alternatives considered**: McpAgent; SDK v1 + WorkerTransport; stdio Node.

**Sources**: [ADR 0010](../../docs/adr/0010-mcp-stateless-sdk-v2.md).

## R10. shadcn default, marca à parte

**Decision**: Site e webapp usam só shadcn/ui no tema padrão (`packages/ui`). Logo e mascotes em `docs/design/`. Não extrair paleta das ilustrações. PDF/e-mail: capivara-logo + palavra “Capyra”. MCP sem UI.

**Rationale**: Tema custom atrasa cada tela e viola a constituição V.

**Alternatives considered**: Design system próprio; MUI/Chakra; fork do shadcn; paleta derivada dos mascotes.

**Sources**: [ADR 0011](../../docs/adr/0011-shadcn-default-ui.md), `docs/design/README.md`.

## R11. Redes da v1 e janela de mídia

**Decision**: Oferecer só Instagram, TikTok e LinkedIn. Destinos além de seis dias ficam no Capyra e só entram na fila social ao chegar na janela (upload temporário do fornecedor ~7 dias). Capacidades dinâmicas consultadas no `SocialProvider` antes de submeter.

**Rationale**: Oito redes no primeiro lançamento diluem o Gate. Enviar mídia cedo demais falha no vendor.

**Alternatives considered**: Ligar Facebook/YouTube/X/Pinterest/GMB no dia um; transcodificar no Capyra.

**Sources**: PRD §5 e §8.3, CONTEXT (oito redes resolvidas para três).

## R12. Contrato público

**Decision**: OpenAPI em `contracts/openapi/capyra-api.v1.yaml` é a fonte. Tipos gerados em `packages/contracts`. IDs públicos Capyra. `code` de erro em inglês; mensagem humana localizada. CamelCase.

**Rationale**: Constituição: a API não inventa campo. Troca de fornecedor não muda o contrato.

**Alternatives considered**: GraphQL; IDs do vendor; campos ad hoc nas rotas.

Nenhum item de Technical Context ficou como NEEDS CLARIFICATION.
