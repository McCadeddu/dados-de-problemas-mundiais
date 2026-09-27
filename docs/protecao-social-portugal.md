# Subsídios de desemprego em Portugal

Integração do indicador INE **0004348**, produzido pelo Instituto de Informática: beneficiárias/os de subsídios de desemprego da Segurança Social, por sexo, anual. Recorte Portugal (`PT`), total de homens e mulheres (`T`), unidade número, sem multiplicador. Primeira coleta: 27/09/2026; atualização da fonte: 04/07/2026; histórico 1990–2025.

**A contagem não representa pessoas únicas.** A nota oficial informa que os beneficiários são contados tantas vezes quantos os subsídios que recebem. Inclui subsídio de desemprego, subsídio social inicial e subsequente, prolongamento e medida extraordinária para desempregados de longa duração. Não é número de parcelas pagas nem taxa de cobertura. Não dividir pelo desemprego trimestral, nem usar no ranking internacional.

- [Indicador INE](https://www.ine.pt/xurl/indx/0004348/PT)
- [Metadados oficiais](https://www.ine.pt/ine/json_indicador/pindicaMeta.jsp?varcd=0004348&lang=PT)
- [Catálogo oficial e licença CC BY 4.0](https://dados.gov.pt/api/1/datasets/687042d38c1cd0da86630c9a/)

O conector valida indicador, dimensões, total nacional, unidade, frequência, anos consecutivos, revisão e contagens inteiras não negativas. Ausências sinalizadas permanecem nulas. Falha ou perda de cobertura mantém a coleta anterior com aviso e data da tentativa; sem coleta anterior válida, interrompe a geração.

`npm run data:social-protection` atualiza este complemento preservando as outras séries nacionais. A atualização nacional diária também o inclui. JSON e CSV preservam nota, sinalizações, revisão, coleta e links de proveniência. Apresentação no tema trabalho digno de Portugal, junto ao desemprego trimestral.
