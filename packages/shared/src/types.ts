export type Domain =
  | "water"
  | "energy"
  | "food"
  | "health"
  | "education"
  | "internet"
  | "transport"
  | "monetary";

export type Confidence = "high" | "medium" | "low";

export type TargetPreset = "minimum" | "dignity" | "high";
export type EfficiencyPreset = "low" | "medium" | "high";
export type EthicsPreset = "save_lives" | "equality" | "sustainability";

export interface Assumption {
  id: string;
  label: string;
  description: string;
  defaultValue: number;
  range: [number, number];
  unit: string;
  impactText: string;
  rationale: string;
  version: string;
}

export interface DomainValue {
  domain: Domain;
  value: number;
  target: number;
  unit: string;
  confidence: Confidence;
  source: string;
  year: number;
  coverage: string;
  label: "data" | "estimate" | "assumption";
}

export interface CountryState {
  iso3: string;
  name: string;
  region: string;
  population: number;
  domains: Record<Domain, DomainValue>;
}

export interface ScenarioInput {
  transitionYears: 0 | 5 | 10;
  efficiency: EfficiencyPreset;
  ethics: EthicsPreset;
  patentsAbolished: boolean;
  targetPreset: TargetPreset;
  modelVersion: string;
}

export interface DomainOutcome {
  domain: Domain;
  beforeCoveragePct: number;
  afterCoveragePct: number;
  deltaPct: number;
  bottleneck: boolean;
  explanation: string;
}

export interface ScenarioOutput {
  runId: string;
  scenarioHash: string;
  modelVersion: string;
  datasetSnapshotId: string;
  outputs: DomainOutcome[];
  assumptionsUsed: Array<{ id: string; value: number; unit: string }>;
  limits: string[];
  winnersLosers: {
    gainers: string[];
    losers: string[];
  };
  bottlenecks: string[];
  summaryText: string;
}

export interface PersonalReportInput {
  countryIso3: string;
  annualIncome: number;
  incomeKind: "gross" | "net";
  netWorth?: number;
  householdSize?: number;
  scenario: ScenarioInput;
}

export interface PersonalMetricLine {
  metric: string;
  today: string;
  utopia: string;
  delta: string;
  label: "data" | "estimate" | "assumption";
  why: {
    formula: string;
    parameters: Record<string, string | number>;
    source: string;
  };
}

export interface PersonalReportOutput {
  headline: string;
  monthlyIncomeDelta: number;
  metrics: PersonalMetricLine[];
  tradeOffs: string[];
  disclaimer: string;
}
