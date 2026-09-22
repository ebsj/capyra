# Feature Specification: Capyra Social v1

**Feature Branch**: `001-capyra-social-v1`

**Created**: 2026-09-21

**Status**: Draft

**Input**: User description: "Gerar toda a spec da solução Capyra Social v1: plataforma white-label em que agências e criadores gerenciam Instagram, TikTok e LinkedIn das Marcas — autenticar, organizar equipe, conectar redes, criar, aprovar, publicar, medir, pesquisar anúncios públicos, cobrar e operar via MCP — sem o Operador identificar o Fornecedor social."

**Glossário**: [`CONTEXT.md`](../../CONTEXT.md)
**Produto**: [`docs/PRD.md`](../../docs/PRD.md)

## User Scenarios & Testing *(mandatory)*

Cada história abaixo é um recorte independentemente testável. O MVP comercial da v1 é US1–US7 (autenticar → conectar → publicar → cobrar). Relatórios, concorrentes, MCP e site público entram em seguida.

Testes obrigatórios desta spec (não opcionais):

- isolamento por **Conta Capyra** e por **Marcas atribuídas** em toda mutação autenticada;
- contrato da API pública (`accountId`, `brandId`, `socialAccountId`, `publicationId`, `destinationId`; vocabulário Capyra; nenhum identificador do Fornecedor social);
- jornadas ponta a ponta contra um **provedor social simulado** (nunca como fallback silencioso em produção).

### User Story 1 - Entrar sem senha e abrir a Conta (Priority: P1)

A pessoa informa o e-mail. O Capyra envia, no mesmo e-mail transacional, um **link mágico** e um **código de acesso** de uso único. Abrir o link **ou** digitar o código autentica. Os dois invalidam um ao outro depois do primeiro uso bem-sucedido.

E-mail desconhecido cria a **Conta Capyra** no primeiro acesso (tipo `agency` ou `creator`) com exatamente um **Proprietário** e uma **Marca** inicial de nome placeholder. E-mail já vinculado a outra Conta não abre uma segunda. Não há senha.

**Why this priority**: Sem sessão de Operador não existe produto. É o primeiro valor demonstrável.

**Independent Test**: Com um e-mail novo, completar o acesso por link e, em outro fluxo, por código; verificar Conta + Marca inicial; recusar segundo uso do mesmo fator; recusar o mesmo e-mail em outra Conta.

**Acceptance Scenarios**:

1. **Given** um e-mail desconhecido, **When** a pessoa solicita acesso e abre o link mágico válido, **Then** nasce uma Conta Capyra com Tipo escolhido, um Proprietário e uma Marca placeholder, e a sessão fica autenticada.
2. **Given** o mesmo pedido de acesso, **When** a pessoa digita o código válido em vez de abrir o link, **Then** autentica da mesma forma e o link correspondente deixa de valer.
3. **Given** um fator já usado ou expirado, **When** alguém tenta reutilizá-lo, **Then** a autenticação falha e nenhum estado de Conta muda.
4. **Given** um e-mail que já é Operador de uma Conta, **When** tenta criar outra Conta, **Then** o Capyra recusa e a pessoa entra na Conta existente.
5. **Given** um Operador autenticado, **When** escolhe sair naquele dispositivo, **Then** só aquele acesso encerra; outros dispositivos seguem até o próximo pedido autenticado falhar se o Operador for removido.

---

### User Story 2 - Organizar Marcas e equipe (Priority: P1)

O Proprietário nomeia a Marca, confirma o **Fuso da marca** (padrão `America/Sao_Paulo`) e convida Criadores, Aprovadores e Visualizadores por e-mail, com **Papel** e **Marcas atribuídas**. A lista de Marcas pode ser vazia: o convidado entra e não opera nada até o Proprietário atribuir.

O convite sai no **Idioma** do Proprietário; no primeiro acesso o convidado grava o próprio Idioma. O Proprietário altera Papel e Marcas atribuídas na hora, sem novo convite, e não promove a Proprietário. Remover um Operador revoga o acesso imediatamente.

**Why this priority**: Agência sem equipe e sem recorte de Marca não entrega o público-alvo. Isolamento interno começa aqui.

**Independent Test**: Convidar os três papéis, entrar com Marcas vazias, atribuir depois, mudar Papel, tentar ver Marca não atribuída, remover Operador e confirmar que o próximo pedido autenticado falha. Não depende de redes conectadas.

**Acceptance Scenarios**:

1. **Given** uma Conta nova, **When** o Proprietário confirma nome não vazio e fuso da Marca inicial, **Then** a Marca fica operável para agendar; o navegador não define o fuso.
2. **Given** um convite válido para `ana@marca.com` como Aprovador com Marcas vazias, **When** ela aceita com esse e-mail, **Then** entra como Operadora e não vê conteúdo de Marca nenhuma.
3. **Given** um convite para `ana@marca.com`, **When** outra pessoa tenta aceitar com outro e-mail, **Then** o convite falha.
4. **Given** um Criador só na Marca Natura, **When** ele lista o calendário, **Then** não vê a Marca Boticário da mesma Conta.
5. **Given** um Visualizador, **When** o Proprietário o promove a Aprovador nas mesmas Marcas, **Then** a mudança vale na hora, sem novo Convite, e ele não vira Proprietário.
6. **Given** um Operador autenticado em dois dispositivos, **When** o Proprietário o remove, **Then** o próximo pedido autenticado em qualquer dispositivo falha.

---

### User Story 3 - Conectar Instagram, TikTok e LinkedIn (Priority: P1)

Só o Proprietário inicia ou encerra **Conexão social**. O navegador vai da interface Capyra para a tela oficial da rede e volta ao **domínio Capyra**. Se a rede exigir escolha (organização ou perfil no LinkedIn), a tela de seleção é do Capyra.

Uma **Identidade nativa** verificada ocupa no máximo um slot por rede na Marca e no máximo uma conexão ativa em todo o Capyra. Handle não é a chave. Identidade não verificável fica pendente e não publica. Perda de autorização vira **Conexão com ação necessária** e bloqueia envios.

A conexão dispara a **Importação inicial** de noventa dias de **Posts externos** (metadados e métricas, sem baixar arquivos). A nova identidade entra na cobrança do ciclo.

Facebook, YouTube, X, Pinterest e demais redes **não** aparecem neste lançamento.

**Why this priority**: Sem Conta social não há publicação nem unidade cobrada.

**Independent Test**: Com provedor social simulado, conectar as três redes, recusar segunda identidade no mesmo slot, recusar a mesma identidade em outra Conta, marcar ação necessária e confirmar que envios param. Sem composição de conteúdo.

**Acceptance Scenarios**:

1. **Given** um Proprietário na Marca, **When** conecta Instagram profissional em modo headless, **Then** a Conta social fica ativa, a identidade nativa fica exclusiva no Capyra e a importação de noventa dias começa.
2. **Given** LinkedIn já conectado como página, **When** tenta ligar o perfil pessoal na mesma Marca, **Then** o Capyra recusa: um slot por rede.
3. **Given** um Instagram já conectado na Conta A, **When** o Proprietário da Conta B tenta a mesma identidade, **Then** a conexão é bloqueada até desconexão explícita na Conta A.
4. **Given** um Criador, **When** tenta iniciar OAuth, **Then** a ação é recusada.
5. **Given** autorização perdida na rede, **When** o Capyra reconcilia o estado, **Then** a conexão fica com ação necessária, novos envios daquela Conta social param e o Proprietário é avisado.
6. **Given** um Operador na jornada de conexão, **When** observa telas, e-mails, erros, callback e lista de aplicativos autorizados, **Then** só identifica Capyra e a rede social — nunca o Fornecedor social.
7. **Given** uma rede sem Gate white label `go`, **When** o Proprietário abre a lista de redes, **Then** essa rede permanece oculta e não é cobrada.

---

### User Story 4 - Compor Publicação e Destinos (Priority: P1)

O Criador ou o Proprietário abre o compositor no contexto de uma Marca, escolhe uma ou mais Contas sociais conectadas (cada uma vira um **Destino**) e define texto, hashtags, mídia, capa, horário e ajustes por Destino.

A biblioteca da Marca guarda **Mídia original**. Se a rede exigir outro recorte ou duração, o operador envia **Variante de mídia**. O Capyra não transcodifica, não reenquadra e não comprime. Só Proprietário e Criador enviam arquivo. Validação por Destino ocorre antes de enviar para aprovação ou de agendar. Aprovador e Visualizador não enviam arquivo.

**Why this priority**: É o núcleo editorial. Sem Destino não há o que aprovar nem publicar.

**Independent Test**: Criar Publicação com dois Destinos divergentes, recusar mídia incompatível, recusar upload do Aprovador, impedir apagar mídia em uso. Pode usar redes simuladas; não exige aprovação nem entrega real.

**Acceptance Scenarios**:

1. **Given** Instagram e TikTok conectados na Marca, **When** o Criador cria uma Publicação com os dois Destinos, **Then** texto e mídia podem divergir e cada Destino tem estado próprio.
2. **Given** um Reels que a rede não aceita no recorte original, **When** o Criador envia uma Variante de mídia válida, **Then** o Destino usa a variante e a Mídia original permanece na biblioteca.
3. **Given** um Aprovador, **When** tenta enviar arquivo, **Then** o Capyra recusa e o caminho é **Comentário**.
4. **Given** mídia ligada a um Destino não concluído, **When** alguém tenta eliminá-la, **Then** a exclusão é bloqueada.
5. **Given** um Visualizador, **When** abre o compositor, **Then** só lê; não muta conteúdo nem mídia.

---

### User Story 5 - Aprovar conteúdo por Destino (Priority: P1)

Se a **Política de aprovação** da Marca estiver ligada, Destino só agenda ou publica no estado **aprovado**. O Criador envia para revisão. O Aprovador comenta no Destino, aprova, rejeita ou pede alterações.

Aprovar um Destino **com horário** o agenda. Sem horário, permanece aprovado até o Criador ou o Proprietário agendar ou publicar. O Aprovador não escolhe horário nem publica agora. Mudança de texto, mídia, horário ou Destino depois de aprovado reabre a revisão; agendar o aprovado sem alterar conteúdo não reabre.

Padrão: ligada em Conta `agency`, desligada em `creator`. O Tipo de conta não remove o recurso.

**Why this priority**: É o diferencial da agência e o critério de aceite 3 da v1.

**Independent Test**: Ligar a política, enviar dois Destinos, aprovar um, rejeitar o outro, pedir alteração, editar o aprovado e confirmar reabertura. Não precisa de entrega na rede.

**Acceptance Scenarios**:

1. **Given** Marca com aprovação obrigatória e Destino em revisão com horário, **When** o Aprovador aprova, **Then** o Destino é agendado e o Aprovador não clica em publicar.
2. **Given** Destino aprovado sem horário, **When** o Criador troca a legenda com a política ligada, **Then** a revisão reabre e publicar fica bloqueado até nova aprovação.
3. **Given** Destino aprovado sem alteração de conteúdo, **When** o Criador agenda, **Then** a revisão **não** reabre.
4. **Given** dois Destinos da mesma Publicação, **When** só o Instagram é aprovado, **Then** o TikTok permanece em revisão e não é liberado.
5. **Given** um Visualizador, **When** tenta aprovar ou comentar, **Then** aprovar é recusado e comentário escrito é recusado (só lê).
6. **Given** um Proprietário que escreveu o Destino, **When** a Marca exige aprovação, **Then** ele mesmo pode aprovar — não é um segundo Papel.

---

### User Story 6 - Agendar, publicar e acompanhar o calendário (Priority: P1)

Horário segue o **Fuso da marca**, gravado também em instante absoluto. DST inexistente ou ambíguo é recusado. Mudar o fuso depois **não** desloca agendamentos já gravados.

Agendar ou publicar cria **Versão de destino** imutável. Cancelar um Destino futuro só conclui depois da confirmação de que a rede não publicará aquela versão. Timeout após escrita vira **Entrega desconhecida**, sem reenvio automático. **Falha definitiva** só retenta por ação explícita, sem repetir Destinos concluídos.

Agendamentos além da janela de mídia temporária (o Capyra usa seis dias) ficam no Capyra até entrar na janela. Edição ou remoção de post **já publicado na rede** está fora da v1.

**Why this priority**: É a promessa operacional (posts no prazo ≥ 95% dos Destinos não cancelados).

**Independent Test**: Agendar no fuso da Marca, mudar o fuso sem deslocar o instante, simular cancelamento confirmado, entrega desconhecida, falha definitiva e retry seletivo contra o provedor simulado.

**Acceptance Scenarios**:

1. **Given** Fuso da marca `America/Sao_Paulo` e Destino marcado para terça 10:00, **When** o Proprietário muda o fuso para Recife depois, **Then** o instante já gravado não se desloca.
2. **Given** um Destino agendado, **When** o Operador pede cancelamento e a rede confirma que não publicará, **Then** existe **Cancelamento de destino**.
3. **Given** escrita na rede com aceite incerto, **When** o tempo de confirmação esgota, **Then** o estado é **Entrega desconhecida** e não há retry automático.
4. **Given** um Destino em falha definitiva e outro já publicado na mesma Publicação, **When** o Operador autorizado retenta, **Then** só o falho é reenviado.
5. **Given** um Criador e um Visualizador da mesma Marca, **When** abrem o calendário, **Then** ambos vêem Destinos por dia, rede e estado das Marcas atribuídas; o Visualizador não muta.

---

### User Story 7 - Cobrar Identidades sociais do ciclo (Priority: P1)

Preço de lista: **R$ 49,90 por Conta social conectada, por mês**, em BRL, recorrente e self-service. A fatura soma **Identidades sociais do ciclo**. Reconectar a mesma identidade no mesmo ciclo não duplica. Nova conexão entra em pró-rata; desconexão não estorna o ciclo corrente.

Sem Conta social ativa, a Conta Capyra permanece gratuita para login, Marcas e rascunhos, mas não publica. **Inadimplência** bloqueia nova conexão e qualquer ação que agende ou publique (incluindo aprovar Destino com horário). Rascunho, comentário, rejeitar e leitura continuam. Só o Proprietário vê faturas e método de pagamento.

**Why this priority**: É a unidade comercial e o critério de aceite 7. Conectar sem cobrar deixa margem indefinida.

**Independent Test**: Conectar três Instagrams de três Marcas e ver R$ 149,70 / mês (pró-rata no primeiro ciclo); reconectar o mesmo; desconectar sem estorno; simular falha de pagamento e tentar aprovar Destino com horário.

**Acceptance Scenarios**:

1. **Given** três Marcas cada uma com um Instagram conectado, **When** o ciclo fecha, **Then** a fatura lista três identidades e o preço de lista soma R$ 149,70 / mês.
2. **Given** um Instagram desconectado e reconectado no mesmo ciclo, **When** a fatura é emitida, **Then** a identidade conta uma vez.
3. **Given** Inadimplência, **When** o Aprovador aprova um Destino com horário, **Then** a ação é recusada; rejeitar e comentar continuam.
4. **Given** um Criador, **When** tenta abrir o portal de cobrança, **Then** o acesso é recusado.
5. **Given** Conta sem Conta social ativa, **When** o Proprietário cria rascunho, **Then** o rascunho existe e publicar/agendar permanece bloqueado.

---

### User Story 8 - Relatórios e exportação (Priority: P2)

Qualquer papel com leitura na Marca abre relatórios por período, Marca, rede e Destino. Métricas nativas (impressões, alcance, engajamento, cliques, visualizações, salvamentos, seguidores, melhor horário quando a rede fornecer) vêm de **Snapshot de métrica**. Ausência **não** é zero. Agregação entre redes só para definições equivalentes. Comparações não afirmam causalidade.

PDF usa capivara-logo e a palavra “Capyra” no tipo padrão. CSV é só dados. Sem nome do Fornecedor social.

**Why this priority**: Fecha o ciclo “medir”, mas o produto já publica sem relatório.

**Independent Test**: Gerar relatório com métrica presente e métrica ausente; exportar PDF e CSV; confirmar que Visualizador lê e que ausência não vira zero.

**Acceptance Scenarios**:

1. **Given** um Destino publicado com impressões presentes e alcance ausente, **When** o Visualizador abre o relatório, **Then** impressões aparecem e alcance permanece ausente, com explicação na interface.
2. **Given** um Proprietário, **When** exporta PDF e CSV do período, **Then** o PDF traz capivara-logo + “Capyra” e o CSV só dados, sem o Fornecedor social.
3. **Given** LinkedIn perfil pessoal, **When** a rede não devolve métrica de post externo, **Then** o Capyra não inventa número nem zero.

---

### User Story 9 - Pesquisar anúncios públicos de concorrentes (Priority: P2)

Na Marca, o operador pesquisa anúncios públicos da Meta (exige Instagram conectado) ou do LinkedIn (exige LinkedIn conectado). Filtros: termo, página/anunciante, país, período, status, plataforma de anúncio. Resultados são modelo Capyra. Não cria campanhas pagas e não rastreia feed orgânico.

**Why this priority**: Está no resultado pretendido da v1, mas o ciclo publicar-medir já existe sem isso.

**Independent Test**: Com Instagram simulado, buscar anúncios Meta; sem Instagram, recusar; confirmar que IDs do fornecedor não vazam.

**Acceptance Scenarios**:

1. **Given** Instagram conectado na Marca, **When** o Criador pesquisa anúncios públicos da Meta, **Then** vê criativo e metadados públicos em modelo Capyra.
2. **Given** Marca sem LinkedIn, **When** tenta a biblioteca do LinkedIn, **Then** a pesquisa é recusada.
3. **Given** resultados da busca, **When** inspeciona identificadores públicos, **Then** não há ID, nome de perfil interno nem URL do Fornecedor social.
4. **Given** um anúncio encontrado, **When** o operador tenta veicular ou importar para o calendário, **Then** a v1 não oferece essas ações.

---

### User Story 10 - Operar via MCP com o mesmo Operador (Priority: P2)

O MCP headless autentica um **Operador** e usa só a API pública do Capyra. Respeita o mesmo **Papel** e as mesmas **Marcas atribuídas**. Não há Papel extra nem atalho de Proprietário. Descrições das ferramentas seguem o **Idioma** do Operador. Sem interface gráfica.

**Why this priority**: Diferencia o Capyra (agente no ChatGPT/Claude), mas o webapp sozinho já cumpre o ciclo editorial.

**Independent Test**: Autenticar um Criador no MCP, listar calendário das Marcas atribuídas, tentar conectar rede e tentar ler Marca não atribuída.

**Acceptance Scenarios**:

1. **Given** um Criador autenticado no MCP, **When** pede o calendário, **Then** recebe só Destinos das Marcas atribuídas.
2. **Given** o mesmo Criador, **When** tenta iniciar Conexão social via MCP, **Then** a ação é recusada como no webapp.
3. **Given** um Visualizador no MCP, **When** tenta criar rascunho, **Then** a mutação é recusada.
4. **Given** Operador com Idioma `es`, **When** lista as ferramentas, **Then** as descrições estão em `es`.

---

### User Story 11 - Site público em três idiomas (Priority: P3)

Visitante acessa o site de marketing em `pt-BR` (padrão), `en` ou `es` por prefixo de rota. O site não autentica Operador, não mostra calendário nem cobrança, e chama à ação para o webapp. Header: capivara-logo + a palavra “Capyra”.

**Why this priority**: Necessário para aquisição, não para o ciclo operacional autenticado.

**Independent Test**: Abrir `/pt-br`, `/en` e `/es`, confirmar copy localizada, CTA para o webapp e ausência de sessão de Operador.

**Acceptance Scenarios**:

1. **Given** um visitante em `/es`, **When** lê a página, **Then** o conteúdo está em espanhol e o header mostra a capivara-logo + “Capyra”.
2. **Given** um visitante sem prefixo, **When** abre o site, **Then** vale `pt-BR`.
3. **Given** um visitante, **When** inspeciona o site, **Then** não há sessão de Operador nem dados de Marca.

---

### Edge Cases

- Convite expirado (sete dias) ou já usado não autentica e não muda Papel.
- Último pedido de acesso invalida link e código anteriores do mesmo e-mail.
- Rate limit por e-mail e por origem reduz abuso de link/código, sem revelar se o e-mail existe além do fluxo normal.
- **Marcas atribuídas** vazias: o Operador entra e a interface não mostra conteúdo de Marca.
- Arquivar Marca cancela Destinos futuros, desconecta contas e deixa histórico somente leitura; restaurar exige novas conexões.
- Mídia de Marca arquivada expira em trinta dias, salvo vínculo com Publicação ainda não concluída.
- Reconexão que tentaria trocar a Identidade nativa é bloqueada antes da autorização (handle novo da mesma identidade é aceito).
- LinkedIn página e perfil pessoal não cabem na mesma Marca.
- Horário inexistente ou ambíguo no fuso (DST) é recusado na entrada.
- Pedido de cancelamento sem confirmação da rede **não** vira Cancelamento de destino.
- Inadimplência: aprovar Destino **sem** horário continua (não agenda); com horário, bloqueia.
- Métrica ausente, melhor horário ausente e demografia ausente permanecem ausentes.
- Eventos de entrega fora de ordem não regridem estado terminal (`publicado`, `cancelado`, `falha_definitiva`).
- E-mail de Operador removido não reabre a Conta antiga se for convidado de novo depois — convite novo cria o Operador outra vez, sem restaurar sessão antiga.
- Tipo de conta trocado pelo Proprietário não altera preço, Papel, Marcas nem a Política de aprovação já gravada.

## Requirements *(mandatory)*

IDs estáveis herdados de [`docs/PRD.md`](../../docs/PRD.md) §7. A spec não redefine o glossário.

### Functional Requirements

#### Conta e equipe

- **FR-001**: Toda Conta Capyra MUST ter Tipo `agency` ou `creator`, exatamente um Proprietário e zero ou mais Operadores nos demais papéis.
- **FR-002**: Toda Conta nova MUST nascer com uma Marca inicial de nome placeholder (`Minha marca` no padrão `pt-BR`). O Fuso da marca padrão é `America/Sao_Paulo`. Nome não vazio e fuso MUST ser confirmados antes de qualquer agendamento; o navegador não é fonte da verdade.
- **FR-003**: Convites MUST ser de uso único, vinculados ao e-mail, com expiração de sete dias e Papel/Marcas explícitos. Lista vazia de Marcas atribuídas é válida; o Operador não opera Marca até o Proprietário atribuir.
- **FR-004**: Um e-mail autenticado MUST participar de no máximo uma Conta Capyra na v1.
- **FR-005**: Remoção de Operador MUST revogar autorização imediatamente em todos os lugares autenticados; logout encerra só aquele acesso. Sessões antigas falham no próximo pedido autenticado.
- **FR-006**: Criador, Aprovador e Visualizador MUST enxergar só Marcas atribuídas; Proprietário enxerga todas.
- **FR-006b**: O Proprietário MUST alterar Papel e Marcas atribuídas de Criador, Aprovador e Visualizador na hora, sem novo Convite. MUST NOT promover a Proprietário.

#### Autenticação

- **FR-007**: Login e primeiro acesso MUST usar somente e-mail + link mágico ou código de acesso; não há senha.
- **FR-008**: Link e código MUST expirar, ser de uso único e pertencer a um único e-mail.
- **FR-009**: E-mails transacionais de autenticação, convite e cobrança MUST identificar só Capyra e sair no Idioma do destinatário (`pt-BR`, `en` ou `es`). Convite a quem ainda não entrou sai no Idioma do Proprietário; no primeiro acesso o convidado grava o próprio Idioma. Visual: capivara-logo + a palavra “Capyra”; sem mascote no corpo; sem o Fornecedor social.

#### Marcas

- **FR-010**: Mutações autenticadas MUST filtrar a Conta Capyra e validar a Marca; não existe operação “sem Marca”.
- **FR-011**: Só o Proprietário MUST arquivar uma Marca. Arquivar confirma cancelamento dos Destinos futuros, desconecta Contas sociais e deixa histórico somente leitura.
- **FR-012**: Mídia original de Marca arquivada ou com exclusão solicitada MUST expirar em trinta dias, salvo vínculo com Publicação ainda não concluída.
- **FR-013**: Restaurar Marca MUST exigir novas conexões; o histórico antigo MUST NOT ser reatribuído a outra identidade.

#### Conexões sociais

- **FR-014**: Só o Proprietário MUST conectar, reconectar ou desconectar.
- **FR-015**: MUST haver no máximo uma Conta social ativa por rede e Marca; no máximo uma conexão ativa global por identidade nativa verificada.
- **FR-016**: A autorização social MUST ser de uso único, expirar e vincular Operador, Conta, Marca e rede. O navegador não decide a propriedade da identidade.
- **FR-017**: Identidade não verificável MUST ficar pendente e não publicar. Reconexão insegura (troca de identidade disfarçada de refresh) MUST ser bloqueada antes da autorização; handle não é a chave de identidade.
- **FR-018**: Desconexão só MUST terminar após cancelamento confirmado dos Destinos futuros daquela Conta social.
- **FR-019**: Perda de autorização MUST marcar Conexão com ação necessária, bloquear novos envios e alertar o Proprietário.
- **FR-020**: O consentimento da rede MUST ser headless: retorno no domínio Capyra; seleção de organização/perfil LinkedIn na interface Capyra.

#### Mídia

- **FR-021**: Biblioteca MUST ser privada por Conta e Marca; arquivos de mídia fora do registro de estado; metadados e referências no Capyra.
- **FR-022**: Uploads até 200 MB (imagens, vídeo); o Capyra MUST NOT transcodificar, reenquadrar nem comprimir na v1. Só Proprietário e Criador enviam Mídia original e Variante de mídia nas Marcas atribuídas; Aprovador e Visualizador não enviam arquivo.
- **FR-023**: Destino MUST usar Mídia original compatível ou Variante de mídia fornecida pelo operador.
- **FR-024**: Mídia em uso por Destino não concluído MUST NOT ser eliminada.

#### Publicação e agendamento

- **FR-025**: Publicação MUST agrupar Destinos; cada Destino tem conteúdo, mídia, horário e estado próprios.
- **FR-026**: Agendar ou publicar MUST criar Versão de destino imutável e chave de idempotência.
- **FR-027**: Horário MUST seguir o Fuso da marca; instantes existentes MUST NOT se deslocar se o fuso mudar.
- **FR-028**: Cancelamento incerto e escrita com resultado desconhecido MUST permanecer estados explícitos (Entrega desconhecida); MUST NOT haver reenvio automático.
- **FR-029**: Retry seletivo MUST NOT repetir Destinos concluídos.
- **FR-030**: Agendamentos além da janela de mídia temporária (cerca de sete dias no fornecedor; o Capyra usa seis) MUST ficar duráveis no Capyra e só ser enviados ao entrar na janela.
- **FR-031**: Calendário MUST listar Destinos da Marca (e da Conta, com filtro) por dia, rede e estado.
- **FR-032**: Importação inicial MUST cobrir noventa dias de Posts externos disponíveis, com paginação e deduplicação, sem download automático de arquivo.
- **FR-033**: Edição ou remoção de post já publicado na rede está fora da v1.

#### Aprovação

- **FR-034**: Cada Marca MUST configurar se publicação/agendamento exige aprovação.
- **FR-035**: Estados do Destino no fluxo editorial MUST ser: `rascunho`, `em_revisao`, `aprovado`, `rejeitado`, `alteracoes_solicitadas`, `agendado`, `publicado`, `cancelado`, `falha_definitiva`, `entrega_desconhecida`.
- **FR-036**: Comentário MUST pertencer ao Destino, com autor, horário e visibilidade restrita à Conta e às Marcas atribuídas. Proprietário, Criador e Aprovador escrevem; Visualizador só lê. O e-mail não é o fio.
- **FR-037**: Aprovação MUST ser por Destino; um Destino aprovado não libera os demais.
- **FR-038**: Pedido de alteração MUST reabrir o rascunho para o Criador e impedir agendar/publicar até nova aprovação, se a exigência estiver ligada.
- **FR-039**: Visualizador MUST NOT aprovar; Aprovador MUST NOT publicar; Criador MUST NOT aprovar. O Proprietário cria, aprova, publica e lê em todas as Marcas — inclusive o Destino que ele mesmo escreveu.

#### Relatórios

- **FR-040**: Snapshots de métricas nativas MUST existir por Conta social e por Destino, com origem, período, instante da observação e instante da atualização.
- **FR-041**: Métrica ausente MUST permanecer ausente; a interface explica a indisponibilidade.
- **FR-042**: Relatórios MUST ser filtráveis por Marca, rede, período e Destino; comparações MUST NOT afirmar causalidade.
- **FR-043**: Exportação PDF MUST usar a capivara-logo e a palavra “Capyra” no tipo padrão; CSV só dados. Sem paleta extra, sem nome, logo ou rodapé do Fornecedor social.
- **FR-044**: Melhor horário, histórico de seguidores e demografias entram quando a rede os fornecer; ausência MUST NOT inventar número.

#### Concorrentes

- **FR-045**: Pesquisa na biblioteca de anúncios da Meta MUST exigir Conta social ativa de Instagram na Marca.
- **FR-046**: Pesquisa na biblioteca de anúncios do LinkedIn MUST exigir Conta social ativa de LinkedIn na Marca.
- **FR-047**: A API pública do Capyra MUST expor busca, filtros e resultados em modelo próprio; IDs internos do Fornecedor social MUST NOT vazar.
- **FR-048**: A feature MUST NOT criar, editar nem veicular anúncios.

#### Cobrança

- **FR-049**: Preço de lista MUST ser R$ 49,90 por Conta social conectada, por mês, em BRL, recorrente e self-service.
- **FR-050**: A fatura do ciclo MUST somar as Identidades sociais do ciclo; reconectar a mesma identidade MUST NOT duplicar.
- **FR-051**: Nova conexão no meio do ciclo MUST entrar em pró-rata; desconexão MUST NOT estornar o ciclo corrente.
- **FR-052**: Sem Conta social ativa, a Conta Capyra MUST permanecer gratuita para login, Marcas e rascunhos locais, mas MUST NOT publicar.
- **FR-053**: Falha de pagamento MUST marcar a Conta em Inadimplência: bloqueia novas conexões e qualquer ação que agende ou publique, inclusive aprovar um Destino com horário. Rascunho, comentário, rejeitar e leitura permanecem. Destinos já enviados ao fornecedor seguem a política de cancelamento confirmado.
- **FR-054**: Somente o Proprietário MUST ver e alterar método de pagamento, faturas e portal de cobrança.

#### Auditoria e notificações

- **FR-055**: Ações sensíveis MUST registrar ator, Conta, Marca, recurso, horário e correlação — sem credenciais, mídia bruta, tokens ou URL assinada.
- **FR-056**: Notificações in-app e e-mail Capyra MUST existir para: convite, código/link de acesso, aprovação pendente, decisão de aprovação, conexão com ação necessária, falha definitiva de Destino, fatura e recibo.

#### White label

- **FR-057**: Em conexão, consentimento, seleção, callback, reconexão, revogação, erros, e-mails, suporte, lista de aplicativos autorizados e publicação, o Operador MUST só poder identificar Capyra e a rede social.
- **FR-058**: Contratos públicos, registros visíveis ao cliente, PDFs, notificações de saída (se houver) e textos de erro MUST usar vocabulário Capyra.
- **FR-059**: IDs, nomes de perfil e URLs do Fornecedor social MUST NOT ser aceitos como identificadores públicos.

#### Idiomas

- **FR-060**: Site, webapp, e-mails Capyra e MCP MUST oferecer `pt-BR`, `en` e `es`; o padrão é `pt-BR`.
- **FR-061**: O Operador MUST persistir um Idioma; mudá-lo MUST NOT alterar o Fuso da marca nem traduzir Destinos já escritos.

#### MCP

- **FR-062**: O MCP headless MUST autenticar um Operador e chamar só a API pública do Capyra; MUST respeitar Papel e Marcas atribuídas; MUST NOT acessar armazenamento interno, trilho de pagamento, e-mail transacional nem o Fornecedor social. Não há Papel extra nem atalho de Proprietário.

#### Testes

- **FR-063**: O conjunto de testes MUST cobrir isolamento por Conta Capyra e por Marcas atribuídas, conformidade do contrato público (IDs Capyra, vocabulário Capyra) e jornadas ponta a ponta contra um provedor social simulado. O provedor simulado MUST NOT ser fallback silencioso em produção.

### Key Entities

Termos canônicos em [`CONTEXT.md`](../../CONTEXT.md). Resumo operacional:

- **Conta Capyra**: isolamento e quem paga; Tipo `agency` | `creator`.
- **Operador**: pessoa autenticada em exatamente uma Conta; um Papel; um Idioma.
- **Papel**: Proprietário | Criador | Aprovador | Visualizador.
- **Convite**: uso único, e-mail, Papel, Marcas atribuídas, expiração.
- **Marca**: identidade comercial de uma Conta; Fuso da marca; Política de aprovação.
- **Marca arquivada**: somente leitura; sem conexões nem publicações futuras.
- **Conta social / Conexão social**: vínculo exclusivo com Identidade nativa de uma rede.
- **Conexão com ação necessária**: autorização inválida; bloqueia envios.
- **Mídia original / Variante de mídia**: arquivo da Marca vs. arquivo para cumprir um Destino.
- **Publicação**: agrupa Destinos de uma Marca.
- **Destino**: entrega planejada para uma Conta social; máquina de estados FR-035.
- **Versão de destino**: retrato imutável submetido.
- **Tentativa de entrega / Entrega desconhecida / Falha definitiva / Cancelamento de destino**.
- **Comentário**: conversa editorial no Destino.
- **Post externo**: histórico importado, somente leitura.
- **Snapshot de métrica**: observação datada; ausência ≠ zero.
- **Identidade social do ciclo / Ciclo de cobrança / Inadimplência**.
- **Fornecedor social**: motor interno invisível; fora da API pública.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um Proprietário completa o primeiro acesso (e-mail + link ou código), confirma a Marca inicial e convida um Criador, um Aprovador e um Visualizador com isolamento por Marca, em menos de dez minutos numa jornada assistida de aceite.
- **SC-002**: Destinos não cancelados cuja publicação a rede confirmou ocorrem no horário agendado (± tolerância da rede) em ≥ 95% dos casos medidos após o Gate white label `go`.
- **SC-003**: Conectar três Instagrams de três Marcas resulta em cobrança de lista de R$ 149,70 / mês (pró-rata no primeiro ciclo); reconectar o mesmo Instagram não duplica; desconectar não estorna o ciclo corrente.
- **SC-004**: Em produção, incidentes em que o Operador identifica o Fornecedor social nas superfícies da jornada social = zero nas redes com Gate `go`.
- **SC-005**: Métrica ausente permanece ausente em 100% dos relatórios e exportações inspecionados (nunca coercida a zero).
- **SC-006**: 100% das mutações autenticadas de teste recusam acesso cruzado de Conta Capyra e de Marca não atribuída.
- **SC-007**: Criador envia Publicação com dois Destinos, Aprovador comenta e aprova um deles, e só o aprovado segue para agendamento, numa jornada contínua sem sair do Capyra.
- **SC-008**: Pesquisa de anúncios Meta e LinkedIn devolve resultados no modelo Capyra quando a conexão exigida existe, e recusa com mensagem Capyra quando não existe.
- **SC-009**: MCP e webapp recusam as mesmas ações proibidas pelo Papel (conectar rede como Criador, publicar como Aprovador, mutar como Visualizador) em 100% dos casos de teste.
- **SC-010**: Site público serve `pt-BR`, `en` e `es` e não expõe sessão de Operador.
- **SC-011**: Tempo mediano entre envio para revisão e decisão (aprovar / rejeitar / pedir alterações) é mensurável in-product a partir do primeiro piloto.
- **SC-012**: Contratos públicos, PDF, CSV, e-mails e erros visíveis ao cliente usam só vocabulário Capyra e IDs Capyra em 100% das superfícies de aceite.

## Assumptions

- O glossário de [`CONTEXT.md`](../../CONTEXT.md) e os FR de [`docs/PRD.md`](../../docs/PRD.md) prevalecem sobre esta spec em caso de conflito de termo; conflito deve ser corrigido aqui, não no glossário, salvo emenda explícita.
- Redes da v1: **Instagram**, **TikTok**, **LinkedIn**. Demais redes listadas no PRD §5.2 e §14 ficam fora.
- Contas Instagram de publicação são profissionais.
- O Capyra opera a aplicação web autenticada, o site público, a API pública e o MCP; o cliente não acessa dashboard nem domínio do Fornecedor social.
- Há checkout recorrente em BRL para o Proprietário; o trilho de pagamento pode aparecer na página hospedada de checkout, como o próprio trilho exige.
- E-mail transacional sai com remetente e templates Capyra.
- Gate white label prático (`go` / `no-go` por rede) é condição comercial, não um recorte opcional da spec: rede sem `go` permanece desligada.
- Provedor social simulado cobre desenvolvimento e testes; nunca substitui o fornecedor real em produção sem decisão explícita.
- Fora da v1 (PRD §14): inbox/DMs, ads manager, escuta orgânica, IA de vídeo, transcodificação, editar post já publicado, várias contas da mesma rede na mesma Marca, um e-mail em várias Contas, transferir Proprietário, senha/login social/SSO, CLI, Python/IA, exclusão definitiva self-service, API pública para terceiros além do webapp e do MCP, white-label da UI Capyra para a agência revender com a marca dela.
- Mobile nativo está fora; webapp responsivo entra no tema visual padrão da interface.
- Não há `[NEEDS CLARIFICATION]`: as decisões de escopo, papéis, redes, preço e white label já estão no PRD e no CONTEXT.
