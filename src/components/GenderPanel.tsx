import type { DashboardData } from '../types'
import { genderMetadata } from '../lib/gender'
import { FEMINICIDE_RATE_ID } from '../lib/feminicide'

export function GenderPanel({ data, continent }: { data: DashboardData; continent: string }) {
  const countries = new Set(data.countries.filter((country) => continent === 'Todos' || country.continent === continent).map((country) => country.code))
  const indicators = data.indicators.filter((indicator) => indicator.themeId === 'gender-equality' && indicator.geographyType === 'country')
  return <section className="panel gender-panel" aria-label="Cobertura dos indicadores de gênero">
    <div className="panel__header"><div><h3>Gênero: dados disponíveis no recorte</h3><p>{continent === 'Todos' ? 'Mundo inteiro' : continent}. A cobertura mostra onde há dados; não mede igualdade nem prevalência mundial.</p></div><strong className="badge">Denominadores distintos</strong></div>
    <p>Não calculamos médias mundiais ou continentais com a população total: representação usa cadeiras, participação usa populações por sexo e idade, violência usa mulheres que já tiveram parceiro, e cuidado usa tempo.</p>
    <div className="gender-panel__grid">{indicators.map((indicator) => {
      const values = data.latest.filter((value) => value.indicatorId === indicator.id && value.geographyType === 'country' && countries.has(value.geographyCode))
      const years = values.map((value) => value.year)
      const first = Math.min(...years), last = Math.max(...years)
      return <article key={indicator.id}><span>{indicator.name}</span><strong>{values.length} de {countries.size}</strong><small>países com dado</small><p>{years.length ? `Anos dos últimos dados: ${first === last ? first : `${first}–${last}`}.` : 'Sem observações neste recorte.'}</p><p className="meta">{genderMetadata[indicator.id]?.denominator}</p>{genderMetadata[indicator.id] && <a href={genderMetadata[indicator.id].methodologyUrl}>Definição da fonte</a>}</article>
    })}</div>
    <details><summary>Limites da cobertura e das comparações</summary>
      <p>Compare os países no mesmo ano quando houver observações. O ranking usa o último dado de cada país e pode reunir anos diferentes; diferenças não demonstram causas ou significância estatística.</p>
      <p>“Últimos 12 meses” em violência é a janela da pesquisa, não uma atualização em tempo real. A série cobre parceiros atuais ou anteriores; registros policiais, feminicídios e outras formas de violência exigem fontes próprias.</p>
      <p>No trabalho, a série mundial usa 15 anos ou mais; o recorte estadual brasileiro usa 14 anos ou mais. No cuidado, pontos percentuais do dia e horas do IBGE são unidades distintas.</p>
      <p>O tema ainda não cobre todas as formas de discriminação social, racial ou contra pessoas LGBTQIA+. {data.indicators.some((item) => item.id === FEMINICIDE_RATE_ID) ? 'No Brasil, o recorte estadual inclui registros de feminicídio de 2024–2025 do RASEAM 2026, separados desta medida de prevalência.' : 'Não há série estadual de violência de gênero integrada.'} Ausência de dado não é ausência do problema.</p>
    </details>
  </section>
}
