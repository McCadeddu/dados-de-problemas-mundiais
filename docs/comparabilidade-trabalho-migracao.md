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

O painel já executa um primeiro teste descritivo com observações país–ano
alinhadas: desemprego e emprego vulnerável são confrontados com refugiados ou
solicitantes de asilo acolhidos por mil habitantes, usando população do mesmo
ano. Ele mostra o número de observações, uma correlação linear descritiva, os
doze países com maior taxa no último ano alinhado e permite baixar o recorte em
CSV. Correlação, diferença de médias ou regressão podem descrever associação;
não identificam causalidade sem desenho de pesquisa, variáveis de controle e
hipóteses temporais explícitas.
