# Métricas permanecem nativas e históricas

O Capyra armazena snapshots com rede, fonte, período, horário de observação e
data até a qual o dado está completo, em vez de manter apenas o valor mais
recente. Dados indisponíveis não viram zero, métricas de plataformas diferentes
só são agregadas quando forem semanticamente equivalentes e aditivas, e o MVP
não produz um score geral entre redes. Essa precisão custa mais armazenamento,
mas preserva tendências e impede comparações enganosas.
