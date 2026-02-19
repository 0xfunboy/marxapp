import cors from "cors";
import express from "express";
import { z } from "zod";
import {
  ASSUMPTIONS,
  COUNTRY_STATES,
  MODEL_VERSION,
  AVAILABLE_DOMAINS,
  type Domain,
  type PersonalReportOutput,
  type ScenarioInput
} from "@marxapp/shared";
import { DASHBOARD_DOMAINS, computeGlobalBundle, computeGlobalLayer, runScenario } from "@marxapp/sim";

const app = express();
app.use(cors());
app.use(express.json());

const scenarioSchema = z.object({
  transitionYears: z.union([z.literal(0), z.literal(5), z.literal(10)]),
  efficiency: z.union([z.literal("low"), z.literal("medium"), z.literal("high")]),
  ethics: z.union([z.literal("save_lives"), z.literal("equality"), z.literal("sustainability")]),
  patentsAbolished: z.boolean(),
  targetPreset: z.union([z.literal("minimum"), z.literal("dignity"), z.literal("high")]),
  modelVersion: z.string().optional()
});

const personalInputSchema = z.object({
  countryIso3: z.string().length(3),
  annualIncome: z.number().positive(),
  incomeKind: z.union([z.literal("gross"), z.literal("net")]),
  netWorth: z.number().optional(),
  householdSize: z.number().int().positive().optional(),
  scenario: scenarioSchema
});

const scenarioCache = new Map<string, ReturnType<typeof runScenario>>();
const mapLayerCache = new Map<string, ReturnType<typeof computeGlobalLayer>>();
const mapBundleCache = new Map<string, ReturnType<typeof computeGlobalBundle>>();

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "marxapp-api",
    modelVersion: MODEL_VERSION,
    now: new Date().toISOString()
  });
});

app.get("/api/v1/indicators", (req, res) => {
  const country = String(req.query.country || "").toUpperCase();
  const year = Number(req.query.year || 2024);

  const state = COUNTRY_STATES.find((c) => c.iso3 === country);
  if (!state) {
    return res.status(404).json({ error: "Country not found" });
  }

  const indicators = Object.values(state.domains).map((d) => ({ ...d, year }));
  return res.json({
    country: state.iso3,
    year,
    indicators,
    meta: {
      source: "World Bank-driven didactic bundle",
      confidence: "mixed",
      definitions: "v0.1 educational proxy mappings"
    }
  });
});

app.get("/api/v1/map-layer", (req, res) => {
  const domain = String(req.query.domain || "water") as Domain;
  const gapMode = String(req.query.gapMode || "false") === "true";
  const targetPreset = String(req.query.targetPreset || "dignity") as ScenarioInput["targetPreset"];
  if (!AVAILABLE_DOMAINS.includes(domain)) {
    return res.status(400).json({ error: `Invalid domain: ${domain}` });
  }

  const key = `${domain}:${gapMode}:${targetPreset}`;
  const cached = mapLayerCache.get(key);
  if (cached) {
    return res.json({
      domain,
      gapMode,
      targetPreset,
      year: 2024,
      layer: cached,
      cache: "hit"
    });
  }

  const layer = computeGlobalLayer(domain, gapMode, targetPreset);
  mapLayerCache.set(key, layer);
  return res.json({
    domain,
    gapMode,
    targetPreset,
    year: 2024,
    layer,
    cache: "miss"
  });
});

app.get("/api/v1/map-bundle", (req, res) => {
  const gapMode = String(req.query.gapMode || "true") === "true";
  const targetPreset = String(req.query.targetPreset || "dignity") as ScenarioInput["targetPreset"];
  const key = `${gapMode}:${targetPreset}:bundle:v2`;
  const cached = mapBundleCache.get(key);

  if (cached) {
    return res.json({
      domains: DASHBOARD_DOMAINS,
      gapMode,
      targetPreset,
      year: 2024,
      countries: cached,
      cache: "hit"
    });
  }

  const countries = computeGlobalBundle(gapMode, targetPreset);
  mapBundleCache.set(key, countries);

  return res.json({
    domains: DASHBOARD_DOMAINS,
    gapMode,
    targetPreset,
    year: 2024,
    countries,
    cache: "miss"
  });
});

app.post("/api/v1/scenario/run", (req, res) => {
  const parsed = scenarioSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const payload: ScenarioInput = {
    ...parsed.data,
    modelVersion: parsed.data.modelVersion ?? MODEL_VERSION
  };

  const key = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const cached = scenarioCache.get(key);
  if (cached) {
    return res.json({ ...cached, cache: "hit" });
  }

  const output = runScenario(payload);
  scenarioCache.set(key, output);

  return res.json({ ...output, cache: "miss" });
});

app.post("/api/v1/report/personal", (req, res) => {
  const parsed = personalInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const data = parsed.data;
  const scenario = runScenario({
    ...data.scenario,
    modelVersion: data.scenario.modelVersion ?? MODEL_VERSION
  });

  const country = COUNTRY_STATES.find((c) => c.iso3 === data.countryIso3.toUpperCase());
  if (!country) {
    return res.status(404).json({ error: "Country not found" });
  }

  const regionalAdjustment = country.domains.monetary.value / country.domains.monetary.target;
  const equalityFactor = data.scenario.ethics === "equality" ? 1.04 : 1;
  const monthlyNow = data.annualIncome / 12;
  const monthlyUtopia = (country.domains.monetary.target / 12) * equalityFactor * Math.min(1.2, 1 / regionalAdjustment);
  const monthlyIncomeDelta = Number((monthlyUtopia - monthlyNow).toFixed(2));

  const report: PersonalReportOutput = {
    headline: `${country.name}: personal impact in Utopia scenario (${data.scenario.targetPreset})`,
    monthlyIncomeDelta,
    metrics: [
      {
        metric: "Monthly income",
        today: `$${monthlyNow.toFixed(2)}`,
        utopia: `$${monthlyUtopia.toFixed(2)}`,
        delta: `${monthlyIncomeDelta >= 0 ? "+" : ""}$${monthlyIncomeDelta}`,
        label: "estimate",
        why: {
          formula: "(country_monetary_target / 12) * equality_factors - current_monthly_income",
          parameters: {
            country_monetary_target: country.domains.monetary.target,
            equality_factor: equalityFactor,
            regional_adjustment: Number(regionalAdjustment.toFixed(3))
          },
          source: "Marxapp didactic monetary proxy v0.1"
        }
      },
      ...scenario.outputs.slice(0, 6).map((out) => ({
        metric: `${out.domain} access`,
        today: `${out.beforeCoveragePct}%`,
        utopia: `${out.afterCoveragePct}%`,
        delta: `${out.deltaPct >= 0 ? "+" : ""}${out.deltaPct}%`,
        label: "estimate" as const,
        why: {
          formula: "coverage_after - coverage_before",
          parameters: {
            before: out.beforeCoveragePct,
            after: out.afterCoveragePct,
            scenario_hash: scenario.scenarioHash
          },
          source: "Scenario engine v0.1"
        }
      }))
    ],
    tradeOffs: [
      "Essential service coverage improves where structural gaps exist.",
      "Relative income can decline in high-surplus countries.",
      "Fast transitions increase frictions and logistics bottlenecks."
    ],
    disclaimer:
      "Didactic report: estimates are based on country-level proxies. Personal inputs are not stored on the server."
  };

  return res.json(report);
});

app.post("/api/v1/report/personal/export", (req, res) => {
  const parsed = personalInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const data = parsed.data;
  const scenario = runScenario({
    ...data.scenario,
    modelVersion: data.scenario.modelVersion ?? MODEL_VERSION
  });

  const country = COUNTRY_STATES.find((c) => c.iso3 === data.countryIso3.toUpperCase());
  if (!country) {
    return res.status(404).json({ error: "Country not found" });
  }

  const monthlyNow = data.annualIncome / 12;
  const monthlyUtopia = country.domains.monetary.target / 12;
  const delta = monthlyUtopia - monthlyNow;

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Marxapp Personal Report</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 24px; color: #111; }
      h1, h2 { margin: 0 0 8px 0; }
      .muted { color: #555; font-size: 12px; }
      .watermark { position: fixed; top: 45%; left: 15%; opacity: 0.09; font-size: 56px; transform: rotate(-20deg); }
      table { width: 100%; border-collapse: collapse; margin-top: 14px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    </style>
  </head>
  <body>
    <div class="watermark">didactic simulation</div>
    <h1>Marxapp Personal Impact Report</h1>
    <p class="muted">ModelVersion ${MODEL_VERSION} | ScenarioHash ${scenario.scenarioHash}</p>
    <h2>${country.name}</h2>
    <p>Monthly income today: $${monthlyNow.toFixed(2)} | Utopia: $${monthlyUtopia.toFixed(2)} | Delta: ${delta >= 0 ? "+" : ""}$${delta.toFixed(2)}</p>
    <table>
      <thead><tr><th>Domain</th><th>Before</th><th>After</th><th>Delta</th></tr></thead>
      <tbody>
      ${scenario.outputs
        .map(
          (o) =>
            `<tr><td>${o.domain}</td><td>${o.beforeCoveragePct}%</td><td>${o.afterCoveragePct}%</td><td>${o.deltaPct >= 0 ? "+" : ""}${o.deltaPct}%</td></tr>`
        )
        .join("")}
      </tbody>
    </table>
    <p class="muted">Didactic report based on country-level proxies.</p>
  </body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.status(200).send(html);
});

app.get("/api/v1/method", (_req, res) => {
  return res.json({
    modelVersion: MODEL_VERSION,
    domains: ["water", "energy", "food", "health", "education", "internet", "transport", "monetary"],
    assumptions: ASSUMPTIONS,
    knownUnknowns: [
      "Supply-chain dynamics and infrastructure lead-times are simplified.",
      "No deterministic forecast of political stability or public safety.",
      "v0.1 uses mostly country-level resolution."
    ],
    datasets: [
      {
        id: "wb_population",
        year: 2023,
        coverage: "country-level global (250 countries/territories)",
        notes: "World Bank indicator SP.POP.TOTL",
        confidence: "high"
      },
      {
        id: "wb_essential_services_bundle_v1",
        year: 2023,
        coverage: "country-level global (250 countries/territories)",
        notes:
          "Water SH.H2O.BASW.ZS, Energy EG.USE.ELEC.KH.PC / EG.ELC.ACCS.ZS fallback, Food SN.ITK.DEFC.ZS, Health SH.XPD.CHEX.PC.CD, Education SE.ADT.LITR.ZS, Internet IT.NET.USER.ZS, Income NY.GNP.PCAP.PP.CD",
        confidence: "medium"
      }
    ],
    changelog: [
      {
        version: "0.1.1",
        date: "2026-02-19",
        changes: [
          "3D dashboard with country-level multi-color stacked columns",
          "Country-border hover highlighting over satellite texture",
          "Dataset seed upgraded to World Bank indicators with declared regional fallbacks"
        ]
      },
      {
        version: "0.1.0",
        date: "2026-02-19",
        changes: [
          "Initial didactic MVP release",
          "Scenario engine with gap/surplus + bottleneck extraction",
          "Personal report with explainability"
        ]
      }
    ]
  });
});

app.get("/api/v1/assumptions", (_req, res) => {
  return res.json({
    modelVersion: MODEL_VERSION,
    presets: {
      minimum: { targetMultiplier: 0.85, description: "Minimum essential-service thresholds" },
      dignity: { targetMultiplier: 1, description: "Baseline dignity thresholds" },
      high: { targetMultiplier: 1.15, description: "Higher baseline wellbeing thresholds" }
    },
    assumptions: ASSUMPTIONS
  });
});

const port = Number(process.env.PORT || 4100);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`marxapp-api listening on :${port}`);
});
