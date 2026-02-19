# Marxapp v0.1 - Implementation Status

Last updated: 2026-02-19

## Completed

1. Monorepo foundations
- Structure: `apps/web`, `services/api`, `services/sim`, `packages/shared`
- TypeScript workspace baseline and shared scripts

2. Didactic model and simulation
- Core domains modeled (water, energy, food, health, education, internet)
- Gap/surplus algorithm + redistribution + bottlenecks
- Outputs include assumptions and explicit model limits

3. API v0.1
- `/api/v1/map-layer`
- `/api/v1/map-bundle`
- `/api/v1/indicators`
- `/api/v1/scenario/run`
- `/api/v1/report/personal`
- `/api/v1/report/personal/export`
- `/api/v1/method`
- `/api/v1/assumptions`

4. Frontend v0.1
- Global dashboard with target and gap mode controls
- 3D globe (`react-globe.gl`) with stacked multi-domain country columns
- Utopia simulator (presets + patents toggle)
- Personal report with line-by-line explainability
- Method / assumptions / changelog / limitations pages

5. Data foundations
- Initial DB schema: `services/api/db/schema.sql`
- JSON schemas for assumptions and scenario results
- Global seed (250 countries/territories) from World Bank-based indicators

## Remaining gaps before full v0.1 done

1. Real ingest jobs
- Move from seed generation to scheduled, repeatable ingestion pipelines
- Persist snapshots in Postgres + object storage

2. Advanced map layer
- Country polygon optimizations and hover performance tuning
- Better interaction density for mobile

3. Performance goals
- Precompute preset scenarios
- Redis/edge cache instead of in-memory cache only

4. Testing
- Engine unit tests
- E2E smoke tests for dashboard/simulator/report

5. Deployment
- Staging with DB + cache + secret management + monitoring

## Suggested next sequence

1. Integrate Postgres migrations and persistence wiring
2. Implement real ingest jobs for population + water + energy
3. Refine winners/losers split by region/percentiles
4. Improve 3D map overlays and bottleneck storytelling
5. Add automated tests and CI quality gates
