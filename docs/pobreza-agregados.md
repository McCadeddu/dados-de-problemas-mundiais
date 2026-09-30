# Pobreza: país, regiões e mundo

Integração de 30/09/2026. Fonte: Banco Mundial, Poverty and Inequality Platform
(PIP), distribuída pelo World Development Indicators (WDI), indicador
[`SI.POV.UMIC`](https://data.worldbank.org/indicator/SI.POV.UMIC).

## O que foi integrado

- Linha de US$ 8,30 por pessoa/dia, em PPC de 2021; percentual da população.
- Cadastro de 217 países/territórios, sete regiões e mundo. Nem todos os países
  possuem observações. Ausências permanecem nulas, inclusive no CSV.
- Histórico consultado desde 2000; primeira coleta contém 5.850 posições anuais,
  das quais 2.054 têm valor, até 2025. O último agregado mundial não nulo é 2024.
- País, regiões e mundo obtidos na mesma consulta, revisão WDI de 13/07/2026.
  Os grupos EAS, ECS, LCN, MEA, NAC, SAS e SSF são regiões oficiais, não uma
  reclassificação dos continentes do mapa. Nomes originais preservados.
- País e ano selecionáveis, histórico por área e arquivos CSV/JSON com linha,
  PPC, unidade, escala, sinalização, datas, consulta, metodologia e licença.

Exemplo da primeira coleta, ano 2024:

| Área | Abaixo de US$ 8,30/dia, PPC 2021 |
| --- | ---: |
| Brasil | 20,6% |
| América Latina e Caribe (LCN) | 24,7% |
| Mundo (WLD) | 46,1% |

Os valores são os publicados na fonte, sem recalcular médias continentais.
O WDI pode ser atualizado em calendário diferente do portal PIP; este complemento
não afirma representar a edição mais recente de todos os produtos PIP.

## Limites de comparação

Ano e linha comuns são necessários, mas não eliminam diferenças entre pesquisas.
A fonte combina medidas de renda e consumo, cujas diferenças afetam as comparações.
Para os agregados regionais e mundiais, a PIP alinha pesquisas aos anos de referência,
podendo interpolar ou extrapolar; veja a
[explicação do Banco Mundial](https://datahelpdesk.worldbank.org/knowledgebase/articles/193313-if-poverty-rates-are-not-available-for-all-countri).
A cobertura amostral e a natureza estimada de cada observação não estão detalhadas
nesta resposta WDI. Sinalização vazia não prova que seja uma medição direta.

A pobreza relativa Eurostat (60% da mediana nacional da renda disponível
equivalente após transferências), linhas nacionais e pobreza multidimensional
permanecem separadas. Não se calcula Gini mundial pela média de Ginis nacionais.
O mapa principal e este complemento têm seletores de ano próprios e podem ter
datas de coleta diferentes; suas referências ficam visíveis.

## Fontes regionais adicionais revisadas

- [Eurostat](https://ec.europa.eu/eurostat/cache/metadata/EN/tipspo_esms.htm):
  definição de risco de pobreza consultada. O complemento nacional existente
  continua separado da linha internacional.
- [ADB, Ásia e Pacífico](https://kidb.adb.org/): portal e catálogo localizados;
  seleção de indicador e validação da linha ainda pendentes.
- [Banco Africano de Desenvolvimento](https://www.afdb.org/en/knowledge/publications/gender-poverty-and-environmental-indicators-on-african-countries):
  catálogo oficial localizado; dados de tabelas individuais ainda não integrados.
- [Pacific Community, guia HIES](https://www.spc.int/DigitalLibrary/Doc/SDD/Capacity_Development__Guidance_notes/GN_Pacific_HIES_Toolkit_Data_Applications_and_Analysis.pdf?attachment=true):
  metodologia de pesquisas domiciliares e linhas de necessidades básicas localizada;
  não se presume equivalência automática com a linha de PPC do Banco Mundial.

Essas consultas ampliam o catálogo documental. Não representam quatro novos
conectores numéricos nem verificações independentes de todos os valores WDI.

## Atualização e integridade

`npm run data:poverty-aggregates` coleta e valida a fonte; também faz parte de
`npm run data:build` e, portanto, da rotina de atualização já existente.

A validação rejeita respostas paginadas/incompletas, duplicidades, percentuais
inválidos, geografia inesperada, anos omitidos e mudança de linha/PPC. A perda de
uma observação anteriormente disponível conserva a última coleta e marca o
arquivo como cache. Falha sem coleta anterior válida interrompe o comando.

Artefatos: `public/data/poverty-aggregates.json` e
`public/data/poverty-aggregates.csv`. O ID legado do indicador no mapa permanece
inalterado. Novas fontes não alteram os valores de outros temas.
