# Agendamentos seguem o fuso da marca

Cada marca possui um fuso IANA obrigatório, inicialmente sugerido pela Conta
Capyra. O operador agenda no horário local da marca; a API preserva tanto o
instante UTC quanto o fuso usado, e mudanças posteriores não deslocam
agendamentos existentes. Horários inexistentes ou ambíguos em transições de
horário de verão exigem correção explícita.
