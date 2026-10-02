# Roadmap

## Pesquisas e conceitos PIP — 02/10/2026

- Conferência nacional por país/ano integrada, com edição PIP fixada e sem
  interpolação: 1.137 pares com uma candidata coincidente, 689 inconclusivos
  por precisão, 5 divergentes e 31 sem pesquisa elegível. CSV/JSON e atualização
  diária incluídos.
- Brasil/2024: candidata PNADC-E1, conceito renda. Coincidência numérica não
  comprova vínculo com a pesquisa WDI; edições das bases são diferentes.
- Pendente: comprovar vínculos WDI–pesquisa antes de automatizar filtros de
  conceito para comparações internacionais. Riqueza patrimonial permanece
  uma lacuna distinta. Detalhes em [distribuicao-renda.md](distribuicao-renda.md).

## Distribuição de renda — 02/10/2026

- Etapa de consolidação de 30/09 publicada; CI e deploy confirmados em 02/10.
- Parcelas nacionais dos 10% superiores e 20% inferiores integradas via WDI/PIP:
  168 países com observações por série, desde 2000, conforme disponibilidade.
  Mapas e históricos; complemento nacional em ano comum; CSV/JSON, metadados e
  atualização diária. Não há média continental/mundial dessas parcelas.
- Conceito e pesquisa têm agora conferência separada na PIP; a identificação
  definitiva da pesquisa WDI permanece pendente. Ver
  [distribuicao-renda.md](distribuicao-renda.md).

## Consolidação — 30/09/2026

Estado: alterações de 30/09 publicadas (180 testes, TypeScript, lint e
build, inclusive base GitHub Pages). CI e deploy remotos concluídos. Registro em
[verificacao-2026-09-30.md](verificacao-2026-09-30.md).
A cópia ativa é `C:/projetos/Mundialidade`; a pasta OneDrive é antiga.

1. Concluir validação conjunta e preparar publicação das correções locais.
2. Fechar pobreza/desigualdade: aprofundar concentração de renda e distinguir riqueza.
3. Trabalho: obter classificação OIT por observação e agregados oficiais regionais/mundiais.
4. Recuperar discriminação social e integração efetiva AdaptaBrasil.
5. Ampliar educação, gênero, migração e subdivisões nacionais, uma entrega por vez.

Navegação: mundo e regiões primeiro; complemento do país somente na análise nacional.
Cada entrega deve registrar cobertura, limitações, testes e estado de publicação.
Discriminação social permanece uma lacuna do pedido original, além de gênero.
AdaptaBrasil ainda tem apenas pré-visualização de CSV; não é um conector integrado.
Status das fontes existe, mas precisa consolidar falhas, cache e revisões necessárias.

## Próxima etapa

- ampliar a camada nacional de trabalho para medidas de proteção social e
  contribuição previdenciária fora do Brasil, começando por fontes que publiquem
  denominador, população e período compatíveis. Primeiro complemento entregue:
  contribuição patronal para aposentadoria na África do Sul (Stats SA, LMD 2024),
  2019–2024, total e por sexo. Portugal: subsídios de desemprego, INE 0004348,
  1990–2025, contagem anual por subsídio, sem representar pessoas únicas ou taxa
  de cobertura. Ambos com histórico e CSV; avançar para outros países e modalidades;
- trabalho forçado: complemento mundial e regional entregue em 27/09/2026,
  OIT/Walk Free/OIM, referência 2021, modalidades, taxas por mil e CSV com
  proveniência. Avançar para registros de fiscalização em série separada,
  preservando a diferença em relação à prevalência estimada;
- aprofundar recortes estaduais ou provinciais dos seis países prioritários
  somente quando a fonte fornecer códigos, cobertura e definições estáveis;

- fome e água: complemento nacional do Brasil integrado com IBGE/SIDRA 6665
  (insegurança alimentar em domicílios, seis observações entre 2004 e 2024,
  provenientes de PNAD, POF e PNAD Contínua). Recorte estadual integrado em
  26/09/2026 pela tabela 9552: 27 UFs, 2023 e 2024, três indicadores. A rede
  de água e o saneamento brasileiros já estão integrados, mas não são medida de
  fome ou segurança alimentar;

- revisar as 38 entradas ainda pendentes no catálogo nacional e confirmar os endereços importados do diretório da ONU;
- ampliar séries oficiais de cuidado não remunerado e violência de gênero, com definições compatíveis;
- ampliar os conectores nacionais além da primeira série de pobreza relativa Eurostat, preservando a origem de cada observação;

- ampliar indicadores estaduais de clima com fontes oficiais e cobertura claramente delimitada, além dos focos ativos de fogo do INPE já incluídos;
- feminicídio estadual integrado em 27/09/2026: RASEAM 2026, 27 UFs, taxas e contagens para 2024–2025, com proveniência, reconciliação e limites explícitos;
- ampliar recortes do IBGE para regiões geográficas imediatas, sem confundir dados municipais e estaduais;
- aprofundar fluxos de migração forçada por origem, acolhimento e tipo de deslocamento.

## Produto e qualidade

- pobreza, 30/09/2026: países, sete regiões e mundo integrados via WDI/PIP,
  na mesma coleta; linha US$ 8,30/dia em PPC 2021, histórico desde 2000,
  nulos preservados, ano selecionável e CSV/JSON. Catálogo documental ampliado
  com Eurostat, ADB, Banco Africano de Desenvolvimento e Pacific Community.
  Ver `docs/pobreza-agregados.md`; conexões numéricas regionais adicionais e
  detalhamento de renda/consumo e sinalizações permanecem pendentes.

- revisão de 30/09/2026: controle documental de fontes nas sete problemáticas;
  ano comum no mapa/ranking/cartões nacionais, exclusões explícitas e ano no CSV;
  linha de pobreza corrigida após conferir 2.430 observações; rankings de séries
  OIT suspensos sem sinalizações de imputação. Detalhes e limites em
  `docs/revisao-fontes-comparabilidade.md`. Cruzamento trabalho–migração agora exclui observações imputadas ou sem
  classificação comprovada; falta obter classificação documental da OIT e
  integrar agregados oficiais por tema. Ver `docs/trabalho-classificacao.md`.

- fome e água, 27/09/2026: agregados oficiais FAO/JMP via WDI, quatro indicadores,
  mundo e sete regiões da fonte, histórico desde 2000, seleção de ano e CSV/JSON.
  Nulos e anos de referência preservados; grupos oficiais separados dos continentes.

- revisão de agregações em 27/09/2026: autorização por indicador, bloqueio de
  anos misturados e duplicidades. Médias populacionais limitadas a acesso à água,
  como estimativas dos países cobertos. Gini, ND-GAIN e contagens migratórias
  sem médias genéricas; pobreza e clima mostram cobertura e anos disponíveis.
  Próximo passo: integrar agregados oficiais com metodologia própria por fonte;

- entregue em 27/09/2026: contribuição patronal para aposentadoria na África
  do Sul, como complemento nacional de trabalho; edição revisada, histórico
  por sexo, denominador, ressalvas da pandemia, condições de uso e CSV/JSON;

- revisão de gênero em 27/09/2026: removidas médias por população total para
  medidas com denominadores incompatíveis; cartões mostram cobertura e período
  por continente. Violência agora identifica corretamente parceiros íntimos,
  janela da pesquisa e população de referência. Feminicídio estadual foi integrado
  no complemento RASEAM; outras formas de violência e dimensões de discriminação
  permanecem lacunas explícitas;

- entregue em 26/09/2026: insegurança alimentar por UF no mapa, histórico,
  ranking e comparação estadual, com três categorias, denominador domiciliar,
  ressalva amostral e preservação da última coleta válida;

- revisão de 26/09/2026: corrigida a identificação das pesquisas no histórico
  brasileiro de segurança alimentar (PNAD, POF e PNAD Contínua), com limites de
  comparação explícitos e validação de duplicidades e perda de anos na coleta;

- desemprego trimestral de Portugal diretamente do INE (0012136): 62 trimestres
  na primeira coleta, com revisão histórica e datas de atualização visíveis;

- desemprego mensal nacional da Austrália via ABS: histórico desde 2015, recorte
  e ajuste sazonal explícitos, coleta diária com preservação do histórico em caso
  de falha; complemento separado das comparações anuais internacionais;

- comparação trabalho–migração: três medidas migratórias, ano comum selecionável,
  filtro de continente, lista de exclusões e exportação da mesma amostra usada
  nas correlações; testes de cálculo, ausência de dados e exportação;

- entregue em 25/09/2026: matriz de comparabilidade trabalho–migração com
  alinhamento de país/ano, denominadores, Pearson, Spearman, ponderação
  populacional, influência por exclusão e CSV das transições;
- entregue em 25/09/2026: seis complementos nacionais prioritários de trabalho
  (México, Portugal, Itália, Austrália, África do Sul e Índia), com fontes,
  definições, histórico, cache seguro e limites de comparação;

- entregue em 18/09/2026: catálogo com 217 entradas territoriais, diagnóstico de cobertura e complemento de pobreza relativa para 30 países, com atualização diária e testes;

- páginas temáticas compartilháveis entregues para os sete temas;
- séries já carregadas sob demanda; ampliar carregamento sob demanda das visualizações;
- ampliar testes de conectores e de interface;
- modelos de issue para sugestões de fonte e qualidade já entregues; manter atualizados.

## Princípios de evolução

- fontes públicas, gratuitas e com uso verificável;
- metodologia e período visíveis no painel;
- ausência de dado nunca deve ser apresentada como zero;
- comparações devem indicar diferenças de cobertura, unidade e período.

## Tema reservado para depois

- Conflitos armados, sugeridos pelo usuário em 18/09/2026. A inclusão do tema e
  sua pesquisa de fontes ficam para uma etapa futura, após as prioridades atuais.
