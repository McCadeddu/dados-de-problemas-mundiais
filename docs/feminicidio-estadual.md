# Feminicídio registrado por UF — RASEAM 2026

Integração revisada em 27/09/2026. São dois indicadores, para 27 UFs e dois
anos completos (2024 e 2025): mulheres vítimas registradas e taxa publicada
por 100 mil mulheres. Disponíveis em mapas, histórico, comparação e CSV.

## Fonte e proveniência

- Ministério das Mulheres, RASEAM 2026, tabelas 5.37a (2025) e 5.37b (2024).
- Páginas impressas 467–468; páginas 459–460 do PDF.
- Registros do Ministério da Justiça e Segurança Pública; denominadores do IBGE,
  Projeção da População, revisão de 2024.
- Atualização dos dados informada no relatório: **20/02/2026**; sujeitos a revisão.
- [PDF oficial](https://www.gov.br/mulheres/pt-br/central-de-conteudos/publicacoes-1/raseam-2026-relatorio-anual-socioeconomico-da-mulher.pdf/@@display-file/file#page=459).
- O expediente permite reprodução parcial ou total com citação da fonte.

`scripts/data/sources/raseam-2026-feminicide.json` guarda a edição revisada,
hash SHA-256 do PDF, tabelas, páginas, valores, denominadores e taxas originais.
`public/data/brazil-feminicide.json` disponibiliza essa proveniência e as séries.
Os totais das UFs conferem com os nacionais: 1.494 em 2024 e 1.548 em 2025.
As populações também conferem; todas as taxas conferem com o arredondamento
publicado para uma casa decimal. As duas páginas foram verificadas visualmente.

## Atualização e reprodução

`npm run data:gender-states` valida e integra a edição revisada. Faz parte de
`data:build`, portanto as coletas gerais não removem os indicadores. Não busca
automaticamente novas edições nem mistura revisões do Sinesp com este relatório.
A interface distingue a data da fonte da data de processamento do painel.

Para reproduzir a extração: baixar o PDF oficial e executar, com `pdfplumber`,
`python scripts/data/extract-raseam-feminicide.py caminho/do/arquivo.pdf` na raiz.
O extrator é específico da edição; uma nova publicação exige conferir páginas,
definições, denominadores e datas, adaptar o extrator/validador e revisar o diff.
Nunca publicar dados parciais de 2026 como se fossem totais anuais.

## Interpretação

- São mulheres vítimas de feminicídio consumado registradas na fonte.
  Não são todas as mortes de mulheres nem todas as formas de violência.
- Contagens não comparam risco: dependem também do tamanho da população.
  O ranking de contagens é descritivo e usa orientação neutra.
- A taxa usa população feminina do mesmo ano, não população total. É bruta,
  sem padronização por idade; empates podem resultar do arredondamento.
- Registro, classificação, subnotificação e revisões afetam as comparações.
  Dois anos não estabelecem uma tendência de longo prazo ou uma relação causal.
- Não combinar com a prevalência mundial de violência por parceiro íntimo.

## Decisão sobre a base detalhada do Sinesp

Na inspeção da planilha de 2025, várias linhas de Brasília compartilham UF,
município, mês e demais dimensões expostas. Há também linhas de município não
informado e totais que incluem sexo masculino/não informado. A soma bruta
não representa automaticamente o recorte feminino da publicação. Essa planilha
não foi usada para substituir a tabela revisada; uma integração automática
futura requer validar a granularidade e as regras de agregação da fonte.
