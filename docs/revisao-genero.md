# Revisão de gênero — 27/09/2026

O painel reúne cinco medidas mundiais (representação parlamentar, participação
feminina, violência por parceiro íntimo, diferença de participação e de cuidado)
e quatro estaduais (participação feminina, diferença de participação, rendimento
e cuidado). Os mapas, séries por território e comparações entre países continuam
disponíveis; não formam uma medida única de igualdade.

## Correções

- Representação usa cadeiras da câmara única/baixa, não população total.
- Participação mundial usa população por sexo com 15+; a estadual usa 14+.
- Violência SG.VAW.1549.ZS usa mulheres de 15–49 anos que já tiveram parceiro:
  violência física/sexual por parceiro atual ou anterior nos 12 meses da pesquisa.
  Não inclui não parceiros nem mede ocorrências policiais ou o ano corrente.
- Cuidado mundial usa pontos percentuais de um dia de 24 horas; a série estadual
  é diferença de médias em horas. Pesquisas e amostragens diferem.
- Médias mundiais/continentais ponderadas pela população total foram suprimidas
  neste tema. Os cartões apresentam cobertura e anos dos últimos dados, reagindo
  ao continente selecionado. O assistente usa a cobertura do mesmo recorte.
- Os nove indicadores têm denominador/base e acesso à metodologia específica.

As definições corrigidas são compartilhadas com a ingestão em `src/lib/gender.ts`,
para persistirem nas atualizações. Esta revisão não atualiza as observações:
a série de violência na base continua com último ano global 2017. O ranking
continua usando o último ano disponível de cada país, que pode variar; o painel
explicita essa limitação. Ausência de dados não significa ausência de violência.

## Lacunas

Não há série estadual integrada de violência. Registros administrativos exigem
avaliação de cobertura, classificação e subnotificação, sem equivaler a prevalência.
O tema não cobre todas as formas de discriminação racial, social ou contra pessoas
LGBTQIA+. Novas fontes devem ser avaliadas antes de afirmar completude do tema.

## Referências

- [Violência: definição do Banco Mundial](https://databank.worldbank.org/metadataglossary/world-development-indicators/series/SG.VAW.1549.ZS)
- [Representação parlamentar](https://databank.worldbank.org/metadataglossary/world-development-indicators/series/SG.GEN.PARL.ZS)
- [Cuidado não remunerado](https://databank.worldbank.org/metadataglossary/gender-statistics/series/SG.TIM.UWRK.FE)
- IBGE/SIDRA: [4093](https://sidra.ibge.gov.br/tabela/4093),
  [10280](https://sidra.ibge.gov.br/tabela/10280) e [7013](https://sidra.ibge.gov.br/tabela/7013).
