# Comparabilidade entre trabalho e migração

Esta matriz orienta o próximo ciclo de análise. Ela mantém indicadores com
conceitos, denominadores, períodos e unidades de observação diferentes em
linhas separadas. Uma associação descritiva só deve ser calculada depois de
alinhar país, ano, população de referência e qualidade da fonte.

| Medida | O que mede | Denominador e período | Regra de comparação |
| --- | --- | --- | --- |
| Desemprego | Pessoas sem trabalho, disponíveis e procurando trabalho | Força de trabalho; ano; estimativa modelada OIT/Banco Mundial | Comparar apenas com o mesmo conceito e ano; não mede informalidade nem migração. |
| Emprego vulnerável | Conta própria e trabalhadores familiares não remunerados | Emprego total; ano; estimativa modelada | Não é sinônimo de pobreza ou trabalho forçado. |
| Ausência de contribuição | Ocupados sem contribuição previdenciária no recorte observado | Ocupados; Brasil/PNAD Contínua, 4º trimestre | Não comparar diretamente com a série global: cobertura e denominador diferem. |
| Trabalho forçado | Trabalho sob ameaça ou coerção, sem liberdade efetiva | Estimativa global de estoque/prevalência, referência 2021 | Não é taxa anual de desemprego e não tem a mesma fonte ou unidade. |
| Refugiados e solicitantes de asilo | Pessoas sob proteção internacional ou em pedido de proteção | Estoque no fim do ano, por origem e acolhida | Separar de fluxos, migrantes econômicos e deslocados internos. |
| Estoque de migrantes | Pessoas residentes em país diferente do país de nascimento | Estoque internacional harmonizado; Banco Mundial/ONU; ano da estimativa | Não equivale a refugiados, solicitantes de asilo nem a entradas no período. |

## Comparação anual reproduzível

Desemprego e emprego vulnerável são confrontados com uma das três medidas:
refugiados acolhidos, solicitantes de asilo acolhidos ou estoque internacional
de migrantes. Cada contagem é dividida pela população do mesmo país e ano e
multiplicada por mil. Não há interpolação nem substituição por um ano vizinho.

O seletor de ano usa, por padrão, o último ano com pelo menos uma observação
completa na base mundial da medida selecionada. O filtro de continente da
página também se aplica à comparação. Um continente sem observações nesse ano
recebe uma mensagem de ausência; não há recuo silencioso para outro ano.
Ao trocar a medida migratória, o seletor volta ao último ano disponível dela.

Cada país ou território entra uma única vez, no ano selecionado. Pearson r e
Spearman ρ são calculados sem ponderação, com a mesma amostra nas duas associações.
Pearson resume associação linear; Spearman compara a ordem dos países e é menos
sensível a valores extremos. A tabela
completa e o CSV usam exatamente essa amostra; a antiga correlação que reunia
vários anos foi removida. Países sem uma das quatro medidas válidas são listados
como excluídos com o requisito ausente ou inválido identificado. Zero publicado é preservado; população não positiva, valores
não finitos, taxas de trabalho fora de 0–100% e contagens negativas são excluídos.

O painel também oferece uma análise de sensibilidade com Pearson ponderado pela
população. A leitura principal dá o mesmo peso a cada país; a versão ponderada
responde a uma pergunta diferente, dando mais influência aos países maiores. Uma
diferença relevante entre as duas versões deve ser registrada, pois mostra que a
associação depende da composição populacional do recorte.

Também é calculada uma faixa de influência retirando cada país uma vez e
recalculando Pearson. Com pelo menos quatro países, uma faixa ampla indica que
um ou poucos territórios podem estar determinando a associação observada.

O painel resume esses diagnósticos em uma leitura orientativa: proximidade entre
Pearson e Spearman, diferença entre pesos iguais e populacionais e amplitude da
faixa de influência. Diferenças ou amplitudes acima de 0,20 geram alertas
heurísticos, sem validação como teste estatístico. Sinais opostos entre Pearson
e Spearman são destacados mesmo abaixo desse limiar. Proximidade dos métodos e
ausência de alertas não garantem associação forte, confiabilidade ou causalidade.

Quando existem observações completas em dois anos consecutivos, o painel também
compara as mudanças dentro de cada país. Essa análise usa apenas pares exatos
ano anterior/ano selecionado, respeita o continente selecionado, sem preencher lacunas, e mostra Pearson e Spearman
entre as variações. Ela reduz a influência de diferenças estruturais entre países,
mas continua sendo descritiva e não identifica causalidade.

Com menos de três observações ou sem variação em uma das duas medidas, o painel
informa que a correlação não pode ser calculada. Isso é diferente de r = 0.
O resultado não fornece significância estatística, relação individual ou efeito
causal. Países pequenos recebem o mesmo peso que grandes; cobertura, valores
extremos e fatores como renda, conflito e políticas podem alterar a associação.
Alinhar o ano não torna idênticas as populações de referência ou as datas de
medição dentro desse ano. As categorias migratórias podem se sobrepor e não são
somadas.

O CSV inclui todos os países do recorte, valores sem arredondamento, população
usada no denominador, código do indicador migratório e data de geração do
arquivo de dados. O nome identifica medida, ano e continente. As fontes são
mostradas no painel; carregamento, falha e ausência de dados têm mensagens
distintas.
