# Créditos de análise são reservados antes do processamento

Uma solicitação válida reserva um crédito e só o consome quando produz relatório
completo. Falha técnica ou cancelamento anterior ao processamento libera a
reserva, retries internos não criam consumo adicional e uma nova análise
solicitada pelo operador exige outro crédito. A reserva impede concorrência de
solicitações acima da franquia sem cobrar trabalho que o Capyra não concluiu.
