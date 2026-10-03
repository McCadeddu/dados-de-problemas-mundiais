# Retomada do Mundialidade — 03/10/2026

## Escopo da revisão

Histórico disponível das seis conversas vinculadas ao projeto, incluindo as
páginas antigas de cada conversa, confrontado com código, dados, documentação
e estado da publicação. A conversa inicial relacionada no ChatGPT também foi
consultada. Nenhuma mensagem foi enviada às outras conversas.

| Conversa | Contribuição ao projeto |
| --- | --- |
| Planejar app de dados globais | Objetivo original: fome/água, discriminação, pobreza/riqueza, clima, migração e Brasil |
| Criar MVP de indicadores globais | Implementação, publicação, hierarquia territorial, fontes, estabilidade e experiência |
| Revisar programa e atualizar | Educação/trabalho, explicações, narrativas, fontes nacionais e comparações |
| Retomar e avançar a conversa | Insegurança alimentar e feminicídio por UF, proteção social, agregações oficiais |
| Comparar fontes em cada problemática | Comparabilidade, pobreza/distribuição, pesquisas, nova navegação territorial |
| Preparar homilia e PPT | Uso dos dados em formação e apresentação; arquivos entregues |
| Criar programa de dados globais | Conversa inicial relacionada no ChatGPT; propostas de fontes e arquitetura |

Propostas dos assistentes não são tratadas como requisitos automaticamente
aprovados. Pedidos posteriores do usuário prevalecem sobre sugestões antigas.
Conflitos armados continuam reservados para depois, conforme pedido explícito.

## Estado observado

- Cópia ativa de desenvolvimento: `C:/projetos/Mundialidade`.
- O projeto cadastrado no app e os diretórios das conversas ainda apontam para
  a pasta OneDrive. Sua base principal foi gerada em 04/09/2026 e tem nove
  indicadores; a base ativa foi gerada em 02/10/2026 e tem 56 indicadores no
  catálogo principal. Complementos possuem seus próprios arquivos e datas.
- Sete problemáticas, 217 países/territórios cadastrados e 19 fontes no catálogo
  principal. Cadastro territorial não significa cobertura integral dos dados.
- Catálogo nacional: 217 entradas, das quais 38 pendentes, 171 listadas em
  diretório, sete com conector existente e uma documentada. Instituição listada
  não equivale a endereço auditado ou série nacional integrada.
- Navegação publicada: Problemáticas → Mundo → Continentes → Estados (países).
  UFs e regiões IBGE permanecem dentro da análise do Brasil.
- CI e publicação do commit `4f6ce62` concluídos com sucesso em 03/10/2026.
  Esta revisão não repetiu a suíte de testes: consultou a validação da entrega
  anterior e executou verificações específicas dos dados.

## Entregas que não devem ser refeitas

| Área | Já entregue | Falta ampliar ou concluir |
| --- | --- | --- |
| Fome e água | Quatro indicadores internacionais; agregados oficiais de mundo/regiões; EBIA nacional; insegurança alimentar nas 27 UFs; rede de água e saneamento regional | Conectores adicionais e conferência da edição; preservar domicílios/pessoas e definições de serviço |
| Gênero | Participação, representação, cuidado e violência; feminicídio nas 27 UFs | Discriminação social além de gênero; violência/cuidado e medidas internacionais com conceitos compatíveis |
| Pobreza/desigualdade | Linha internacional corrigida; agregados oficiais; Gini; parcelas dos 10% superiores e 20% inferiores; notas WDI, filtros, conferência PIP e mudanças no histórico | Riqueza patrimonial; conceitos detalhados das pesquisas; complementos regionais e subnacionais adicionais |
| Clima | ND-GAIN e componentes nacionais; focos de fogo do INPE por UF | Conector efetivo AdaptaBrasil; risco municipal por ameaça, cenário e horizonte; impactos regionais próprios |
| Migração | Origem/acolhimento, asilo, deslocamento interno UNHCR, corredores bilaterais e SISMIGRA por UF | Deslocamento por desastres; fluxos de período; agregados e complementos nacionais/regionais sem duplicidades |
| Analfabetismo | Adultos/jovens por país, indicador por UF e definições | Agregados oficiais com denominadores etários; outras dimensões educacionais e recortes internos |
| Trabalho | Desemprego/emprego vulnerável, seis complementos nacionais, proteção social de Portugal/África do Sul e trabalho forçado mundial/regional | Classificação por observação; agregados oficiais; contribuição/proteção em outros países; fiscalização separada da prevalência |
| Interface e explicações | Cores temáticas, mapas, históricos, comparações, CSV, definições e quatro perguntas narrativas | Leitura mais curta e orientada; testes de percurso; acessibilidade; relatórios reutilizáveis |

## Achados que alteram a prioridade

### 1. A comparação trabalho–migração está implementada, mas sem amostra elegível

Nos arquivos ativos, desemprego e emprego vulnerável têm 6.531 observações
cada, todas classificadas como `unknown`. A função `alignWorkMigration`,
executada com esses arquivos, refugiados acolhidos e população, retornou zero
país-anos elegíveis. A regra atual exige `reported` nas duas medidas de trabalho.

Isso é uma proteção metodológica, não uma autorização para remover a regra.
Os resultados publicados em conversas antigas precedem essa restrição e não
devem ser apresentados como resultados atuais disponíveis. A próxima entrega
deve obter classificação documentada da fonte, ou integrar séries reportadas
adequadas; enquanto não houver amostra, explicar o bloqueio de forma simples.
A [nota da OIT](https://www.ilo.org/resource/news/note-ilo-modelled-estimates-and-country-rankings-or-comparisons)
fundamenta a restrição a comparações de observações imputadas.

### 2. Discriminação social e riqueza continuam lacunas do objetivo original

O nome do tema de gênero inclui discriminação social, mas seu catálogo atual
mede participação, representação, cuidado, violência e feminicídio. Não cobre
diretamente outras formas de discriminação. Renda/consumo também não mede
patrimônio acumulado.

Para discriminação, uma candidata a investigar é o indicador
[ODS 16.b.1](https://unstats.un.org/sdgs/metadata/?Goal=16&Target=16.b),
de discriminação/assédio relatados nos 12 meses anteriores. Ainda faltam validar
acesso, cobertura, dimensões e reutilização para integrar dados. Denúncias
administrativas precisam de uma série e interpretação próprias.

### 3. AdaptaBrasil pode avançar além do carregamento manual de CSV

Hoje o programa apenas pré-visualiza CSV; não transforma esse arquivo em um
indicador integrado. Foi localizada documentação pública de
[acesso à API do AdaptaBrasil](https://github.com/AdaptaBrasil/AdaptaBrasilAPIAccess),
com recorte, resolução, indicador, ano e cenário. É uma possibilidade para
automatizar a coleta, sujeita a validar endpoints e condições de reutilização.
Não é necessário pressupor que o usuário precise fornecer manualmente cada
arquivo. Esta revisão não executou o código do repositório externo.

### 4. A atualização precisa de um status operacional por conjunto

O rodapé principal lista fontes como “Incluída” no último processamento válido.
Vários complementos já possuem `lastAttemptAt`, `fetchedAt` e `cached`, mas não
há uma visão operacional consolidada das falhas e revisões. Coleta diária não
torna uma pesquisa anual um dado em tempo real.

### 5. As subdivisões ainda são específicas do Brasil

O modelo principal contém `brazilStates` e `brazilImmediateRegions`. Outros
países têm complementos nacionais, mas ainda não têm uma hierarquia geral de
províncias/estados/regiões. Apenas fome/água tem indicadores por Regiões
Geográficas Imediatas no catálogo atual. Regiões da fonte não equivalem aos
continentes do mapa; uma média dos países não substitui um agregado oficial.

### 6. O uso em homilia/apresentação já foi entregue, com base antiga explícita

Os arquivos do Ano A existem na pasta `entregas` do OneDrive. O gerador da
homilia identifica a base de 04/09/2026 nas notas. Antes de reutilizar esses
materiais como retrato atualizado, conferir seus números contra a base ativa,
mantendo ano observado, fonte e dados complementares separados. Não se conclui
que um número ficou incorreto apenas porque a coleta é antiga.

## Ordem recomendada de trabalho

| Ordem | Entrega | Critério para concluir |
| --- | --- | --- |
| 1 | Consolidar pasta ativa, documentação e matriz de cobertura/status | Uma origem de dados por entrega; cada tema/escala identifica dado integrado, referência documental ou lacuna; datas de referência, coleta, tentativa e cache visíveis |
| 2 | Recuperar comparabilidade de trabalho | Classificação comprovada por observação, exclusões auditáveis e comparação habilitada apenas se houver amostra adequada; agregados oficiais separados |
| 3 | Recuperar discriminação social do escopo original | Primeiro indicador oficial validado com universo, período, cobertura e licença; não apresentar representação feminina como medida de toda discriminação |
| 4 | Integrar um indicador AdaptaBrasil | Coleta reprodutível, códigos territoriais, ameaça/cenário/ano explícitos, mapa e explicação; agregação por UF somente se metodologicamente autorizada |
| 5 | Aprofundar pobreza e riqueza | Conceitos de pesquisa documentados; patrimônio em série própria; comparações e exportações preservam a proveniência |
| 6 | Ampliar região/mundo e países por temática | Agregados oficiais próprios, conferência de denominadores e pequenos lotes nacionais; educação, gênero e migração com lacunas explícitas |
| 7 | Generalizar recortes internos | Modelo de territórios com vínculos país/subdivisão; um país piloto e tema com fonte adequada antes de ampliar |
| 8 | Consolidar uso educativo e versão estável | Relatório reutilizável com fonte/ano, narrativas revisadas, acessibilidade e testes de percurso; roteiro/documentação coerentes com a versão publicada |

Começar pela ordem 1 torna as demais entregas verificáveis. Depois, concluir
uma temática por vez, conforme pedido do usuário, em vez de acumular novos
gráficos sobre dados ainda não comparáveis. Conflitos armados e IA conversacional
real permanecem posteriores; o assistente atual é uma leitura por regras, não
um modelo de linguagem.

## Evidências locais

- `public/data/mundialidade.json`: catálogo e cobertura territorial.
- `public/data/national-data.json`: instituições e complementos nacionais.
- `public/data/series/ilo-unemployment.json` e
  `public/data/series/ilo-vulnerable-employment.json`: classificação atual.
- `src/lib/workMigration.ts`: requisitos para elegibilidade da comparação.
- `src/lib/sourceReview.ts`: fontes documentadas e próximas integrações.
- `src/App.tsx`: pré-visualização AdaptaBrasil e status atual das fontes.
- `docs/roadmap.md`: histórico de entregas e pendências.

Este documento registra a revisão e recomendações. Não declara integração de
novos dados nem modifica o funcionamento da aplicação.
