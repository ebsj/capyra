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

**Papel**:
Classificação única do Operador na Conta Capyra: Proprietário, Criador, Aprovador ou Visualizador.
_Avoid_: permissão, role por Marca

**Proprietário**:
Único Operador dono da Conta Capyra.
_Avoid_: admin, owner, administrador

**Criador**:
Operador cujo Papel é produzir conteúdo nas Marcas atribuídas.
_Avoid_: social media, redator, editor

**Aprovador**:
Operador cujo Papel é decidir sobre o conteúdo nas Marcas atribuídas.
_Avoid_: cliente, revisor

**Visualizador**:
Operador cujo Papel é somente leitura nas Marcas atribuídas.
_Avoid_: guest, viewer

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
Fuso horário IANA que interpreta os agendamentos de uma Marca.
_Avoid_: fuso do navegador, fuso do operador

**Política de aprovação**:
Exigência, por Marca, de decisão de um Aprovador antes de agendar ou publicar.
_Avoid_: aprovação da Conta, aprovação por e-mail

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
- Uma **Marca** pertence a exatamente uma **Conta Capyra**
- A **Marca** não é limite de isolamento, não é faturada à parte e não representa o cliente contratual da agência
- O **Tipo de conta** não define plano, permissão, preço nem limite de **Marcas**
- Uma **Conta Capyra** possui um ou mais **Operadores**
- Um **Operador** participa de exatamente uma **Conta Capyra**
- Um e-mail autenticado identifica no máximo um **Operador**
- Uma **Conta Capyra** possui exatamente um **Proprietário**
- Um **Operador** possui exatamente um **Papel**
- Um **Operador** possui exatamente um **Idioma**; o padrão é `pt-BR`
- O **Papel** não varia por **Marca**
- **Criador**, **Aprovador** e **Visualizador** recebem um conjunto de **Marcas** atribuídas; o **Proprietário** tem todas
- Somente o **Proprietário** inicia ou encerra uma **Conexão social**, convida ou remove **Operadores** e altera cobrança
- Toda **Marca** possui exatamente um **Fuso da marca** e uma **Política de aprovação**
- Uma **Marca** possui no máximo uma **Conta social** ativa por rede
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
- Uma **Jornada social white label** cobre conexão, consentimento, seleção, callback, reconexão, revogação, erros, e-mails, aplicativos autorizados e publicação
- Identificadores do **Fornecedor social** não são identificadores públicos nem critério de **Conta Capyra**

## Example dialogue

> **Dev:** "A Natura é uma **Conta Capyra** ou uma **Marca**?"
> **Domain expert:** "Na Conta da agência Acme, Natura é uma **Marca**. Quem paga o Capyra é a Acme, a **Conta Capyra**."
>
> **Dev:** "Se a Natura demitir a Acme, a **Marca** vira a Conta da Natura?"
> **Domain expert:** "Não. A Acme arquiva ou desconecta. A Natura só publica no Capyra se tiver a própria **Conta Capyra** e conectar as redes de novo."
>
> **Dev:** "`ana@natura.com` pode aprovar na Acme e ter a própria **Conta Capyra**?"
> **Domain expert:** "Não. Um e-mail é um **Operador** em uma **Conta Capyra**. Para a Natura contratar o Capyra, a Acme precisa removê-la primeiro — ou ela usa outro e-mail."
>
> **Dev:** "Ana pode ser **Criador** na Natura e **Visualizador** no Boticário?"
> **Domain expert:** "Não. Ela tem um **Papel**. Ou é **Criador** só na Natura, ou **Criador** nas duas, ou outro papel nas Marcas que lhe forem atribuídas."
>
> **Dev:** "O **Criador** pode conectar o Instagram da Natura?"
> **Domain expert:** "Não. Só o **Proprietário** cria **Conexão social**. Conectar cobra e trava a **Identidade nativa** no Capyra inteiro."
>
> **Dev:** "Duas agências podem manter **Conexão social** com o mesmo Instagram?"
> **Domain expert:** "Não. A identidade precisa ser desconectada da primeira **Conta Capyra** antes de ligar na segunda."
>
> **Dev:** "Conta `creator` não tem **Política de aprovação**?"
> **Domain expert:** "Tem, por **Marca**. O tipo só muda o padrão da experiência; não tira o recurso."
>
> **Dev:** "Cancelar no Capyra já impede o post na rede?"
> **Domain expert:** "Não. Só existe **Cancelamento de destino** depois da confirmação de que a rede não publicará aquela **Versão de destino**."
>
> **Dev:** "A métrica veio vazia. Coloco zero no relatório?"
> **Domain expert:** "Não. **Snapshot de métrica** ausente permanece ausente."

## Flagged ambiguities

- "cliente" era usado tanto para quem paga o Capyra quanto para o cliente da agência — resolvido: quem paga é a **Conta Capyra**; o cliente da agência não é entidade de domínio (aparece como **Marca** e, se entrar no produto, como **Operador** na Conta da agência)
- "usuário" poderia ser a pessoa autenticada ou a Conta que paga — resolvido: a pessoa é o **Operador**; quem paga é a **Conta Capyra**
- participação em várias Contas — resolvido: na v1 um e-mail autenticado pertence a no máximo uma **Conta Capyra**
- "membro" e "permissão por marca" sugeriam Papel diferente em cada Marca — resolvido: um **Papel** por **Operador** e um conjunto de **Marcas** atribuídas
- "conta" misturava Conta Capyra e Conta social — resolvido: os termos são distintos e sempre qualificáveis
- `agency` e `creator` pareciam planos diferentes — resolvido: são **Tipo de conta**; não definem preço, permissão nem limite de Marcas
- "conectar redes" parecia tarefa de quem cria conteúdo — resolvido: somente o **Proprietário** inicia ou encerra **Conexão social**
- "remover marca" parecia exclusão — resolvido: o fluxo comum produz **Marca arquivada**; exclusão definitiva é privacidade
- "horário agendado" poderia seguir o navegador — resolvido: vale o **Fuso da marca**, e mudar o fuso não desloca instantes já gravados
- "publicação" misturava o conteúdo, cada envio e o resultado — resolvido: **Publicação** agrupa **Destinos**; cada envio é **Tentativa de entrega**
- "cancelar" parecia só apagar localmente — resolvido: **Cancelamento de destino** exige confirmação de que a rede não publicará
- "falha" incluía timeout após envio — resolvido: aceite incerto é **Entrega desconhecida**
- "reconexão necessária" parecia aviso visual — resolvido: **Conexão com ação necessária** bloqueia envios
- "@handle" parecia identidade — resolvido: a **Identidade nativa** é estável; handle não é a chave
- "várias contas do mesmo Instagram na Marca" — resolvido: no máximo uma **Conta social** ativa por rede e Marca
- "cobrar conexões simultâneas" — resolvido: a fatura conta **Identidades sociais do ciclo**
- "white label" parecia só logo na interface — resolvido: a **Jornada social white label** cobre toda a jornada percebida
- "métrica indisponível" parecia zero — resolvido: ausência não é zero
- "análise de concorrentes" parecia escuta de perfil orgânico — resolvido: na v1 é pesquisa de anúncios públicos, fora deste glossário como entidade
- "idioma" misturado com fuso — resolvido: **Idioma** é interface (`pt-BR`, `en`, `es`); **Fuso da marca** é agendamento
