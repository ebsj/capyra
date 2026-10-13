# Entregas desconhecidas são reconciliadas antes de repetir

Falhas transitórias confirmadas podem ser repetidas automaticamente com espera
progressiva e limite, mas timeout após envio produz resultado desconhecido. O
Capyra reconcilia esse estado antes de criar outra tentativa para não duplicar
publicações possivelmente aceitas; rejeições de conteúdo, permissão, formato ou
credencial são definitivas e uma nova tentativa depende do operador.
