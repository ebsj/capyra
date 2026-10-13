# Capyra Social: integração, publicação, métricas e precificação

**Status:** implementação local autorizada; prova real do fornecedor pendente

**Data de referência:** 13/09/2026

**Origem:** revisão de `PLAN (7).md` contra o repositório, o domínio resolvido e a documentação oficial atual do Zernio

## 1. Decisão executiva

O Capyra Social é tecnicamente plausível, mas a escolha do Zernio permanece
**condicional**. Nenhum piloto social começa antes de Instagram, TikTok e
YouTube passarem conjuntamente por uma prova prática da Jornada social white
label.

O requisito é estrito: em conexão, consentimento, seleção, callback,
reconexão, revogação, erros, e-mails, suporte, aplicativos autorizados e
publicação, o Operador pode identificar somente Capyra e a rede social. Qualquer
exposição de nome, marca ou domínio do Zernio reprova o gate.

A implementação completa, incluindo o adaptador social, foi autorizada em
14/09/2026 antes da prova prática. Desenvolvimento e validação usam Wrangler
local, Docker para Python e um simulador social explicitamente selecionado.
O usuário configurará as credenciais e executará a prova real depois da entrega.
O piloto comercial continua bloqueado pelo gate conjunto. Identidades não
verificáveis e reconexões inseguras são bloqueadas no produto; sucesso no
simulador não aprova a integração real nem a jornada white label.

## 2. Resultado pretendido e escopo

O produto deve permitir que uma equipe execute o ciclo:

> analisar → melhorar → publicar → medir

O piloto terá trinta dias, três agências e oferta comercial de teste chamada
**Capyra Social**. A implementação será compatível com contas `agency`,
`creator` e `team`, mas a venda do piloto ficará restrita a agências.

### Incluído no primeiro lançamento

- Marcas obrigatórias para todos os Tipos de conta.
- Colaboração com um Proprietário e Membros.
- Uma Conta social ativa por rede em cada Marca.
- Instagram, TikTok e YouTube.
- Biblioteca de mídia, Publicações e Posts externos.
- Composição por Destino, rascunho, publicação imediata e agendamento.
- Cancelamento confirmado antes da publicação e retry apenas de Destinos que falharam.
- Importação automática de noventa dias de metadados e métricas.
- Snapshots históricos de métricas nativas.
- Uso, franquias, reserva de créditos e trilha de auditoria.

### Fora do primeiro lançamento

- Portal ou aprovação pelo cliente da agência.
- Permissões por Marca ou mais papéis além de Proprietário e Membro.
- Participação do mesmo usuário em várias Contas Capyra.
- Mais de uma conta ativa da mesma rede por Marca.
- Edição ou remoção de post já publicado.
- Corte, reenquadramento, transcodificação ou compressão pelo Capyra.
- Análise de IA para imagens e carrosséis.
- Score agregado entre redes ou atribuição causal de desempenho à análise.
- Importação histórica em massa acima de noventa dias.
- Inbox, comentários, mensagens, anúncios, escuta social e outras redes.
- Cobrança self-service; o piloto terá faturamento e provisionamento manuais.
- Novas ferramentas sociais no CLI ou MCP; ambos preservam o comportamento atual.

## 3. Modelo de domínio

O glossário canônico está em [`CONTEXT.md`](../../CONTEXT.md). As regras
centrais são:

| Conceito | Regra |
| --- | --- |
| Conta Capyra | Fronteira de isolamento por `account_id`; possui uma ou mais Marcas |
| Tipo de conta | Segmenta a experiência, mas não define plano, permissões ou limite de Marcas |
| Marca | Pertence a exatamente uma Conta Capyra e possui fuso IANA obrigatório |
| Operador | Pertence a uma Conta; Proprietário administra e Membro opera todas as Marcas |
| Conta social | Identidade de uma Marca em uma rede; no máximo uma ativa por rede e uma conexão ativa global |
| Publicação | Conteúdo de uma Marca que agrupa um ou mais Destinos |
| Destino | Variação para uma Conta social, com conteúdo, horário e estado próprios |
| Versão de destino | Snapshot imutável criado na submissão ou no agendamento |
| Tentativa de entrega | Um esforço de enviar um Destino; retries não repetem Destinos concluídos |
| Post externo | Registro somente leitura de conteúdo publicado fora do Capyra |
| Snapshot de métrica | Observação datada de uma métrica nativa de uma Conta social ou Destino |
| Crédito de análise | Reservado no aceite e consumido apenas após relatório completo |

### 3.1 Propriedade e isolamento

- Cada Marca pertence a uma única Conta Capyra.
- Uma identidade social pode ter somente uma conexão ativa em todo o Capyra.
- A Marca possui no máximo uma conta ativa de Instagram, TikTok e YouTube.
- Troca de identidade exige desconexão explícita; histórico não é transferido.
- Consultas e mutações autenticadas filtram `account_id` e validam `brand_id`.
- Identificadores Zernio nunca são aceitos como identificadores públicos nem
  usados, isoladamente, para decidir o tenant.

### 3.2 Marcas, análises e mídia

- Toda nova análise pertence a exatamente uma Marca, em todos os Tipos de conta.
- Contas existentes recebem uma Marca inicial; análises anteriores continuam
  sem Marca até atribuição manual e não podem originar publicação nesse estado.
- A Versão de destino pode ter um Vínculo de análise opcional com uma análise
  concluída da mesma Marca.
- Publicar não exige análise: imagens, carrosséis e conteúdo não analisado são
  válidos.
- Comparações mostram associação observacional; nunca afirmam causalidade.
- Uploads do Capyra permanecem limitados a 200 MB pelo contrato atual. A
  franquia de análise continua limitada a vídeos de até três minutos; esse
  limite não redefine, por si, os formatos publicáveis abaixo de 200 MB.

### 3.3 Arquivamento e retenção

- Somente o Proprietário arquiva uma Marca.
- Arquivamento cancela e confirma Destinos futuros, depois desconecta as Contas sociais.
- A Marca arquivada fica somente leitura e preserva análises, publicações e métricas.
- Mídias originais expiram trinta dias após arquivamento ou exclusão solicitada.
- Mídia vinculada a uma publicação não concluída não pode ser eliminada.
- Restauração exige novas conexões; exclusão definitiva segue fluxo separado de privacidade.

## 4. Capacidades por rede

As capacidades devem ser consultadas dinamicamente e validadas antes de cada
submissão; a tabela é um baseline de planejamento, não uma promessa imutável.

| Rede | Escopo do MVP | Restrições essenciais |
| --- | --- | --- |
| Instagram | Feed, Reels, Stories e carrosséis | Conta profissional; validar formato, quantidade e configurações antes de agendar |
| TikTok | Vídeo e carrossel de fotos | Mídia obrigatória; prévia e consentimento explícitos; novas conexões Business publicam vídeo direto apenas como público |
| YouTube | Vídeos e Shorts | Um vídeo por Destino; identidade autorizada precisa possuir ou gerenciar o canal de forma compatível; sem imagem, carrossel ou post de comunidade |

O compositor permite texto, título, descrição, capa e configurações específicas
por Destino. Ele reutiliza a Mídia original quando compatível e solicita uma
Variante de mídia quando necessário. O Capyra não envia mídia fora dos limites
esperando que o fornecedor a corrija. Processamento inevitável realizado pela
própria rede permanece fora do controle do produto.

Referências: [Instagram](https://docs.zernio.com/platforms/instagram),
[TikTok](https://docs.zernio.com/platforms/tiktok) e
[YouTube](https://docs.zernio.com/platforms/youtube).

## 5. Gate de viabilidade com o Zernio

### 5.1 Matriz obrigatória de evidências

Executar em conta de teste, registrar vídeo ou screenshots e guardar data,
rede, identidade escolhida, URLs/domínios e resultado para cada cenário:

1. conexão inicial;
2. consentimento e seleção de conta/canal;
3. callback no domínio Capyra;
4. reconexão da mesma identidade;
5. tentativa de conectar identidade diferente em slot ocupado;
6. cancelamento pelo usuário;
7. expiração de autorização;
8. revogação na rede e lista de aplicativos autorizados;
9. desconexão iniciada no Capyra;
10. mensagens de erro e recuperação;
11. publicação imediata e agendada de cada formato suportado;
12. identificação exibida no post e em notificações externas.

O modo `headless=true` elimina telas intermediárias de seleção hospedadas pelo
fornecedor, mas não prova qual aplicativo aparece no consentimento da rede. A
aprovação é prática, não documental. Consulte
[Get OAuth connect URL](https://docs.zernio.com/connect/get-connect-url).

### 5.2 Gates adicionais de identidade

Um perfil Zernio corresponde a uma Marca e admite uma conta por plataforma.
Conectar outra conta no mesmo slot substitui a anterior. No TikTok, o Zernio
documenta que distingue reconexão de troca pelo último `@handle`; renomear o
handle pode ser interpretado como conta diferente e apagar o histórico mantido
pelo fornecedor. Consulte [Profiles](https://docs.zernio.com/guides/profiles) e
[TikTok connection lanes](https://docs.zernio.com/platforms/tiktok).

O gate reprova se não for possível:

- obter ou verificar uma identidade nativa estável por rede;
- impedir uma conexão diferente antes de qualquer substituição destrutiva;
- reconhecer com segurança uma reconexão após mudança de handle;
- recuperar histórico do Capyra sem depender da retenção do fornecedor;
- manter fornecedor invisível em todas as superfícies definidas.

### 5.3 Saída da prova

Produzir um relatório assinado pelo responsável do produto contendo matriz de
evidências, versões/data dos fluxos, lacunas, resposta do fornecedor sobre app
OAuth próprio e decisão `go/no-go`. Sem `go` nas três redes, o piloto comercial não começa. A implementação
local das fases sociais está autorizada, com os bloqueios de identidade
registrados na [spec](../../specs/002-capyra-social/spec.md).

## 6. Arquitetura proposta

### 6.1 Fronteiras

- `apps/api` continua como única fronteira de negócio e integração externa.
- `apps/web` usa somente o proxy `/api/v1`.
- `apps/ai` permanece restrito a R2 e OpenAI, sem D1, auth ou Zernio.
- MCP e CLI continuam usando a API pública e não chamam o fornecedor.
- Um adaptador interno `SocialProvider` encapsula Zernio, mapeia erros e impede
  que tipos ou IDs do fornecedor vazem para os contratos públicos.
- **Autorização Capyra** (MCP/PKCE) e **Autorização social** são fluxos distintos.

### 6.2 Estado em D1

Novas tabelas ou equivalentes devem cobrir:

- `brands` e o vínculo obrigatório de Marca nos novos `source_assets` e `video_analyses`;
- convites/membros, notificações e eventos de auditoria;
- `social_accounts`, conexões e sessões de autorização;
- `social_publications`, destinos, versões e tentativas de entrega;
- `external_posts` e `metric_snapshots`;
- recibos deduplicados de webhook;
- ledger de franquias, reservas e consumo de créditos.

Invariantes importantes usam constraints e índices, inclusive exclusividade de
Proprietário, Marca/plataforma ativa, identidade social ativa e IDs de webhook.
Migrações seguem expand/contract e preservam os registros existentes.

### 6.3 Objetos em R2

- Mídias permanecem privadas, particionadas por Conta e Marca.
- D1 armazena metadados e referências; nunca os binários.
- A transferência ao Zernio é servidor-a-servidor por URL de upload prescrita,
  sem tornar o bucket Capyra público.
- O purge respeita retenção de trinta dias e bloqueios de Publicações em aberto.
- Posts externos não causam download automático de mídia.

### 6.4 Agendamento e limite de sete dias

Uploads temporários do Zernio expiram após sete dias e a documentação orienta
agendar posts que os usam dentro dessa janela. Portanto:

- agendamentos a até seis dias são transferidos imediatamente ao fornecedor;
- agendamentos mais distantes ficam duráveis no Capyra;
- um Cron seleciona Destinos que entraram na janela e envia IDs para uma Queue social;
- o consumer cria o upload, transfere a mídia e agenda com chave idempotente;
- reconciliação periódica recupera jobs sem lease, webhooks perdidos e estados desconhecidos;
- Queue social, DLQ, retries e observabilidade ficam separados da fila de análises.

Referências: [Media uploads](https://docs.zernio.com/guides/media-uploads) e
[Idempotency and safe retries](https://docs.zernio.com/guides/idempotency).

### 6.5 Webhooks

- Endpoint dedicado verifica HMAC-SHA256 sobre o corpo bruto em comparação constante.
- O ID estável do evento é inserido sob índice único antes do processamento.
- O handler persiste e responde `2xx` em menos de cinco segundos; a Queue processa depois.
- Tenant e Marca são resolvidos apenas por mapeamento interno conhecido.
- Eventos fora de ordem não podem regredir um estado terminal.
- Reconciliação cobre o modelo at-least-once, atrasos e DLQ do fornecedor.

O Zernio documenta até sete tentativas, entrega at-least-once e deduplicação por
ID de evento. Consulte [Webhooks](https://docs.zernio.com/webhooks).

## 7. Contrato público

Toda rota permanece sob `/api/v1`, usa camelCase, IDs próprios, paginação e
autorização por Conta/Marca. O desenho detalhado pertence à spec e ao OpenAPI,
mas o plano prevê os seguintes recursos:

- `/brands`, `/brands/{id}/archive` e `/brands/{id}/restore`;
- `/members`, `/member-invitations`;
- `/brands/{brandId}/social-connections` e sessões de autorização por plataforma;
- `/social-publications` e `/social-publications/{id}/destinations`;
- ações explícitas de agendar, cancelar e repetir um Destino;
- `/external-posts`, sincronização inicial e importação pontual por URL;
- `/social-metrics` e séries históricas;
- `/usage`, reservas e compras provisionadas;
- `/notifications` e `/audit-events`.

Qualquer mudança atualiza em conjunto:

- `contracts/openapi/capyra-api.v1.yaml`;
- validadores e tipos gerados;
- modelos/consumidores web;
- testes de contrato, autorização e isolamento;
- documentação pública afetada.

## 8. Fluxos e estados

### 8.1 Onboarding e equipe

- Toda conta nova cria uma Marca inicial com nome e fuso confirmados.
- Conta existente recebe Marca inicial na migração; análises antigas ficam sem atribuição.
- Há exatamente um Proprietário e até quatro Membros na oferta piloto.
- Convites são de uso único, expiram e não permitem que um e-mail já vinculado
  a outra Conta Capyra participe de duas contas no MVP.
- Proprietário administra membros, conexões e cobrança.
- Membro cria, edita, agenda, publica e consulta todas as Marcas.
- Toda ação sensível registra ator, Conta, Marca, recurso, horário e correlação,
  sem credenciais, mídia, prompt ou URL assinada.

### 8.2 Conexão

- Somente Proprietário inicia ou encerra conexão.
- Criar Marca cria de forma idempotente o perfil correspondente no fornecedor.
- Slot ocupado bloqueia tentativa de identidade diferente antes de abrir OAuth.
- Reconexão da mesma identidade preserva o registro e reconcilia estado.
- Perda inesperada de autorização bloqueia novos envios e marca “requer ação”.
- Desconexão voluntária só conclui após confirmar cancelamento dos Destinos futuros.
- Resultado incerto gera alerta ao Proprietário; nada é reenviado automaticamente.

### 8.3 Publicação

- Rascunho é editável.
- Agendar ou publicar cria Versão de destino imutável e chave idempotente.
- Data/hora é interpretada no fuso IANA da Marca, preservando também o instante UTC.
- Alterar o fuso não desloca agendamentos existentes; horários de DST ambíguos são rejeitados.
- Editar item agendado cancela e confirma a versão vigente antes de criar outra.
- Pedido de cancelamento não é apresentado como cancelado antes da confirmação externa.
- Se a rede já iniciou ou concluiu a publicação, cancelamento é recusado.
- Estado geral da Publicação é derivado dos Destinos.

Estados detalhados serão fixados na spec; no mínimo devem distinguir rascunho,
aguardando handoff, submetendo, agendado, publicando, publicado, cancelamento
solicitado, cancelado, resultado desconhecido e falha definitiva.

### 8.4 Falhas e retry

- `429`, indisponibilidade e erros transitórios confirmados usam backoff limitado.
- `Retry-After` é respeitado.
- Timeout ou `503` depois de uma escrita produz resultado desconhecido.
- Antes de repetir, consultar estado usando IDs e a mesma chave idempotente.
- Rejeições de conteúdo, permissão, formato ou credencial aguardam ação do Operador.
- Retry manual cria nova Tentativa apenas nos Destinos que falharam.
- `207` do fornecedor é tratado como sucesso HTTP com resultado parcial, não como sucesso total.
- Código e tipo estáveis orientam o controle; mensagens humanas não orientam lógica.

Referências: [Post lifecycle](https://docs.zernio.com/guides/post-lifecycle) e
[Error handling](https://docs.zernio.com/guides/error-handling).

### 8.5 Posts externos e métricas

- Conexão inicia importação paginada dos noventa dias anteriores.
- Deduplicação usa plataforma, identidade social nativa e ID nativo do post.
- Importação por URL permite buscar item anterior quando ainda disponível.
- Post externo é somente leitura e não possui Tentativas de entrega do Capyra.
- Snapshots guardam origem, nome da métrica, período, observação e `dataThrough`.
- Indisponível não equivale a zero.
- Agregação de Marca exige equivalência semântica e aditividade documentadas.
- Métricas recentes são atualizadas diariamente; status de publicação depende
  de webhook com reconciliação periódica, não da cadência analítica.
- Dashboard não cria score entre redes e não atribui causalidade à análise.

Referências: [List posts](https://docs.zernio.com/posts/list-posts),
[Sync external posts](https://docs.zernio.com/analytics/sync-external-posts) e
[Get analytics](https://docs.zernio.com/analytics/get-analytics).

### 8.6 Uso e créditos

- Solicitação válida reserva um Crédito de análise atomicamente.
- Relatório completo consome; falha técnica ou cancelamento prévio libera.
- Retry interno da mesma análise não cobra outra unidade.
- Nova análise solicitada pelo Operador consome outra unidade.
- Sem saldo, nova análise é bloqueada até compra explícita.
- Créditos mensais incluídos expiram no fechamento do ciclo.
- Pacotes comprados são consumidos depois da franquia e permanecem enquanto a assinatura estiver ativa.

## 9. Oferta comercial e economia

### 9.1 Hipótese de oferta

| Item | Hipótese do piloto |
| --- | ---: |
| Capyra Social | R$ 999/mês |
| Marcas ativas | 5 |
| Identidades sociais únicas por ciclo | 15 |
| Operadores | 5, incluindo o Proprietário |
| Análises mensais | 50 vídeos de até 3 minutos |
| Marca adicional | R$ 199/mês, com 3 identidades adicionais por ciclo |
| Pacote adicional | R$ 149 por 50 análises, mediante compra explícita |
| Publicações | Sem cobrança por post, sujeitas aos limites das redes |

Marcas arquivadas não ocupam franquia de Marca, mas identidades conectadas em
qualquer momento continuam contando até o fechamento do ciclo. Reconectar a
mesma identidade não consome unidade adicional. A equipe acompanha
`account-days` internamente para reconciliar custo real do Zernio.

### 9.2 Custo do fornecedor

Em 13/09/2026, o Zernio documenta cobrança diária progressiva por contas
conectadas: crédito equivalente às duas primeiras, US$ 6 por unidade na faixa
até dez, US$ 3 na faixa até cem e US$ 1 acima de cem. Perfis e posts não são
tarifados separadamente. Consulte [Pricing](https://docs.zernio.com/pricing).

Mantendo quinze conexões durante trinta dias:

| Contas Capyra pagantes | Contas sociais | Zernio/mês | Zernio por Conta Capyra |
| ---: | ---: | ---: | ---: |
| 1 | 15 | US$ 63 | US$ 63,00 |
| 5 | 75 | US$ 243 | US$ 48,60 |
| 10 | 150 | US$ 368 | US$ 36,80 |
| 20 | 300 | US$ 518 | US$ 25,90 |

### 9.3 Premissas e sensibilidade

- Câmbio base: R$ 6/US$, como premissa, não cotação.
- Infraestrutura e suporte: R$ 100 por Conta Capyra/mês.
- Custo máximo de IA: R$ 1 por análise concluída.
- Tributos e cobrança: 10% da receita.
- Desenvolvimento, aquisição e despesas administrativas ficam fora da margem de contribuição.

Com uso integral da franquia, a margem estimada sobre a receita bruta é:

| Cenário | R$ 5/US$ | R$ 6/US$ | R$ 7/US$ |
| --- | ---: | ---: | ---: |
| 1 cliente | 43,5% | 37,1% | 30,8% |
| 10 clientes | 56,6% | 52,9% | 49,2% |

O piloto usa faturamento manual e provisionamento explícito de entitlement.
Antes de cobrança automatizada, medir inadimplência, impostos reais, custo de
suporte, armazenamento, egress, account-days e custo completo por análise.

## 10. Segurança e privacidade

- Chaves Zernio e segredo de webhook ficam em Workers secrets.
- O Capyra não armazena tokens OAuth das redes; armazena IDs próprios,
  referências do fornecedor e estado mínimo necessário.
- Sessão de Autorização social usa state aleatório, uso único, expiração curta
  e vínculo a Conta, Marca, plataforma e Operador.
- Callback nunca aceita do navegador a autoridade final sobre perfil, conta ou tenant.
- Webhooks exigem assinatura válida e deduplicação antes de alterar estado.
- R2 permanece privado; URLs assinadas, mídia, tokens e payloads sensíveis não entram em logs.
- Auditoria registra mutações sensíveis por doze meses no piloto.
- Limites de taxa e abuso existem por Conta, Operador, Marca e Conta social conforme a operação.
- Exclusão definitiva precisa remover D1, R2 e mapeamentos do fornecedor conforme política formal.

## 11. Entrega incremental

### Fase 0 — prova do fornecedor

- Executar a matriz white label nas três redes.
- Confirmar identidade nativa estável e comportamento de reconexão/TikTok.
- Validar todos os formatos, preflight, idempotência, cancelamento, webhooks e métricas.
- Obter resposta escrita sobre identidade OAuth própria, custos e aprovações.
- Saída: `go/no-go` conjunto.

### Fase 1 — fundações independentes

- Marcas obrigatórias, fuso, arquivamento e retenção.
- Migração/backfill seguro para contas e análises existentes.
- Convites e papéis Proprietário/Membro.
- Brand-scoped assets e análises.
- Ledger de uso, reservas, auditoria e provisionamento manual.

### Fase 2 — fatia vertical Instagram

- Adaptador, perfil por Marca e conexão white label.
- Mídia, compositor, preflight, rascunho e um Destino.
- Publicação imediata/agendada, webhook, reconciliação e métrica.
- Implementação local autorizada antes do Gate white label; piloto real exige aprovação conjunta.

### Fase 3 — multi-Destino, TikTok e YouTube

- Variações por rede e consentimentos TikTok.
- Handoff tardio de mídia, versões imutáveis, cancelamento e retry seletivo.
- Falha parcial, resultado desconhecido e perda de conexão.
- Cobertura dos formatos acordados nas três redes.

### Fase 4 — biblioteca, importação e analytics

- Posts externos, importação inicial de noventa dias e importação por URL.
- Snapshots, staleness, indisponibilidade e agregações permitidas.
- Comparação observacional com Vínculo de análise.

### Fase 5 — piloto comercial

- Provisionar três agências por trinta dias.
- Faturar manualmente R$ 999 e registrar concessões/exceções.
- Medir ativação, confiabilidade, suporte, custos, margem e disposição a pagar.
- Recalcular franquias, adicionais e preço antes de oferta pública.

## 12. Validação técnica

### Contrato e API

- OpenAPI, gerados, consumidores e testes mudam juntos.
- Testes negativos de `account_id`, `brand_id`, papéis e IDs do fornecedor.
- Idempotência de create, schedule, cancel, retry, convite, reserva e webhook.

### D1, R2 e jobs

- Migração local com conta existente, backfill de Marca e análise legada sem Marca.
- Constraints e concorrência de conexão, Proprietário e reserva de créditos.
- Ownership, streaming, retenção, purge e bloqueio de mídia em uso.
- Queue/DLQ com duplicação, timeout, retry, lease vencido e reconciliação.
- Handoff em T−6 dias e comportamento nos limites da janela.

### Web

- Criar/alternar/arquivar Marca, convidar Membro e visualizar uso.
- Conectar/reconectar/desconectar cada rede.
- Compor variações, corrigir preflight, agendar em fuso e cancelar.
- Exibir falha parcial, ação necessária, resultado desconhecido e staleness.
- Build para mudanças de rota/configuração e smoke dos fluxos principais.

### Segurança

- Assinatura inválida, replay e evento fora de ordem em webhook.
- State ausente, expirado, reutilizado ou vinculado a outro tenant.
- Tentativa de referenciar Marca, mídia, análise ou Conta social de outra conta.
- Logs e erros sem secrets, mídia, prompts, tokens ou URLs assinadas.
- Baseline de dependências e DAST local conforme os runbooks existentes.

## 13. Critérios do piloto

O lançamento público só é recomendado se todos forem atendidos:

- zero exposição do Zernio nas três Jornadas sociais white label;
- zero incidente de isolamento, autorização incorreta ou publicação duplicada;
- 100% dos estados desconhecidos reconciliados ou escalados com evidência;
- pelo menos duas das três agências completam analisar → publicar → medir em três Marcas;
- pelo menos 95% dos Destinos aceitos chegam a estado terminal rastreável sem intervenção técnica;
- falhas por conteúdo, permissão e rede aparecem classificadas e acionáveis;
- métricas sempre mostram origem, indisponibilidade e atualização;
- margem de contribuição medida de pelo menos 40% no câmbio e uso observados;
- no máximo duas horas de suporte operacional por agência no mês;
- pelo menos duas agências aceitam continuar pelo preço de R$ 999 sem desconto obrigatório.

Falhar em segurança, duplicação ou white label é bloqueio absoluto. Metas
comerciais ou operacionais abaixo do esperado exigem recalcular preço, franquia
ou escopo antes de novo piloto; não são mascaradas por projeções.

## 14. Riscos e condições de interrupção

| Risco | Resposta |
| --- | --- |
| Zernio aparece em consentimento ou configuração | No-go conjunto; avaliar apps próprios em outro plano |
| TikTok renomeado é tratado como identidade diferente | No-go até haver identificador estável ou prevenção comprovada |
| Upload Zernio expira antes do agendamento | Handoff somente dentro de seis dias, com dispatcher e reconciliação |
| Fornecedor substitui conexão ocupada | Bloqueio Capyra antes de iniciar OAuth e teste destrutivo controlado |
| Métrica atrasada ou ausente | Snapshot com `observedAt`, `dataThrough` e indisponibilidade explícita |
| Timeout após escrita | Estado desconhecido, consulta/reconciliação e mesma chave idempotente |
| Rotação de conexões eleva custo | Franquia por identidade única do ciclo e medição de account-days |
| Crescimento de mídia/R2 | Limite de 200 MB, retenção de trinta dias em Marca arquivada e medição por tenant |
| Modelo atual impede usuário em duas contas | Limitação explícita do MVP; revisar antes de expansão além do piloto |

## 15. Documentação e definição de pronto

Além deste plano, decisões já consolidadas estão em `CONTEXT.md` e
`docs/adr/`. A implementação deve atualizar README, setup, desenvolvimento,
arquitetura, banco, segurança, OpenAPI, contratos gerados e instruções dos apps
afetados.

Uma fase está pronta somente com:

- história demonstrável de ponta a ponta;
- contratos e migrações alinhados;
- testes proporcionais passando;
- evidências dos gates anexadas;
- custos e limitações registrados;
- documentação sem descrever comportamento futuro como concluído.


## 16. Decisões de execução aprovadas em 14/09/2026

- Artefatos Spec Kit: [spec](../../specs/002-capyra-social/spec.md), [plano técnico](../../specs/002-capyra-social/plan.md), [tarefas](../../specs/002-capyra-social/tasks.md) e [quickstart](../../specs/002-capyra-social/quickstart.md).
- `brandId` obrigatório também nos comandos e ferramentas existentes de CLI/MCP; o usuário rejeitou atribuição automática à Marca padrão. A alteração de entrada exige atualização dos clientes.
- Oferta inicial aplicada a todas as Contas, sem consumo retroativo; ciclo mensal por aniversário UTC a partir da migração/provisionamento.
- Convites seguros por link copiável, com destinatário autenticado e expiração de sete dias; sem provedor de e-mail transacional adicional.
- Fuso provisório `America/Recife`, com confirmação obrigatória antes de agendar.
- Implementação do adaptador real e simulador local; nenhum deploy, migration remota, publicação real ou chamada paga durante o desenvolvimento.
- Identidade nativa não comprovada permanece pendente e bloqueia publicação; reconexão insegura não abre OAuth. Não usar handle ou ID do fornecedor como prova de identidade.
- A prova prática de OAuth, white label, formatos e métricas reais será executada pelo usuário posteriormente. Não registrar esses gates como aprovados por testes locais.
