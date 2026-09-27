# Trabalho forçado: edição revisada da OIT

Referência 2021, publicada em 12/09/2022 pela OIT, Walk Free e OIM, no relatório *Global Estimates of Modern Slavery: Forced Labour and Forced Marriage*. Tabelas 1 e 2, páginas impressas 17–18 (PDF 26–27), conferidas visualmente em 27/09/2026.

O complemento apresenta três modalidades mutuamente exclusivas e cinco regiões da OIT. Cada conjunto reconcilia com o total de 27.577 **milhares** de pessoas. A taxa mundial é 3,5 por **mil** habitantes, não 3,5%. Preservam-se as taxas publicadas: não são recalculadas com dados populacionais atuais. Categorias não recebem taxas derivadas.

As regiões OIT não são os continentes do mapa; não aplicar filtros continentais nem atribuir esses valores aos países. Trata-se de prevalência estimada em um dia qualquer de 2021, não fluxo anual, resgates, incidência ou contagem atual. Casamento forçado não integra este recorte. A coleta parcialmente anterior à pandemia limita sua representação dos efeitos da crise.

`src/data/forced-labour-2021.json` guarda a edição revisada e sua proveniência, incluindo SHA-256 do PDF, páginas e licença CC BY 4.0. Os avisos de tradução e adaptação exigidos pela licença estão na interface e no CSV. O relatório original está vinculado nesses arquivos.

`npm run data:forced-labour` valida unidade, recortes, reconciliação, edição e localização da fonte antes de gerar JSON e CSV públicos. Integra o build diário, mas **não procura nem mistura edições novas automaticamente**. Uma nova edição exige nova revisão de conceitos, unidades e recortes. A interface usa o mesmo arquivo revisado, evitando depender da API externa no navegador.

Próximos recortes: dados administrativos de fiscalização em série separada; examinar a disponibilidade de estimativas nacionais compatíveis; avaliar indicadores sobre prevenção e resposta institucional.
