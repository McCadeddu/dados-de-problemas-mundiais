# Cobertura territorial e operação da coleta

A matriz disponível nas páginas de análise reúne os conjuntos já publicados.
Ela separa agregados mundiais, regiões oficiais das fontes, séries internacionais
por país, complementos nacionais, UFs e Regiões Geográficas Imediatas brasileiras.
O recorte continental do mapa não é contado como um agregado oficial.

Cada território precisa ter pelo menos uma observação numérica finita, com
período identificado, para contar como coberto. Zero é uma observação válida;
ausência não é zero. A cobertura considera todo o histórico e não garante
disponibilidade simultânea, mesmo conceito ou comparabilidade entre fontes.
Referências documentais são apresentadas separadamente dos conjuntos integrados.

As datas têm sentidos distintos: publicação/atualização declarada pela fonte,
coleta, última tentativa, revisão documental e processamento da base. Campos
ausentes permanecem não informados. Processar um arquivo não comprova consulta
nova à instituição. Cache só aparece quando declarado no artefato; o diagnóstico
não testa a disponibilidade da instituição em tempo real.

O relatório `public/data/coverage-status.json` é gerado por
`npm run data:coverage-status`, lendo os arquivos locais, sem novas requisições.
O comando está incluído ao final de `data:build`, usado na atualização completa.
Depois de atualizar um complemento isoladamente, execute também o diagnóstico.
Publique catálogo, séries, complementos e diagnóstico juntos. A interface oculta
a matriz quando a versão do catálogo não coincide com a registrada no relatório.

A primeira entrega registra 78 conjuntos (56 indicadores principais, 10
agregados de fome/água e pobreza, 2 estimativas de trabalho forçado e 10
complementos nacionais). Três complementos declaram uso de cache. Esses números
descrevem os arquivos de 02/10/2026 e serão recalculados nas próximas coletas.
