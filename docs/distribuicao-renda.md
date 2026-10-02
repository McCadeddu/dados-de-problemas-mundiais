# Distribuição da renda ou consumo — 02/10/2026

## Cobertura e funcionamento

Duas séries Banco Mundial/PIP via WDI foram integradas ao tema pobreza:

- `SI.DST.10TH.10`: parcela dos 10% com maior renda ou consumo per capita.
- `SI.DST.FRST.20`: parcela dos 20% com menor renda ou consumo per capita.

A primeira coleta, sem cache, encontrou 168 países/territórios com dados em cada
série desde 2000, com observações até 2025 conforme o país. A distribuição
brasileira de 2024 apresenta 39,3% para o grupo superior e 3,9% para o inferior.
Esses são percentuais do total nacional, não proporções da população.

O mapa mundial, histórico, ano comum e CSV de ranking seguem os controles já
existentes. O panorama mundial mostra cobertura nacional e não produz agregado.
Na página nacional, as duas parcelas aparecem juntas apenas nos anos com ambas
as observações. O histórico conserva ausências e anos sem par. A ausência não
é substituída por zero ou pelo último dado de outra pesquisa.

## Limitações

Os metadados WDI informam que a distribuição usa renda ou consumo de pesquisas
domiciliares. Esta API não fornece por observação a variável de bem-estar ou o
identificador da pesquisa. Mesmo ano não comprova mesma pesquisa ou equivalência
de conceito. A PIP deve ser consultada para essa verificação.

O ano identifica a pesquisa ou o início da coleta quando ela cruza dois anos.
Mudanças de conceito, desenho amostral e tratamento da produção para consumo
próprio podem limitar comparações temporais e internacionais. As parcelas podem
ser calculadas da pesquisa original ou estimadas de dados agrupados.

Renda e consumo são distintos do patrimônio acumulado. Estes indicadores não
fecham a lacuna de riqueza patrimonial. Os dois grupos têm tamanhos diferentes
(10% e 20%); o painel não calcula uma razão automática entre suas parcelas.
Uma média das parcelas nacionais não representa distribuição continental ou
mundial: seria necessária a distribuição conjunta. A WDI indica agregação NA.

Metodologias oficiais:

- [10% superiores](https://databank.worldbank.org/metadataglossary/world-development-indicators/series/SI.DST.10TH.10).
- [20% inferiores](https://databank.worldbank.org/metadataglossary/world-development-indicators/series/SI.DST.FRST.20).
- [Poverty and Inequality Platform](https://pip.worldbank.org/).

## Operação e proveniência

`npm run data:income-distribution` atualiza somente esse complemento. A coleta
também está em `data:build`, executado pela atualização diária existente.

Artefatos: `income-distribution.json` conserva nulos, status e metadados;
`income-distribution.csv` inclui códigos, ano, unidade, consulta, licença e datas;
as duas séries individuais e os metadados do dashboard alimentam os mapas.
A atualização específica preserva a data de processamento geral do dashboard;
a data desta coleta está no complemento e nos seus CSV/JSON.

Validam-se paginação, código e definição, edição WDI, geografia conhecida,
períodos contínuos na resposta, duplicações e percentuais finitos entre 0 e 100.
Nulos permanecem na evidência completa e são omitidos das séries numéricas para
gráficos, conforme o padrão do dashboard. Falha ou perda de cobertura conserva
a coleta anterior, com aviso e data da tentativa. Sem cache, a coleta falha.

Status vazio não comprova dado reportado nem ausência de estimação. Dados
licenciados em CC BY 4.0 pelo Banco Mundial, com atribuição à cadeia WDI/PIP e
instituições das pesquisas. A licença MIT do código não substitui essa licença.

Próximas etapas: identificar conceito de renda/consumo e pesquisa por observação,
ampliar desigualdade nacional/subnacional com conceitos compatíveis e pesquisar
riqueza patrimonial em uma série própria.
