# Feature Specification: Capyra Social

**Feature Branch**: `codex/capyra-social`

**Created**: 2026-09-14

**Status**: Implemented and locally validated; live provider proof pending

**Input**: Plano aprovado pelo usuário, baseado em [capyra-social.md](../../docs/plans/capyra-social.md) e [CONTEXT.md](../../CONTEXT.md).

## User Scenarios & Testing

### User Story 1 - Marcas e equipe (Priority: P1)

O Proprietário organiza Marcas e convida Membros para operar no mesmo espaço.

**Why this priority**: Faz parte do ciclo mínimo analisar → publicar → medir.

**Independent Test**: Executar os cenários abaixo com Conta e mídia descartáveis, simulando apenas dependências externas.

**Acceptance Scenarios**:

1. Conta existente recebe Marca inicial sem alterar análises antigas; nome e fuso são confirmados antes do agendamento.
2. Convite válido aceita apenas o e-mail autenticado correspondente, uma vez; usuário de outra Conta é recusado.
3. Membro removido perde acesso imediatamente, inclusive com token ainda válido.

### User Story 2 - Biblioteca, análise e créditos (Priority: P1)

O Operador carrega mídia de uma Marca e solicita análise com controle de uso.

**Why this priority**: Faz parte do ciclo mínimo analisar → publicar → medir.

**Independent Test**: Executar os cenários abaixo com Conta e mídia descartáveis, simulando apenas dependências externas.

**Acceptance Scenarios**:

1. Nova mídia e análise exigem Marca ativa explícita; análise legada pode ser atribuída manualmente.
2. Vídeo de até 180 segundos pode ser analisado; imagem e vídeo maior são recusados sem consumo.
3. Requisições concorrentes não excedem saldo; relatório completo consome uma unidade, falha libera e retry interno não cobra.

### User Story 3 - Conexões sociais protegidas (Priority: P1)

O Proprietário conecta as redes da Marca sem misturar identidades nem perder histórico.

**Why this priority**: Faz parte do ciclo mínimo analisar → publicar → medir.

**Independent Test**: Executar os cenários abaixo com Conta e mídia descartáveis, simulando apenas dependências externas.

**Acceptance Scenarios**:

1. Uma identidade nativa comprovada só pode estar ativa em uma Marca no produto.
2. Identidade não verificável fica pendente e não publica; reconexão insegura é bloqueada antes da autorização.
3. Desconexão só termina após cancelamento confirmado dos Destinos futuros.

### User Story 4 - Publicação e agendamento por Destino (Priority: P1)

O Operador prepara variações, publica ou agenda e acompanha cada entrega.

**Why this priority**: Faz parte do ciclo mínimo analisar → publicar → medir.

**Independent Test**: Executar os cenários abaixo com Conta e mídia descartáveis, simulando apenas dependências externas.

**Acceptance Scenarios**:

1. Publicação sem análise é permitida; vínculo opcional exige análise concluída da mesma Marca.
2. Cada submissão cria versão imutável; edição agendada cancela a versão anterior antes de substituí-la.
3. Cancelamento incerto e escrita com resultado desconhecido permanecem explícitos; retry seletivo não repete entregas concluídas.
4. Horário é interpretado no fuso confirmado da Marca; DST inexistente/ambíguo é recusado; mudança de fuso não desloca horários.

### User Story 5 - Posts externos e métricas (Priority: P2)

O Operador consulta histórico externo e desempenho nativo por Marca e rede.

**Why this priority**: Completa a operação e a leitura histórica da oferta.

**Independent Test**: Executar os cenários abaixo com Conta e mídia descartáveis, simulando apenas dependências externas.

**Acceptance Scenarios**:

1. Conexão importa os noventa dias disponíveis com paginação e deduplicação, sem baixar arquivos externos.
2. Importação pontual por URL permite itens anteriores disponíveis; registros externos são somente leitura.
3. Métricas mostram origem, período, observação e atualização; indisponível não é zero e comparações não afirmam causalidade.

### User Story 6 - Operação, franquias e retenção (Priority: P2)

O Proprietário acompanha uso, notificações, histórico e arquivamento seguro.

**Why this priority**: Completa a operação e a leitura histórica da oferta.

**Independent Test**: Executar os cenários abaixo com Conta e mídia descartáveis, simulando apenas dependências externas.

**Acceptance Scenarios**:

1. Oferta vale para todas as contas: cinco Marcas ativas, quinze identidades por ciclo, cinco Operadores e cinquenta análises.
2. Reconexão da mesma identidade não consome franquia adicional; identidades desconectadas contam até fechar o ciclo.
3. Arquivamento confirma cancelamentos e desconexões; histórico permanece somente leitura e originais expiram após trinta dias salvo bloqueio de publicação aberta.
4. Créditos incluídos expiram no ciclo, pacotes são consumidos depois e permanecem com assinatura ativa; somente provisionamento operacional concede adicionais.

### Edge Cases

Saldo e convite concorrentes; Membro removido com sessão antiga; Marca alheia/arquivada; horário DST; webhook inválido, duplicado ou atrasado; publicação parcial; timeout após escrita; expiração da deduplicação externa; troca de handle; upload expirado; mídia em uso no purge; métrica indisponível.

## Requirements

### Functional Requirements

- **FR-001**: Toda Conta deve possuir Marca inicial; novas operações de mídia e análise exigem Marca ativa explícita.
- **FR-002**: Análises legadas devem permanecer sem Marca até atribuição manual e não podem originar publicação antes disso.
- **FR-003**: A Marca deve ter nome e fuso IANA confirmados antes de agendamento; alterações não deslocam instantes existentes.
- **FR-004**: A Conta deve possuir exatamente um Proprietário e no máximo quatro Membros na oferta inicial; Membros operam todas as Marcas.
- **FR-005**: Convites por link devem estar vinculados ao e-mail, expirar em sete dias e ser de uso único; participação em duas Contas é proibida.
- **FR-006**: Remoção de Membro deve revogar acesso imediatamente; proibição por papel não encerra uma sessão válida.
- **FR-007**: Mídia privada deve aceitar vídeos e imagens de até 200 MB e variantes fornecidas pelo Operador, sem transformação automática.
- **FR-008**: Análise deve aceitar apenas vídeo de até três minutos; validação técnica deve preceder o trabalho de análise cobrado.
- **FR-009**: Cada análise aceita deve reservar uma unidade atomicamente, consumir apenas com relatório completo e liberar em falha ou cancelamento elegível; retry interno não recobra.
- **FR-010**: Todas as contas devem receber cinquenta análises por ciclo mensal, cinco Marcas ativas, quinze identidades únicas por ciclo e cinco Operadores; adicionais dependem de provisionamento explícito.
- **FR-011**: Créditos incluídos devem expirar ao fim do ciclo; pacotes devem ser consumidos depois e permanecer enquanto a assinatura estiver ativa.
- **FR-012**: Conexões devem ser administradas somente pelo Proprietário, limitadas a uma identidade ativa por rede e Marca e uma conexão ativa global por identidade nativa verificada.
- **FR-013**: Autorização social deve ser de uso único, expirar e vincular Operador, Conta, Marca e rede; o navegador não decide a propriedade da identidade.
- **FR-014**: Identidade não verificável deve permanecer pendente sem publicar; reconexão insegura deve ser bloqueada antes da autorização, sem usar handle como identidade.
- **FR-015**: Publicações devem agrupar Destinos com conteúdo, mídia, configurações, horários e estados independentes; análise concluída da mesma Marca é vínculo opcional.
- **FR-016**: Devem ser suportados Feed, Reels, Stories e carrosséis Instagram; vídeos e carrosséis de fotos TikTok; vídeos e Shorts YouTube; texto, imagem, carrossel de até 20 imagens e vídeo LinkedIn (perfil pessoal ou página de empresa), sujeitos às capacidades válidas da conexão.
- **FR-017**: Composição deve validar mídia e configurações por Destino antes de enviar e exigir prévia, privacidade e consentimentos TikTok.
- **FR-018**: Submissão deve preservar versão imutável e tentativas rastreáveis; estados devem distinguir rascunho, aguardando envio, submetendo, agendado, publicando, publicado, cancelamento solicitado, cancelado, desconhecido e falha definitiva.
- **FR-019**: Agendamentos distantes devem permanecer duráveis até seis dias antes da publicação; horários ambíguos ou inexistentes devem ser recusados.
- **FR-020**: Cancelamento, edição agendada, desconexão e arquivamento devem aguardar confirmação externa; conteúdo já em publicação não pode ser apresentado como cancelado.
- **FR-021**: Resultado incerto deve ser reconciliado antes de novo envio; erros transitórios devem respeitar espera limitada; retry manual afeta somente Destinos com falha confirmada.
- **FR-022**: Eventos externos devem ser autenticados e deduplicados antes de alterar estado; eventos antigos não podem regredir estados terminais.
- **FR-023**: Posts externos devem ser importados dos noventa dias disponíveis e por URL individual, com deduplicação por identidade nativa e post, sem download automático de mídia.
- **FR-024**: Snapshots devem preservar origem, nome, período, observação, atualização e indisponibilidade; métricas recentes devem atualizar diariamente.
- **FR-025**: Agregação deve exigir equivalência semântica e aditividade documentadas; não haverá score entre redes nem atribuição causal à análise.
- **FR-026**: Marca arquivada deve ser somente leitura, preservar histórico, exigir novas conexões ao restaurar e expirar originais em trinta dias, salvo publicação ainda aberta.
- **FR-027**: Ações sensíveis devem registrar ator, Conta, Marca, recurso, horário e correlação por doze meses sem segredos ou conteúdo sensível; eventos acionáveis devem notificar o Proprietário.
- **FR-028**: A interface deve oferecer Marcas, equipe, biblioteca, conexões, compositor, agenda, detalhe por Destino, métricas, uso e notificações nos idiomas existentes.
- **FR-029**: Clientes existentes de análise e upload devem exigir escolha explícita de Marca e permitir descobrir Marcas disponíveis, sem novas ferramentas de publicação social.
- **FR-030**: A entrega deve ser validável localmente sem credenciais do fornecedor; operação real e prova white label devem permanecer claramente separadas da simulação.

### Key Entities

Conta Capyra, Operador (Proprietário/Membro), Marca, Mídia original/Variante, Análise de vídeo, Convite, Conta/Conexão social, Sessão de autorização, Publicação, Destino, Versão, Tentativa, Post externo, Snapshot de métrica, Ciclo, Reserva/Crédito, Notificação e Evento de auditoria seguem o glossário canônico.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Os seis percursos descritos são demonstráveis integralmente em ambiente local com dependências externas simuladas.
- **SC-002**: Nenhum cenário de concorrência aceito produz saldo negativo, convite reutilizado, identidade ativa duplicada ou entrega repetida.
- **SC-003**: Todos os estados incertos e indisponibilidades ficam visíveis, sem falso cancelamento, falso sucesso ou conversão em zero.
- **SC-004**: Todas as operações autenticadas testadas rejeitam recursos de outra Conta e permissões incompatíveis.
- **SC-005**: Entrega inclui roteiro reproduzível de configuração e validação real posterior, sem declarar aprovação white label.

## Assumptions

- Público: agency, creator e team; piloto comercial posterior somente para agências.
- Sem portal de aprovação, transformação de mídia, análise de imagens, múltiplas Contas por usuário, edição de posts publicados, outras redes ou cobrança automática.
- Ciclo mensal por aniversário UTC começa na migração/provisionamento, sem consumo retroativo; dia é limitado ao último dia do mês quando necessário.
- Nome inicial deriva da Conta; fuso provisório America/Recife exige confirmação. Convites expiram em sete dias.
- Implementação específica autorizada antes da prova real; essa prova e o piloto comercial não fazem parte do aceite técnico local.
- Interface deve preservar design e idiomas existentes. Ausência de identidade confiável bloqueia ativação/publicação.
