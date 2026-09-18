export function EducationWorkPanel({ themeId }: { themeId: string }) {
  if (themeId === 'illiteracy') return <section className="panel">
    <div className="panel__header"><div><h3>Analfabetismo no mundo</h3><p>Ler e escrever com compreensão uma frase simples sobre a vida cotidiana.</p></div></div>
    <p>O mapa permite alternar entre pessoas de 15 anos ou mais e jovens de 15 a 24 anos. As taxas são calculadas como 100 menos a alfabetização publicada pela UNESCO/UIS e distribuída pelo Banco Mundial. Quanto maior o valor, maior a proporção não alfabetizada.</p>
    <p>Isso não mede analfabetismo funcional, qualidade da aprendizagem ou abandono escolar. Os levantamentos e anos disponíveis variam entre países; ausência de dados não significa ausência de analfabetismo.</p>
    <p>Para o Brasil, o próximo nível oferece dados anuais da PNAD Contínua por estado. As séries nacional e internacional podem diferir em referência e metodologia.</p>
    <p className="meta"><a href="https://data.worldbank.org/indicator/SE.ADT.LITR.ZS">UNESCO/UIS via Banco Mundial</a> · <a href="https://sidra.ibge.gov.br/tabela/7113">IBGE — analfabetismo por estado</a></p>
  </section>
  if (themeId !== 'decent-work') return null
  return <section className="panel">
    <div className="panel__header"><div><h3>Trabalho, proteção social e liberdade</h3><p>Três problemas diferentes, com medidas e coberturas próprias.</p></div></div>
    <div className="hunger-water-panel__grid">
      <article><h4>Falta de emprego</h4><p>Os mapas e rankings abaixo mostram desemprego total ou juvenil: pessoas que procuram trabalho e estão disponíveis, como percentual da força de trabalho. Não representam todas as pessoas sem ocupação, incluindo quem deixou de procurar.</p></article>
      <article><h4>Trabalho sem contribuição</h4><p>No Brasil, há uma série por estado de ocupados que não contribuem para instituto de previdência em nenhum trabalho, com o 4º trimestre de cada ano. Informalidade é um conceito diferente; não será usada como substituto automático.</p><p className="meta">Cobertura mundial de não contribuição ainda não integrada. <a href="https://sidra.ibge.gov.br/tabela/5947">Fonte estadual: IBGE, tabela 5947</a>.</p></article>
      <article><h4>Trabalho escravo ou forçado</h4><strong>27,6 milhões</strong><p>Estimativa mundial de pessoas em trabalho forçado em um dia qualquer de 2021, publicada em 2022 por OIT, Walk Free e OIM. É uma referência de 2021, não uma contagem atual em tempo real.</p><p>Não há uma série de prevalência por país integrada neste painel. Os mapas de desemprego abaixo não medem trabalho escravo ou forçado. Registros de resgate e fiscalização também não estimam o total de vítimas.</p><p className="meta"><a href="https://www.ilo.org/topics/forced-labour-modern-slavery-and-trafficking-persons/what-forced-labour">Definição OIT</a> · <a href="https://www.ilo.org/topics/forced-labour-modern-slavery-and-trafficking-persons/data-and-research-forced-labour">Estimativa e pesquisa OIT</a> · <a href="https://webapps.ilo.org/flodashboard/">Observatório OIT</a> · <a href="https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/areas-de-atuacao/combate-ao-trabalho-escravo-e-analogo-ao-de-escravo">Trabalho análogo à escravidão — MTE/Brasil</a></p></article>
    </div>
    <p>Trabalho e migração permanecem como temas distintos. Uma futura comparação deverá alinhar população, período e território; estes dados não demonstram que a migração cause desemprego ou exploração.</p>
  </section>
}
