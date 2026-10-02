import { useEffect, useState } from 'react'
import { surveyAuditLabels, type PipSurveyAudit } from '../lib/pipSurveyAudit'

export function IncomeSurveyEvidence({ countryCode, year, wdiFetchedAt }: { countryCode: string; year: number; wdiFetchedAt: string }) {
  const [audit, setAudit] = useState<PipSurveyAudit | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    fetch(`${import.meta.env.BASE_URL}data/pip-survey-audit.json`, { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error('PIP indisponível')
      return response.json() as Promise<PipSurveyAudit>
    }).then(result => {
      if (!Array.isArray(result.entries)) throw new Error('Auditoria inválida')
      if (!controller.signal.aborted) { setAudit(result); setFailed(false) }
    }).catch(() => { if (!controller.signal.aborted) setFailed(true) })
    return () => controller.abort()
  }, [attempt])
  const entry = audit?.wdiFetchedAt === wdiFetchedAt ? audit.entries.find(e => e.countryCode === countryCode && e.year === year) : undefined
  return <section aria-label="Pesquisa e conceito na PIP">
    <h4>Pesquisa e conceito na PIP</h4>
    {!audit ? <p>{failed ? <>Não foi possível carregar a conferência das pesquisas. <button onClick={() => { setFailed(false); setAttempt(a => a + 1) }}>Repetir conferência PIP</button></> : 'Carregando conferência das pesquisas…'}</p>
      : audit.wdiFetchedAt !== wdiFetchedAt ? <p role="status">A conferência PIP se refere a outra coleta WDI. Nenhuma pesquisa é atribuída a estes valores.</p>
        : !entry ? <p role="status">Sem conferência PIP para este país e ano.</p>
          : <><p><strong>{surveyAuditLabels[entry.status]}.</strong></p>
            {entry.candidates.map((s, i) => <article key={`${s.acronym}-${s.welfareType}-${i}`}>
              <p>Pesquisa candidata: <strong>{s.acronym}</strong>. Conceito na PIP: <strong>{s.welfareType === 'income' ? 'renda' : 'consumo'}</strong>. Ano da pesquisa: {s.surveyYear}. Cobertura: nacional.</p>
              <p>Parcelas na PIP: 10% superiores, {s.top10.toLocaleString('pt-BR', { maximumFractionDigits: 3 })}%; 20% inferiores, {s.bottom20.toLocaleString('pt-BR', { maximumFractionDigits: 3 })}%.</p>
              {s.comparableSpell && <p>Período comparável informado pela PIP dentro deste país: {s.comparableSpell}. Não certifica comparabilidade internacional.</p>}
            </article>)}
            <p>A conferência exige pesquisa nacional, sem interpolação, ano de pesquisa compatível e coincidência das duas parcelas, considerando o arredondamento das duas bases. Casos no limite de precisão permanecem inconclusivos. Coincidência numérica não prova que a WDI usou essa pesquisa. As edições podem divergir; os valores WDI permanecem os exibidos acima.</p>
          </>}
    {audit && <p className="meta">Edição PIP: {audit.version}. Coleta PIP: {audit.fetchedAt.slice(0, 10)}. Última tentativa: {audit.lastAttemptAt.slice(0, 10)}. Base WDI: {audit.wdiSourceUpdatedAt}. {audit.cached && 'A coleta PIP falhou; a conferência usa as pesquisas da coleta anterior.'} <a href={audit.requestUrl}>Consulta PIP com edição fixada</a>.</p>}
    <p><a href={`${import.meta.env.BASE_URL}data/pip-survey-audit.csv`} download>Baixar conferência e pesquisas candidatas (CSV)</a> · <a href={`${import.meta.env.BASE_URL}data/pip-survey-audit.json`} download>JSON da conferência</a> · <a href="https://worldbank.github.io/pipr/reference/get_stats.html">Documentação PIP</a></p>
  </section>
}
