# Evidência de validação — Capyra Social

Validação técnica local concluída em 2026-09-14 na branch `codex/capyra-social`, que incorpora o commit documental `f8a84eb`. Nenhum deploy, migration remota, publicação real ou chamada paga foi executado. O token e a prova real do Zernio ficam para o usuário.

## Artefatos e convergência

Spec Kit: scripts setup-plan/setup-tasks/check-prerequisites executados; checklist de requisitos revisado; análise inicial mapeou 30 FR e cinco SC às 43 tarefas iniciais. Implementação dividida entre três subagentes, com contratos/migrations/consumidores integrados pelo agente principal.

A revisão encontrou e corrigiu cinco grupos de lacunas registrados em T044–T048: paginação da auditoria de provisionamento; auditoria/notificações de falha; idempotência de cancelamento e visualização de versões; franquia de identidades na virada mensal; correlação de métricas e estados terminais. A revisão de T024/T025 também corrigiu classificação de falha antes da escrita e fechamento de tentativa na DLQ para permitir retry seguro.

A passagem final cobriu 30 requisitos funcionais, 20 cenários de aceite, cinco critérios técnicos de sucesso, oito decisões arquiteturais e os seis princípios da constituição. Nenhuma lacuna técnica acionável permaneceu. Prova white label e resultado comercial são obrigações posteriores expressamente excluídas do aceite local.

## Testes e build

| Verificação | Resultado observado |
| --- | --- |
| Worker/API e contratos | 103 testes, 16 arquivos, passaram; incluem 36 casos sociais |
| Núcleo de integração | 9 testes passaram |
| CLI | 3 testes passaram, inclusive rejeição de criação/upload sem Marca |
| MCP | 16 testes passaram, incluindo tools/list, tools/call e auth_status |
| Web | 38 testes passaram; lint e build passaram |
| Infraestrutura | 6 testes passaram, incluindo provisionamento atômico/idempotente |
| Python | 54 testes passaram; uma advertência de depreciação do TestClient existente |
| TypeScript | `npm run typecheck` passou para todos os workspaces aplicáveis |
| OpenAPI | Geração de tipos/validadores passou; respostas reais locais de nove recursos passaram nos schemas canônicos |
| D1 | Migrations 0000–0007 aplicadas apenas localmente; teste migra conta/análise legada sem atribuir Marca retroativa |
| Drizzle | As colunas das 33 tabelas correspondem às migrations finais |
| Cloudflare | Tipos de bindings e `check:cloudflare` passaram; API/MCP/web/site empacotados em dry-run |
| Documentação | Links locais dos artefatos/documentos revisados e `git diff --check` passaram |

Comandos: `npm test`, `npm -w @capyra/api test`, `npm run typecheck`, `npm -w @capyra/web run lint`, `npm -w @capyra/web run build`, `uv run --project apps/ai pytest apps/ai/tests`, `npm run contracts:generate`, `npm run check:cloudflare`. Caches temporários e `BUILDX_CONFIG=/tmp/capyra-buildx` foram usados para contornar permissões do host sem alterar diretórios globais.

A cobertura inclui: Conta/Marca/papel, convite concorrente/expiração/e-mail, revogação com JWT antigo, mídia inválida/limites/Range privado, probe duplicado/retry, saldo concorrente/consumo único/liberação/ciclo/pacotes, três redes e formatos, consentimentos, DST, T−6 dias, 207/429, escrita incerta, leases/DLQ, cancelamento incerto, retry parcial, webhook HMAC/duplicado/atrasado, importação paginada/URL, métrica indisponível, histórico transferido entre contas e retenção.

## Smoke no Wrangler e Docker

- API 5080, MCP 5090, web 3000, site 3001 e container Python saudáveis.
- Conta descartável criada (201), Marca confirmada (200), upload de vídeo sintético (201) e metadados `pending → ready` via Queue + container: 720×1280, H.264, quatro segundos. Nenhum OpenAI usado na inspeção.
- Três conexões mock verificadas. Publicação em Instagram/TikTok/YouTube com uma versão e uma tentativa por Destino, apesar da repetição da mesma submissão/chave.
- Posts externos e snapshots nativos disponíveis; nove respostas locais validaram contra os schemas gerados, incluindo publicação com histórico.
- Uma análise sem chave OpenAI permaneceu em retry durante a janela curta do smoke. Cancelamento/exclusão elegível retornou 204 e devolveu o saldo de 49 para 50, com zero reservas. A liberação após falha definitiva é comprovada nos testes Worker; esse smoke não comprova conclusão de análise por IA.
- Playwright percorreu sete telas autenticadas. Criou Publicação, adicionou Reel com vídeo privado/prévia, executou preflight, agendou no fuso da Marca e cancelou com confirmação. Histórico imutável também conferido. Desktop 1440 e mobile 390 sem overflow, pageerror ou falha HTTP nesse fluxo.
- Um aviso existente de hidratação do atributo nonce no `FirebasePublicConfigScript` não interrompeu os percursos.

Screenshots locais: `/tmp/capyra-social-brands-desktop.png`, `/tmp/capyra-social-brands-mobile.png`, `/tmp/capyra-social-library-desktop.png`, `/tmp/capyra-social-connections.png`, `/tmp/capyra-social-composer.png`, `/tmp/capyra-social-destination.png`, `/tmp/capyra-social-destination-mobile.png`, `/tmp/capyra-social-history.png`. Fixtures são sintéticos; tokens locais não são parte da documentação versionada.

## Segurança

`security:local` final passou: Gitleaks sem segredos nos arquivos atuais; Trivy filesystem sem achados no recorte configurado; Semgrep sem findings; pip-audit sem vulnerabilidades conhecidas. Hono foi atualizado dentro do intervalo permitido para remover advisories detectados no baseline inicial. Resta um advisory **baixo** do esbuild sobre servidor de desenvolvimento no Windows (GHSA-g7r4-m6w7-qqqr), sem aplicação ao runtime Workers/macOS validado; não houve atualização ampla e não relacionada da cadeia de build.

`security:images -- --image ai` passou: imagem Python Alpine 3.24.1 sem vulnerabilidades de SO HIGH/CRITICAL no recorte configurado. A análise de dependências Python é complementada por pip-audit; não se afirma ausência universal de vulnerabilidades.

ZAP baseline completou os quatro alvos locais, sem FAIL: API 2 grupos de avisos, MCP 1, web 6 e site 5. Avisos foram revisados: CORS em fontes públicas do servidor Vite (médio, sem conteúdo autenticado), headers opcionais/ausentes em módulos e estáticos de desenvolvimento (baixo), cache e aplicação moderna (informacional). O spider MCP partiu de `/` (404); cobertura funcional autenticada/isolamento vem dos testes MCP/Worker, não desse spider. Os relatórios ficam em `tmp/security/zap/{api,mcp,web,site}.{json,md,html}` e não comprovam configuração de produção.

A primeira tentativa DAST usou localhost dentro do Docker e não alcançou o host. Depois, API/MCP foram alcançados por `host.docker.internal`; web/site exigiram bind IPv4 e hostname adicional explícito do Vite. Somente alvos locais foram acessados.

Uma credencial aparente preexistente em `apps/api/.dev.vars.example` foi substituída por placeholder. Se for válida, o proprietário deve revogar/rotacionar a chave. A remoção desta worktree não apaga o histórico Git. Nenhuma credencial foi reproduzida nesta documentação.

## Fora da validação local

Não executados: Zernio autenticado, publicação/analytics reais, OAuth/branding white label, OpenAI pago, deploy ou migrations remotas. Identidades não verificáveis continuam bloqueadas; resultado remoto inconclusivo permanece desconhecido sem reenvio cego. O [quickstart](quickstart.md) contém token, segredo, callback, webhook e roteiro posterior. Aprovação do fornecedor e lançamento comercial continuam pendentes.
