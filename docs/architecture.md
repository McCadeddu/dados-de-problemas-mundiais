# Arquitetura do MVP

## Objetivo
Criar um dashboard open-source para monitorar indicadores sociais e ambientais globais e do Brasil, com foco em:

- fome e sede
- discriminação social e desigualdade de gênero
- pobreza e desigualdade
- vulnerabilidade climática
- migração forçada e crises humanitárias

## Decisões principais

### 1. App estático com pipeline de dados separada
- O frontend lê artefatos versionados em `public/data`.
- A coleta e normalização rodam em `scripts/data/build.ts`.
- Isso simplifica hospedagem, auditoria, cache e publicação open-source.

### 2. Schema único para o frontend
- Todas as fontes são convertidas para:
  - `indicators`
  - `series`
  - `latest`
  - `rankings`
  - `sources`
- Assim, o frontend não precisa conhecer detalhes de cada API.

### 3. Conectores plugáveis por fonte
- Cada fonte entra por um conector dedicado.
- No MVP:
  - World Bank Open Data
  - ND-GAIN
  - IBGE SIDRA
  - Natural Earth

## Estrutura de pastas

```text
.
├── .github/workflows/
├── docs/
│   └── architecture.md
├── public/
│   └── data/
├── scripts/
│   └── data/
│       └── build.ts
├── src/
│   ├── components/
│   ├── lib/
│   ├── test/
│   ├── App.tsx
│   └── types.ts
├── .env.example
├── LICENSE
├── README.md
└── package.json
```

## Fluxo de dados

1. `npm run data:build`
2. coleta dados brutos das fontes públicas
3. normaliza para um schema comum
4. salva `public/data/mundialidade.json`
5. salva GeoJSONs em `public/data/geo`
6. o frontend renderiza mapas, séries e rankings a partir desses arquivos

## Fontes escolhidas

### Globais
- World Bank Open Data
- ND-GAIN Country Index

### Brasil
- IBGE SIDRA

### Mapas
- Natural Earth

## Plano de evolução

### Curto prazo
- adicionar novos indicadores estaduais do Brasil
- melhorar tooltips, legenda e estados vazios
- ampliar cobertura metodológica por indicador

### Médio prazo
- separar conectores por arquivo
- persistir snapshots históricos dos datasets
- publicar demo automatizada

### Longo prazo
- expor API própria opcional
- suportar comparação multi-país/multi-estado
- adicionar alertas de anomalia e mudanças recentes

