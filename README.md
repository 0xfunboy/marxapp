# Marxapp

Marxapp is a didactic web application that explores a high-equality global redistribution scenario through transparent, inspectable models.

The core product idea is simple:
- Show where essential-service gaps exist today.
- Simulate what changes under a configurable “Utopia” redistribution run.
- Explain every output with assumptions, formulas, confidence levels, and source metadata.

This project is intentionally educational. It is not a deterministic forecasting system and not an industrial supply-chain optimizer.

## Why this exists

Public debates about inequality often focus only on money. Marxapp reframes the discussion around concrete essentials:
- water
- energy
- food
- health
- education
- internet
- transport/logistics (proxy)
- monetary income (explicitly non-dominant in the model)

The app is designed to make trade-offs visible and debuggable, not ideological.

## Current status (v0.1)

Implemented and working:
- Global 3D dashboard with country-level stacked multi-color columns.
- Country boundary hover highlighting on satellite-style globe texture.
- Country-level bundle across 250 countries/territories.
- Utopia simulator with scenario presets and explainable output.
- Personal impact report with line-by-line “Why?” formula blocks.
- Method/assumptions/limitations pages with model transparency.
- World Bank-driven seed dataset with explicit fallback strategy.

## Monorepo structure

- `apps/web`
  - Next.js frontend.
  - Main routes: Dashboard, Utopia Simulator, Personal Report, Method, Limitations.
  - 3D globe rendering via `react-globe.gl`.

- `services/api`
  - Express + TypeScript API.
  - Scenario run endpoints, map bundle endpoints, personal report endpoint, method endpoint.

- `services/sim`
  - Didactic simulation engine.
  - Gap/surplus logic, redistribution proxy, bottleneck extraction.

- `packages/shared`
  - Shared types, assumptions, constants, and data seed interfaces.

- `docs`
  - Implementation status and delivery notes.

## Data model and sourcing approach

### Data source strategy

v0.1 uses a World Bank indicator-driven seed and declared fallback logic.

Primary indicators include:
- `SP.POP.TOTL` (population)
- `SH.H2O.BASW.ZS` (basic water services)
- `EG.USE.ELEC.KH.PC` (electric power consumption per capita)
- `EG.ELC.ACCS.ZS` (electricity access fallback)
- `SN.ITK.DEFC.ZS` (undernourishment proxy)
- `SH.XPD.CHEX.PC.CD` (current health expenditure per capita)
- `SE.ADT.LITR.ZS` (adult literacy)
- `IT.NET.USER.ZS` (internet users)
- `NY.GNP.PCAP.PP.CD` (GNI per capita, PPP)

### Transparency labels

Each metric line is explicitly labeled as one of:
- `data` (direct source metric, no imputation)
- `estimate` (derived transformation)
- `assumption` (fallback/imputed)

### Confidence levels

Every metric carries confidence (`high|medium|low`) and source year metadata.

## Simulation logic (didactic)

The simulation pipeline follows these steps:
1. Build current world state (country/domain values).
2. Compute needs from target presets and population.
3. Compute capacity and global surplus/gap per domain.
4. Apply redistribution with efficiency/ethics/transition multipliers.
5. Apply bottleneck constraints (logistics cost proxies).
6. Return before/after, deltas, bottlenecks, assumptions used, and model limits.

This is a transparent educational model, not a policy-grade optimizer.

## Frontend UX model

### Dashboard
- 3D globe with one stacked column per country.
- Segment colors represent domain contributions in the same vertical column.
- Hover state highlights country borders and surfaces quick stats.
- Click state opens detailed country cards with source and confidence metadata.

### Utopia Simulator
- Transition years (`0 | 5 | 10`)
- Organizational efficiency (`low | medium | high`)
- Ethical priority (`save_lives | equality | sustainability`)
- Patent toggle for health module
- Target preset (`minimum | dignity | high`)

### Personal Report
- Input: country, annual income, gross/net toggle, optional net worth, optional household size.
- Output: estimated monthly income delta, service-access deltas, trade-offs, and explainability blocks.

## API reference (v0.1)

Base URL: `http://localhost:4100`

- `GET /health`
- `GET /api/v1/indicators?country=ITA&year=2024`
- `GET /api/v1/map-layer?domain=water&gapMode=true&targetPreset=dignity`
- `GET /api/v1/map-bundle?gapMode=true&targetPreset=dignity`
- `POST /api/v1/scenario/run`
- `POST /api/v1/report/personal`
- `POST /api/v1/report/personal/export`
- `GET /api/v1/method`
- `GET /api/v1/assumptions`

## Local development

### Requirements
- Node.js 20+
- pnpm 10+

### Setup

```bash
pnpm install
cp .env.example .env
pnpm run dev
```

Default ports:
- Web: `http://localhost:3100`
- API: `http://localhost:4100`

## Environment variables

See `.env.example`:
- `NEXT_PUBLIC_API_BASE_URL` (default `/backend`)
- `API_PROXY_TARGET` (default `http://127.0.0.1:4100`)
- `WEB_PORT` (default `3100`)
- `PORT` (default `4100`)

## Privacy and safety

- Personal report inputs are not persisted by default.
- The app is explicit about assumptions, confidence, and model limits.
- Outputs are educational estimates, not guaranteed real-world predictions.

## Known limitations

- Country-level resolution only in v0.1.
- No subnational infrastructure modeling.
- Logistics and transition shocks are proxy-based.
- Social/political/security dynamics are not forecasted.

## Roadmap direction

Planned upgrades after v0.1:
- Repeatable ingest jobs + snapshot versioning in persistent storage.
- Improved regional/percentile winners-losers reporting.
- Better map polygon performance and mobile interaction density.
- Precomputed scenario cache and stronger observability.
- Expanded test coverage (unit + E2E).

## License and usage note

This repository is for educational exploration of redistribution trade-offs.
Always interpret outputs together with assumptions, confidence scores, and limitations.
