export const genderMetadata: Record<string, { denominator: string; methodologyUrl: string }> = {
  'wb-women-parliament': { denominator: 'cadeiras ocupadas na câmara única ou baixa do parlamento nacional', methodologyUrl: 'https://databank.worldbank.org/metadataglossary/world-development-indicators/series/SG.GEN.PARL.ZS' },
  'wb-female-labor': { denominator: 'população feminina de 15 anos ou mais', methodologyUrl: 'https://databank.worldbank.org/metadataglossary/world-development-indicators/series/SL.TLF.CACT.FE.ZS' },
  'wb-women-violence-recent': { denominator: 'mulheres de 15 a 49 anos que já tiveram parceiro íntimo', methodologyUrl: 'https://databank.worldbank.org/metadataglossary/world-development-indicators/series/SG.VAW.1549.ZS' },
  'wb-labor-participation-gap': { denominator: 'taxas por sexo: população masculina e feminina de 15 anos ou mais; homens menos mulheres', methodologyUrl: 'https://databank.worldbank.org/metadataglossary/world-development-indicators/series/SL.TLF.CACT.FE.ZS' },
  'wb-unpaid-care-gap': { denominator: 'dia de 24 horas; diferença entre proporções de tempo de mulheres e homens', methodologyUrl: 'https://databank.worldbank.org/metadataglossary/gender-statistics/series/SG.TIM.UWRK.FE' },
  'ibge-state-female-labor-participation': { denominator: 'população feminina de 14 anos ou mais; média simples dos quatro trimestres', methodologyUrl: 'https://sidra.ibge.gov.br/tabela/4093' },
  'ibge-state-labor-participation-gap': { denominator: 'taxas por sexo da população de 14 anos ou mais; homens menos mulheres', methodologyUrl: 'https://sidra.ibge.gov.br/tabela/4093' },
  'ibge-state-gender-wage-gap': { denominator: 'rendimento médio masculino: (rendimento masculino − feminino) / masculino × 100', methodologyUrl: 'https://sidra.ibge.gov.br/tabela/10280' },
  'ibge-state-unpaid-care-gap': { denominator: 'diferença entre médias de horas de mulheres e homens de 14 anos ou mais; não é uma taxa populacional', methodologyUrl: 'https://sidra.ibge.gov.br/tabela/7013' },
}

// Shared with ingestion so corrected definitions survive subsequent data refreshes.
export const genderDefinitions: Record<string, { name?: string; description: string }> = {
  'wb-women-parliament': { description: 'Percentual das cadeiras ocupadas por mulheres na câmara única ou baixa do parlamento nacional. O denominador são as cadeiras, não a população do país.' },
  'wb-women-violence-recent': { name: 'Violência física e/ou sexual por parceiro íntimo — últimos 12 meses', description: 'Percentual de mulheres de 15 a 49 anos que já tiveram parceiro íntimo e sofreram violência física e/ou sexual por parceiro atual ou anterior nos 12 meses anteriores à pesquisa. Não inclui violência por não parceiros nem equivale a registros policiais. O ano da observação é o da fonte; “últimos 12 meses” não significa o ano corrente.' },
  'wb-unpaid-care-gap': { description: 'Tempo feminino menos masculino em trabalho doméstico e cuidado não remunerado, em pontos percentuais de um dia de 24 horas. Não são horas nem percentual da população. Pesquisas de uso do tempo podem diferir em método e amostragem entre países; não comparar diretamente com a diferença de horas do IBGE.' },
}
