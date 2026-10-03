# Comparações de trabalho: classificação das observações

Atualização de 03/10/2026: desemprego total e emprego vulnerável passaram à
API direta OIT/SDMX. Foram recuperadas 3.367 observações de desemprego com R;
o emprego vulnerável ainda não tem R nos três componentes. O cruzamento mantém
zero país-anos elegíveis. Ver [método atual e reprodução](classificacao-trabalho-oit.md).
O relato abaixo descreve a coleta WDI anterior.

Revisão: 30 de setembro de 2026.

A OIT mistura observações nacionais harmonizadas e imputações em suas estimativas modeladas. Recomenda não usar observações imputadas para comparar ou ordenar países: https://www.ilo.org/resource/news/note-ilo-modelled-estimates-and-country-rankings-or-comparisons

O cruzamento trabalho–migração agora exige observationType=reported nas duas taxas de trabalho, para cada país e ano. Imputed, unknown e campos ausentes ficam fora dos níveis, variações anuais, correlações e CSVs. A interface explica a exclusão. A classificação reportada é uma condição necessária, não garantia de equivalência entre pesquisas.

A coleta conserva obs_status em sourceObservationStatus e define unknown nas séries modeladas: status vazio não demonstra observação reportada. Na consulta de controle à API WDI para BRA, os três indicadores SL.UEM.TOTL.ZS, SL.UEM.1524.ZS e SL.EMP.VULN.ZS retornaram status vazio em 2024 e 2025. Essa verificação amostral não classifica os demais países. Arquivos anteriores sem classificação também são tratados como desconhecidos, sem alterar valores históricos.

Próximas etapas: obter classificação documentada por observação no ILOSTAT; integrar agregados regionais e mundiais oficiais, sem médias simples dos países; verificar equivalência de pesquisas nacionais antes de habilitar comparações. Agregados novos ainda não foram integrados nesta etapa.
