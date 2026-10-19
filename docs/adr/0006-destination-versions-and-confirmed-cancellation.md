# Destinos submetidos são versionados e cancelamentos são confirmados

Publicar ou agendar cria uma versão imutável do destino com chave de
idempotência. Editar depois da submissão exige cancelar a versão vigente,
confirmar o cancelamento externo e criar outra; até essa confirmação, o estado
permanece como cancelamento solicitado. A operação é recusada quando a rede já
iniciou ou concluiu a publicação, e remoção de postagem publicada não pertence
ao primeiro lançamento.
