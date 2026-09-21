# Capyra

Glossário canônico do Capyra Social: gestão das mídias sociais de marcas para agências e criadores.

## Language

### Conta e pessoas

**Conta Capyra**:
Espaço isolado da organização ou profissional que contrata e paga o Capyra.
_Avoid_: tenant, workspace, conta, cliente

**Tipo de conta**:
Classificação da Conta Capyra como `agency` ou `creator` para segmentar a experiência.
_Avoid_: plano, permissão, franquia

**Operador**:
Pessoa autenticada que participa de exatamente uma Conta Capyra.
_Avoid_: usuário, user, membro, cliente

**Convite**:
Pedido de uso único, vinculado a um e-mail, para entrar numa Conta Capyra com um Papel e Marcas atribuídas.
_Avoid_: share link, guest, convite de Marca

**Papel**:
Classificação única do Operador na Conta Capyra: Proprietário, Criador, Aprovador ou Visualizador.
_Avoid_: permissão, role por Marca

**Proprietário**:
Único Operador dono da Conta Capyra, com as capacidades de Criador, Aprovador e Visualizador em todas as Marcas, mais cobrança, convites e Conexão social.
_Avoid_: admin, owner, administrador, dois papéis

**Criador**:
Operador cujo Papel é produzir conteúdo nas Marcas atribuídas.
_Avoid_: social media, redator, editor

**Aprovador**:
Operador cujo Papel é decidir sobre o conteúdo nas Marcas atribuídas.
_Avoid_: cliente, revisor

**Visualizador**:
Operador cujo Papel é somente leitura nas Marcas atribuídas.
_Avoid_: guest, viewer

**Marcas atribuídas**:
Conjunto de Marcas que um Criador, Aprovador ou Visualizador pode operar na Conta Capyra.
_Avoid_: permissão por marca, isolamento da marca, tenant da marca

**Idioma**:
Código BCP 47 da interface: `pt-BR`, `en` ou `es`.
_Avoid_: idioma do navegador como fonte da verdade após o login, pt, pt-br sem o BR

### Marcas

**Marca**:
Identidade comercial pertencente a exatamente uma Conta Capyra.
_Avoid_: cliente, perfil, projeto, tenant

**Marca arquivada**:
Marca inativa preservada em modo somente leitura, sem conexões sociais nem publicações futuras.
_Avoid_: marca excluída, marca removida

**Fuso da marca**:
Fuso horário IANA que interpreta os agendamentos de uma Marca; o padrão é `America/Sao_Paulo`.
_Avoid_: fuso do navegador, fuso do operador

**Política de aprovação**:
Exigência, por Marca, de decisão de um Aprovador antes de agendar ou publicar.
_Avoid_: aprovação da Conta, aprovação por e-mail

**Comentário**:
Registro de conversa editorial em um Destino.
_Avoid_: fio de e-mail, review do fornecedor

### Redes e conexões

**Conta social**:
Identidade de uma Marca em uma rede social específica.
_Avoid_: perfil social, conta, conexão

**Conexão social**:
Vínculo ativo e exclusivo entre uma Conta social e o Capyra.
_Avoid_: integração, OAuth

**Conexão com ação necessária**:
Conexão social sem autorização válida, que bloqueia envios até o Proprietário intervir.
_Avoid_: desconectada, caiu, falha silenciosa

**Identidade nativa**:
Identificador estável da conta na própria rede, distinto de handle ou nome de exibição.
_Avoid_: @handle, username, identidade do fornecedor

**Autorização social**:
Consentimento concedido na rede social para o Capyra agir sobre uma Conta social.
_Avoid_: login no Capyra, OAuth do fornecedor

### Conteúdo e entrega

**Mídia original**:
Arquivo enviado que serve de fonte para os Destinos de uma Marca.
_Avoid_: artefato, post

**Variante de mídia**:
Arquivo fornecido pelo Operador para cumprir o requisito de um Destino.
_Avoid_: transformação automática, ajuste do fornecedor

**Publicação**:
Conteúdo de uma Marca que agrupa um ou mais Destinos.
_Avoid_: post, envio, postagem

**Destino**:
Entrega planejada de uma Publicação para exatamente uma Conta social.
_Avoid_: rede, publicação, post

**Versão de destino**:
Retrato imutável do conteúdo e do agendamento de um Destino submetido.
_Avoid_: rascunho enviado, edição em andamento

**Tentativa de entrega**:
Um esforço individual de enviar um Destino à sua Conta social.
_Avoid_: retry, publicação

**Cancelamento de destino**:
Confirmação de que uma Versão de destino não será publicada pela rede.
_Avoid_: pedido de cancelamento, cancelar local

**Entrega desconhecida**:
Tentativa de entrega cujo aceite pela rede ainda não foi confirmado nem descartado.
_Avoid_: falha, timeout definitivo

**Falha definitiva**:
Resultado confirmado que encerra tentativas automáticas de um Destino.
_Avoid_: erro temporário, entrega desconhecida

**Post externo**:
Postagem publicada fora do Capyra e importada como registro histórico somente leitura.
_Avoid_: publicação, rascunho importado

**Importação inicial**:
Sincronização dos Posts externos dos noventa dias anteriores à Conexão social.
_Avoid_: importação completa, download de mídia

**Snapshot de métrica**:
Observação datada de uma métrica nativa de uma Conta social ou Destino.
_Avoid_: valor atual, zero quando indisponível, score geral

### Cobrança

**Identidade social do ciclo**:
Identidade nativa conectada ao menos uma vez durante um ciclo de cobrança.
_Avoid_: conexão simultânea, account-day

**Ciclo de cobrança**:
Período mensal em BRL no qual as Identidades sociais do ciclo são faturadas.
_Avoid_: assinatura por assento, plano por Tipo de conta

**Inadimplência**:
Estado da Conta Capyra após falha de pagamento, que impede nova Conexão social e qualquer ação que agende ou publique.
_Avoid_: conta suspensa, somente leitura total

### White label

**Fornecedor social**:
Motor interno de conexão, fila e publicação, invisível para o Operador.
_Avoid_: nomear o fornecedor na UI, API ou e-mail

**Jornada social white label**:
Jornada percebida na qual somente Capyra e a rede social de destino são identificáveis.
_Avoid_: white label parcial, só a interface

**Gate white label**:
Aprovação prática da Jornada social white label em cada rede oferecida, antes da venda.
_Avoid_: validação só documental, go parcial na rede vendida

## Relationships

- Uma **Conta Capyra** possui uma ou mais **Marcas**
- Toda **Conta Capyra** nova nasce com uma **Marca** inicial, com nome placeholder até o **Proprietário** confirmar; não se agenda com nome vazio
- Uma **Marca** pertence a exatamente uma **Conta Capyra**
- O isolamento é a **Conta Capyra**; a **Marca** não é limite de isolamento, não é faturada à parte e não representa o cliente contratual da agência
- **Marcas atribuídas** recortam visibilidade e mutação dentro da **Conta Capyra**; o **Proprietário** opera todas as Marcas dessa Conta
- O **Tipo de conta** não define plano, permissão, preço nem limite de **Marcas**
- O **Proprietário** pode alterar o **Tipo de conta**; isso não muda preço, **Papel**, **Marcas** nem a **Política de aprovação** já gravada
- Uma **Conta Capyra** possui um ou mais **Operadores**
- Um **Operador** participa de exatamente uma **Conta Capyra**
- Toda ação autenticada, inclusive via MCP, é de um **Operador** com o mesmo **Papel** e as mesmas **Marcas atribuídas**; não existe Papel extra no MCP
- Uma **Conta Capyra** possui exatamente um **Proprietário**
- O **Proprietário** não transfere o Papel na v1
- Um **Operador** possui exatamente um **Papel**
- O **Proprietário** não acumula um segundo **Papel**; o Papel já inclui criar, aprovar, publicar e ler
- Um **Operador** possui exatamente um **Idioma**; o padrão é `pt-BR`
- O **Convite** sai no **Idioma** do **Proprietário**; no primeiro acesso o convidado grava o próprio **Idioma**
- O **Papel** não varia por **Marca**
- **Criador**, **Aprovador** e **Visualizador** recebem **Marcas atribuídas**; o **Proprietário** opera todas
- **Marcas atribuídas** podem ser vazias; o **Operador** entra e não opera **Marca** nenhuma até o **Proprietário** atribuir
- Somente o **Proprietário** inicia ou encerra uma **Conexão social**, convida ou remove **Operadores** e altera cobrança
- O **Proprietário** altera **Papel** e **Marcas atribuídas** de **Criador**, **Aprovador** e **Visualizador** na hora; não promove a **Proprietário** nem exige novo **Convite**
- **Criador** não aprova; **Aprovador** não agenda nem publica; **Visualizador** não muta
- Só **Proprietário** e **Criador** enviam **Mídia original** e **Variante de mídia** nas **Marcas atribuídas**; **Aprovador** e **Visualizador** não enviam arquivo
- Aprovar um **Destino** que já tem horário o agenda; sem horário, o Destino permanece aprovado até o **Criador** ou o **Proprietário** agendar ou publicar
- Alterar texto, mídia, horário ou **Destino** depois de aprovado reabre a revisão quando a **Política de aprovação** está ligada; agendar o aprovado sem alterar conteúdo não reabre
- Um **Comentário** pertence a exatamente um **Destino**
- **Proprietário**, **Criador** e **Aprovador** escrevem **Comentário** nas **Marcas atribuídas**; **Visualizador** só lê
- Toda **Marca** possui exatamente um **Fuso da marca** e uma **Política de aprovação**; **Marca** nova nasce em `America/Sao_Paulo` até o **Proprietário** alterar
- Uma **Marca** possui no máximo uma **Conta social** ativa por rede; página LinkedIn e perfil pessoal LinkedIn ocupam o mesmo slot
- Uma **Identidade nativa** verificada possui no máximo uma **Conexão social** ativa em todo o Capyra
- Handle não identifica uma **Conta social**
- Uma **Conexão com ação necessária** bloqueia novos envios daquela **Conta social**
- Uma **Publicação** pertence a exatamente uma **Marca** e possui um ou mais **Destinos**
- Um **Destino** pertence a exatamente uma **Publicação** e referencia exatamente uma **Conta social**
- Agendar ou publicar um **Destino** cria uma **Versão de destino**
- Um **Destino** possui uma ou mais **Tentativas de entrega**, sem repetir Destinos já concluídos
- Um pedido de cancelamento só produz **Cancelamento de destino** após confirmação da rede
- Uma **Entrega desconhecida** exige reconciliação antes de nova **Tentativa de entrega**
- Uma **Falha definitiva** só origina nova tentativa por ação explícita do **Operador** autorizado
- Um **Post externo** não possui **Tentativa de entrega** do Capyra
- Uma **Importação inicial** recupera metadados e métricas, não os arquivos de mídia
- **Snapshot de métrica** ausente não é zero
- O **Ciclo de cobrança** conta **Identidades sociais do ciclo**; reconectar a mesma **Identidade nativa** no mesmo ciclo não cria outra unidade
- Desconectar no ciclo corrente não remove a **Identidade social do ciclo** até o fechamento
- **Inadimplência** bloqueia nova **Conexão social** e qualquer ação que agende ou publique, inclusive aprovar um **Destino** com horário
- Em **Inadimplência**, rascunho, **Comentário**, rejeitar, ler e **Destinos** já enviados ao fornecedor continuam
- Uma **Jornada social white label** cobre conexão, consentimento, seleção, callback, reconexão, revogação, erros, e-mails, aplicativos autorizados e publicação
- Identificadores do **Fornecedor social** não são identificadores públicos nem critério de **Conta Capyra**

## Example dialogue

> **Dev:** "O Proprietário preenche o nome do cliente além do nome da **Marca**?"
> **Domain expert:** "Não. O nome é o da **Marca**. Quem aprova, se entrar no Capyra, é um **Operador** — não existe Cliente da agência."
>
> **Dev:** "Acabei de entrar. A **Marca** já tem nome?"
> **Domain expert:** "Tem um placeholder. Sem nome vazio na hora de agendar. Não é Cliente da agência."
>
> **Dev:** "A Natura é uma **Conta Capyra** ou uma **Marca**?"
> **Domain expert:** "Na Conta da agência Acme, Natura é uma **Marca**. Quem paga o Capyra é a Acme, a **Conta Capyra**."
>
> **Dev:** "A Acme quer apagar o histórico da Natura, não só arquivar."
> **Domain expert:** "Na v1 não. Só **Marca arquivada**. Excluir de verdade fica fora do self-service."
>
> **Dev:** "Se a Natura demitir a Acme, a **Marca** vira a Conta da Natura?"
> **Domain expert:** "Não. A Acme arquiva ou desconecta. A Natura só publica no Capyra se tiver a própria **Conta Capyra** e conectar as redes de novo."
>
> **Dev:** "A sócia que abriu a Conta sai. Ela passa o **Proprietário** para o sócio que ficou?"
> **Domain expert:** "Não, na v1. O Papel não transfere. A saída é outra **Conta Capyra**, convites e desconectar as redes."
>
> **Dev:** "`ana@natura.com` pode aprovar na Acme e ter a própria **Conta Capyra**?"
> **Domain expert:** "Não. Um e-mail é um **Operador** em uma **Conta Capyra**. Para a Natura contratar o Capyra, a Acme precisa removê-la primeiro — ou ela usa outro e-mail."
>
> **Dev:** "A Acme convida o Aprovador antes de criar a **Marca**. O **Convite** vale?"
> **Domain expert:** "Vale, com **Marcas atribuídas** vazias. Ela entra e não opera nada até o **Proprietário** atribuir."
>
> **Dev:** "`ana@natura.com` era **Visualizador**. Vira **Aprovador** sem outro convite?"
> **Domain expert:** "Sim. O **Proprietário** muda **Papel** e **Marcas atribuídas** na hora. Não vira **Proprietário**."
>
> **Dev:** "Ana pode ser **Criador** na Natura e **Visualizador** no Boticário?"
> **Domain expert:** "Não. Ela tem um **Papel**. Ou é **Criador** só na Natura, ou **Criador** nas duas, ou outro papel nas **Marcas atribuídas**."
>
> **Dev:** "Se o Aprovador da Natura vir o calendário do Boticário, vazou o tenant?"
> **Domain expert:** "Não. Os dois estão na mesma **Conta Capyra**. Isso é falha de **Marcas atribuídas**, não de isolamento."
>
> **Dev:** "O **Criador** pode conectar o Instagram da Natura?"
> **Domain expert:** "Não. Só o **Proprietário** cria **Conexão social**. Conectar cobra e trava a **Identidade nativa** no Capyra inteiro."
>
> **Dev:** "A Natura publica como página e como o CEO no LinkedIn, na mesma **Marca**?"
> **Domain expert:** "Não. LinkedIn é uma rede, um slot. Ou a página, ou o perfil. Os dois exigem **Marcas** distintas — ou espera a v2."
>
> **Dev:** "Duas agências podem manter **Conexão social** com o mesmo Instagram?"
> **Domain expert:** "Não. A identidade precisa ser desconectada da primeira **Conta Capyra** antes de ligar na segunda."
>
> **Dev:** "Na conta `creator` o influenciador sozinho liga a **Política de aprovação**. Quem aprova o que ele escreveu?"
> **Domain expert:** "Ele mesmo, porque é **Proprietário**. Isso não é um segundo **Papel**."
>
> **Dev:** "Abri como `creator` e agora tenho três Marcas de cliente. Preciso de outra Conta?"
> **Domain expert:** "Não. O **Proprietário** muda o **Tipo de conta**. As **Marcas** e as políticas já gravadas ficam."
>
> **Dev:** "Conta `creator` não tem **Política de aprovação**?"
> **Domain expert:** "Tem, por **Marca**. O tipo só muda o padrão da experiência; não tira o recurso."
>
> **Dev:** "O Aprovador aprovou o Instagram já marcado para terça 10:00. Ele precisa clicar em publicar?"
> **Domain expert:** "Não. Aprovar um **Destino** com horário o agenda. Sem horário, fica aprovado até o **Criador** ou o **Proprietário** publicar. O **Aprovador** não agenda nem publica."
>
> **Dev:** "O Destino foi aprovado sem horário. Posso trocar a legenda e publicar?"
> **Domain expert:** "Não, se a **Política de aprovação** estiver ligada. Qualquer mudança de texto, mídia, horário ou Destino reabre a revisão. Só agendar o aprovado sem alterar conteúdo não reabre."
>
> **Dev:** "Cancelar no Capyra já impede o post na rede?"
> **Domain expert:** "Não. Só existe **Cancelamento de destino** depois da confirmação de que a rede não publicará aquela **Versão de destino**."
>
> **Dev:** "O Aprovador comenta na Publicação inteira ou no Instagram?"
> **Domain expert:** "No **Destino**. **Comentário** é do Instagram, não da **Publicação**. O **Visualizador** lê e não escreve."
>
> **Dev:** "A fatura falhou. O Aprovador ainda pode aprovar o Instagram de terça?"
> **Domain expert:** "Não, se o **Destino** tem horário — isso agendaria. **Inadimplência** bloqueia conectar, agendar e publicar. Rejeitar, comentar e ler continua."
>
> **Dev:** "O Aprovador sobe outro recorte do Reels?"
> **Domain expert:** "Não. Só **Proprietário** e **Criador** enviam **Mídia original** ou **Variante de mídia**. O Aprovador pede alteração com **Comentário**."
>
> **Dev:** "Criei a Conta em Recife e marquei 10:00 sem mexer no fuso. Que horário vale?"
> **Domain expert:** "`America/Sao_Paulo`, o padrão do **Fuso da marca**. O navegador não conta. Recife só vale se o **Proprietário** mudar o fuso."
>
> **Dev:** "A métrica veio vazia. Coloco zero no relatório?"
> **Domain expert:** "Não. **Snapshot de métrica** ausente permanece ausente."

## Flagged ambiguities

- "cliente" era usado tanto para quem paga o Capyra quanto para o cliente da agência — resolvido: quem paga é a **Conta Capyra**; o cliente da agência não é entidade de domínio (aparece como **Marca** e, se entrar no produto, como **Operador** na Conta da agência)
- "nome do cliente interno" na Marca — resolvido: não existe na v1; o nome visível é o da **Marca**
- Nome da **Marca** inicial — resolvido: placeholder até o **Proprietário** confirmar; não se agenda com nome vazio
- "isolar cada Marca" / "isolamento entre clientes" pareciam tenant por Marca — resolvido: o isolamento é a **Conta Capyra**; o recorte interno são as **Marcas atribuídas**
- "usuário" poderia ser a pessoa autenticada ou a Conta que paga — resolvido: a pessoa é o **Operador**; quem paga é a **Conta Capyra**
- MCP como "bot" — resolvido: não é pessoa nova; é o mesmo **Operador**, mesmo **Papel**, mesmas **Marcas atribuídas**
- participação em várias Contas — resolvido: na v1 um e-mail autenticado pertence a no máximo uma **Conta Capyra**
- Transferir **Proprietário** — resolvido: fora da v1; a saída é outra **Conta Capyra**, convites e desconectar redes
- Mudar **Papel** depois do **Convite** — resolvido: o **Proprietário** altera **Papel** e **Marcas atribuídas** no lugar; não promove a Proprietário
- **Convite** sem Marcas — resolvido: lista vazia é válida; o **Operador** não opera **Marca** até o **Proprietário** atribuir
- "membro" e "permissão por marca" sugeriam Papel diferente em cada Marca — resolvido: um **Papel** por **Operador** e **Marcas atribuídas**
- Vários dispositivos — resolvido: o **Operador** pode estar autenticado em mais de um lugar; logout é local; remover o Operador derruba todos
- **Proprietário** "atuando em dois papéis" — resolvido: um **Papel** só, com todas as capacidades; não é admin separado de Criador/Aprovador
- **Aprovador** "não publica" vs horário no rascunho — resolvido: aprovar **Destino** com horário o agenda; sem horário, **Criador** ou **Proprietário** publica; **Aprovador** não escolhe horário nem publica agora
- Editar depois de aprovado — resolvido: qualquer mudança de texto, mídia, horário ou Destino reabre a revisão se a **Política de aprovação** estiver ligada; agendar sem alterar conteúdo não reabre
- Aprovador subir arte — resolvido: só **Proprietário** e **Criador** enviam **Mídia original** e **Variante de mídia**; o Aprovador devolve com **Comentário**
- "conta" misturava Conta Capyra e Conta social — resolvido: os termos são distintos e sempre qualificáveis
- `agency` e `creator` pareciam planos diferentes — resolvido: são **Tipo de conta**; não definem preço, permissão nem limite de Marcas
- Trocar `agency` ↔ `creator` — resolvido: o **Proprietário** muda o tipo; só afeta padrões de experiência daqui pra frente, não Marcas nem políticas já gravadas
- "conectar redes" parecia tarefa de quem cria conteúdo — resolvido: somente o **Proprietário** inicia ou encerra **Conexão social**
- "remover marca" parecia exclusão — resolvido: o fluxo self-service da v1 produz **Marca arquivada** (restaurável com novas conexões); exclusão definitiva fica fora da v1
- "horário agendado" poderia seguir o navegador — resolvido: vale o **Fuso da marca** (padrão `America/Sao_Paulo`); mudar o fuso não desloca instantes já gravados; o navegador não é fonte da verdade
- "publicação" misturava o conteúdo, cada envio e o resultado — resolvido: **Publicação** agrupa **Destinos**; cada envio é **Tentativa de entrega**
- "cancelar" parecia só apagar localmente — resolvido: **Cancelamento de destino** exige confirmação de que a rede não publicará
- "falha" incluía timeout após envio — resolvido: aceite incerto é **Entrega desconhecida**
- "reconexão necessária" parecia aviso visual — resolvido: **Conexão com ação necessária** bloqueia envios
- "@handle" parecia identidade — resolvido: a **Identidade nativa** é estável; handle não é a chave
- "várias contas do mesmo Instagram na Marca" — resolvido: no máximo uma **Conta social** ativa por rede e Marca
- LinkedIn página "e/ou" perfil pessoal — resolvido: um slot; a conexão escolhe um alvo; os dois ao mesmo tempo não cabem na mesma **Marca** na v1
- Oito redes no primeiro lançamento — resolvido: v1 é **Instagram**, **TikTok** e **LinkedIn**; Facebook, YouTube, X, Pinterest e Google Meu Negócio ficam para depois
- "cobrar conexões simultâneas" — resolvido: a fatura conta **Identidades sociais do ciclo**
- "conta suspensa" vs falha de pagamento — resolvido: **Inadimplência** bloqueia conexão nova e agendar/publicar (incluindo aprovar com horário); não congela rascunho nem leitura
- "white label" parecia só logo na interface — resolvido: a **Jornada social white label** cobre toda a jornada percebida
- "métrica indisponível" parecia zero — resolvido: ausência não é zero
- "análise de concorrentes" parecia escuta de perfil orgânico — resolvido: na v1 é pesquisa de anúncios públicos, fora deste glossário como entidade
- Comentário na Publicação vs Destino — resolvido: **Comentário** pertence ao **Destino**; **Visualizador** não escreve
- "idioma" misturado com fuso — resolvido: **Idioma** é interface (`pt-BR`, `en`, `es`); **Fuso da marca** é agendamento
- Idioma do **Convite** — resolvido: sai no **Idioma** do **Proprietário**; o convidado grava o próprio no primeiro acesso
