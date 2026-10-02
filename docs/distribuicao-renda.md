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
existentes. O panorama mundial mostra cobertura por país e não produz agregado.
Na página nacional, as duas parcelas aparecem juntas apenas nos anos com ambas
as observações. O histórico conserva ausências e anos sem par. A ausência não
é substituída por zero ou pelo último dado de outra pesquisa.

## Limitações

Os metadados WDI informam que a distribuição usa renda ou consumo de pesquisas
domiciliares. A consulta inicial não solicitava notas por observação. Isso foi
corrigido em 02/10/2026: `footnote=y` retorna a sigla da pesquisa, o conceito
e eventuais restrições de cobertura em texto. Mesmo ano e conceito não comprovam
equivalência metodológica entre países. Ausência de restrição na nota não
comprova cobertura nacional.

## Notas WDI e filtro por conceito

Cada série tem 1.862 observações desde 2000; em 1.770 a nota é reconhecida
como declaração de pesquisa e conceito. Destas, 30 indicam cobertura apenas
urbana. Outras 92 permanecem sem classificação, preservando a nota bruta.
Brasil/2024 é identificado pela própria WDI como PNADC-E1, microdados de renda;
Argentina/2024 como EPHC-S2, renda com cobertura apenas urbana.

O parser aceita apenas o formato explícito `Based on data from …` e
`Estimated from unit-record/grouped income/consumption data`, com a restrição
opcional `Urban only`. Texto ausente ou diferente não recebe classificação
por inferência. O nome da pesquisa, conceito, tipo de distribuição, restrição
e nota original seguem para as séries, últimos valores e CSV/JSON.

O seletor mundial **Conceito documentado na WDI** controla mapa, ranking,
cartões e histórico da comparação entre países. Renda/consumo excluem notas
sem classificação e cobertura explicitamente urbana. O modo todos conserva
as observações originais. O ano selecionado não é substituído quando o filtro
resulta vazio. O parâmetro `conceitoRenda` preserva o filtro no link partilhado.
Uma tabela identifica as pesquisas e notas de cada observação do recorte;
o CSV do ranking também conserva esses campos. Complementos oficiais e a
análise nacional continuam identificando suas próprias fontes e períodos.

Documentação oficial do parâmetro:
[API Basic Call Structures](https://datahelpdesk.worldbank.org/knowledgebase/articles/898581-api-basic-call-structures).

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

## Conferência das pesquisas PIP

Integrada em 02/10/2026, com edição explícita `20260922_2021_01_02_PROD`,
PPC 2021, todos os anos de pesquisa, sem preenchimento de lacunas. Foram
coletadas 2.479 pesquisas. Entre os pares WDI disponíveis desde 2000,
1.137 país-anos têm uma candidata com ambas as parcelas coincidentes,
689 são inconclusivos pelo arredondamento, 5 têm parcelas divergentes
e 31 não têm pesquisa nacional elegível.
Contagens são de país-anos, não países. Para Brasil/2024, a candidata é
PNADC-E1, conceito renda, com 39,33% e 3,91% na PIP.

A conferência exige país e ano iguais, início do ano de pesquisa compatível,
cobertura e nível nacionais, estimativa de pesquisa sem interpolação, e
coincidência das duas parcelas considerando a precisão WDI (uma casa percentual)
e a precisão observada na resposta PIP (quatro casas na fração de cada decil).
Os 20% inferiores são a soma dos dois primeiros decis da PIP. Adota-se margem
de arredondamento de 0,005 ponto percentual para um decil e 0,01 para a soma
de dois. Valores junto aos limites de arredondamento WDI (0,05 ponto percentual)
permanecem inconclusivos; coincidência requer que todo o intervalo PIP caiba
na faixa WDI. A precisão da resposta é uma premissa desta conferência e deve
ser revista caso a publicação da API mude. Não se escolhe
entre múltiplas candidatas coincidentes. Não se atribui conceito ou pesquisa
ao dado WDI somente por país e ano. Coincidência numérica é evidência, não
prova de que a WDI utilizou aquela pesquisa; WDI julho/2026 e PIP setembro/2026
são edições diferentes. As parcelas originais WDI não são substituídas.

O painel nacional apresenta a conferência do ano selecionado. O CSV registra
todos os resultados, inclusive divergência, limite de precisão, ambiguidade, ausência e par
incompleto, e os valores de cada candidata. O JSON conserva as pesquisas e
os campos de comparabilidade. O período comparável da PIP é nacional; não
certifica equivalência internacional. O conceito candidato não é usado como
filtro de comparabilidade internacional do mapa.

`npm run data:pip-surveys` refaz somente esta conferência. Também roda ao fim
de `data:income-distribution`, antes do catálogo nacional na coleta diária.
Falhas ou perda de cobertura preservam as pesquisas anteriores e suas datas,
recalculando a conferência contra a WDI atual. Uma conferência de outra coleta
WDI não é exibida como evidência dos valores atuais. Sem cache, a coleta falha.
Fontes: [API PIP](https://pip.worldbank.org/api),
[cliente oficial](https://worldbank.github.io/pipr/reference/get_stats.html).
Os dados seguem a licença Banco Mundial já documentada acima.

Próximas etapas: detalhar conceitos de renda, desenho e cobertura das pesquisas
identificadas pela WDI; não confundir a sigla declarada com uma edição PIP
numericamente coincidente. Ampliar desigualdade nacional/subnacional com conceitos
compatíveis e pesquisar riqueza patrimonial em uma série própria.
