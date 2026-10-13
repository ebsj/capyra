# Capyra

Glossário canônico dos conceitos de negócio usados pelo Capyra e por suas
integrações sociais.

## Language

**Conta Capyra**:
Espaço isolado pertencente a uma organização ou profissional cliente do Capyra.
_Avoid_: conta, tenant

**Tipo de conta**:
Classificação da **Conta Capyra** como `agency`, `creator` ou `team` para segmentação da experiência.
_Avoid_: plano, permissão, franquia

**Capyra Social**:
Oferta comercial de integração social disponível independentemente do **Tipo de conta**.
_Avoid_: Capyra Agência, tipo de conta

**Identidade social do ciclo**:
Identidade nativa de uma rede social conectada ao menos uma vez durante um ciclo de cobrança.
_Avoid_: conexão simultânea, account-day

**Crédito de análise**:
Unidade reservada para uma solicitação válida e consumida quando sua **Análise de vídeo** é concluída.
_Avoid_: tentativa de processamento, publicação, crédito consumido em falha técnica

**Agência**:
Organização que opera uma **Conta Capyra** para administrar marcas de seus clientes.
_Avoid_: conta, equipe

**Operador**:
Usuário que participa de uma **Conta Capyra** e trabalha com seus recursos.
_Avoid_: usuário da agência, equipe

**Proprietário**:
**Operador** responsável por membros, conexões sociais e cobrança da **Conta Capyra**.
_Avoid_: administrador, owner

**Membro**:
**Operador** autorizado a trabalhar com todas as **Marcas** da **Conta Capyra**, sem administrar membros, conexões sociais ou cobrança.
_Avoid_: colaborador, member

**Marca**:
Identidade comercial pertencente a exatamente uma **Conta Capyra**.
_Avoid_: cliente, perfil

**Marca arquivada**:
**Marca** inativa preservada para consulta histórica, sem conexões sociais ou publicações futuras.
_Avoid_: marca excluída, marca removida

**Fuso da marca**:
Fuso horário IANA que define a interpretação local dos agendamentos de uma **Marca**.
_Avoid_: fuso do navegador, fuso do operador

**Análise de vídeo**:
Avaliação de um vídeo realizada no contexto de exatamente uma **Marca**.
_Avoid_: análise sem marca, relatório

**Mídia original**:
Arquivo enviado ou recuperado que serve de fonte para análise ou publicação de uma **Marca**.
_Avoid_: análise, artefato, publicação

**Variante de mídia**:
Arquivo fornecido pelo operador para atender aos requisitos específicos de um **Destino**.
_Avoid_: transformação automática, ajuste de texto

**Conta social**:
Identidade de uma **Marca** em uma rede social específica.
_Avoid_: conta, perfil social, conexão

**Conexão social**:
Vínculo ativo e exclusivo entre uma **Conta social** e o Capyra.
_Avoid_: conta social, integração

**Conexão com ação necessária**:
**Conexão social** sem autorização válida que exige intervenção do **Proprietário**.
_Avoid_: desconectada, saudável, falha silenciosa

**Publicação**:
Conteúdo de uma **Marca** que agrupa uma ou mais entregas planejadas às redes sociais.
_Avoid_: postagem publicada, tentativa, envio

**Post externo**:
Postagem publicada fora do Capyra e importada como registro histórico somente leitura.
_Avoid_: Publicação, rascunho importado

**Destino**:
Entrega planejada de uma **Publicação** para exatamente uma **Conta social**, com conteúdo e agendamento próprios.
_Avoid_: rede, publicação, tentativa

**Versão de destino**:
Retrato imutável do conteúdo e do agendamento de um **Destino** submetido para entrega.
_Avoid_: rascunho, edição em andamento

**Cancelamento de destino**:
Confirmação de que uma **Versão de destino** não será publicada pela rede social.
_Avoid_: solicitação de cancelamento

**Tentativa de entrega**:
Um esforço individual de enviar um **Destino** à sua **Conta social**.
_Avoid_: destino, repetição, publicação

**Snapshot de métrica**:
Observação datada de uma métrica nativa de uma rede para uma **Conta social** ou um **Destino**.
_Avoid_: valor atual, score geral, zero quando indisponível

**Vínculo de análise**:
Associação opcional entre uma **Versão de destino** e a **Análise de vídeo** concluída que orientou sua preparação.
_Avoid_: atribuição causal, impacto comprovado

**Importação inicial**:
Sincronização automática dos **Posts externos** dos noventa dias anteriores à conexão de uma **Conta social**.
_Avoid_: importação completa, download de mídia

**Autorização Capyra**:
Consentimento para um cliente externo acessar a API do Capyra em nome de um **Operador**.
_Avoid_: conexão social, OAuth social

**Autorização social**:
Consentimento concedido na rede social para criar ou consultar conteúdo de uma **Conta social**.
_Avoid_: OAuth do MCP, login no Capyra

**Entrega desconhecida**:
**Tentativa de entrega** cujo aceite pela rede social ainda não pôde ser confirmado nem descartado.
_Avoid_: falha, timeout definitivo

**Falha definitiva**:
Resultado confirmado que encerra as tentativas automáticas de um **Destino** e exige intervenção do operador.
_Avoid_: indisponibilidade temporária, resultado desconhecido

**Jornada social white label**:
Jornada percebida pelo **Operador** na qual somente Capyra e a rede social de destino podem ser identificadas.
_Avoid_: white label parcial, interface white label

**Gate white label**:
Condição conjunta que exige aprovação das **Jornadas sociais white label** de Instagram, TikTok e YouTube antes do piloto social.
_Avoid_: aprovação parcial, validação apenas documental

## Relationships

- Uma **Conta Capyra** do tipo agência representa exatamente uma **Agência**
- O **Tipo de conta** não determina quantas **Marcas** uma **Conta Capyra** pode possuir
- A contratação do **Capyra Social** não depende do **Tipo de conta**, embora o piloto seja destinado a agências
- A franquia do **Capyra Social** conta **Identidades sociais do ciclo**, e reconectar a mesma identidade não cria outra unidade
- Um **Crédito de análise** reservado é liberado se a análise falhar tecnicamente ou for cancelada antes do processamento
- Repetições automáticas da mesma análise não consomem novos **Créditos de análise**
- Uma **Conta Capyra** possui exatamente um **Proprietário** e zero ou mais **Membros**
- **Proprietários** e **Membros** são **Operadores**
- Toda **Conta Capyra** possui uma ou mais **Marcas**
- Uma **Marca** pertence a exatamente uma **Conta Capyra**
- Uma **Marca arquivada** preserva suas análises, publicações e métricas em modo somente leitura
- Uma **Marca arquivada** preserva registros históricos, mas suas **Mídias originais** expiram após trinta dias
- Toda **Marca** possui exatamente um **Fuso da marca**
- Um agendamento preserva o instante e o **Fuso da marca** usados em sua criação, mesmo que o fuso da Marca mude depois
- Uma **Análise de vídeo** pertence a exatamente uma **Marca**
- Uma **Mídia original** não expira enquanto estiver vinculada a uma publicação ainda não concluída
- Um **Destino** pode usar a **Mídia original** ou uma **Variante de mídia** compatível com sua rede
- Uma **Marca** possui zero ou mais **Contas sociais**
- Uma **Marca** possui no máximo uma **Conta social** ativa por rede social
- Uma **Conta social** possui no máximo uma **Conexão social** ativa em todo o Capyra
- Uma **Conexão com ação necessária** bloqueia novos envios e dispara reconciliação dos **Destinos** futuros
- Uma **Publicação** pertence a exatamente uma **Marca** e possui um ou mais **Destinos**
- Um **Post externo** pertence a exatamente uma **Marca** e uma **Conta social**, sem possuir **Tentativas de entrega** do Capyra
- Um **Post externo** só pode originar **Análise de vídeo** quando houver **Mídia original** recuperável ou fornecida pelo operador
- Um **Destino** pertence a exatamente uma **Publicação** e referencia exatamente uma **Conta social**
- Um **Destino** agendado possui uma **Versão de destino** imutável; editá-lo exige cancelar a versão vigente e criar outra
- Um pedido de cancelamento só produz um **Cancelamento de destino** após confirmação externa
- Um **Destino** possui uma ou mais **Tentativas de entrega**, sem repetir Destinos já concluídos
- Uma **Conta social** ou um **Destino** possui zero ou mais **Snapshots de métrica**
- Um **Vínculo de análise** referencia uma **Análise de vídeo** concluída da mesma **Marca** da **Publicação**
- Uma **Importação inicial** recupera metadados e métricas, mas não baixa automaticamente a mídia original
- Métricas de redes diferentes só são agregadas para uma **Marca** quando suas definições são comprovadamente equivalentes e aditivas
- Uma **Entrega desconhecida** precisa ser reconciliada antes de qualquer nova **Tentativa de entrega**
- Uma **Falha definitiva** pode originar uma nova **Tentativa de entrega** somente por ação do operador
- Uma **Jornada social white label** abrange conexão, consentimento, reconexão, revogação, erros, comunicações e publicação
- Uma **Jornada social white label** não expõe a identidade do fornecedor social em nenhuma de suas etapas
- O **Gate white label** só é aprovado quando as três redes do piloto passam por validação prática

## Example dialogue

> **Dev:** "A conexão ainda é uma **Jornada social white label** se o fornecedor aparecer apenas na tela de consentimento?"
> **Domain expert:** "Não — durante toda a jornada, o operador pode ver somente Capyra e a rede social de destino."
>
> **Dev:** "Duas **Agências** podem manter uma **Conexão social** ativa com o mesmo Instagram?"
> **Domain expert:** "Não — a **Conta social** precisa ser desconectada da primeira **Agência** antes de ser vinculada à segunda."
>
> **Dev:** "Um **Membro** pode agendar uma publicação para qualquer **Marca** da **Agência**?"
> **Domain expert:** "Sim — somente membros, conexões sociais e cobrança ficam reservados ao **Proprietário**."

## Flagged ambiguities

- "Conta" era usado tanto para a **Conta Capyra** quanto para a **Conta social** — resolvido: os termos são distintos e devem ser qualificados
- `agency`, `creator` e `team` poderiam implicar modelos ou limites de marca diferentes — resolvido: são **Tipos de conta** para segmentação; todas as contas podem possuir múltiplas **Marcas**, conforme a oferta comercial
- "Capyra Agência" poderia tornar a oferta exclusiva ao tipo `agency` — resolvido: **Capyra Social** é independente do **Tipo de conta**, e apenas o piloto comercial é restrito a agências
- "Até quinze contas sociais" poderia significar apenas conexões simultâneas — resolvido: a franquia conta até quinze **Identidades sociais do ciclo** distintas
- "Análise consome um crédito" poderia incluir solicitação, retry ou falha — resolvido: o crédito é reservado no aceite e consumido somente quando a **Análise de vídeo** termina com relatório completo
- "Equipe da agência" poderia significar uma conta do tipo `team` — resolvido: significa o conjunto de **Operadores** de uma **Conta Capyra** do tipo agência
- "OAuth" poderia significar autorização de um cliente do Capyra ou conexão com uma rede — resolvido: **Autorização Capyra** e **Autorização social** são jornadas distintas
- "Marca" parecia existir somente para agências — resolvido: toda **Conta Capyra**, inclusive `creator` e `team`, trabalha obrigatoriamente no contexto de uma **Marca**
- "Contas sociais de uma marca" poderia incluir vários perfis da mesma rede — resolvido: cada **Marca** possui no máximo uma **Conta social** ativa por rede no primeiro lançamento
- "Remover marca" poderia significar exclusão imediata — resolvido: o fluxo comum arquiva a **Marca** após cancelar publicações futuras e desconectar suas contas sociais; exclusão definitiva pertence ao processo de privacidade e retenção
- "Horário agendado" poderia seguir o navegador do operador — resolvido: ele é interpretado no **Fuso da marca**, convertido para um instante UTC e não muda retroativamente
- "Preservar o histórico" poderia incluir os arquivos binários — resolvido: relatórios, publicações e métricas permanecem, enquanto **Mídias originais** expiram trinta dias após arquivamento ou exclusão solicitada
- "Ajustes por rede" poderia incluir transformação automática — resolvido: o MVP adapta composição e configurações, valida a mídia e solicita uma **Variante de mídia** quando necessário
- "Análise" poderia existir apenas no contexto geral da conta — resolvido: toda nova **Análise de vídeo** pertence a exatamente uma **Marca**; registros anteriores aguardam atribuição manual
- "Publicação" era usado para o conteúdo, cada envio e o resultado agregado — resolvido: **Publicação** agrupa **Destinos**, e cada envio ou repetição é uma **Tentativa de entrega**
- "Publicação importada" poderia sugerir um conteúdo editável pelo Capyra — resolvido: conteúdo publicado fora do produto é um **Post externo** somente leitura
- "Cancelar" poderia significar apenas registrar a intenção local — resolvido: um **Cancelamento de destino** só existe após confirmação de que a rede não publicará aquela versão
- "Falha" poderia incluir timeout após envio — resolvido: aceite incerto produz **Entrega desconhecida**, que deve ser reconciliada antes de qualquer repetição
- "Reconexão necessária" poderia ser apenas um aviso visual — resolvido: uma **Conexão com ação necessária** bloqueia envios, tenta cancelar Destinos futuros e alerta o **Proprietário** sobre resultados não confirmados
- "Métricas por marca" poderia significar somar indicadores incompatíveis — resolvido: preservamos **Snapshots de métrica** nativos e só agregamos definições comprovadamente equivalentes e aditivas
- "Melhora após a análise" poderia sugerir causalidade — resolvido: o **Vínculo de análise** registra associação, e comparações observacionais não comprovam que a análise causou o resultado
- "Importar publicações" poderia significar copiar todo o histórico e os arquivos — resolvido: a **Importação inicial** cobre noventa dias de metadados e métricas; posts mais antigos exigem importação pontual quando disponíveis
- "White label" poderia significar somente a interface controlada pelo Capyra — resolvido: a exigência cobre toda a jornada percebida pelo operador da agência
- "Aprovar a integração" poderia permitir lançamento parcial — resolvido: o **Gate white label** exige aprovação conjunta de Instagram, TikTok e YouTube antes do piloto
