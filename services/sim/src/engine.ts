import {
  ASSUMPTIONS,
  COUNTRY_CENTROIDS,
  COUNTRY_STATES,
  MODEL_VERSION,
  TARGET_MULTIPLIERS,
  type CountryState,
  type Domain,
  type DomainOutcome,
  type ScenarioInput,
  type ScenarioOutput
} from "@marxapp/shared";

const CORE_DOMAINS: Domain[] = [
  "water",
  "energy",
  "food",
  "health",
  "education",
  "internet",
  "transport",
  "monetary"
];
export const DASHBOARD_DOMAINS: Domain[] = ["water", "energy", "food", "health", "education", "internet"];

const ethicsWeights: Record<ScenarioInput["ethics"], Record<Domain, number>> = {
  save_lives: {
    water: 1.25,
    energy: 1,
    food: 1.2,
    health: 1.4,
    education: 0.8,
    internet: 0.75,
    transport: 0.8,
    monetary: 0.7
  },
  equality: {
    water: 1,
    energy: 1,
    food: 1,
    health: 1,
    education: 1,
    internet: 1,
    transport: 1,
    monetary: 1
  },
  sustainability: {
    water: 1.1,
    energy: 0.95,
    food: 1,
    health: 1,
    education: 1,
    internet: 1,
    transport: 0.85,
    monetary: 0.8
  }
};

const efficiencyMultiplier: Record<ScenarioInput["efficiency"], number> = {
  low: 0.8,
  medium: 1,
  high: 1.15
};

const transitionShock: Record<ScenarioInput["transitionYears"], number> = {
  0: 0.18,
  5: 0.1,
  10: 0.05
};

function coverageRatio(value: number, target: number): number {
  if (target <= 0) return 1;
  return Math.min(1, value / target);
}

function scenarioHash(input: ScenarioInput): string {
  return Buffer.from(JSON.stringify(input)).toString("base64url").slice(0, 16);
}

function domainTotals(domain: Domain, countries: CountryState[], targetMultiplier: number) {
  let need = 0;
  let capacity = 0;
  for (const c of countries) {
    const d = c.domains[domain];
    need += d.target * targetMultiplier * c.population;
    capacity += d.value * c.population;
  }
  return { need, capacity };
}

function computeDomainOutcome(domain: Domain, input: ScenarioInput): DomainOutcome {
  const targetMultiplier = TARGET_MULTIPLIERS[input.targetPreset];
  const totals = domainTotals(domain, COUNTRY_STATES, targetMultiplier);

  const baseCoverage = totals.need === 0 ? 1 : Math.min(1, totals.capacity / totals.need);
  const surplus = Math.max(0, totals.capacity - totals.need);
  const gap = Math.max(0, totals.need - totals.capacity);

  const logisticsCostFactor =
    domain === "water"
      ? 0.22
      : domain === "energy"
        ? 0.2
        : domain === "transport"
          ? 0.24
          : domain === "monetary"
            ? 0.1
            : 0.15;
  const effectiveAllocation =
    surplus *
    efficiencyMultiplier[input.efficiency] *
    ethicsWeights[input.ethics][domain] *
    (1 - transitionShock[input.transitionYears]) *
    (1 - logisticsCostFactor);

  const patentsBoost = input.patentsAbolished && domain === "health" ? 1.12 : 1;
  const afterGap = Math.max(0, gap - effectiveAllocation * patentsBoost);
  const afterCoverage = totals.need === 0 ? 1 : Math.min(1, 1 - afterGap / totals.need);

  const delta = (afterCoverage - baseCoverage) * 100;
  const isBottleneck = afterCoverage < 0.92;

  return {
    domain,
    beforeCoveragePct: Number((baseCoverage * 100).toFixed(2)),
    afterCoveragePct: Number((afterCoverage * 100).toFixed(2)),
    deltaPct: Number(delta.toFixed(2)),
    bottleneck: isBottleneck,
    explanation:
      afterCoverage >= 0.99
        ? "The gap is almost closed with the current parameters."
        : "Residual gaps remain due to capacity and logistics constraints in the selected timeframe."
  };
}

export function runScenario(input: ScenarioInput): ScenarioOutput {
  const normalized: ScenarioInput = {
    ...input,
    modelVersion: input.modelVersion || MODEL_VERSION
  };

  const outputs = CORE_DOMAINS.map((d) => computeDomainOutcome(d, normalized));
  const bottlenecks = outputs
    .filter((x) => x.bottleneck)
    .sort((a, b) => a.afterCoveragePct - b.afterCoveragePct)
    .slice(0, 5)
    .map((x) => `${x.domain}: coverage ${x.afterCoveragePct}%`);

  const gainers = COUNTRY_STATES.filter((c) => c.domains.monetary.value < c.domains.monetary.target).map(
    (c) => c.name
  );
  const losers = COUNTRY_STATES.filter((c) => c.domains.monetary.value > c.domains.monetary.target).map(
    (c) => c.name
  );

  const lines = [
    `Scenario ${normalized.targetPreset} with ${normalized.transitionYears === 0 ? "instant" : `${normalized.transitionYears}-year`} transition.`,
    `Organizational efficiency ${normalized.efficiency}, ethical priority ${normalized.ethics}.`,
    normalized.patentsAbolished
      ? "Patent abolition: enabled (didactic boost for the health domain)."
      : "Patent abolition: disabled.",
    "Domains with residual gaps are listed in the bottlenecks panel.",
    "Didactic output: this is not a political or geopolitical forecast.",
    "Every result depends on country-level proxies and explicit assumptions.",
    "Use sliders to perform sensitivity analysis.",
    "Always check confidence and dataset year."
  ];

  return {
    runId: `run_${Date.now()}`,
    scenarioHash: scenarioHash(normalized),
    modelVersion: MODEL_VERSION,
    datasetSnapshotId: "snapshot_2024_mock_v1",
    outputs,
    assumptionsUsed: ASSUMPTIONS.map((a) => ({
      id: a.id,
      value: a.defaultValue,
      unit: a.unit
    })),
    limits: [
      "Country-level resolution only, no subnational granularity in v0.1.",
      "Logistics are modeled with simplified proxies, not real supply-chain optimization.",
      "Social and political effects are excluded: didactic scenario only.",
      "Monetary model is simplified and intentionally non-dominant."
    ],
    winnersLosers: {
      gainers,
      losers
    },
    bottlenecks,
    summaryText: lines.join("\n")
  };
}

export function computeGlobalLayer(domain: Domain, gapMode: boolean, targetPreset: ScenarioInput["targetPreset"]) {
  const multiplier = TARGET_MULTIPLIERS[targetPreset];

  return COUNTRY_STATES.map((country) => {
    const dv = country.domains[domain];
    const target = dv.target * multiplier;
    const coverage = coverageRatio(dv.value, target);

    return {
      iso3: country.iso3,
      country: country.name,
      region: country.region,
      centroid: COUNTRY_CENTROIDS[country.iso3] ?? { lat: 0, lon: 0 },
      year: dv.year,
      source: dv.source,
      confidence: dv.confidence,
      value: dv.value,
      target,
      unit: dv.unit,
      coveragePct: Number((coverage * 100).toFixed(2)),
      belowThresholdPopulation: Math.round(country.population * (1 - coverage)),
      gapModeValue: gapMode ? Number((1 - coverage).toFixed(4)) : Number(coverage.toFixed(4)),
      label: dv.label
    };
  });
}

export function computeGlobalBundle(gapMode: boolean, targetPreset: ScenarioInput["targetPreset"]) {
  return COUNTRY_STATES.map((country) => {
    const perDomain = Object.fromEntries(
      DASHBOARD_DOMAINS.map((domain) => {
        const dv = country.domains[domain];
        const target = dv.target * TARGET_MULTIPLIERS[targetPreset];
        const coverage = coverageRatio(dv.value, target);

        return [
          domain,
          {
            domain,
            value: dv.value,
            target,
            unit: dv.unit,
            source: dv.source,
            sourceYear: dv.year,
            coveragePct: Number((coverage * 100).toFixed(2)),
            gapModeValue: gapMode ? Number((1 - coverage).toFixed(4)) : Number(coverage.toFixed(4)),
            belowThresholdPopulation: Math.round(country.population * (1 - coverage)),
            label: dv.label,
            confidence: dv.confidence
          }
        ];
      })
    );

    return {
      iso3: country.iso3,
      country: country.name,
      region: country.region,
      population: country.population,
      centroid: COUNTRY_CENTROIDS[country.iso3] ?? { lat: 0, lon: 0 },
      year: 2024,
      source: "World Bank indicators + declared proxy fallback",
      perDomain
    };
  });
}
