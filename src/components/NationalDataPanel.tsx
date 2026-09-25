import { useEffect, useState } from 'react'
import type { DashboardData, NationalData } from '../types'
import { formatValue } from '../lib/dashboard'
import { AustraliaLaborData } from './AustraliaLaborData'
import { PortugalLaborData } from './PortugalLaborData'
import { ItalyLaborData } from './ItalyLaborData'
import { MexicoLaborData } from './MexicoLaborData'
import { SouthAfricaLaborData } from './SouthAfricaLaborData'
import { IndiaLaborData } from './IndiaLaborData'

const statusLabels = {
  'directory-listed': 'Instituição localizada no diretório da ONU',
  documented: 'Documentação consultada; integração direta pendente',
  'existing-connector': 'Conector nacional já disponível',
  pending: 'Instituição ainda em pesquisa',
}

const priorityNextSteps: Record<string, string> = {
  MEX: 'Desemprego mensal integrado diretamente do INEGI. Avaliar informalidade e recortes estaduais.',
  PRT: 'Desemprego trimestral integrado diretamente do INE; pobreza relativa via EU-SILC. Avaliar educação e proteção social.',
  ITA: 'Desemprego mensal integrado diretamente do Istat; pobreza relativa via EU-SILC. Avaliar recortes regionais e educação.',
  AUS: 'Desemprego mensal integrado pela ABS. Avaliar outras medidas de trabalho e proteção social.',
  ZAF: 'Desemprego trimestral integrado pela Stats SA. Avaliar contribuição previdenciária e recortes provinciais.',
  IND: 'Desemprego mensal integrado pelo MoSPI/eSankhyiki. Avaliar outras medidas de trabalho e recortes estaduais.',
}

export function NationalDataPanel({ countryCode, themeId, dashboard }: {
  countryCode: string; themeId: string; dashboard: DashboardData
}) {
  const [data, setData] = useState<NationalData | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    fetch(`${import.meta.env.BASE_URL}data/national-data.json`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Catálogo indisponível')
        return response.json() as Promise<NationalData>
      })
      .then((result) => { if (!controller.signal.aborted) { setData(result); setError(false) } })
      .catch(() => { if (!controller.signal.aborted) setError(true) })
    return () => controller.abort()
  }, [attempt])

  const source = data?.registry.find((entry) => entry.countryCode === countryCode)
  const series = themeId === 'poverty-inequality'
    ? data?.poverty.series.find((entry) => entry.countryCode === countryCode)
    : undefined
  const latest = series?.points.at(-1)
  const australiaLabor = countryCode === 'AUS' && themeId === 'decent-work' ? data?.australiaUnemployment : undefined
  const portugalLabor = countryCode === 'PRT' && themeId === 'decent-work' ? data?.portugalUnemployment : undefined
  const southAfricaLabor = countryCode === 'ZAF' && themeId === 'decent-work' ? data?.southAfricaUnemployment : undefined
  const mexicoLabor = countryCode === 'MEX' && themeId === 'decent-work' ? data?.mexicoUnemployment : undefined
  const italyLabor = countryCode === 'ITA' && themeId === 'decent-work' ? data?.italyUnemployment : undefined
  const indiaLabor = countryCode === 'IND' && themeId === 'decent-work' ? data?.indiaUnemployment : undefined
  const missing = dashboard.indicators.filter((indicator) => indicator.geographyType === 'country'
    && indicator.themeId === themeId
    && !dashboard.latest.some((value) => value.indicatorId === indicator.id && value.geographyCode === countryCode))

  return <section className="panel national-data" aria-label="Fontes oficiais e dados nacionais">
    <div className="panel__header"><div><h3>Fontes oficiais e dados nacionais</h3><p>Instituições do país e informações complementares à comparação mundial.</p></div></div>
    {error ? <p role="alert">Não foi possível carregar o catálogo. <button className="text-button" onClick={() => { setError(false); setAttempt((value) => value + 1) }}>Tentar novamente</button></p>
      : !data ? <p role="status">Carregando fontes nacionais...</p>
      : <>
        <div className="national-data__source">
          <strong>{source?.institution ?? 'Fonte nacional ainda não catalogada'}</strong>
          <p>{statusLabels[source?.status ?? 'pending']}</p>
          {source?.url && <a href={source.url} target="_blank" rel="noreferrer">Abrir endereço da instituição</a>}
          {source && <p className="meta"><a href={source.evidenceUrl} target="_blank" rel="noreferrer">Referência da pesquisa</a> · Consulta em {source.checkedAt.split('-').reverse().join('/')}</p>}
          {priorityNextSteps[countryCode] && <p className="national-data__next-step"><strong>Próximo passo do lote prioritário:</strong> {priorityNextSteps[countryCode]}</p>}
          <p>Uma instituição localizada não significa que todos os seus dados estejam integrados. A disponibilidade e as condições de reutilização são verificadas por conjunto.</p>
        </div>
        {latest && data && series ? <article className="national-data__indicator">
          <h4>Risco de pobreza relativa — EU-SILC</h4>
          <p className="national-data__value">{formatValue(latest.value, '%')} <small>· ano da pesquisa: {latest.year}</small></p>
          {latest.status && <p>Sinalização da fonte para o último valor: {latest.status}. Consulte a legenda na série histórica.</p>}
          <p>Pessoas em domicílios com renda disponível equivalente inferior a 60% da mediana nacional, após transferências sociais. Abrange todas as idades e ambos os sexos na população coberta pela pesquisa de domicílios privados.</p>
          <p>O limiar depende da renda de cada país. Este indicador complementa a análise nacional e não substitui a linha internacional de pobreza do mapa mundial. O ano exibido é o da pesquisa EU-SILC; a renda normalmente se refere ao ano anterior.</p>
          <details><summary>Ver série histórica e sinalizações da fonte ({series.points.length} anos)</summary>
            <div className="national-data__table"><table><caption>Risco de pobreza relativa: percentual da população</caption><thead><tr><th scope="col">Ano da pesquisa</th><th scope="col">Valor</th><th scope="col">Sinalização Eurostat</th></tr></thead><tbody>{series.points.map((point) => <tr key={point.year}><td>{point.year}</td><td>{formatValue(point.value, '%')}</td><td>{point.status || '—'}</td></tr>)}</tbody></table></div>
            <p className="meta">Códigos da fonte preservados: b = quebra de série; e = estimativa; p = provisório; u = baixa confiabilidade. Outros códigos devem ser consultados na fonte. Anos sem observação não são preenchidos com zero.</p>
          </details>
          <p className="meta">Fonte: <a href={data.poverty.sourceUrl}>Eurostat · ilc_li02</a>, a partir de estatísticas nacionais EU-SILC. <a href={data.poverty.methodologyUrl}>Metodologia e relatórios nacionais</a> · <a href={data.poverty.licenseUrl}>Condições de reutilização</a>.</p>
          <p className="meta">Atualização da fonte: {new Date(data.poverty.sourceUpdatedAt).toLocaleDateString('pt-BR')}. Coleta: {new Date(data.poverty.fetchedAt).toLocaleDateString('pt-BR')}. {data.poverty.cached && 'A última tentativa falhou; exibindo a coleta anterior.'}</p>
          <p className="meta">Seleção, tradução dos rótulos e apresentação pelo Mundialidade. O Eurostat não é responsável por estas adaptações. Valores mantidos como publicados.</p>
        </article> : indiaLabor ? <IndiaLaborData data={indiaLabor} /> : australiaLabor ? <AustraliaLaborData data={australiaLabor} /> : portugalLabor ? <PortugalLaborData data={portugalLabor} /> : southAfricaLabor ? <SouthAfricaLaborData data={southAfricaLabor} /> : mexicoLabor ? <MexicoLaborData data={mexicoLabor} /> : italyLabor ? <ItalyLaborData data={italyLabor} /> : <p>Ainda não há uma série nacional complementar integrada para este país nesta problemática. Isso não indica ausência do problema ou inexistência de dados oficiais.</p>}
      </>}
    <p className="meta">{missing.length ? `Lacunas na base mundial deste tema: ${missing.map((indicator) => indicator.name).join('; ')}.` : 'Todos os indicadores mundiais deste tema têm algum dado para este país; os períodos podem variar.'}</p>
    <p className="meta"><a href={`${import.meta.env.BASE_URL}data/country-coverage.json`} download>Baixar diagnóstico de cobertura por país (JSON)</a></p>
  </section>
}
