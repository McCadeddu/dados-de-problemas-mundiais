# Fome e água: agregados oficiais

Integração de 27/09/2026: quatro indicadores WDI (fonte 2), mundo e sete regiões publicadas pelo Banco Mundial, 32 séries consultadas desde 2000. Dados FAO para subalimentação e insegurança alimentar; OMS/UNICEF JMP para água. O painel não recalcula esses agregados a partir dos países.

Indicadores: `SN.ITK.DEFC.ZS`, `SN.ITK.MSFI.ZS`, `SH.H2O.BASW.ZS`, `SH.H2O.SMDW.ZS`. Áreas: WLD, EAS, ECS, LCN, MEA, NAC, SAS, SSF. Os nomes são obtidos no catálogo da API; MEA foi publicado nesta coleta como *Middle East, North Africa, Afghanistan & Pakistan*. Não associar automaticamente a continentes, nem somar percentuais regionais. Composição dos grupos pode mudar entre edições; a série não garante fronteiras constantes.

Na primeira coleta, os últimos dados mundiais são de 2023 para subalimentação e 2024 para os demais indicadores. Esses anos são rótulos da fonte, não datas de coleta nem garantias de uma pesquisa pontual em cada ano. O indicador de subalimentação pode apresentar 2,5 para valores abaixo desse limite; não interpretar como valor exato. A nota aparece junto à tabela.

O denominador dos quatro indicadores é a população, não os domicílios. A insegurança alimentar internacional não se confunde com a EBIA domiciliar brasileira. Acesso pelo menos básico à água inclui o serviço gerido com segurança; não somar os dois percentuais. O agregado JMP pode combinar estimativas urbanas e rurais ou usar totais nacionais conforme regras e cobertura; mudanças metodológicas podem afetar a continuidade.

O complemento tem cartões mundiais com ano individual, tabela regional com ano único e histórico por área. Ausência não vira zero nem é preenchida com outro ano. Filtros continentais do mapa não se aplicam aos grupos do Banco Mundial. O número de regiões não informa cobertura populacional; a consulta não fornece essa cobertura, e o painel explicita o limite.

`npm run data:hunger-aggregates` coleta dados, catálogo de áreas e metadados dos quatro indicadores. Valida paginação, totais de linhas, códigos, fonte, definições, percentuais, duplicidades, continuidade de anos e cobertura mundial mínima. Redução de observações válidas preserva a coleta anterior com aviso e data da tentativa; sem cópia anterior, a geração falha. A rotina integra `data:build` diário.

Arquivos públicos: `hunger-aggregates.json` e `hunger-aggregates.csv`. Preservam valores sem arredondamento, nulos, sinalizações, definições e nomes originais, atualização da base, coleta, tentativa, consultas e licença CC BY 4.0. A interface exibe uma casa decimal. As estimativas continentais próprias para água permanecem separadas e identificadas como cálculos do painel.

Fontes: [WDI — subalimentação](https://databank.worldbank.org/metadataglossary/world-development-indicators/series/SN.ITK.DEFC.ZS), [WDI — insegurança alimentar](https://databank.worldbank.org/metadataglossary/world-development-indicators/series/SN.ITK.MSFI.ZS), [WDI — água básica](https://databank.worldbank.org/metadataglossary/world-development-indicators/series/SH.H2O.BASW.ZS), [WDI — água gerida com segurança](https://databank.worldbank.org/metadataglossary/world-development-indicators/series/SH.H2O.SMDW.ZS).
