# Verificação funcional — 19/09/2026

## Escopo

Revisão das explicações dos indicadores e dos cruzamentos trabalho–migração,
com navegação no navegador e checagem dos arquivos publicados. As observações
estatísticas existentes foram preservadas; a coleta completa de todas as APIs
externas não foi refeita nesta revisão.

## Verificações

- Os 49 indicadores têm arquivos de séries presentes e não vazios. A checagem
  estrutural não encontrou anos não inteiros ou valores não finitos.
- As explicações abriram pelo teclado nos sete temas, sem alertas de carregamento.
- A troca de indicador atualizou a definição; as escalas estadual e regional
  exibiram as explicações correspondentes.
- Portugal (INE trimestral) e Austrália (ABS mensal) carregaram na visão nacional.
- No recorte europeu, o cruzamento de refugiados usou 2025; estoque de migrantes
  selecionou 2024 e indicou zero transições consecutivas, sem preencher lacunas.
- Testes automatizados cobrem seleção de ano, filtro continental, exportação das
  mesmas linhas exibidas, falta de dados e falhas de carregamento.

## Correções

- Fontes compartilhadas entre adultos e jovens sobrescreviam os links de
  metodologia. Cada série de educação e trabalho passou a ter uma referência
  própria; conector e catálogo existente foram corrigidos.
- Cobertura territorial deixou de ser apresentada como denominador na ausência
  desse metadado. Contagens absolutas são identificadas como tal.
- Spearman agora rejeita entradas não finitas antes de ordená-las.
- A lista de exclusões explica também falha no cálculo por mil habitantes e
  não mostra uma lista vazia quando não existe um ano comum.

O reparo de metadados pode ser reproduzido com
`npx tsx scripts/data/repair-education-metadata.ts`, sem consultar APIs nem mudar
valores estatísticos.
