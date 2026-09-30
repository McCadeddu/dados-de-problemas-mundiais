export const POVERTY_ID = 'wb-poverty-685' // Stable legacy key; the label is not the definition.
export const POVERTY_NAME = 'Pobreza na linha de US$ 8,30/dia'
export const POVERTY_DESCRIPTION = 'População abaixo de US$ 8,30 por pessoa/dia, em PPC de 2021 (%). Série revisada do Banco Mundial/PIP; não concatenar com a antiga linha de US$ 6,85 em PPC de 2017.'
export const POVERTY_METADATA_URL = 'https://api.worldbank.org/v2/indicator/SI.POV.UMIC?source=2&format=json'
export function validatePovertyDefinition(raw: unknown) {
  if (!Array.isArray(raw) || raw.length !== 2 || raw[0]?.total !== 1 || !Array.isArray(raw[1]) || raw[1].length !== 1) throw new Error('Metadados de pobreza incompletos')
  const meta = raw[1][0]
  if (meta.id !== 'SI.POV.UMIC' || meta.source?.id !== '2' || !meta.name?.includes('$8.30') || !meta.name?.includes('2021 PPP') || !meta.sourceNote?.includes('2021')) throw new Error('Definição de pobreza mudou; revisar linha e PPC antes de publicar')
  return meta as { id: string; name: string; sourceNote: string; sourceOrganization: string }
}
