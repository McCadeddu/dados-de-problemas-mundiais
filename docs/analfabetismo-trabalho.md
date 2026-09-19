# Analfabetismo e trabalho

Implementação e fontes verificadas em 18/09/2026. Os dois temas abrem primeiro
a análise mundial, com mapas, ranking e comparação entre países; o detalhe
nacional permanece ao final desse percurso.

## Indicadores incorporados

| Tema | Indicador | Fonte e transformação | Cobertura inicial |
| --- | --- | --- | --- |
| Analfabetismo | Pessoas de 15 anos ou mais | UNESCO/UIS via Banco Mundial, `100 - SE.ADT.LITR.ZS` | 170 países/territórios, último ano do conjunto 2024 |
| Analfabetismo | Jovens de 15 a 24 anos | UNESCO/UIS via Banco Mundial, `100 - SE.ADT.1524.LT.ZS` | 172 países/territórios, último ano do conjunto 2024 |
| Trabalho | Desemprego total | OIT, estimativas modeladas via Banco Mundial, `SL.UEM.TOTL.ZS` | 187 países/territórios, até 2025 |
| Trabalho | Desemprego juvenil | OIT, estimativas modeladas via Banco Mundial, `SL.UEM.1524.ZS` | 187 países/territórios, até 2025 |
| Trabalho | Emprego vulnerável | OIT, estimativas modeladas via Banco Mundial, `SL.EMP.VULN.ZS`; conta por conta própria e trabalhadores familiares auxiliares | 187 países/territórios, até 2025 |
| Analfabetismo — Brasil | Taxa de analfabetismo 15+ | IBGE PNAD Contínua, tabela 7113, variável 10267, sexo total e idade 15+ | 27 UFs, até 2025 |
| Trabalho — Brasil | Ocupados sem contribuição previdenciária em qualquer trabalho | IBGE PNAD Contínua, tabela 5947, variável 4108, categoria 99158 | 27 UFs; somente 4º trimestre de cada ano, até 2025 |

O ano mais recente de um conjunto não significa que todos os países tenham
observações naquele ano. Valores ausentes, sigilosos e não numéricos não são
convertidos em zero nem interpolados. O analfabetismo calculado não mede
analfabetismo funcional. Desemprego tem como denominador a força de trabalho,
e não a população total. Por isso os novos temas não exibem médias mundiais ou
continentais ponderadas pela população total; mantêm filtros por continente e
comparações das séries nacionais.

## Trabalho escravo ou forçado

O painel incorpora uma referência global de **27,6 milhões de pessoas em 2021**,
publicada em 2022 por OIT, Walk Free e OIM. A referência e seus links são curados,
não atualizados automaticamente pela API. Não é uma contagem de 2026.

- [Dados e pesquisa OIT](https://www.ilo.org/topics/forced-labour-modern-slavery-and-trafficking-persons/data-and-research-forced-labour)
- [Definição OIT](https://www.ilo.org/topics/forced-labour-modern-slavery-and-trafficking-persons/what-forced-labour)
- [Observatório OIT](https://webapps.ilo.org/flodashboard/)
- [Ministério do Trabalho e Emprego — Brasil](https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/areas-de-atuacao/combate-ao-trabalho-escravo-e-analogo-ao-de-escravo)

Não há mapa de prevalência de trabalho forçado por país integrado nesta entrega.
Fiscalizações e trabalhadores resgatados não medem o total de vítimas e não
devem ser apresentados como prevalência comparável entre países.

## Limitações e próximos conectores

- A contribuição previdenciária direta está disponível nesta entrega apenas por
  UF brasileira. Ainda não foi incorporada uma série mundial equivalente.
- A série `SL.ISV.IFRM.ZS` de informalidade ainda possui metadados no Banco
  Mundial, mas a consulta de observações retornou indicador removido/arquivado.
  Ela não foi incorporada e não foi substituída silenciosamente por outra medida.
- Trabalho informal, falta de contribuição e trabalho forçado são conceitos
  diferentes. Não são somados em um índice único.
- A comparação inicial entre trabalho e migração está disponível como teste
  descritivo: usa país–ano alinhado e refugiados acolhidos por mil habitantes;
  não estima causalidade.
  Será necessário compatibilizar período, população e território, sem inferir
  causalidade de uma simples associação.

## Atualização

`npm run data:education-work` coleta as cinco séries mundiais e três estaduais,
atualiza mapas/rankings e grava as séries históricas. Ele integra `data:build`,
antes de `data:national`, para atualizar também o diagnóstico de cobertura.
A coleta tenta novamente até três vezes em falhas de conexão, expiração de prazo
ou HTTP 408/429/500/502/503/504, com espera de 2 e 4 segundos. Cada tentativa tem
limite de 60 segundos, incluindo a leitura do corpo da resposta. Os logs identificam
a URL e a causa. JSON inválido e erros HTTP permanentes não são repetidos.
Se as tentativas se esgotarem ou a validação de cobertura falhar, o processo
encerra e impede a publicação automatizada; a versão pública anterior permanece.

Correção de 19/09/2026: a execução `35444247043` falhou por
`UND_ERR_CONNECT_TIMEOUT` ao acessar o IBGE na etapa de educação e trabalho,
que anteriormente fazia apenas uma tentativa. Testes simulam esse erro, respostas
HTTP transitórias e leitura interrompida, além de verificar o limite de tentativas.
Validação local em 19/09/2026: `npm run data:build` concluiu todas as etapas,
preservando 49 indicadores, 217 entradas territoriais e 6.973 últimos valores.
As três séries estaduais de educação e trabalho mantiveram cobertura das 27 UFs.

As definições podem ser consultadas na [API de metadados do Banco Mundial](https://api.worldbank.org/v2/indicator/SE.ADT.LITR.ZS?format=json),
no [IBGE 7113](https://servicodados.ibge.gov.br/api/v3/agregados/7113/metadados)
e no [IBGE 5947](https://servicodados.ibge.gov.br/api/v3/agregados/5947/metadados).
