# Verificação de 25/09/2026 — variações anuais por país

## Entrega

- Tabela de variações de desemprego, emprego vulnerável e medida migratória por
  país, restrita ao continente, medida e par de anos selecionados.
- CSV com os dois anos, valores originais, contagens migratórias, populações,
  variações sem arredondamento, indicador e data do arquivo de dados.
- Explicações de pontos percentuais, diferença de estoques por habitante,
  arredondamento e ausência de pares válidos; sem interpretação causal.

## Validação

- 88 testes em 16 arquivos passaram. Os novos casos conferem a reprodução das
  diferenças a partir do CSV, denominadores que mudam entre anos, zeros,
  precisão, nomes com aspas, filtros, período e ausência de pares anuais.
- ESLint, TypeScript e compilação de produção com a base do GitHub Pages passaram.
- Verificação no navegador local: 161 transições mundiais de refugiados em
  2024–2025; filtro Europe com 37 transições; estoque migratório em 2024 sem
  par consecutivo, tabela ausente e exportação desativada.
- Nenhum erro de console capturado na verificação local.
- Conteúdo e acionamento do CSV validados nos testes automatizados. A captura
  do evento de download no navegador integrado expirou; o recebimento físico
  desse arquivo pelo navegador não foi confirmado nesta verificação.

Não houve nova coleta de dados neste ciclo. A validação cobre esta entrega e
as regressões automatizadas, não uma nova auditoria de todas as fontes externas.
