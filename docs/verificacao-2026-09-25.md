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

## Ciclo seguinte — conector nacional do México

- INEGI ENOE: 44 meses, janeiro de 2023 a agosto de 2026, desemprego nacional
  de pessoas de 15 anos ou mais, ambos os sexos, sem ajuste sazonal.
- Coleta real do XLSX público concluída sem token e sem cache. Último valor
  3,0107%, exibido como 3,0%, conferido no comunicado oficial de 25/09/2026.
- Notas originais preservadas, ressalva de Guerrero em 2023 visível e link
  para precisão amostral. Não se reproduzem as cores de precisão do XLSX.
- Validação de estrutura, população, continuidade mensal, percentuais e
  cobertura; ausência ND e zero distintos; falhas mantêm a coleta anterior.
- 97 testes em 18 arquivos passaram; ESLint, TypeScript, build com base do
  GitHub Pages e verificação de whitespace passaram. Uma falha intermediária
  de codificação de acentos foi corrigida antes da execução final dos testes.
- Navegador local: mês, valor, fonte e ressalvas confirmados; histórico aberto
  com 44 observações, nenhum erro de console capturado.
- Atualização de adm-zip 0.6.0 para 0.6.1 no lockfile; auditoria npm sem
  vulnerabilidades conhecidas após a atualização.
- ABS, INE Portugal, Istat e Eurostat recoletados sem cache; cobertura mantida.
  Dados nacionais não foram incorporados automaticamente ao cruzamento mundial.

## Ciclo seguinte — conector nacional da África do Sul

- Stats SA QLFS, indicador LU1: 74 trimestres, 2008Q1–2026Q2. Edição publicada
  em 11/08/2026; último valor 33,6%, conferido no comunicado oficial.
- Download real e leitura da planilha pública concluídos sem cache. Os demais
  complementos nacionais também foram recoletados sem cache e mantiveram cobertura.
- Validação de recorte, unidade, idade, sequência temporal, valores e edição;
  testes de zeros, duplicatas, resposta HTML de bloqueio e manutenção do histórico.
- 101 testes em 19 arquivos passaram. ESLint, TypeScript, build de produção
  com base GitHub Pages e verificação de whitespace passaram.
- Navegador local: valor e período corretos, histórico aberto com 74 observações,
  apresentação legível e nenhum erro de console capturado. Teste de componente
  mantém o complemento restrito à África do Sul no tema trabalho.
- A tela documenta a edição fixa e a revisão necessária para integrar novos
  relatórios; a rotina diária não descobre novas publicações automaticamente.
- Fontes, condições de reutilização, notas e limites disponíveis no painel.

## Ciclo seguinte — conector nacional da Índia

- MoSPI/eSankhyiki PLFS integrado pela API pública: 17 meses, abril de 2025 a
  agosto de 2026; último valor 5,0% em agosto de 2026. O painel identifica a
  população de 15 anos ou mais, total rural + urbana, pessoas de ambos os sexos,
  e a situação semanal corrente (CWS).
- A coleta valida dimensões, unidade, sequência mensal, paginação, valores
  ausentes, limites e períodos futuros. O filtro `year_type_code=2` foi omitido
  porque eliminava 13 observações sem erro; a série mensal retornada foi validada
  diretamente pelos campos de ano e mês. Falhas preservam a coleta anterior.
- O endpoint antigo exige compatibilidade TLS específica; o adaptador restrito
  ao host público mantém verificação de certificado e nome, exige TLS 1.2 ou
  superior, desabilita renegociação e não segue redirecionamentos.
- O painel explica CWS, o início da nova série mensal, a diferença em relação à
  situação habitual anual e os limites para cruzar trabalho e migração. A API
  não informa ajuste sazonal nem data de revisão, portanto isso não é inferido.
- Testes de parser, paginação, cache, segurança do transporte e componente
  passaram; a coleta nacional completa passou sem cache: ABS 140 meses, INE
  Portugal 62 trimestres, Istat 139 meses, INEGI 44 meses, Stats SA 74
  trimestres e MoSPI 17 meses. O conector não altera rankings mundiais.
