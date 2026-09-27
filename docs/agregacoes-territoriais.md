# Agregações territoriais

Revisão de 27/09/2026: a navegação mundo → país → subdivisão não implica derivar os dados locais dos mundiais. Séries oficiais nacionais e locais permanecem independentes.

O cálculo genérico passou de uma autorização por tema para uma lista explícita de indicadores. Somente `wb-basic-water` e `wb-safely-managed-water` admitem estimativa ponderada pela população: são percentuais da população total. O painel identifica o resultado como estimativa dos países cobertos, não como agregado oficial do JMP/Banco Mundial. Suas regras e populações podem diferir das utilizadas pela instituição.

Cada chamada exige um único indicador e ano, países sem duplicidade e percentuais finitos entre 0 e 100. Só entram países com população positiva e finita daquele mesmo ano. A cobertura mostra o número realmente incluído. Zero é observação válida. Sem denominadores, o resultado é ausente. Não se substituem anos nem se imputam países faltantes.

O histórico continental calcula cada ano separadamente; a composição dos países pode mudar. Se os últimos dados nacionais forem de anos distintos, não há média de últimos valores, mesmo quando cada observação tem população correspondente.

Não agregados automaticamente:

- Gini: uma média dos índices nacionais não representa a distribuição conjunta de renda.
- ND-GAIN: pontuações nacionais não são índices mundiais oficiais.
- Migração e refúgio: contagens exigem somas validadas e recortes sem duplicidade; nunca média ponderada de contagens.
- Pobreza e alimentação: dependem de revisão de períodos, pesquisas, denominadores e regras próprias da fonte.
- Gênero, analfabetismo e trabalho: têm denominadores específicos já excluídos da média por população total.
- Indicadores novos ou não identificados: ficam bloqueados até revisão explícita.

Os cartões de pobreza e clima apresentam cobertura e anos disponíveis, mantendo mapas e comparações nacionais. Estimativas oficiais mundiais publicadas separadamente, como trabalho forçado, permanecem identificadas com fonte e ano.

Referências: [regras de agregação do Banco Mundial](https://datahelpdesk.worldbank.org/knowledgebase/articles/198549-what-methods-are-used-to-calculate-aggregates-for) e [denominador do acesso básico à água](https://databank.worldbank.org/metadataglossary/world-development-indicators/series/SH.H2O.BASW.ZS).
