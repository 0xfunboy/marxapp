"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Header } from "../../components/Header";
import { apiPost } from "../../lib/api";

type ScenarioOutput = {
  outputs: Array<{
    domain: string;
    beforeCoveragePct: number;
    afterCoveragePct: number;
    deltaPct: number;
    bottleneck: boolean;
    explanation: string;
  }>;
  assumptionsUsed: Array<{ id: string; value: number; unit: string }>;
  limits: string[];
  bottlenecks: string[];
  summaryText: string;
  cache?: "hit" | "miss";
};

const defaults = {
  transitionYears: 5 as 0 | 5 | 10,
  efficiency: "medium" as "low" | "medium" | "high",
  ethics: "equality" as "save_lives" | "equality" | "sustainability",
  patentsAbolished: false,
  targetPreset: "dignity" as "minimum" | "dignity" | "high"
};

export default function UtopiaPage() {
  const [form, setForm] = useState(defaults);
  const [result, setResult] = useState<ScenarioOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensitivity = useMemo(() => {
    if (form.efficiency === "low" || form.transitionYears === 0) return "high";
    if (form.efficiency === "high" && form.transitionYears === 10) return "low";
    return "medium";
  }, [form.efficiency, form.transitionYears]);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiPost<ScenarioOutput>("/api/v1/scenario/run", {
        ...form,
        modelVersion: "0.1.0"
      });
      setResult(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <Header />
      <section className="card" style={{ marginBottom: 12 }}>
        <h1>Utopia Simulator</h1>
        <p>Reproducible pipeline with explicit parameters. Every output includes numbers, assumptions, and limits.</p>
        <p className="small">
          Full method: <Link href="/method">sources, definitions, assumptions, and changelog</Link>.
        </p>
      </section>

      <section className="grid two" style={{ marginBottom: 12 }}>
        <article className="card">
          <label>Transition timeframe</label>
          <select
            value={form.transitionYears}
            onChange={(e) => setForm((s) => ({ ...s, transitionYears: Number(e.target.value) as 0 | 5 | 10 }))}
          >
            <option value={0}>Instant (didactic)</option>
            <option value={5}>5 years</option>
            <option value={10}>10 years</option>
          </select>

          <label style={{ marginTop: 10 }}>Organizational efficiency</label>
          <select
            value={form.efficiency}
            onChange={(e) => setForm((s) => ({ ...s, efficiency: e.target.value as "low" | "medium" | "high" }))}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <label style={{ marginTop: 10 }}>Ethical priority</label>
          <select
            value={form.ethics}
            onChange={(e) =>
              setForm((s) => ({ ...s, ethics: e.target.value as "save_lives" | "equality" | "sustainability" }))
            }
          >
            <option value="save_lives">Save lives</option>
            <option value="equality">Equality</option>
            <option value="sustainability">Sustainability</option>
          </select>

          <label style={{ marginTop: 10 }}>Target preset</label>
          <select
            value={form.targetPreset}
            onChange={(e) => setForm((s) => ({ ...s, targetPreset: e.target.value as "minimum" | "dignity" | "high" }))}
          >
            <option value="minimum">Minimum</option>
            <option value="dignity">Dignity</option>
            <option value="high">High</option>
          </select>

          <label style={{ marginTop: 10 }}>
            <input
              type="checkbox"
              checked={form.patentsAbolished}
              onChange={(e) => setForm((s) => ({ ...s, patentsAbolished: e.target.checked }))}
              style={{ width: "auto", marginRight: 8 }}
            />
            Patent abolition (health module)
          </label>

          <button style={{ marginTop: 12 }} onClick={run} disabled={loading}>
            {loading ? "Running..." : "Run Utopia"}
          </button>
          <div className="small" style={{ marginTop: 8 }}>
            Estimated sensitivity: {sensitivity}
          </div>
        </article>

        <article className="card">
          <h3>Summary (8-12 lines)</h3>
          <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontFamily: "inherit" }}>
            {result?.summaryText || "Run the scenario to view before/after output."}
          </pre>
          {result?.cache && <p className="small">Scenario cache: {result.cache}</p>}
          {error && <p style={{ color: "var(--bad)" }}>{error}</p>}
        </article>
      </section>

      {result && (
        <>
          <section className="grid three" style={{ marginBottom: 12 }}>
            {result.outputs.map((o) => (
              <article className="card" key={o.domain}>
                <strong>{o.domain}</strong>
                <div>Before: {o.beforeCoveragePct}%</div>
                <div>After: {o.afterCoveragePct}%</div>
                <div>
                  Delta: {o.deltaPct >= 0 ? "+" : ""}
                  {o.deltaPct}%
                </div>
                <div className="small">{o.explanation}</div>
              </article>
            ))}
          </section>

          <section className="grid two">
            <article className="card">
              <h3>Top 5 bottlenecks</h3>
              <ul>
                {result.bottlenecks.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </article>
            <article className="card">
              <h3>Assumptions used</h3>
              <ul>
                {result.assumptionsUsed.map((a) => (
                  <li key={a.id}>
                    {a.id}: {a.value} {a.unit}
                  </li>
                ))}
              </ul>
              <h3>Model limits</h3>
              <ul>
                {result.limits.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </article>
          </section>
        </>
      )}
    </main>
  );
}
