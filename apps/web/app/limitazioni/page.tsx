import { Header } from "../../components/Header";

export default function LimitationsPage() {
  const limits = [
    "This is not a scientific digital twin of the planet.",
    "It does not optimize global supply chains with industrial-grade accuracy.",
    "It does not produce deterministic forecasts on crime, politics, or social stability.",
    "Governance, war, and corruption are represented only as didactic scenario parameters.",
    "Country-level proxy data can produce local inconsistencies."
  ];

  return (
    <main className="container">
      <Header />
      <section className="card">
        <h1>Limitations v0.1</h1>
        <p>Anti-propaganda page: what the model can do and what it cannot do.</p>
        <ul>
          {limits.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
