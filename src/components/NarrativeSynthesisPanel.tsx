type Narrative = {
  title: string
  influence: string
  consequences: string
  causes: string
  mitigation: string
  sources: Array<{ label: string; url: string }>
}

const narratives: Record<string, Narrative> = {
  'hunger-water': {
    title: 'Fome, água e saneamento',
    influence: 'Afeta a sobrevivência, a saúde e a capacidade de aprender e trabalhar; quando persiste, reduz a resiliência de comunidades inteiras e limita o desenvolvimento humano.',
    consequences: 'Aumenta doenças evitáveis, mortalidade infantil, faltas à escola, desigualdade territorial e a pressão para deslocamento em busca de segurança alimentar e serviços básicos.',
    causes: 'Conflitos, pobreza, preços e acesso desigual a alimentos, degradação ambiental, eventos climáticos extremos e infraestrutura insuficiente combinam-se de formas diferentes em cada território.',
    mitigation: 'Proteção social, sistemas alimentares resilientes, água e saneamento seguros, prevenção de conflitos e financiamento local são frentes complementares; FAO, UNICEF, OMS, Banco Mundial e governos nacionais trabalham com essa agenda.',
    sources: [{ label: 'FAO — segurança alimentar', url: 'https://www.fao.org/publications/home/fao-flagship-publications/the-state-of-food-security-and-nutrition-in-the-world/en' }, { label: 'JMP — água e saneamento', url: 'https://washdata.org/' }],
  },
  'gender-equality': {
    title: 'Desigualdade de gênero',
    influence: 'Restringe a participação de uma grande parte da população na educação, no trabalho, na política e na produção de conhecimento, reduzindo o potencial social e econômico de toda a civilização.',
    consequences: 'Produz diferenças de renda, tempo, segurança, poder de decisão e acesso a serviços; também transfere trabalho de cuidado não remunerado para grupos já vulneráveis.',
    causes: 'Normas discriminatórias, violência, divisão desigual do cuidado, barreiras legais e econômicas e sub-representação nas decisões mantêm ciclos de desigualdade.',
    mitigation: 'Leis e orçamento para igualdade, prevenção e resposta à violência, serviços de cuidado, educação e dados desagregados são necessários; ONU Mulheres, OIT, OMS e organizações nacionais atuam em conjunto.',
    sources: [{ label: 'ONU Mulheres — dados', url: 'https://data.unwomen.org/' }, { label: 'OIT — gênero e trabalho', url: 'https://www.ilo.org/topics/gender-equality' }],
  },
  'poverty-inequality': {
    title: 'Pobreza e desigualdade',
    influence: 'Define quem consegue converter crescimento econômico em saúde, educação, segurança e autonomia; desigualdade persistente enfraquece a coesão social e a confiança nas instituições.',
    consequences: 'Está associada a privação material, pior saúde, menor escolarização, insegurança e exclusão política. As consequências se acumulam entre gerações e variam por território, idade, gênero e grupo social.',
    causes: 'Mercados de trabalho segmentados, discriminação, heranças patrimoniais, crises, tributação regressiva e acesso desigual a serviços e oportunidades estão entre os fatores estruturais.',
    mitigation: 'Proteção social, serviços públicos universais, trabalho decente, tributação progressiva e políticas baseadas em evidências podem reduzir a privação; governos, Banco Mundial, PNUD e sociedade civil atuam em escalas diferentes.',
    sources: [{ label: 'Banco Mundial — pobreza', url: 'https://www.worldbank.org/en/topic/poverty' }, { label: 'PNUD — pobreza multidimensional', url: 'https://hdr.undp.org/' }],
  },
  'climate-vulnerability': {
    title: 'Vulnerabilidade climática',
    influence: 'Muda as condições físicas para viver, produzir e circular. O risco resulta da combinação entre ameaça climática, exposição e capacidade de adaptação, e não apenas da temperatura média.',
    consequences: 'Ondas de calor, secas, inundações e perdas de ecossistemas atingem saúde, moradia, alimentos, infraestrutura e renda; os impactos recaem de modo desigual sobre pessoas e territórios.',
    causes: 'Emissões de gases de efeito estufa, ocupação de áreas de risco, degradação ambiental, pobreza e infraestrutura pouco resiliente ampliam a exposição e reduzem a capacidade de resposta.',
    mitigation: 'Redução de emissões, adaptação planejada, alerta precoce, financiamento climático e transição justa precisam caminhar juntos; UNFCCC, IPCC, governos locais e comunidades implementam essas respostas.',
    sources: [{ label: 'UNFCCC — adaptação e resiliência', url: 'https://www.unfccc.int/topics/adaptation-and-resilience/the-big-picture/introduction' }, { label: 'IPCC', url: 'https://www.ipcc.ch/' }],
  },
  'forced-migration': {
    title: 'Migração forçada',
    influence: 'É uma resposta humana a conflitos, perseguições, desastres e colapsos de segurança. Reorganiza populações, cidades e relações entre países, com efeitos duradouros sobre direitos e desenvolvimento.',
    consequences: 'Envolve perda de moradia e renda, separação familiar, riscos à saúde e à proteção, pressão sobre serviços de acolhida e desafios de integração, retorno ou reassentamento.',
    causes: 'Conflitos, perseguição, violência, violações de direitos, desastres e deterioração das condições de vida podem expulsar pessoas; os motivos frequentemente se sobrepõem.',
    mitigation: 'Prevenir conflitos, proteger direitos, ampliar vias regulares, financiar acolhida e integração e garantir soluções duradouras são frentes centrais; ACNUR, OIM, Estados e organizações locais trabalham nelas.',
    sources: [{ label: 'ACNUR — estatísticas', url: 'https://www.unhcr.org/refugee-statistics/' }, { label: 'OIM — dados de migração', url: 'https://www.iom.int/migration-data' }],
  },
  illiteracy: {
    title: 'Analfabetismo',
    influence: 'Limita o acesso a informação, direitos, saúde, trabalho e participação pública. Em escala civilizacional, reduz a transmissão de conhecimento e a capacidade de instituições e pessoas tomarem decisões autônomas.',
    consequences: 'Aumenta a dependência de terceiros, restringe oportunidades de renda, dificulta o uso de serviços e pode reproduzir pobreza, exclusão digital e desigualdade entre gerações.',
    causes: 'Pobreza, discriminação, conflitos, distância da escola, barreiras linguísticas, deficiência, trabalho infantil e baixa qualidade ou interrupção da educação podem se combinar.',
    mitigation: 'Educação pública inclusiva, alfabetização de jovens e adultos, permanência escolar, formação docente e materiais acessíveis são respostas comprovadas; governos, UNESCO, UNICEF e comunidades educacionais atuam nelas.',
    sources: [{ label: 'Instituto de Estatística da UNESCO', url: 'https://databrowser.uis.unesco.org/' }, { label: 'Banco Mundial — alfabetização', url: 'https://data.worldbank.org/indicator/SE.ADT.LITR.ZS' }],
  },
  'decent-work': {
    title: 'Trabalho, proteção e contribuição',
    influence: 'O trabalho organiza renda, produção, proteção social e reconhecimento. Desemprego, informalidade e exploração reduzem a capacidade de famílias e Estados sustentarem saúde, educação e direitos.',
    consequences: 'Podem gerar pobreza, insegurança, perda de contribuições, acidentes e adoecimento, além de incentivar migração por necessidade. Trabalho forçado acrescenta coerção e violação direta de direitos.',
    causes: 'Ciclos econômicos, baixa criação de empregos, discriminação, informalidade, falhas de fiscalização e ausência de proteção social interagem com conflitos, crises e mudanças tecnológicas.',
    mitigation: 'Políticas de emprego, direitos trabalhistas, transição da economia informal para a formal, inspeção, proteção social e combate ao trabalho forçado são complementares; OIT, governos, sindicatos, empregadores e sociedade civil atuam em conjunto.',
    sources: [{ label: 'ILOSTAT — dados de trabalho', url: 'https://ilostat.ilo.org/data/' }, { label: 'OIT — Recomendação 204', url: 'https://wwwex.ilo.org/dyn/f?p=1000:12100::::P12100_INSTRUMENT_ID:3243110' }],
  },
}

export function NarrativeSynthesisPanel({ themeId }: { themeId: string }) {
  const narrative = narratives[themeId]
  if (!narrative) return null
  const items = [
    ['Quanto influencia a civilização humana?', narrative.influence],
    ['Quais consequências sociais envolve?', narrative.consequences],
    ['Quais são as causas?', narrative.causes],
    ['Como mitigar e quem trabalha para resolver?', narrative.mitigation],
  ]
  return <section className="panel narrative-synthesis" aria-label={`Síntese narrativa: ${narrative.title}`}>
    <div className="panel__header"><div><span>Síntese narrativa</span><h3>{narrative.title}</h3></div><strong className="badge">4 perguntas</strong></div>
    <div className="narrative-synthesis__grid">{items.map(([label, text]) => <article key={label}><h4>{label}</h4><p>{text}</p></article>)}</div>
    <p className="meta">Leituras institucionais: {narrative.sources.map((source, index) => <span key={source.url}>{index > 0 && ' • '}<a href={source.url} target="_blank" rel="noreferrer">{source.label}</a></span>)}</p>
  </section>
}
