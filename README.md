# Mundialidade

Mundialidade é um dashboard web open-source para acompanhar indicadores sociais e ambientais globais e do Brasil, com foco em fome, água, gênero, desigualdade, vulnerabilidade climática, migração forçada, analfabetismo e trabalho.

As páginas de [analfabetismo e trabalho](docs/analfabetismo-trabalho.md) incluem
mapas e séries mundiais UNESCO/UIS e OIT, dados estaduais do IBGE e explicação
sobre trabalho forçado. A contribuição previdenciária está disponível por UF
brasileira; a estimativa de trabalho forçado é global, referente a 2021.

## Stack

- React 19
- Vite
- TypeScript
- Recharts
- D3 Geo
- Node.js para coleta e processamento
- Vitest para testes básicos
- GitHub Actions para CI e refresh de dados

## Arquitetura

- `scripts/data/build.ts`: coleta dados públicos e normaliza o schema.
- `public/data/`: artefatos gerados consumidos pelo frontend.
- `src/`: dashboard responsivo, mapas, gráficos e filtros.
- `docs/architecture.md`: visão da arquitetura e plano de evolução.
- `docs/roadmap.md`: prioridades públicas de evolução.

## Fontes principais

- World Bank Open Data
- ND-GAIN Country Index: índice geral, vulnerabilidade e prontidão, com componentes de alimento, água, saúde e governança
- UNHCR Refugee Data Finder
- World Bank international migrant stock (`SM.POP.TOTL`)
- IBGE SIDRA
- IBGE Pesquisa de Orçamentos Familiares (POF 2017-2018)
- Natural Earth
- Eurostat EU-SILC: complemento nacional de pobreza relativa em países europeus

## Fontes oficiais nacionais

O detalhe de cada país inclui um catálogo de instituições e o status da pesquisa.
Em pobreza, 30 países têm séries complementares Eurostat de 2015 em diante,
conforme disponibilidade. A pobreza relativa nacional não substitui a linha
internacional usada no mapa mundial. Consulte o [levantamento e a operação dos
conectores nacionais](docs/fontes-nacionais.md).

`npm run data:national` atualiza esse complemento; também é executado pela coleta
completa. Uma falha no Eurostat mantém a última coleta disponível, com aviso no
painel. Os dados obedecem às condições de reutilização do Eurostat; a licença do
código do projeto não substitui as licenças das fontes.

### Indicadores iniciais de fome e sede

- Insegurança alimentar moderada ou grave: World Bank, série `SN.ITK.MSFI.ZS`.
- Água potável gerida com segurança: World Bank/JMP, série `SH.H2O.SMDW.ZS`.
- Acesso básico à água: World Bank/JMP, série `SH.H2O.BASW.ZS`.

As duas primeiras séries ampliam o recorte de fome e sede ao separar privação alimentar,
acesso básico e serviço de água com critérios de disponibilidade e qualidade.

### Comparação entre continentes

As médias continentais usam ponderação pela população anual do World Bank. Um país só entra no
cálculo quando há população e valor do indicador no mesmo ano; o painel informa a quantidade de
países incluídos. Essa regra evita que países muito pequenos tenham o mesmo peso de populações
muito maiores, mas não substitui análises por subgrupos ou distribuição interna.

### Indicadores iniciais de migração e crise humanitária

O painel trabalho–migração compara um ano comum por vez e acompanha o filtro
de continente. Mostra a amostra e os países excluídos; tabela e CSV usam os mesmos
registros dos cálculos. A correlação é descritiva, com peso igual por território,
e não estima causalidade. Consulte a [metodologia](docs/comparabilidade-trabalho-migracao.md).

- Refugiados por país de origem e refugiados acolhidos, da UNHCR.
- Solicitantes de asilo acolhidos, da UNHCR.
- Deslocados internos por conflito ou violência acompanhados pela UNHCR.

Os deslocados internos publicados pela UNHCR cobrem populações sob sua proteção ou assistência;
eles não representam, sozinhos, o total global de deslocamento interno.

### Indicadores iniciais de desigualdade de gênero

- Diferença de participação na força de trabalho entre homens e mulheres.
- Diferença de tempo dedicado a cuidado não remunerado entre homens e mulheres.
- Mulheres sujeitas a violência física e/ou sexual recente.

As diferenças são apresentadas em pontos percentuais. A cobertura de cuidado e violência é menor
e possui anos de referência diferentes entre países; o painel informa o ano mais recente de cada série.
Uma série mundial de diferença salarial comparável continua prevista para uma fonte específica.

### Indicadores estaduais do Brasil

- Insegurança alimentar em domicílios: alguma, moderada e grave; IBGE/PNAD
  Contínua, tabela 9552, 27 UFs em 2023 e 2024. Disponível no mapa, histórico,
  ranking e comparação entre estados. Atualização: `npm run data:food-security-states`
  (também incluída em `data:build`). Estimativas amostrais, com denominador domiciliar.

- Pobreza multidimensional e vulnerabilidade multidimensional: POF 2017-2018, estatísticas experimentais do IBGE.
- Renda per capita até 1/4 do salário mínimo: Censo 2022.
- Participação feminina, diferença de participação e diferença de cuidado não remunerado: PNAD Contínua.
- Diferença salarial de gênero: Censo 2022, diferença bruta de rendimentos médios.
- Focos ativos de fogo detectados: Programa Queimadas do INPE, total anual por UF do satélite de referência, taxa anual por 100 mil habitantes com população estimada pelo IBGE e janela recente de sete dias.

Cada indicador informa seu período e suas limitações metodológicas no próprio painel.
Focos ativos detectados não são equivalentes ao número de incêndios nem à área queimada.

## Licenças e redistribuição

O projeto prefere fontes públicas, gratuitas e com licença clara. No MVP:

- World Bank Open Data: CC BY 4.0
- UNHCR Refugee Data Finder: CC BY 4.0
- ND-GAIN: licença aberta informada pela fonte
- Natural Earth: domínio público
- IBGE SIDRA: dados públicos do IBGE

Revise sempre a documentação da fonte antes de ampliar redistribuição ou republicação de dados derivados.

## Instalação

```bash
npm ci
npm run data:build
npm run dev
```

## Scripts

A coleta automática roda diariamente às 09:00 UTC (06:00 em Brasília). Após
uma execução bem-sucedida de `Refresh Data` na branch `main`, o workflow
`Deploy GitHub Pages` publica os arquivos atualizados. A coleta e a publicação
validam o projeto antes de prosseguir. Falhas de coleta não acionam publicação.

Os resumos mundiais mostram o intervalo dos anos efetivamente usados na média;
os países podem ter anos de referência diferentes. A ponderação utiliza a
população do mesmo ano de cada observação e não equivale a uma estatística
mundial oficial publicada pela fonte.

```bash
npm run data:build
npm run dev
npm run test
npm run build
```

## Atualização dos dados

O GitHub Actions consulta as fontes públicas diariamente às 09:00 UTC (06:00 em São Paulo).
O workflow só cria um commit quando o arquivo de dados gerado contém mudanças. A frequência de
publicação de cada fonte continua sendo exibida no painel, pois muitos indicadores são anuais.

## CSV do AdaptaBrasil

No tema `Vulnerabilidade às mudanças climáticas`, use o botão de download para abrir o catálogo oficial. Baixe um CSV, volte ao painel e selecione `Carregar CSV para pré-visualizar`. A prévia é local ao navegador e mostra colunas, linhas e campos territoriais necessários. Após validar UF ou município, valor e cenário/período, o arquivo pode ser incorporado ao gerador para agregação por estado.

## Contribuição e qualidade dos dados

Use os formulários do GitHub para [sugerir uma fonte](.github/ISSUE_TEMPLATE/sugestao-de-fonte.yml)
ou [reportar qualidade de dados](.github/ISSUE_TEMPLATE/qualidade-de-dados.yml). Cada sugestão deve
informar a licença ou condições de reutilização, metodologia e cobertura, para preservar a transparência
das comparações publicadas.

## O que o MVP entrega

- dashboard responsivo
- páginas temáticas diretas: `fome-e-sede`, `genero`, `pobreza`, `clima`, `migracao`, `analfabetismo` e `trabalho`
- mapa mundial
- mapa do Brasil
- filtro por país
- filtro por estado no Brasil
- séries históricas
- ranking global por indicador
- transparência de fonte, data e metodologia
- pipeline pronta para CI

## Limites atuais do MVP

- o recorte estadual brasileiro ainda não cobre todos os temas, especialmente clima e migração;
- pobreza multidimensional, cuidado não remunerado e diferença salarial têm períodos de referência distintos e não devem ser comparados como uma série anual única;
- a arquitetura está pronta para receber conectores estaduais e regionais adicionais.

## Comunidade

- [Como contribuir](CONTRIBUTING.md)
- [Código de Conduta](CODE_OF_CONDUCT.md)
- [Roadmap](docs/roadmap.md)

## Estrutura do projeto

```text
.
├── .github/workflows/
├── docs/
├── public/data/
├── scripts/data/
├── src/
├── .env.example
├── LICENSE
└── README.md
```

## Publicação no GitHub

Checklist sugerido:

1. criar o repositório
2. subir o conteúdo atual
3. ativar GitHub Actions
4. escolher hospedagem estática
5. configurar branch padrão e proteção
