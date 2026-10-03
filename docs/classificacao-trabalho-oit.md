# Classificação das observações de trabalho — 03/10/2026

As séries de desemprego total e emprego vulnerável passaram a usar diretamente
a API SDMX da OIT. Os identificadores internos foram mantidos; o desemprego
juvenil continua distribuído pelo Banco Mundial, sem classificação comprovada.
Os gráficos, rankings, CSVs e o cruzamento de trabalho–migração usam as séries
publicadas, com fonte e transformação declaradas no indicador.

## Consulta e regras

- [Desemprego: metadados e edição](https://sdmx.ilo.org/rest/dataflow/ILO/DF_UNE_2EAP_SEX_AGE_RT/1.0).
  Frequência anual, ambos os sexos, idade 15+, medida `UNE_2EAP_RT`.
- [Emprego por status: metadados e edição](https://sdmx.ilo.org/rest/dataflow/ILO/DF_EMP_2EMP_SEX_STE_NB/1.0).
  Frequência anual, ambos os sexos, medida `EMP_2EMP_NB`, milhares de pessoas.
  Emprego vulnerável = `100 × (STE_ICSE93_3 + STE_ICSE93_5) / STE_ICSE93_TOTAL`.
  Exige os três componentes no mesmo país e ano, com denominador positivo.
- [Dicionário oficial](https://sdmx.ilo.org/rest/codelist/ILO/CL_OBS_STATUS/1.0):
  `R` = Real value, `I` = Imputation, `A` = Adjusted. O coletor verifica esses
  significados antes de publicar. R é tratado como reportado neste controle;
  I é imputado. Ajuste, estimativa, previsão e status vazio permanecem desconhecidos
  quanto à condição de observação reportada. A ausência de I não prova R.
- No indicador derivado, somente R nos três componentes permite classificação
  reportada; I em algum componente implica imputação. As marcações dos três
  componentes são preservadas em `sourceObservationStatus`.

A classificação é ligada ao valor obtido diretamente da OIT. Não foi transferida
a valores de outra edição ou instituição com base em coincidência numérica.
O coletor rejeita recortes inesperados, duplicatas, CSV inválido e cobertura
global inferior a 150 países/territórios. Falhas interrompem a atualização e
impedem publicação automática; não são disfarçadas como nova coleta bem-sucedida.

## Resultado desta coleta

As duas séries têm 6.496 observações em 186 países e territórios, entre 1991 e
2025. No desemprego, 3.367 têm R e 3.129 permanecem sem comprovação. No emprego
vulnerável, nenhuma observação tem R nos três componentes; todas as 6.496
permanecem sem comprovação. Não houve I nos recortes consultados, o que não
autoriza considerar os demais valores reportados.

O cruzamento conjunto com migração continua com **zero país-anos elegíveis**.
A regra exige as duas taxas reportadas, migração e população válida no mesmo
país e ano. A interface mostra o diagnóstico de classificação e explica essa
limitação, sem gerar correlações ou CSVs de amostra inexistente.

Na cobertura comum, o desemprego coincide numericamente com a série anterior
do Banco Mundial. O cálculo do emprego vulnerável coincide até precisão de
ponto flutuante nesta edição. Isso não é garantia para próximas edições.
O território `CHI` (Channel Islands), presente na distribuição WDI anterior,
não tem o mesmo código na resposta direta utilizada e não foi remapeado por
suposição. A cobertura passou de 187 para 186 entradas.

## Reprodução

`npm run data:ilo-observations` atualiza as duas séries, catálogo, rankings,
diagnóstico de cobertura por país e três artefatos de evidência:

- `public/data/ilo-observation-audit.json`: edição declarada pela API, datas,
  URLs, contagens, dicionário e SHA-256 dos CSVs.
- `public/data/ilo-unemployment-observations.csv`: resposta direta de desemprego.
- `public/data/ilo-employment-observations.csv`: resposta dos componentes.

Os CSVs incluem também áreas oficiais fora do catálogo do programa; as séries
normalizadas usam somente os códigos presentes no catálogo. Quebras de linha
dos CSVs são preservadas no Git para permitir verificar os hashes publicados.
Após uma atualização isolada, execute `npm run data:coverage-status`.
O coletor integra `data:education-work`, que integra a coleta completa.
A API requer `Accept-Language: en` para os formatos CSV e JSON de metadados.

Próxima investigação: localizar uma fonte que declare a origem reportada dos
componentes do emprego vulnerável, preservando conceito, período e população.
Sem essa evidência, o bloqueio metodológico deve permanecer.
