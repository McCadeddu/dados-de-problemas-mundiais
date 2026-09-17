# Como contribuir

Obrigado por ajudar a tornar os indicadores sociais e ambientais mais acessíveis.

## Ambiente local

```bash
npm ci
npm run data:build
npm test
npm run lint
npm run build
```

## Novas fontes de dados

Cada fonte nova deve ser pública, gratuita e ter condições de uso compatíveis com a publicação de dados derivados. Inclua no conector:

- URL da fonte e da metodologia;
- licença ou condição pública de uso;
- data ou período de referência;
- cobertura territorial e lacunas conhecidas;
- definição do indicador, unidade e sentido de interpretação.

Evite editar `public/data/mundialidade.json` manualmente. O arquivo é gerado por `scripts/data/build.ts`; altere o conector e execute `npm run data:build`.

## Alterações de interface

Preserve a navegação por problemática e escala geográfica. Novos indicadores devem continuar funcionando em mapa, ranking, série histórica, comparação e painel de metodologia quando houver dados suficientes.

## Pull requests

- mantenha mudanças pequenas e com uma finalidade clara;
- não reverta alterações de outras pessoas;
- inclua testes para lógica nova quando aplicável;
- descreva fonte, método e limitações de qualquer dado incorporado;
- execute os comandos de validação antes de enviar.

## Comunicação

Ao abrir issue ou pull request, siga o [Código de Conduta](CODE_OF_CONDUCT.md). Problemas de conduta podem ser reportados de forma privada ao mantenedor do repositório.
