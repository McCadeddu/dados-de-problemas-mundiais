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

## Ciclo seguinte — conector nacional da Itália

- Integração direta do Istat: desemprego mensal, Itália, ambos os sexos, 15–74
  anos, com ajuste sazonal. 139 meses de 2015-01 a 2026-07, edição 2026M9G1.
- Valor final 5,778043%, apresentado como 5,8%, conferido com o comunicado oficial.
- Nova coleta nacional concluída sem uso de cache: Istat 139 meses, ABS 140
  meses, INE Portugal 62 trimestres, EU-SILC 30 países. Cobertura anterior preservada.
- Parser seleciona uma só edição e rejeita recortes incorretos, duplicatas,
  meses omitidos, percentuais inválidos e perda de cobertura. Testes cobrem
  revisões, zeros, ausências, notas e recuperação por cache com datas preservadas.
- 93 testes em 17 arquivos passaram, com dois trabalhadores para reduzir a
  disputa por recursos no computador. A primeira execução paralela excedeu
  o limite de tempo de um teste preexistente de explicações dos 49 indicadores;
  não houve mudança de asserções ou aumento de timeout para contornar a falha.
- ESLint, TypeScript e build de produção com base GitHub Pages passaram.
- Navegador local: fonte Istat, mês e valor, edição, metodologia e histórico
  confirmados; nenhum erro de console capturado. Teste de componente garante
  que os dados italianos não apareçam em outro país ou tema.
- A comparação mundial e seus algoritmos permanecem com as séries anuais
  harmonizadas; este ciclo acrescenta o complemento nacional italiano.
