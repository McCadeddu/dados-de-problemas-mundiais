# Revisão de fontes e comparabilidade — 30/09/2026

Esta etapa verifica referências para as sete problemáticas e melhora o controle
das comparações existentes. Não constitui auditoria de todos os institutos
nacionais, nem integração automática das fontes recém-localizadas. O cadastro
revisado, com links, evidência e situação de integração por fonte, está em
[`src/lib/sourceReview.ts`](../src/lib/sourceReview.ts) e aparece em cada página temática.

## Escopo e achados

| Problemática | Nacional | Regional/continental | Mundial | Condição de comparação |
| --- | --- | --- | --- | --- |
| Fome e água | IBGE/EBIA; relatório SINISA | CEPALSTAT; regiões FAO/JMP via WDI já integradas | FAO; OMS/UNICEF JMP | Separar domicílios de pessoas; rede de água de serviço seguro; preservar janelas FAO |
| Gênero | Estatísticas de Gênero/IBGE | Observatório de Igualdade de Gênero/CEPAL | IPU via WDI; séries internacionais já existentes | Mesmos denominadores, idade, sexo, tipo de violência e período |
| Pobreza | Síntese de Indicadores Sociais/IBGE | CEPALSTAT; complemento Eurostat já existente | Banco Mundial/PIP | Mesma linha e PPC; pobreza relativa e multidimensional em séries distintas |
| Clima | AdaptaBrasil/MCTI | WMO, América Latina e Caribe | ND-GAIN | País, município, cenário futuro e evento observado não formam um índice único |
| Migração | Refúgio em Números/MJSP/OBMigra | R4V: 17 países da resposta regional | UNHCR | Separar estoque/fluxo, origem/acolhimento, refugiados/migrantes |
| Analfabetismo | IBGE/SIS; PNAD/SIDRA já integrado | CEPALSTAT, indicador 4243 | UNESCO/UIS | Mesma faixa etária e método de aferição; não confundir alfabetização básica e funcional |
| Trabalho | IBGE; seis complementos nacionais já integrados | Regiões OIT, trabalho forçado 2021 já integrado | OIT/ILOSTAT via WDI | Força de trabalho e ocupados não são o mesmo denominador; identificar imputações |

O Brasil é a referência nacional desta revisão. América Latina e Caribe é um
recorte regional, não o continente americano inteiro. Regiões do Banco Mundial,
da OIT e os continentes do mapa não têm necessariamente a mesma composição.
Catálogos CEPALSTAT localizados ainda exigem extração e verificação das dimensões.
O relatório WMO 2024 foi consultado para o escopo; o portal indica edição 2025.
IBGE/SIS retornou 403 no acesso direto, mas sua descrição oficial foi localizada
na busca; o endpoint de totais R4V também retornou 403. Essas limitações estão no
cadastro, sem declarar que os respectivos conjuntos foram integralmente auditados.

## Correções entregues

- Fome e água: na análise nacional, o país selecionado aparece junto dos agregados oficiais
  regionais e mundiais, com mesmo indicador/ano e ausência preservada. Datas das
  coletas ficam explícitas; edições distintas podem conter revisões. A linha
  nacional harmonizada FAO/JMP não é substituída por EBIA/SINISA.

- Mapa, panorama, ranking e cartões de comparação entre países usam o mesmo ano
  selecionado. Séries históricas preservam todos os seus anos; complementos
  oficiais têm seletores próprios. A lista de exclusões mostra territórios sem
  observação única e finita. Zero continua sendo dado válido.
- Trocar para um indicador sem o ano solicitado seleciona o ano disponível mais
  recente e o mostra no controle. O ano solicitado é preservado no link (`ano`).
- Ranking ordena os países do recorte e ano, sem reaproveitar o ranking de últimos
  valores. CSV inclui ano, código territorial e identificador do indicador.
- Rankings das séries modeladas OIT são suspensos enquanto não houver sinalização
  de imputação por observação. A [metodologia WDI/OIT](https://databank.worldbank.org/metadataglossary/world-development-indicators/series/SL.UEM.TOTL.ZS)
  desaconselha comparar ou ranquear observações imputadas. Mapas e históricos são
  contexto, sem inferência de desempenho. O cruzamento trabalho–migração também exclui observações imputadas ou sem
  classificação comprovada. Falta obter a classificação por observação da fonte;
  campos ausentes não são tratados como reportados. Ver `trabalho-classificacao.md`.
- A API confirmou que `SI.POV.UMIC` corresponde a **US$ 8,30/dia em PPC de 2021**.
  Todas as 2.430 observações salvas foram conferidas contra a edição atual antes
  da correção do nome e descrição. Valores e data de processamento geral foram
  preservados. O identificador legado `wb-poverty-685` permanece para não quebrar
  links; ele não define a linha monetária. Veja a
  [evidência legível por máquina](../public/data/poverty-definition-review.json).
- A coleta principal valida a definição de pobreza e falha se a linha/PPC mudar,
  evitando republicar números com um rótulo antigo.

## Operação e próximas integrações

`npx tsx scripts/data/verify-poverty.ts` repete a conferência de cada observação
salva, registra a evidência e só corrige o rótulo quando há correspondência exata.
Se a API revisar valores, o comando para sem reclassificar silenciosamente a base.
Ele não substitui a coleta completa.

As próximas integrações devem fornecer, por observação: conceito, universo,
denominador, unidade, ano/janela, geografia, origem, versão, sinalizações e licença.
Só então incluir agregado regional ou mundial, com cobertura e regra próprias.
As prioridades específicas aparecem em cada tema. Localizar uma publicação não
autoriza interpolar ausências ou obter totais mundiais pela média dos países.

Uma fonte nacional pode alimentar a publicação regional e a mundial. Concordância
entre as três não é confirmação independente; registre a cadeia de proveniência.
