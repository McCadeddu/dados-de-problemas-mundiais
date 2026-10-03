export function ComparisonCoverage({ count, total, year, loading }: { count: number; total: number; year: number | undefined; loading: boolean }) {
  if (loading) return <p role="status">Carregando a cobertura do recorte selecionado…</p>
  if (!total) return <p role="status">Não há países ou territórios cadastrados neste recorte.</p>
  return <div className="comparison-coverage" aria-label="Cobertura no ano da comparação">
    <p><strong>{count} de {total}</strong> países e territórios com observação válida em {year ?? 'ano indisponível'}.</p>
    <progress value={count} max={total} aria-label="Países e territórios com observação válida" />
    {count === 0 && <p role="status">Nenhum dado disponível neste ano e filtro. Escolha outro ano ou revise o filtro de conceito, quando disponível. Ausência de dado não significa valor zero.</p>}
    <p>{total - count} sem observação válida neste recorte. Valores de outros anos não preenchem ausências. Mesmo ano não garante equivalência entre conceitos e pesquisas.</p>
  </div>
}
