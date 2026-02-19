"use client";

import { useState } from "react";
import { Header } from "../../components/Header";
import { LabelBadge } from "../../components/LabelBadge";
import { API_BASE, apiPost } from "../../lib/api";

type Report = {
  headline: string;
  monthlyIncomeDelta: number;
  metrics: Array<{
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
  }>;
  tradeOffs: string[];
  disclaimer: string;
};

export default function ReportPage() {
  const [countryIso3, setCountryIso3] = useState("ITA");
  const [annualIncome, setAnnualIncome] = useState(30000);
  const [incomeKind, setIncomeKind] = useState<"gross" | "net">("net");
  const [netWorth, setNetWorth] = useState(0);
  const [householdSize, setHouseholdSize] = useState(1);
  const [report, setReport] = useState<Report | null>(null);
  const [openWhy, setOpenWhy] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  async function generate() {
    const res = await apiPost<Report>("/api/v1/report/personal", {
      countryIso3,
      annualIncome,
      incomeKind,
      netWorth,
      householdSize,
      scenario: {
        transitionYears: 5,
        efficiency: "medium",
        ethics: "equality",
        patentsAbolished: true,
        targetPreset: "dignity"
      }
    });

    setReport(res);
  }

  async function exportPrintable() {
    setExporting(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/report/personal/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countryIso3,
          annualIncome,
          incomeKind,
          netWorth,
          householdSize,
          scenario: {
            transitionYears: 5,
            efficiency: "medium",
            ethics: "equality",
            patentsAbolished: true,
            targetPreset: "dignity"
          }
        })
      });
      if (!res.ok) {
        throw new Error(`Export failed: ${res.status}`);
      }
      const html = await res.text();
      const popup = window.open("", "_blank");
      if (popup) {
        popup.document.write(html);
        popup.document.close();
        popup.focus();
      }
    } finally {
      setExporting(false);
    }
  }

  return (
    <main className="container">
      <Header />
      <section className="card" style={{ marginBottom: 12 }}>
        <h1>Personal Impact Report</h1>
        <p>Personal inputs are used only for this calculation and are not stored by default.</p>
      </section>

      <section className="grid two" style={{ marginBottom: 12 }}>
        <article className="card">
          <label>Country (ISO3)</label>
          <input value={countryIso3} onChange={(e) => setCountryIso3(e.target.value.toUpperCase())} maxLength={3} />

          <label style={{ marginTop: 8 }}>Annual income</label>
          <input type="number" value={annualIncome} onChange={(e) => setAnnualIncome(Number(e.target.value) || 0)} />

          <label style={{ marginTop: 8 }}>Income type</label>
          <select value={incomeKind} onChange={(e) => setIncomeKind(e.target.value as "gross" | "net")}>
            <option value="gross">Gross</option>
            <option value="net">Net</option>
          </select>

          <label style={{ marginTop: 8 }}>Net worth (optional)</label>
          <input type="number" value={netWorth} onChange={(e) => setNetWorth(Number(e.target.value) || 0)} />

          <label style={{ marginTop: 8 }}>Household size (optional)</label>
          <input type="number" value={householdSize} onChange={(e) => setHouseholdSize(Number(e.target.value) || 1)} />

          <button style={{ marginTop: 12 }} onClick={generate}>
            Generate report
          </button>
        </article>

        <article className="card">
          <h3>PDF export (v0.1 simple)</h3>
          <p className="small">
            Generate a printable view with the "didactic simulation" watermark, then use "Print &gt; Save as PDF".
          </p>
          <button onClick={exportPrintable} disabled={exporting}>
            {exporting ? "Preparing export..." : "Export PDF (print)"}
          </button>
          {report && (
            <>
              <h3>{report.headline}</h3>
              <div className="kpi">{report.monthlyIncomeDelta >= 0 ? "+" : ""}${report.monthlyIncomeDelta}</div>
              <p>Estimated monthly income delta</p>
            </>
          )}
        </article>
      </section>

      {report && (
        <section className="card">
          <h3>Trade-offs</h3>
          <ul>
            {report.tradeOffs.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>

          <h3>Metric details</h3>
          <div className="grid two">
            {report.metrics.map((m) => (
              <article className="card" key={m.metric}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong>{m.metric}</strong>
                  <LabelBadge label={m.label} />
                </div>
                <div>Today: {m.today}</div>
                <div>Utopia: {m.utopia}</div>
                <div>Delta: {m.delta}</div>
                <button className="secondary" style={{ marginTop: 8 }} onClick={() => setOpenWhy(openWhy === m.metric ? null : m.metric)}>
                  Why?
                </button>
                {openWhy === m.metric && (
                  <div className="small" style={{ marginTop: 8 }}>
                    <div>Formula: {m.why.formula}</div>
                    <div>Parameters: {JSON.stringify(m.why.parameters)}</div>
                    <div>Source: {m.why.source}</div>
                  </div>
                )}
              </article>
            ))}
          </div>

          <p className="small" style={{ marginTop: 12 }}>
            {report.disclaimer}
          </p>
        </section>
      )}
    </main>
  );
}
