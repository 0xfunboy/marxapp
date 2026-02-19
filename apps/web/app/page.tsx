"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Header } from "../components/Header";
import { LabelBadge } from "../components/LabelBadge";
import { Globe3D } from "../components/Globe3D";
import { apiGet } from "../lib/api";

type DomainKey = "water" | "energy" | "food" | "health" | "education" | "internet";

type DomainStat = {
  domain: DomainKey;
  value: number;
  target: number;
  unit: string;
  source: string;
  sourceYear: number;
  coveragePct: number;
  gapModeValue: number;
  belowThresholdPopulation: number;
  label: "data" | "estimate" | "assumption";
  confidence: "high" | "medium" | "low";
};

type CountryBundle = {
  iso3: string;
  country: string;
  region: string;
  population: number;
  centroid: { lat: number; lon: number };
  year: number;
  source: string;
  perDomain: Record<DomainKey, DomainStat>;
};

type BundleResponse = {
  domains: DomainKey[];
  targetPreset: "minimum" | "dignity" | "high";
  gapMode: boolean;
  year: number;
  cache?: "hit" | "miss";
  countries: CountryBundle[];
};

const domainTitle: Record<DomainKey, string> = {
  water: "Water",
  energy: "Energy",
  food: "Food",
  health: "Health",
  education: "Education",
  internet: "Internet"
};

const domainColor: Record<DomainKey, string> = {
  water: "#2f88ff",
  energy: "#ffcd3c",
  food: "#58c27d",
  health: "#ff5ca8",
  education: "#a36dff",
  internet: "#47d1ff"
};

function avgCoverage(country: CountryBundle): number {
  return (
    (country.perDomain.water.coveragePct +
      country.perDomain.energy.coveragePct +
      country.perDomain.food.coveragePct +
      country.perDomain.health.coveragePct +
      country.perDomain.education.coveragePct +
      country.perDomain.internet.coveragePct) /
    6
  );
}

export default function HomePage() {
  const [targetPreset, setTargetPreset] = useState<"minimum" | "dignity" | "high">("dignity");
  const [gapMode, setGapMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BundleResponse | null>(null);
  const [selectedIso3, setSelectedIso3] = useState<string>("ITA");
  const [hoverIso, setHoverIso] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<BundleResponse>(`/api/v1/map-bundle?gapMode=${gapMode}&targetPreset=${targetPreset}`);
      setData(res);
      if (!res.countries.find((x) => x.iso3 === selectedIso3) && res.countries.length > 0) {
        setSelectedIso3(res.countries[0].iso3);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [gapMode, targetPreset, selectedIso3]);

  useEffect(() => {
    load();
  }, [load]);

  const selected = useMemo(() => data?.countries.find((x) => x.iso3 === selectedIso3) ?? null, [data, selectedIso3]);
  const hovered = useMemo(() => data?.countries.find((x) => x.iso3 === hoverIso) ?? null, [data, hoverIso]);

  const topGapCountries = useMemo(() => {
    if (!data) return [];
    return [...data.countries]
      .map((country) => ({ iso3: country.iso3, country: country.country, gapAvg: 100 - avgCoverage(country) }))
      .sort((a, b) => b.gapAvg - a.gapAvg)
      .slice(0, 8);
  }, [data]);

  const globalStats = useMemo(() => {
    if (!data?.countries.length) return null;
    const totalPop = data.countries.reduce((acc, c) => acc + c.population, 0);
    const avg = data.countries.reduce((acc, c) => acc + avgCoverage(c), 0) / data.countries.length;
    const underThresholdPop = data.countries.reduce(
      (acc, c) => acc + c.perDomain.water.belowThresholdPopulation + c.perDomain.energy.belowThresholdPopulation,
      0
    );
    return { totalPop, avgCoverage: avg, underThresholdPop };
  }, [data]);

  return (
    <main className="container">
      <Header />

      <section className="card" style={{ marginBottom: 14 }}>
        <h1>Global 3D Dashboard - Marxx Lens</h1>
        <p>
          Each country uses one stacked multi-color column: blue water, yellow energy, green food, pink health, purple
          education, cyan internet. Total column length shows aggregate coverage.
        </p>

        <div className="grid three" style={{ alignItems: "end" }}>
          <div>
            <label>Global target</label>
            <select value={targetPreset} onChange={(e) => setTargetPreset(e.target.value as "minimum" | "dignity" | "high") }>
              <option value="minimum">Minimum</option>
              <option value="dignity">Dignity</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label>View mode</label>
            <button className="secondary" onClick={() => setGapMode((v) => !v)}>
              {gapMode ? "Gap mode" : "Coverage mode"}
            </button>
          </div>
          <div>
            <label>Guided order</label>
            <p className="small" style={{ margin: 0 }}>
              Water - Energy - Food - Health - Education - Internet.
            </p>
          </div>
        </div>

        <p className="small" style={{ marginTop: 10 }}>
          Data: World Bank + declared fallbacks. Base year: {data?.year ?? 2024}. Cache: {data?.cache ?? "-"}. Countries: {data?.countries.length ?? 0}.
        </p>
        <p className="small">
          Method and model limits: <Link href="/method">open method page</Link>.
        </p>
      </section>

      <section className="card" style={{ marginBottom: 12 }}>
        {data && (
          <Globe3D
            countries={data.countries}
            gapMode={gapMode}
            selectedIso3={selectedIso3}
            onSelect={setSelectedIso3}
            onHoverIso={setHoverIso}
          />
        )}
        {loading && <p>Loading 3D map...</p>}
        {error && <p style={{ color: "var(--bad)" }}>{error}</p>}
      </section>

      <section className="grid three" style={{ marginBottom: 12 }}>
        <article className="card">
          <h3>Stack legend</h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {Object.entries(domainTitle).map(([key, title]) => (
              <span key={key} className="small" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 999, background: domainColor[key as DomainKey] }} />
                {title}
              </span>
            ))}
          </div>
        </article>

        <article className="card">
          <h3>Global at a glance</h3>
          <p className="small">Total population: {globalStats?.totalPop.toLocaleString("en-US") ?? "-"}</p>
          <p className="small">Average 6-domain coverage: {globalStats ? `${globalStats.avgCoverage.toFixed(1)}%` : "-"}</p>
          <p className="small">Below threshold water+energy (proxy): {globalStats?.underThresholdPop.toLocaleString("en-US") ?? "-"}</p>
        </article>

        <article className="card">
          <h3>Country hover</h3>
          <p className="small">{hovered ? `${hovered.country} (${hovered.iso3})` : "Hover a country on the globe"}</p>
          {hovered && (
            <>
              <p className="small">Average coverage: {avgCoverage(hovered).toFixed(1)}%</p>
              <p className="small">
                W:{hovered.perDomain.water.coveragePct.toFixed(0)} E:{hovered.perDomain.energy.coveragePct.toFixed(0)} F:
                {hovered.perDomain.food.coveragePct.toFixed(0)} H:{hovered.perDomain.health.coveragePct.toFixed(0)} Ed:
                {hovered.perDomain.education.coveragePct.toFixed(0)} N:{hovered.perDomain.internet.coveragePct.toFixed(0)}
              </p>
            </>
          )}
        </article>
      </section>

      <section className="grid two" style={{ marginBottom: 12 }}>
        <article className="card">
          <h3>Top global gap (avg)</h3>
          <ul>
            {topGapCountries.map((c) => (
              <li key={c.iso3}>
                {c.country} ({c.iso3}) - average gap {c.gapAvg.toFixed(1)}%
              </li>
            ))}
          </ul>
        </article>

        {selected && (
          <article className="card">
            <h3>
              {selected.country} ({selected.iso3})
            </h3>
            <p className="small">
              Region: {selected.region} | Population: {selected.population.toLocaleString("en-US")}
            </p>
            <div className="grid two">
              {(Object.keys(selected.perDomain) as DomainKey[]).map((domain) => {
                const d = selected.perDomain[domain];
                return (
                  <article key={domain} className="card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong>{domainTitle[domain]}</strong>
                      <LabelBadge label={d.label} />
                    </div>
                    <div>Coverage: {d.coveragePct}%</div>
                    <div>
                      Value: {d.value.toFixed(2)} {d.unit}
                    </div>
                    <div>
                      Target: {d.target.toFixed(2)} {d.unit}
                    </div>
                    <div className="small">Below threshold: {d.belowThresholdPopulation.toLocaleString("en-US")}</div>
                    <div className="small">Confidence: {d.confidence}</div>
                    <div className="small">Source: {d.source}</div>
                    <div className="small">Source year: {d.sourceYear}</div>
                  </article>
                );
              })}
            </div>
          </article>
        )}
      </section>
    </main>
  );
}
