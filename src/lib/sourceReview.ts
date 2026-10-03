import type { ThemeId } from '../types'

export type ReviewSource = { scale: string; name: string; url: string; evidence: string; use: string }
export type ThemeReview = { themeId: ThemeId; name: string; rule: string; next: string; sources: ReviewSource[] }
export const REVIEW_DATE = '2026-09-30'
const cepal = 'https://statistics.cepal.org/portal/databank/index.html?lang=es'
const sis = 'https://www.ibge.gov.br/estatisticas/sociais/populacao/9221-sintese-de-indicadores-sociais.html'
const source = (scale: string, name: string, url: string, evidence: string, use: string): ReviewSource => ({ scale, name, url, evidence, use })
export const SOURCE_REVIEWS: ThemeReview[] = [
  {
    themeId: 'hunger-water', name: 'Fome e água',
    rule: 'EBIA domiciliar, FIES por pessoa e subalimentação não são medidas intercambiáveis. Rede de abastecimento não comprova água disponível e sem contaminação. Regiões WDI não equivalem aos continentes do mapa.',
    next: 'Alinhar país, região e mundo na mesma edição FAO/JMP; manter EBIA e serviços de abastecimento como complementos nacionais.',
    sources: [
      source('Nacional · Brasil', 'IBGE — Segurança alimentar 2024', 'https://biblioteca.ibge.gov.br/visualizacao/livros/liv102212_informativo.pdf', 'Publicação localizada; percentuais domiciliares e de moradores separados.', 'EBIA nacional e estadual já integrada; publicação usada para revisão conceitual.'),
      source('Nacional · Brasil', 'Ministério das Cidades — SINISA 2025, água', 'https://www.gov.br/cidades/pt-br/acesso-a-informacao/acoes-e-programas/saneamento/sinisa/resultados-sinisa/008_RELATORIO_SINISA_ABASTECIMENTO_AGUA_2025_defeso.pdf/view', 'Relatório oficial localizado.', 'Referência para futura integração; não substitui a série JMP.'),
      source('Regional · América Latina e Caribe', 'CEPALSTAT', cepal, 'Catálogo regional localizado; extração por indicador ainda pendente.', 'Conferência regional; não é uma segunda medição independente se reproduz FAO/JMP.'),
      source('Mundial e regiões da fonte', 'FAO — subalimentação via WDI', 'https://databank.worldbank.org/metadataglossary/world-development-indicators/series/SN.ITK.DEFC.ZS', 'Metodologia consultada, inclusive limiar de 2,5%.', 'Séries nacionais e agregados oficiais já integrados.'),
      source('Mundial e regiões da fonte', 'OMS/UNICEF — JMP', 'https://washdata.org/topics/drinking-water', 'Definições de acesso básico e gerido com segurança consultadas.', 'Agregados oficiais via WDI já integrados; não somar categorias sobrepostas.'),
    ],
  },
  {
    themeId: 'gender-equality', name: 'Gênero e discriminação',
    rule: 'Cadeiras parlamentares, participação no trabalho, cuidado e violência têm denominadores distintos. Igualar faixa etária, sexo, janela da pesquisa e tipo de violência antes de comparar.',
    next: 'Ampliar cuidado e violência com janela e população compatíveis; os indicadores atuais não cobrem todas as formas de discriminação.',
    sources: [
      source('Nacional · Brasil', 'IBGE — Estatísticas de gênero', 'https://www.ibge.gov.br/estatisticas/multidominio/genero/20163-estatisticas-de-genero-indicadores-sociais-das-mulheres-no-brasil.html?=&t=o-que-e', 'Edição 2024 e descrição do produto localizadas.', 'Referência complementar; não corresponde automaticamente às séries já integradas.'),
      source('Regional · América Latina e Caribe', 'CEPAL — Observatório de Igualdade de Gênero', 'https://oig.cepal.org/en', 'Indicadores de autonomia e representação consultados.', 'Consulta documental; conector regional pendente.'),
      source('Mundial', 'IPU via WDI — mulheres no parlamento', 'https://databank.worldbank.org/metadataglossary/world-development-indicators/series/SG.GEN.PARL.ZS', 'Metadados específicos consultados.', 'Série nacional harmonizada integrada; sem média por população total.'),
    ],
  },
  {
    themeId: 'poverty-inequality', name: 'Pobreza e desigualdade',
    rule: 'SI.POV.UMIC usa US$ 8,30/dia em PPC de 2021. Não concatenar com a antiga PPC de 2017. Pobreza relativa Eurostat e pobreza multidimensional POF permanecem separadas; média de Ginis não é Gini mundial.',
    next: 'Agregados, parcelas, notas WDI, filtros de conceito, controle das mudanças no histórico e conferência PIP integrados. Detalhar conceitos e desenhos das pesquisas declaradas; riqueza patrimonial continua pendente. Validar conectores regionais adicionais sem converter linhas nacionais por câmbio corrente.',
    sources: [
      source('Nacional · Brasil', 'IBGE — Síntese de Indicadores Sociais', sis, 'Descrição da edição 2025 localizada; acesso direto retornou 403 nesta consulta.', 'Complemento documental; conferir linha e PPC da edição antes de cruzar os números.'),
      source('Regional · América Latina e Caribe', 'CEPALSTAT — pobreza e distribuição de renda', cepal, 'Catálogo localizado; equivalência entre linhas não validada.', 'Consulta documental; não integrar taxas de linhas diferentes em uma mesma série.'),
      source('Regional · Europa / União Europeia', 'Eurostat — pobreza e exclusão social', 'https://ec.europa.eu/eurostat/cache/metadata/EN/tipspo_esms.htm', 'Metadados consultados: risco de pobreza usa 60% da mediana nacional da renda disponível equivalente após transferências.', 'Complemento nacional Eurostat já integrado; medida relativa separada da linha internacional PPC.'),
      source('Regional · Ásia e Pacífico', 'Asian Development Bank — Key Indicators Database', 'https://kidb.adb.org/', 'Portal consultado e catálogo de indicadores localizado.', 'Referência documental; série e linha de pobreza ainda precisam ser selecionadas e validadas para integração.'),
      source('Regional · África', 'Banco Africano de Desenvolvimento — indicadores sociais', 'https://www.afdb.org/en/knowledge/publications/gender-poverty-and-environmental-indicators-on-african-countries', 'Catálogo de publicações de gênero, pobreza e ambiente localizado.', 'Referência documental; ainda não é um conector nem validação dos valores de cada tabela.'),
      source('Regional · Ilhas do Pacífico', 'Pacific Community — guia HIES', 'https://www.spc.int/DigitalLibrary/Doc/SDD/Capacity_Development__Guidance_notes/GN_Pacific_HIES_Toolkit_Data_Applications_and_Analysis.pdf?attachment=true', 'Guia localizado: pesquisas de renda/despesa e linhas de necessidades básicas.', 'Referência metodológica; linhas locais e agregados de consumo não equivalem automaticamente a US$ 8,30 em PPC de 2021.'),
      source('Mundial', 'Banco Mundial — SI.POV.UMIC / PIP', 'https://data.worldbank.org/indicator/SI.POV.UMIC', 'Página e API confirmaram US$ 8,30 e PPC de 2021.', 'Países, sete regiões e mundo integrados em uma única coleta; ano selecionável, histórico e exportação com proveniência.'),
      source('Mundial · séries nacionais', 'Banco Mundial/PIP — distribuição da renda ou consumo', 'https://databank.worldbank.org/metadataglossary/world-development-indicators/series/SI.DST.10TH.10', 'Metadados e API consultados em 02/10/2026: parcelas dos 10% superiores e 20% inferiores; agregação NA.', '168 países com observações em cada série desde 2000. Mesmo ano não comprova pesquisa ou conceito equivalentes; sem média continental/mundial.'),
    ],
  },
  {
    themeId: 'climate-vulnerability', name: 'Vulnerabilidade climática',
    rule: 'ND-GAIN mede vulnerabilidade e prontidão nacionais. Risco municipal AdaptaBrasil, focos de fogo e anomalias climáticas WMO não usam a mesma escala e não devem formar um ranking conjunto.',
    next: 'Integrar AdaptaBrasil por ameaça, cenário e horizonte temporal; manter o diagnóstico regional WMO como contexto.',
    sources: [
      source('Nacional · Brasil', 'MCTI — AdaptaBrasil', 'https://adaptabrasil.mcti.gov.br/sobre/lista-de-indicadores', 'Lista de índices e indicadores consultada.', 'Fonte para ampliação municipal; não integrada nesta revisão.'),
      source('Regional · América Latina e Caribe', 'WMO — Estado do clima 2024', 'https://wmo.int/resources/publication-series/state-of-climate-latin-america-and-caribbean/state-of-climate-latin-america-and-caribbean-2024', 'Relatório e escopo consultados; há edição 2025 indicada no portal.', 'Contexto de eventos e impactos; não é agregado ND-GAIN nem seleção da edição mais recente.'),
      source('Mundial · cobertura por país', 'Notre Dame — ND-GAIN', 'https://gain.nd.edu/our-work/country-index/methodology/', 'Componentes vulnerabilidade e prontidão consultados.', 'Séries nacionais integradas; sem índice continental ou mundial calculado.'),
    ],
  },
  {
    themeId: 'forced-migration', name: 'Migração e refúgio',
    rule: 'Separar estoques no fim do ano, solicitações no período, acolhimento, origem e deslocamento interno. Migrantes não são todos refugiados; fluxos não podem ser somados a estoques.',
    next: 'Validar totais regionais por população de proteção e evitar dupla contagem entre origem e acolhimento.',
    sources: [
      source('Nacional · Brasil', 'MJSP/OBMigra — Refúgio em Números, 10ª edição', 'https://www.gov.br/mj/pt-br/assuntos/seus-direitos/refugio/refugio-em-numeros-e-publicacoes/anexos/refugio_em_numeros-10e-re1', 'Publicação de 2025 localizada, com solicitações de 2015 a 2024.', 'Referência nacional; solicitações não substituem estoque de refugiados.'),
      source('Regional · 17 países da resposta R4V', 'R4V — Análise de necessidades 2024', 'https://rmrp.r4v.info/rmna2024/', 'Escopo regional consultado; endpoint de totais R4V retornou 403.', 'Contexto humanitário; não representa toda a migração do continente.'),
      source('Mundial', 'UNHCR — conteúdo e estrutura dos dados', 'https://popstats.unhcr.org/refugee-statistics/methodology/data-content/', 'Documentação de estoques, fluxos e categorias consultada.', 'Séries nacionais UNHCR integradas; agregados regionais ainda pendentes.'),
    ],
  },
  {
    themeId: 'illiteracy', name: 'Analfabetismo',
    rule: 'Separar 15 anos ou mais de 15–24 anos. Alfabetização básica não mede alfabetização funcional. O complemento 100 menos alfabetização só vale para a mesma população e ano.',
    next: 'Conferir método de aferição e integrar agregados oficiais UIS; não ponderar taxas adultas pela população de todas as idades.',
    sources: [
      source('Nacional · Brasil', 'IBGE — Síntese de Indicadores Sociais, educação', sis, 'Escopo educacional da edição 2025 localizado; acesso direto retornou 403.', 'Referência documental; série estadual PNAD/SIDRA já integrada separadamente.'),
      source('Regional · América Latina e Caribe', 'CEPALSTAT — analfabetismo', 'https://statistics.cepal.org/portal/cepalstat/dashboard.html?indicator_id=4243&lang=es', 'Indicador por sexo, idade e área localizado.', 'Conector pendente; conferir dimensões antes de comparar.'),
      source('Mundial', 'UNESCO/UIS — glossário de alfabetização', 'https://databrowser.uis.unesco.org/resources/glossary?search=literacy', 'Definições de adultos e jovens consultadas.', 'Séries nacionais via WDI integradas; complemento de alfabetização preserva faixa etária.'),
    ],
  },
  {
    themeId: 'decent-work', name: 'Trabalho e proteção social',
    rule: 'Desemprego usa força de trabalho; emprego vulnerável usa ocupados. Séries mensais, trimestrais e anuais não são intercambiáveis. Estimativas imputadas da OIT não sustentam rankings nacionais.',
    next: 'Preservar sinalizações de imputação e ampliar contribuição previdenciária com denominador compatível; fiscalização de trabalho forçado não mede prevalência.',
    sources: [
      source('Nacional · Brasil', 'IBGE — Síntese de Indicadores Sociais, trabalho', sis, 'Escopo de trabalho e rendimentos localizado; acesso direto retornou 403.', 'Complemento documental às séries PNAD e aos seis conectores nacionais já disponíveis.'),
      source('Regional e mundial · regiões OIT', 'OIT/Walk Free/OIM — estimativas de trabalho forçado', 'https://www.ilo.org/topics/forced-labour-modern-slavery-and-trafficking-persons/data-and-research-forced-labour', 'Publicação e referência 2021 localizadas.', 'Complemento regional e mundial de 2021 já integrado; não é uma série anual.'),
      source('Mundial', 'OIT via WDI — desemprego modelado', 'https://databank.worldbank.org/metadataglossary/world-development-indicators/series/SL.UEM.TOTL.ZS', 'Metadados consultados; restrição explícita para comparações de observações imputadas.', 'Série integrada para contexto; ranking suspenso enquanto a imputação não estiver identificada por observação.'),
    ],
  },
]
