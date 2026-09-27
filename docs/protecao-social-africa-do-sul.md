# Contribuição patronal para aposentadoria — África do Sul

Integração revisada em 27/09/2026. Complemento nacional de trabalho, acessível
na página da África do Sul, junto ao desemprego trimestral já integrado.

## Fonte verificada

- Statistics South Africa, *Labour Market Dynamics in South Africa, 2024*,
  Report 02-11-02. Publicado em 10/12/2025.
- [Página da publicação](https://www.statssa.gov.za/?PPN=Report-02-11-02&page_id=1854).
- [Documento oficial, tabela 3.28](https://www.statssa.gov.za/publications/Report-02-11-02/Report-02-11-022024.pdf#page=161).
- Página impressa 160, página 161 do PDF. As três linhas e seis colunas foram
  conferidas visualmente. A página anterior repete a tabela para 2018–2023;
  não foi misturada com a série escolhida de 2019–2024.
- O JSON revisado em `scripts/data/sources/statssa-pension-2024.json` registra
  as 18 observações, edição, datas, páginas, conceito e SHA-256 do PDF.

## Medida e denominador

Percentual de empregados de 15–64 anos cujo empregador contribui para um fundo
de pensão/aposentadoria em seu nome. As linhas são ambos os sexos, homens e
mulheres; cada linha usa a respectiva população de empregados. Não são todos
os ocupados, todos os residentes, beneficiários de aposentadoria ou valor de benefício.

O relatório usa resultados anuais da QLFS, a partir dos quatro trimestres
(página impressa 14). São mantidos os percentuais publicados, sem recalcular
o total como média simples dos sexos. Em 2024: 44,8% no total, 45,8% entre
homens e 43,6% entre mulheres. O indicador brasileiro de ocupados sem
contribuição previdenciária tem conceito e denominador diferentes.

Não se infere que 100 menos este valor seja a proporção sem qualquer proteção
social: a pergunta cobre uma modalidade específica de contribuição patronal.
Não há integração deste complemento com os rankings mundiais ou com as
correlações trabalho–migração.

## Comparabilidade

Amostragem e mudanças de coleta podem influenciar diferenças. As páginas
impressas 13–14 descrevem a mudança para entrevistas telefônicas durante a
pandemia e a cobertura incompleta da amostra de Q2/2020 a Q2/2021. A página 14
também anuncia mudanças conceituais a partir de Q3/2025, a incorporar no
relatório LMD 2025. Novos anos exigem nova revisão; não estender automaticamente
a comparabilidade do desemprego a este indicador.

## Atualização e reutilização

Esta é uma edição revisada, não uma consulta ao vivo. A interface informa
publicação, revisão e último ano observado. `npm run data:social-protection`
aplica a edição ao arquivo nacional existente sem refazer outras coletas.
`data:national` também a inclui e atualiza o diagnóstico de cobertura; por isso
o processamento diário preserva o complemento. CSV e JSON são disponibilizados.
O CSV inclui tabela, páginas, data de revisão, hash do PDF e condições de
reutilização em cada linha, preservando a proveniência fora do painel.

O validador rejeita conceito, denominador, período, unidade ou edição diferentes,
anos ausentes/duplicados, valores ausentes ou fora de 0–100 e um total incompatível
com os valores por sexo. Ausência nunca é preenchida com zero.

O expediente (página impressa 2) permite uso/processamento com atribuição e
identificação da análise independente. A venda dos dados ou de versões
processadas requer autorização da Stats SA. Essa condição foi preservada na
interface e na proveniência; a licença do código do projeto não a substitui.

Para revisar uma nova edição: obter o PDF na página oficial, conferir tabela,
notas, população e condições de uso; registrar seu hash; atualizar a transcrição,
os metadados e o validador; executar os testes e verificar o painel e o CSV.
