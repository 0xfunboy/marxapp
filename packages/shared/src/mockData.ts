import worldbankSeed from "./data/worldbank.seed.json";
import type { Confidence, CountryState, Domain } from "./types";

const year = 2024;
const domains: Domain[] = [
  "water",
  "energy",
  "food",
  "health",
  "education",
  "internet",
  "transport",
  "monetary"
];

type SeedDomain = {
  value: number;
  target: number;
  unit: string;
  source: string;
  sourceYear: number;
  confidence: Confidence;
  imputed: boolean;
};

type SeedCountry = {
  iso3: string;
  name: string;
  region: string;
  subregion: string;
  population: number;
  lat: number;
  lon: number;
  metrics: Record<Domain, SeedDomain>;
};

function labelFromConfidence(confidence: Confidence, imputed: boolean): "data" | "estimate" | "assumption" {
  if (imputed) return "assumption";
  if (confidence === "high") return "data";
  if (confidence === "medium") return "estimate";
  return "assumption";
}

function domainBlock(domain: Domain, seed: SeedDomain) {
  const label = labelFromConfidence(seed.confidence, seed.imputed);
  return {
    domain,
    value: seed.value,
    target: seed.target,
    unit: seed.unit,
    confidence: seed.confidence,
    source: seed.source,
    year: seed.sourceYear || year,
    coverage: "country-level",
    label
  };
}

const countries = worldbankSeed as SeedCountry[];

export const COUNTRY_STATES: CountryState[] = countries.map((country) => ({
  iso3: country.iso3,
  name: country.name,
  region: country.region,
  population: country.population,
  domains: {
    water: domainBlock("water", country.metrics.water),
    energy: domainBlock("energy", country.metrics.energy),
    food: domainBlock("food", country.metrics.food),
    health: domainBlock("health", country.metrics.health),
    education: domainBlock("education", country.metrics.education),
    internet: domainBlock("internet", country.metrics.internet),
    transport: domainBlock("transport", country.metrics.transport),
    monetary: domainBlock("monetary", country.metrics.monetary)
  }
}));

export const AVAILABLE_DOMAINS = domains;

export const COUNTRY_CENTROIDS: Record<string, { lat: number; lon: number }> = Object.fromEntries(
  countries.map((country) => [country.iso3, { lat: country.lat, lon: country.lon }])
);
