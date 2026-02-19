import { Header } from "../../components/Header";
import { apiGet } from "../../lib/api";

type Method = {
  modelVersion: string;
  domains: string[];
  datasets: Array<{
    id: string;
    year: number;
    coverage: string;
    notes: string;
    confidence: string;
  }>;
  assumptions: Array<{
    id: string;
    label: string;
    description: string;
    defaultValue: number;
    range: [number, number];
    unit: string;
    impactText: string;
    rationale: string;
  }>;
  knownUnknowns: string[];
  changelog: Array<{ version: string; date: string; changes: string[] }>;
};

async function getMethod() {
  return apiGet<Method>("/api/v1/method");
}

export default async function MethodPage() {
  const method = await getMethod();

  return (
    <main className="container">
      <Header />
      <section className="card" style={{ marginBottom: 12 }}>
        <h1>Method</h1>
        <p>
          Model version: <strong>{method.modelVersion}</strong>
        </p>
        <p>Every app output should link back here for full transparency on sources, estimates, and assumptions.</p>
      </section>

      <section className="grid two" style={{ marginBottom: 12 }}>
        <article className="card">
          <h3>Domains</h3>
          <ul>
            {method.domains.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </article>
        <article className="card">
          <h3>Known unknowns (v0.1)</h3>
          <ul>
            {method.knownUnknowns.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="card" style={{ marginBottom: 12 }}>
        <h3>Datasets (year, coverage, notes)</h3>
        <ul>
          {method.datasets.map((d) => (
            <li key={d.id}>
              {d.id} | year {d.year} | coverage: {d.coverage} | confidence: {d.confidence} | notes: {d.notes}
            </li>
          ))}
        </ul>
      </section>

      <section className="card" style={{ marginBottom: 12 }}>
        <h3>Transparency labels</h3>
        <ul>
          <li>data: direct metric from a primary source without imputation.</li>
          <li>estimate: metric derived from a declared transformation of observed values.</li>
          <li>assumption: fallback or imputation used where direct data is unavailable.</li>
        </ul>
      </section>

      <section className="card" style={{ marginBottom: 12 }}>
        <h3>Assumptions library</h3>
        <div className="grid two">
          {method.assumptions.map((a) => (
            <article className="card" key={a.id}>
              <strong>{a.label}</strong>
              <p>{a.description}</p>
              <p>
                Default: {a.defaultValue} {a.unit} | Range: {a.range[0]} - {a.range[1]}
              </p>
              <p className="small">Impact: {a.impactText}</p>
              <p className="small">Rationale: {a.rationale}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>Model changelog</h3>
        {method.changelog.map((c) => (
          <article key={c.version}>
            <strong>
              {c.version} - {c.date}
            </strong>
            <ul>
              {c.changes.map((ch) => (
                <li key={ch}>{ch}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </main>
  );
}
