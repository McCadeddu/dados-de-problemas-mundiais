# Ampliação por fontes oficiais nacionais

Pesquisa inicial em 18/09/2026. Este documento verifica diretórios e exemplos de
fontes; não representa uma auditoria individual de todos os países, nem valida
licença, disponibilidade operacional e comparabilidade de cada conjunto de dados.
O levantamento inicial foi seguido pela primeira integração descrita abaixo.

## Primeira entrega implementada

- Catálogo dos 217 países e territórios: 179 instituições identificadas e 38
  entradas ainda pendentes. O vínculo do diretório foi associado por nome exato
  normalizado ao cadastro do Banco Mundial ou ao nome ISO em inglês; não foi usado
  pareamento aproximado. Endereços da ONU podem estar desatualizados e não foram
  todos visitados individualmente. Uma entrada pendente não significa que o país
  não tenha instituto de estatística.
- Oito entradas têm documentação consultada: Brasil (conector existente), México,
  Portugal, Itália, Austrália, Quênia, África do Sul e Índia. O catálogo de instituições não
  autoriza automaticamente reutilizar os dados de cada portal.
- Novo conector Eurostat `ilc_li02`: pobreza relativa abaixo de 60% da mediana
  nacional da renda equivalente disponível, após transferências, população total.
  Filtros confirmados na API: `freq=A`, `statinfo=MED_EI`, `unit=PC`,
  `rskpovth=B_60`, `sex=T`, `age=TOTAL`, anos desde 2015.
- Primeira coleta: 30 países, 326 observações. Recorte de reutilização limitado a
  UE/EFTA; agregados e demais países não são importados. A política do Eurostat
  prevê exceções, portanto não se atribui uma licença irrestrita a todo o portal.
- Séries mostradas no detalhe nacional de pobreza, com sinalizações, fonte,
  metodologia, data da coleta e aviso em caso de reutilização de uma coleta
  anterior por falha da API. O ano é o da pesquisa; a renda normalmente se refere
  ao ano anterior. A distribuição pelo Eurostat está explicitada na interface.
- O novo indicador não altera rankings nem preenche automaticamente as lacunas
  da linha internacional de pobreza. Não há novos mapas subnacionais nesta etapa.

### Operação

`npm run data:national` atualiza o complemento usando o catálogo revisado em
`scripts/data/national-source-registry.json`. O comando integra `npm run data:build`
e, portanto, a rotina diária já existente. Artefatos publicados:
`public/data/national-data.json` e `public/data/country-coverage.json`.

### Lote prioritário desta etapa

| País | Fonte oficial catalogada | Dado nacional complementar integrado | Próximo passo seguro |
| --- | --- | --- | --- |
| México | INEGI, API de indicadores | Ainda não | Selecionar série e validar token, unidade e recorte estadual. |
| Portugal | INE; EU-SILC via Eurostat | Pobreza relativa 2015–2025 | Avaliar ligação direta ao INE para trabalho e educação. |
| Itália | Istat; EU-SILC via Eurostat | Pobreza relativa 2015–2025 | Validar SDMX nacional antes de adicionar novas séries. |
| Austrália | Australian Bureau of Statistics | Ainda não | Escolher conjunto da Data API e validar licença e denominador. |
| África do Sul | Statistics South Africa | Ainda não | Priorizar pesquisa domiciliar compatível com trabalho e migração. |
| Índia | MoSPI/eSankhyiki | Ainda não | Identificar série oficial estável antes de automatizar a coleta. |

“Ainda não” significa que a fonte foi identificada, mas nenhum valor nacional
foi importado por este conector. O painel mantém essa distinção para não
apresentar uma fonte catalogada como se fosse uma integração concluída.

`node scripts/data/import-national-directory.mjs` atualiza os candidatos a partir
da ONU e do Banco Mundial; revisar o diff antes de aceitar novas associações.
Essa importação é manutenção explícita, não roda automaticamente na coleta diária.

O diagnóstico registra disponibilidade e ano por indicador e país. Ele não
certifica atualidade ou qualidade e não soma territórios a Estados soberanos.

## Localizar instituições

- [Diretório de institutos nacionais da ONU](https://unstats.un.org/home/nso_sites/): ponto de partida por país. Cada endereço deve ser confirmado no portal atual da instituição.
- [Páginas nacionais do FMI](https://data.imf.org/Datasets/NSDP): complemento voltado sobretudo a indicadores macroeconômicos; não cobre sozinho os cinco temas do projeto.
- [API dos ODS da ONU](https://unstats.un.org/SDGAPI/swagger/): dados oficiais reportados pelas agências responsáveis, com possibilidade de ampliar séries e desagregações conforme o indicador.

## Exemplos confirmados na documentação oficial

| País | Fonte | O que foi verificado |
| --- | --- | --- |
| Brasil | [IBGE](https://servicodados.ibge.gov.br/api/docs/agregados) | Conector já presente no projeto para dados estaduais e regionais. |
| México | [INEGI](https://www.inegi.org.mx/servicios/api_indicadores.html) | API de indicadores nacionais, estaduais e municipais; documentação inclui token. |
| Portugal | [Instituto Nacional de Estatística](https://www.ine.pt/) | Portal oficial de estatísticas; os conjuntos devem ser selecionados por conceito e período antes de integração. |
| Itália | [Istat](https://esploradati.istat.it/SDMXWS/swagger/index.html?urls.primaryName=v2) | Interface documentada de serviços SDMX; selecionar conjuntos e recortes antes de integrar. |
| Austrália | [ABS](https://www.abs.gov.au/statistics/application-programming-interfaces-apis/data-api-user-guide) | API de estatísticas econômicas, sociais e censitárias. Recortes variam por conjunto. |
| Quênia | [KNBS](https://www.knbs.or.ke/county-statistical-abstracts/) | Compilações oficiais demográficas, sociais, econômicas e ambientais por condado. Não foi validada uma API. |
| África do Sul | [Stats SA](https://www.statssa.gov.za/?page_id=1417) | Repositórios para consulta e download de censos e pesquisas domiciliares. |
| Índia | [MoSPI/eSankhyiki](https://esankhyiki.mospi.gov.in/) | Portal oficial de indicadores; avaliar os conjuntos temáticos antes de escolher um conector. |

## Prioridades temáticas

- Fome: [FAOSTAT, segurança alimentar](https://data.fao.org/catalog/dataset/955d6564-40a9-48b4-b51b-f19d65bb3539). Comparar com as séries já recebidas pelo Banco Mundial para evitar duplicação.
- Água: [JMP, downloads](https://washdata.org/data/downloads) e [desagregação regional](https://washdata.org/topics/inequalities/sub-national-regions). Possibilidade de aprofundamento onde existem pesquisas e censos suficientes.
- Trabalho e gênero: [ILOSTAT, download em lote](https://ilostat.ilo.org/data/bulk/) e ODS. Cuidado não remunerado e violência precisam de validação específica de população, período e definição.
- Clima: [relatórios nacionais na UNFCCC](https://unfccc.int/reports). São complementos oficiais; relatórios de adaptação não são substitutos equivalentes do índice acadêmico ND-GAIN.
- Migração: preservar as definições das séries UNHCR existentes e avaliar registros nacionais separadamente. Registro de imigrantes, pedido de asilo, estoque de refugiados e deslocamento interno medem fenômenos diferentes.

## Lacunas observadas no arquivo atual

O cadastro contém 217 países e territórios/economias, não 217 Estados soberanos.
Contagens abaixo indicam presença de último valor, não atualidade, qualidade ou
comparabilidade dos dados. Não tratam valores ausentes como zero.

| Indicador | Entradas com dados | Entradas sem dados |
| --- | ---: | ---: |
| Acesso básico à água | 214 | 3 |
| Água potável gerida com segurança | 151 | 66 |
| Insegurança alimentar moderada ou grave | 153 | 64 |
| Violência física e/ou sexual recente contra mulheres | 106 | 111 |
| Diferença de tempo em cuidado não remunerado | 27 | 190 |
| Índice de Gini | 171 | 46 |

Contagens calculadas sobre `public/data/mundialidade.json` após a coleta de 18/09/2026.

## Regras propostas para integrar

1. Criar catálogo por código territorial com instituição, portal, documentação,
   licença, acesso, indicador, unidade, população de referência, anos, divisões
   territoriais e data da verificação. Distinguir fonte identificada, dados
   verificados e conector integrado.
2. Manter séries internacionais harmonizadas no mapa e ranking mundial.
   Preencher uma lacuna com fonte nacional somente depois de validar equivalência
   de conceito, unidade, denominador, período, território e tratamento estatístico.
3. Exibir indicadores próprios do país na página nacional, com recortes internos
   disponíveis e metodologia explícita. Uma linha nacional de pobreza não deve
   substituir diretamente uma linha internacional; registros policiais de
   violência não equivalem à prevalência medida em pesquisa domiciliar.
4. Registrar origem por observação quando uma série combinar instituições;
   o atual `sourceId` por indicador não é suficiente para esse caso.
5. Generalizar a hierarquia territorial hoje específica do Brasil antes de
   acrescentar estados, províncias ou municípios de outros países. Mapas exigem
   limites territoriais licenciados e códigos compatíveis com os dados.
6. Priorizar as lacunas por tema e validar pequenos lotes de países. API pública
   e fonte governamental não dispensam a verificação das condições de reutilização.

Resultado: ampliar a cobertura é viável. Cobertura completa de todos os temas,
anos e regiões em todos os países ainda não foi demonstrada e não deve ser prometida.
