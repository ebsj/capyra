# Spec Kit no Capyra

Em 2026-09-12, CLI e arquivos gerenciados foram atualizados de **1.0.0** para
**1.0.6**, a release estavel mais recente na
[fonte oficial](https://github.com/github/spec-kit/releases/tag/v1.0.6), publicada
em 2026-09-10. A integracao e `codex`, em modo skills, com scripts Bash.
O workflow bundled foi atualizado para 1.0.1; nao ha extensoes instaladas.

## Uso por escopo

As skills `$speckit-*` tratam artefatos e etapas especificas. Uma correcao
localizada nao precisa iniciar um ciclo SDD. Para uma entrega completa:

1. Crie/revise a spec; esclareca ambiguidades materiais antes de planejar.
2. Gere plano e tarefas; analise a consistencia dos artefatos.
3. Implemente e valide o comportamento solicitado.
4. Execute convergencia; se restarem tarefas no escopo autorizado, implemente-as
   e repita a convergencia. Encerre com evidencia ou um bloqueio concreto.

Pedidos apenas de spec, plano ou revisao terminam na etapa pedida. O fim de uma
skill nao cancela outras etapas ja solicitadas. Checklists de revisao preservam
sua autoria: nao marque aprovacao humana como se fosse resultado de teste.

O overlay [capyra-delivery](../.specify/workflows/overlays/speckit/capyra-delivery.yml)
remove as pausas fixas de revisao de spec/plano do workflow `speckit` e acrescenta
analise e convergencia. Isso nao autoriza deploy, publicacao ou acesso remoto.
Decisoes materiais sem resposta ainda requerem o usuario. O runner executa uma
passagem; a repeticao implement/converge cabe ao agente na entrega completa.
Nao execute o workflow completo quando o pedido for apenas uma etapa.

## Atualizacao

O [guia oficial](https://github.com/github/spec-kit/blob/v1.0.6/docs/upgrade.md)
distingue a instalacao do CLI dos arquivos do projeto:

```bash
specify self check
specify self upgrade --dry-run
specify self upgrade
specify integration status
specify integration upgrade codex
specify extension update
specify workflow update
```

As skills possuem customizacoes locais intencionais: descricoes curtas e
procedimentos de hooks extraidos integralmente para `references/`. Os hashes
oficiais ficam intactos para o CLI detectar essas diferencas. Uma atualizacao
pode, portanto, recusar a substituicao: revise e salve o diff antes de usar
`specify integration upgrade codex --force`.

Depois de atualizar, revise e execute `python3 tools/configure-speckit.py`.
O adaptador aceita somente 1.0.6 ate seu formato ser revisado para a proxima
versao; reaplica as adaptacoes sem alterar specs, constituicao ou manifestos.
Ele e idempotente e recusa substituir referencias com conteudo diferente.
O workflow de origem `bundled` nao e atualizado por `workflow update`: compare-o
com `core_pack/workflows/speckit/workflow.yml` do CLI instalado e atualize sua
copia e versao no registro. Preserve o overlay local e valide a composicao:

```bash
specify workflow resolve speckit
specify workflow info speckit
git diff --check
```

Para conferir um recurso sem criar uma feature, use
`SPECIFY_FEATURE_DIRECTORY=specs/001-cloudflare-v2 .specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks`.
Nao substitua o ponteiro de feature de outro trabalho apenas para validar.

## Revisao das instrucoes

A revisao aplicou ao repositorio o artigo
[Rethinking skills and prompts for GPT-6 Astra](https://x.com/pvncher/status/2095991462416490862):

| Tema | Evidencia e ajuste |
| --- | --- |
| Descoberta de skills | Descricoes especificas nas dez skills SDD, quatro de seguranca e guia de design. |
| Leitura progressiva | Hooks so carregam suas referencias se houver configuracao; design aponta para a superficie relevante. |
| Instrucoes permanentes | Entrypoints, constituicao e workflow usam leitura por impacto; guia web remete a arquitetura sem duplicar seu mapa completo. |
| Autonomia e conclusao | Trabalho reversivel segue ate verificacao; testes repetem conforme impacto/falha; entrega SDD inclui convergencia. |
| Limites | Escopo de auditoria, autoria de checklists, producao e chamadas pagas continuam explicitos. |
| Manutencao | Adaptacoes reproduziveis, versoes registradas e templates lendo a constituicao em runtime. |

Sync Impact Report da constituicao: **3.0.0 → 3.1.0**, ampliacao de orientacoes
de execucao/contexto. Principios IV e V, fluxo de desenvolvimento e governanca
foram ajustados; fronteiras de produto e seguranca foram preservadas. O antigo
relatorio transitorio saiu da constituicao; nao houve propagacao de principios
para templates gerenciados.

Escopo desta revisao: arquivos e skills mantidos neste repositorio. Plugins e
skills pessoais de outros projetos permanecem fora desta alteracao; a lista
global de skills ainda pode causar truncamento de descricoes no Codex.

## Evidencias da validacao de 2026-09-12

- CLI instalado e manifestos: 1.0.6. Como `specify self check` retornou
  `offline or timeout`, a release mais recente foi conferida diretamente na
  API publica oficial do GitHub (`repos/github/spec-kit/releases/latest`).
- Dez skills comparadas com uma instalacao limpa de 1.0.6: vinte referencias
  de hooks preservadas integralmente e restante do procedimento inalterado.
- Adaptador reaplicado sem alteracoes; entrada invalida recusada antes da escrita.
- Criacao de feature, setup de plano, resolucao do template de tarefas e
  verificacao de pre-requisitos passaram em diretorio descartavel.
- Workflow composto validado pelo schema oficial; ordem: specify, plan, tasks,
  analyze, implement, converge. Nenhum agente de implementacao foi disparado
  nesta verificacao de configuracao.
- Sintaxe Bash, links das skills e `git diff --check` passaram. As quatro skills
  de seguranca foram sincronizadas com a instalacao pessoal e passaram no
  validador, assim como a skill de design.
- O validador local de skills ainda nao aceita o campo upstream `compatibility`.
  As dez skills SDD foram validadas em copias temporarias sem esse campo;
  o metadata original foi preservado nos arquivos reais.

Nao houve mudanca de runtime de produto, portanto suites de aplicacao e deploy
nao foram executados. `integration status` deve apontar dez skills customizadas,
sem arquivos ausentes; isso e esperado, nao uma instalacao incompleta.
