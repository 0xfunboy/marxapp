export function LabelBadge({ label }: { label: "data" | "estimate" | "assumption" }) {
  return <span className={`badge ${label}`}>{label}</span>;
}
