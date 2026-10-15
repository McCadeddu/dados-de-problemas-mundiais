# Discriminação social — primeira integração, 15/10/2026

O tema de gênero e discriminação passou a incluir a série `VC_VOV_GDSD` da Base
Global ODS da ONU, compilada pelo OHCHR. O indicador aparece como ODS 10.3.1 e
16.b.1; o coletor usa somente a vinculação 16.b.1 para evitar duplicação.

## Definição e seleção

O [indicador oficial](https://unstats.un.org/sdgs/metadata/files/Metadata-16-0b-01.pdf)
mede experiência pessoal relatada de discriminação ou assédio. Não é uma
contagem de denúncias, decisão judicial ou percepção geral sobre o país.
O total de motivos não é obtido pela soma das categorias: uma pessoa pode
relatar vários motivos.

As notas individuais revelam que alguns registros da série usam cinco anos,
dois anos ou três meses, apesar da janela de 12 meses na definição geral.
Por isso a integração exige:

- natureza `C`, dado nacional; estimativas `E` ficam fora desta primeira seleção;
- ambos os sexos e total da pesquisa: `BOTHSEX`, `ALLAGE`, `ALLAREA`, sem
  desagregações por deficiência, educação ou quantil; motivos `ALL`, reporte `G`;
- nota com menção explícita aos últimos 12 meses, sem janela divergente;
- ano inteiro, percentual numérico entre 0 e 100 e status ONU A ou B;
- correspondência entre M49 e ISO alpha-3 no quadro oficial da ONU e presença
  no catálogo territorial do programa.

`ALLAGE` significa sem desagregação por idade, não todas as idades. As faixas
etárias e os motivos perguntados variam entre pesquisas. O status B identifica
quebra de série e permanece nas notas. Valores zero são válidos; ausências,
sigilos, períodos não comprovados e duplicatas não são convertidos em zero.
Duplicatas ambíguas no mesmo país/ano interrompem a publicação.

## Entrega e limites

A edição `2026.Q3.G.01` forneceu 2.960 registros na consulta de motivos totais,
incluindo desagregações e as duas vinculações ODS. A seleção integra **50
observações em 20 países/territórios**. Os arquivos preservam os demais
registros consultados e os motivos de exclusão para revisão.

Mapa e histórico estão disponíveis em Mundo, Continentes e Estados (países),
com o seletor de ano comum. As notas originais de população e pesquisa aparecem
junto à análise e nos dados exportáveis. Há lacunas anuais: ligar duas pesquisas
no gráfico não estima os anos intermediários. Mesmo ano e janela não certificam
equivalência entre instrumentos ou populações. A disponibilidade de notas
detalhadas também limita a seleção e pode afetar sua representatividade.

Não há ranking, média continental/mundial, total global ou subdivisão brasileira
desta medida. O filtro de continente apenas recorta os países. O Brasil não tem
observação elegível nesta seleção; isso não indica ausência de discriminação.
A primeira etapa não representa todas as formas de discriminação nem uma
validação independente das pesquisas nacionais usadas pela base mundial.

## Reprodução e atualização

`npm run data:discrimination` consulta a edição atual, fixa o código da edição
nas páginas, verifica contagem/paginação e confirma ao final que a edição não
mudou. Um filtro remoto seleciona motivos totais; as demais dimensões são
validadas localmente, pois consultas com vários filtros simultâneos expiraram.
Falhas de transporte seguem a política de novas tentativas do projeto.
CSV não é usado nesta integração: a resposta JSON conserva notas e dimensões.

- `public/data/un-discrimination-source.json`: registros originais, metadados,
  atributos e dimensões da consulta;
- `public/data/un-discrimination-audit.json`: edição, consulta, datas de coleta
  e tentativa, exclusões e hash SHA-256 do arquivo de origem;
- `public/data/series/un-discrimination-12-months.json`: observações elegíveis;
- `scripts/data/sources/un-m49-2026-10-15.json`: correspondência M49/ISO extraída
  do [quadro oficial M49](https://unstats.un.org/unsd/methodology/m49/overview/),
  com origem e data de revisão explícitas.

O coletor integra `data:build`. Depois de uma execução isolada, rode também
`npm run data:coverage-status`. A data de coleta não é data de publicação das
pesquisas. Consulte as [condições de uso da ONU](https://www.un.org/en/about-us/terms-of-use)
e mantenha a atribuição UNSD/OHCHR e das fontes nacionais.

Próxima melhoria: verificar fontes nacionais para confirmar janelas e populações
de registros ainda excluídos, e integrar recortes específicos sem confundi-los
com o total. As notas ausentes não autorizam presumir uma janela de 12 meses.
