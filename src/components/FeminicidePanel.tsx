import { FEMINICIDE_COUNT_ID, RASEAM_URL } from '../lib/feminicide'

export function FeminicidePanel({ indicatorId }: { indicatorId: string }) {
  return <section className="panel" aria-label="Como ler os registros de feminicídio">
    <div className="panel__header"><h3>Feminicídio: registros e limites</h3><strong className="badge">RASEAM 2026 · 2024–2025</strong></div>
    <p>{indicatorId === FEMINICIDE_COUNT_ID
      ? 'Contagem de mulheres vítimas registradas. Estados mais populosos podem ter contagens maiores; este ranking não compara risco individual. Para considerar o tamanho da população feminina, selecione a taxa por 100 mil mulheres.'
      : 'Taxa de vítimas registradas por 100 mil mulheres residentes na UF, usando a projeção populacional do IBGE (revisão de 2024). É uma taxa bruta, sem padronização por idade. Os valores publicados têm uma casa decimal; empates podem resultar do arredondamento.'}</p>
    <p>Este recorte cobre feminicídios consumados, não toda a violência contra mulheres. Diferenças de registro, classificação e subnotificação afetam as comparações. Não compare estes registros diretamente com o percentual mundial de violência por parceiro íntimo.</p>
    <p>Dados atualizados na fonte em <strong>20/02/2026</strong>, sujeitos a revisões. Usamos uma edição conferida do relatório, com dois anos completos; não é uma consulta em tempo real ao Sinesp. Novas edições exigem revisão antes de entrar no painel.</p>
    <p className="meta"><a href={`${RASEAM_URL}#page=459`}>Consultar tabelas 5.37a–b no RASEAM</a> · <a href={`${import.meta.env.BASE_URL}data/brazil-feminicide.json`} download>Baixar valores, denominadores e proveniência (JSON)</a></p>
  </section>
}
