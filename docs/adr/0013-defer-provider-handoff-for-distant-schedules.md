# Agendamentos distantes aguardam no Capyra antes do envio

Como uploads temporários do Zernio expiram em sete dias, o Capyra preserva a
versão imutável e a mídia privada de agendamentos distantes, transferindo-as ao
fornecedor somente dentro de uma janela de seis dias. Um dispatcher durável e
reconciliável inicia essa entrega; destinos já dentro da janela são enviados
imediatamente. Assim o calendário pode ultrapassar sete dias sem expor mídia
publicamente nem depender de URLs vencidas.
