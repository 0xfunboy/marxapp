import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

interface RegistryEntry {
  id: string;
  source: string;
  license?: string;
  last_updated?: string;
  coverage: string;
  metric_definitions: Record<string, string>;
  default_confidence: "high" | "medium" | "low";
}

function main() {
  const filePath = resolve(process.cwd(), "src/ingest/registry.example.json");
  const raw = readFileSync(filePath, "utf-8");
  const items = JSON.parse(raw) as RegistryEntry[];

  const snapshots = items.map((item) => {
    const manifest = {
      datasetId: item.id,
      generatedAt: new Date().toISOString(),
      source: item.source,
      metrics: Object.keys(item.metric_definitions)
    };

    const hash = createHash("sha256").update(JSON.stringify(manifest)).digest("hex");

    return {
      snapshotId: `${item.id}_${new Date().toISOString().slice(0, 10).replaceAll("-", "")}`,
      hash,
      manifest
    };
  });

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ ok: true, snapshots }, null, 2));
}

main();
