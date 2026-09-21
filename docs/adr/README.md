# ADRs

Decisões de domínio e arquitetura do Capyra Social. O glossário canônico está em [`CONTEXT.md`](../../CONTEXT.md). O produto está em [`PRD.md`](../PRD.md). A stack está em [`stack.md`](../stack.md).

| ADR | Decisão |
| --- | --- |
| [0001](0001-conta-capyra-is-the-isolation-boundary.md) | **Conta Capyra** é o isolamento e quem paga; **Marca** não é tenant |
| [0002](0002-one-email-one-conta.md) | Um e-mail autenticado participa de no máximo uma **Conta Capyra** |
| [0003](0003-native-identity-is-globally-exclusive.md) | Uma **Identidade nativa** tem no máximo uma **Conexão social** ativa no produto |
| [0004](0004-social-provider-is-an-internal-adapter.md) | Fornecedor social só existe atrás de `SocialProvider` |
| [0005](0005-white-label-journey-is-a-commercial-gate.md) | Rede só é vendida depois do **Gate white label** prático |
| [0006](0006-web-standard-runtime-and-cloud-adapters.md) | TypeScript web-standard; nuvem é adapter; Cloudflare primeiro |
| [0007](0007-hono-vite-isolated-next-site.md) | Hono + Vite/React; Site Next.js isolado; sem Nest nem Python neste corte |
| [0008](0008-drizzle-and-in-api-auth.md) | Drizzle/SQL; auth de Operador na API, não Firebase/Clerk |
| [0009](0009-stripe-checkout-and-resend-email.md) | Stripe no checkout; Resend no e-mail transacional |
| [0010](0010-mcp-stateless-sdk-v2.md) | MCP headless stateless: `@modelcontextprotocol/server` + `createMcpHandler` |
| [0011](0011-shadcn-default-ui.md) | Site e webapp usam só shadcn/ui no tema padrão |
