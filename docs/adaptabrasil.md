# AdaptaBrasil: estresse hídrico por UF — 15/10/2026

O programa consulta diretamente a API pública do AdaptaBrasil MCTI. O primeiro
indicador integrado é **Risco de estresse hídrico**, identificador 2, no setor
Recursos hídricos. São valores estaduais publicados pela fonte: o Mundialidade
não os calcula pela média dos municípios.

## Referência e cenários

| Recorte publicado | Cenário | Período descrito pela fonte |
| --- | --- | --- |
| Presente, referência 2020 | Sem cenário futuro | Ano de maior frequência dos dados brutos do setor; não implica que todos os componentes sejam de 2020 |
| Horizonte 2030 | 49, Otimista — SSP2-4.5 | 2015–2040 |
| Horizonte 2030 | 50, Pessimista — SSP5-8.5 | 2015–2040 |
| Horizonte 2050 | 49, Otimista — SSP2-4.5 | 2041–2070 |
| Horizonte 2050 | 50, Pessimista — SSP5-8.5 | 2041–2070 |

São cinco recortes, cada um com 27 UFs: **135 índices nesta coleta**. Os cenários
não são observações futuras já ocorridas nem previsões pontuais garantidas.
Eles não são concatenados como uma série histórica anual. A data de coleta
permanece separada das referências/horizontes.

O índice, sem unidade física, usa escala de 0 a 1. Não é percentual nem
probabilidade. As cores e faixas são fixas, conforme a legenda da fonte:
0,00–0,19 muito baixo; 0,20–0,39 baixo; 0,40–0,59 médio; 0,60–0,79 alto;
0,80–1,00 muito alto. A escala do mapa não se ajusta aos extremos de cada
cenário. Não há combinação com ND-GAIN, INPE ou agregado continental/mundial.

## Controle territorial

A resposta da API identifica São Paulo pela sigla SP e pelo nome correto, mas
traz `geocod_ibge=34`. A consulta oficial de UFs do IBGE confirmou `35`.
O coletor usa correspondência conjunta de sigla e nome, preserva o código
original e registra a divergência na interface e nos arquivos. Nenhum outro
código é remapeado por suposição. Valores e faixas não são alterados.

A correspondência oficial consultada foi guardada em
`scripts/data/sources/ibge-states-2026-10-15.json`, com URL e data de revisão.
Essa referência não é apresentada como consulta diária ao IBGE. A API IBGE foi
obtida com a validação TLS normal do PowerShell; a consulta Node encontrou
cadeia de certificado incompleta neste ambiente. Não foi desativada a validação
de certificados.

São exigidas 27 UFs distintas em cada resposta. Nome, sigla, indicador, ano e
cenário precisam coincidir; duplicatas, recortes cruzados, índices fora da
escala e divergências de cores/faixas interrompem a atualização. Zero é válido;
valor ausente permanece nulo e não recebe uma cor de risco nem vira zero.

## Interface e arquivos

O complemento aparece em **Estados (países) → Brasil** e em **Brasil → Estados
federados (UFs)**, na problemática de clima. A pré-visualização manual de CSV foi
substituída por mapa, escolha de referência/cenário, comparação de duas UFs,
tabela das 27 UFs e exportação CSV. Os seletores controlam apenas o complemento.
O link da análise preserva `adaptaRecorte`, `adaptaCompararUf` e `uf`.

- `public/data/adaptabrasil.json`: valores normalizados, períodos, cenários,
  legenda, controle territorial e datas;
- `public/data/adaptabrasil-source.json`: metadados dos dois nós relevantes da
  hierarquia, correspondência IBGE e respostas originais dos cinco recortes;
- SHA-256 do arquivo de origem em `adaptabrasil.json`;
- matriz de cobertura: cinco recortes estaduais separados, com referência ou
  horizonte explícito, sem registrá-los como dados mundiais ou anos observados.

Falhas do complemento não interrompem os demais indicadores. Uma falha apenas
da geometria mantém valores e tabelas disponíveis, com opção de nova tentativa.

## Reprodução

`npm run data:adaptabrasil` consulta os metadados, coleta os cinco recortes e
confere novamente os metadados antes de publicar arquivos. A coleta completa
inclui essa etapa. Após atualização isolada, execute `npm run data:coverage-status`.
Falhas seguem a política de novas tentativas de transporte do projeto; não são
rotuladas como coleta nova bem-sucedida usando dados antigos.

O conector TypeScript foi escrito para esta integração; utiliza a documentação
da API e não incorpora o código Python do repositório externo.

Fontes: [documentação oficial de acesso](https://github.com/AdaptaBrasil/AdaptaBrasilAPIAccess),
[hierarquia e metadados](https://sistema.adaptabrasil.mcti.gov.br/api/hierarquia/adaptabrasil),
[referência estadual de 2020](https://sistema.adaptabrasil.mcti.gov.br/2/1/2020/null/BR/estado/adaptabrasil)
e [UFs do IBGE](https://servicodados.ibge.gov.br/api/v1/localidades/estados).

Próxima ampliação: municípios e outras ameaças com suas geometrias, metadados,
cenários e correspondências territoriais validados. Os índices estaduais desta
entrega não substituem a análise da heterogeneidade municipal.
