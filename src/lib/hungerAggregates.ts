export const HUNGER_AGGREGATE_INDICATORS = [
  { id: 'wb-undernourishment', code: 'SN.ITK.DEFC.ZS', name: 'Subalimentação', definition: 'Consumo habitual de energia alimentar insuficiente para uma vida ativa e saudável. É uma estimativa da FAO; não equivale à experiência de insegurança alimentar.', note: 'O valor 2,5 pode representar prevalência inferior a 2,5%, conforme os metadados. O ano é o rótulo publicado pelo Banco Mundial; não reinterpretamos janelas de referência da FAO.' },
  { id: 'wb-moderate-severe-food-insecurity', code: 'SN.ITK.MSFI.ZS', name: 'Insegurança alimentar moderada ou grave', definition: 'Percentual de pessoas que vivem em domicílios classificados com insegurança alimentar moderada ou grave por falta de dinheiro ou outros recursos, segundo a FAO.', note: 'O denominador é a população, não o número de domicílios. Não comparar diretamente com os percentuais domiciliares da EBIA no Brasil nem somar à subalimentação.' },
  { id: 'wb-basic-water', code: 'SH.H2O.BASW.ZS', name: 'Acesso pelo menos básico à água', definition: 'Uso de fonte melhorada com coleta de até 30 minutos, incluindo ida, volta e espera. Inclui quem tem serviço gerido com segurança.', note: 'As categorias se sobrepõem: acesso pelo menos básico e acesso gerido com segurança não devem ser somados.' },
  { id: 'wb-safely-managed-water', code: 'SH.H2O.SMDW.ZS', name: 'Água potável gerida com segurança', definition: 'Uso de fonte melhorada no domicílio ou terreno, disponível quando necessária e livre de contaminação fecal e de substâncias químicas prioritárias.', note: 'Os agregados JMP podem combinar estimativas urbanas e rurais ou usar totais nacionais conforme a cobertura. Mudanças de método podem afetar a série; não são médias recalculadas pelo painel.' },
] as const

export const HUNGER_AREAS = ['WLD', 'EAS', 'ECS', 'LCN', 'MEA', 'NAC', 'SAS', 'SSF'] as const
export type HungerAggregates = {
  fetchedAt: string; lastAttemptAt: string; sourceUpdatedAt: string; cached: boolean
  requestUrl: string; areaRequestUrl: string; licenseUrl: string
  areas: Array<{ code: string; name: string }>
  indicators: Array<{ id: string; code: string; sourceName: string; sourceNote: string; sourceOrganization: string; metadataUrl: string; methodologyUrl: string }>
  series: Array<{ indicatorId: string; areaCode: string; points: Array<{ year: number; value: number | null; status: string }> }>
}

export function aggregateValue(value: number | null | undefined) {
  return value == null ? 'Sem observação' : `${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}
