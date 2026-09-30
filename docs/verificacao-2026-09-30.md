# Consolidação de 30/09/2026

## Estado

Preparação local para publicação, sem commit ou push nesta etapa. Alterações
anteriores preservadas na cópia ativa C:/projetos/Mundialidade.

## Entregas consolidadas

- Revisão documental das fontes nas sete problemáticas e ano comum nas comparações mundiais.
- Definição de pobreza corrigida e agregado oficial de países, regiões e mundo.
- Exclusão de imputações e observações sem classificação comprovada do cruzamento trabalho–migração.
- Fome e pobreza: visão mundial somente com agregados regionais/mundiais; comparação nacional com esses agregados na página do país.
- Ano explícito na posição nacional do recorte mundial.
- Roteiro atualizado, distinguindo entregas de lacunas; documentação do cruzamento atualizada.

## Validação

- 38 arquivos de teste, 180 testes aprovados (npm test -- --maxWorkers=2).
- TypeScript, ESLint e build local aprovados.
- Build com GITHUB_ACTIONS=true aprovado, usando /dados-de-problemas-mundiais/.
- git diff --check aprovado.
- Navegador: pobreza mundial exibe regiões/mundo; análise nacional preserva Brasil 20,6% em 2024. Fome/água mundial sem linha do país; análise nacional com a linha do Brasil.
- Vite mantém aviso não bloqueante sobre uso de __dirname em futura mudança de carregador de configuração.

Não houve nova coleta completa nem auditoria de todas as fontes externas. A
validação não confirma publicação remota. Próximo passo operacional: revisar e
versionar o conjunto, sincronizar com o repositório remoto e acompanhar CI/deploy.
Próximo lote funcional: pobreza/desigualdade, incluindo concentração de renda.
