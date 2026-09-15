# Mundialidade

Mundialidade é um dashboard web open-source para acompanhar indicadores sociais e ambientais globais e do Brasil, com foco em fome, água, gênero, desigualdade, vulnerabilidade climática e migração forçada.

## Stack

- React 19
- Vite
- TypeScript
- Recharts
- D3 Geo
- Node.js para coleta e processamento
- Vitest para testes básicos
- GitHub Actions para CI e refresh de dados

## Arquitetura

- `scripts/data/build.ts`: coleta dados públicos e normaliza o schema.
- `public/data/`: artefatos gerados consumidos pelo frontend.
- `src/`: dashboard responsivo, mapas, gráficos e filtros.
- `docs/architecture.md`: visão da arquitetura e plano de evolução.

## Fontes principais

- World Bank Open Data
- ND-GAIN Country Index
- UNHCR Refugee Data Finder
- IBGE SIDRA
- Natural Earth

### Indicadores iniciais de fome e sede

- Insegurança alimentar moderada ou grave: World Bank, série `SN.ITK.MSFI.ZS`.
- Água potável gerida com segurança: World Bank/JMP, série `SH.H2O.SMDW.ZS`.
- Acesso básico à água: World Bank/JMP, série `SH.H2O.BASW.ZS`.

As duas primeiras séries ampliam o recorte de fome e sede ao separar privação alimentar,
acesso básico e serviço de água com critérios de disponibilidade e qualidade.

### Indicadores iniciais de migração e crise humanitária

- Refugiados por país de origem e refugiados acolhidos, da UNHCR.
- Solicitantes de asilo acolhidos, da UNHCR.
- Deslocados internos por conflito ou violência acompanhados pela UNHCR.

Os deslocados internos publicados pela UNHCR cobrem populações sob sua proteção ou assistência;
eles não representam, sozinhos, o total global de deslocamento interno.

## Licenças e redistribuição

O projeto prefere fontes públicas, gratuitas e com licença clara. No MVP:

- World Bank Open Data: CC BY 4.0
- UNHCR Refugee Data Finder: CC BY 4.0
- ND-GAIN: licença aberta informada pela fonte
- Natural Earth: domínio público
- IBGE SIDRA: dados públicos do IBGE

Revise sempre a documentação da fonte antes de ampliar redistribuição ou republicação de dados derivados.

## Instalação

```bash
npm ci
npm run data:build
npm run dev
```

## Scripts

```bash
npm run data:build
npm run dev
npm run test
npm run build
```

## Atualização dos dados

O GitHub Actions consulta as fontes públicas diariamente às 09:00 UTC (06:00 em São Paulo).
O workflow só cria um commit quando o arquivo de dados gerado contém mudanças. A frequência de
publicação de cada fonte continua sendo exibida no painel, pois muitos indicadores são anuais.

## O que o MVP entrega

- dashboard responsivo
- mapa mundial
- mapa do Brasil
- filtro por país
- filtro por estado no Brasil
- séries históricas
- ranking global por indicador
- transparência de fonte, data e metodologia
- pipeline pronta para CI

## Limites atuais do MVP

- o recorte estadual brasileiro ainda está concentrado em um indicador de vulnerabilidade social do IBGE/SIDRA
- a arquitetura já está pronta para receber novos conectores estaduais de água, gênero, clima e migração

## Estrutura do projeto

```text
.
├── .github/workflows/
├── docs/
├── public/data/
├── scripts/data/
├── src/
├── .env.example
├── LICENSE
└── README.md
```

## Publicação no GitHub

Checklist sugerido:

1. criar o repositório
2. subir o conteúdo atual
3. ativar GitHub Actions
4. escolher hospedagem estática
5. configurar branch padrão e proteção
