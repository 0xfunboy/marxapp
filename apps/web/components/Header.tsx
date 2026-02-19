import Link from "next/link";

export function Header() {
  return (
    <header className="header">
      <div className="brand">MARXXAPP v0.1</div>
      <nav className="nav">
        <Link href="/">Dashboard</Link>
        <Link href="/utopia">Utopia Simulator</Link>
        <Link href="/report">Personal Report</Link>
        <Link href="/method">Method</Link>
        <Link href="/limitations">Limitations</Link>
      </nav>
    </header>
  );
}
