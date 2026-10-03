import type { DashboardData } from '../types'

export function LabourObservationStatus({ data, year, countryCodes }: { data: DashboardData; year?: number; countryCodes: string[] }) {
  const ids = [['ilo-unemployment', 'Desemprego'], ['ilo-vulnerable-employment', 'Emprego vulnerável']]
  const summaries = ids.map(([id, name]) => {
    const series = data.series.filter(s => s.indicatorId === id && s.geographyType === 'country' && countryCodes.includes(s.geographyCode))
    const valid = (p: { value: number }) => Number.isFinite(p.value) && p.value >= 0 && p.value <= 100
    const points = series.flatMap(s => s.points.filter(p => p.year === year && valid(p)))
    return { id, name, reported: points.filter(p => p.observationType === 'reported').length,
      imputed: points.filter(p => p.observationType === 'imputed').length,
      unknown: points.filter(p => !p.observationType || p.observationType === 'unknown').length,
      absent: countryCodes.length - points.length,
      historicalReported: series.flatMap(s => s.points).filter(p => valid(p) && p.observationType === 'reported').length }
  })
  return <details className="national-data" aria-label="Diagnóstico da classificação das observações de trabalho">
    <summary>Classificação das observações de trabalho{year !== undefined ? ` em ${year}` : ''}</summary>
    <p>Estas duas séries usam a API direta OIT/ILOSTAT. A classificação é específica aos valores e à edição consultados.</p>
    <div className="national-data__table"><table><caption>Classificação no ano e recorte selecionados</caption><thead><tr><th scope="col">Medida</th><th scope="col">Reportadas</th><th scope="col">Imputadas</th><th scope="col">Sem comprovação</th><th scope="col">Sem valor válido</th></tr></thead><tbody>{summaries.map(s => <tr key={s.id}><th scope="row">{s.name}</th><td>{s.reported}</td><td>{s.imputed}</td><td>{s.unknown}</td><td>{s.absent}</td></tr>)}</tbody></table></div>
    <p>No histórico inteiro deste recorte: {summaries.map(s => `${s.name}: ${s.historicalReported} observações reportadas`).join('; ')}. Essas contagens incluem vários anos do mesmo país e não são uma amostra alinhada.</p>
    <p>A OIT define R como “Real value” e I como “Imputation”. Apenas R entra como reportada neste controle. Status vazio, ajuste (A), estimativa ou previsão permanecem sem comprovação de observação reportada. Emprego vulnerável exige R nos três componentes: emprego total, conta própria e trabalho familiar auxiliar.</p>
    {summaries[1].historicalReported === 0 && <p className="comparison-warning">O emprego vulnerável ainda não tem observações com os três componentes comprovados como reportados. Por isso o cruzamento conjunto com migração permanece sem amostra elegível, mesmo quando há desemprego reportado.</p>}
    <p><a href={`${import.meta.env.BASE_URL}data/ilo-observation-audit.json`} download>Baixar diagnóstico, edição e códigos OIT (JSON)</a> · <a href={`${import.meta.env.BASE_URL}data/ilo-unemployment-observations.csv`} download>Desemprego direto (CSV)</a> · <a href={`${import.meta.env.BASE_URL}data/ilo-employment-observations.csv`} download>Componentes do emprego vulnerável (CSV)</a> · <a href="https://sdmx.ilo.org/rest/codelist/ILO/CL_OBS_STATUS/1.0">Dicionário oficial dos status</a></p>
  </details>
}
