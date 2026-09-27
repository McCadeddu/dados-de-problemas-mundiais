export const FEMINICIDE_RATE_ID = 'raseam-state-feminicide-rate'
export const FEMINICIDE_COUNT_ID = 'raseam-state-feminicide-victims'
export const RASEAM_URL = 'https://www.gov.br/mulheres/pt-br/central-de-conteudos/publicacoes-1/raseam-2026-relatorio-anual-socioeconomico-da-mulher.pdf/@@display-file/file'
export const isFeminicideIndicator = (id: string) => [FEMINICIDE_RATE_ID, FEMINICIDE_COUNT_ID].includes(id)
