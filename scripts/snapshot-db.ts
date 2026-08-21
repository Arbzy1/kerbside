/**
 * Dump every seeded table to a timestamped JSON file, as a restore point.
 *
 * The seed is deterministic from `results/WEBSITE_EXPORT.json` plus the result CSVs, so the
 * database can always be rebuilt with `npm run db:seed`. This snapshot exists for the case where
 * that is not enough: it captures exactly what the API is serving at a moment in time, so a
 * change can be inspected or reversed without re-deriving it.
 *
 *   npx tsx scripts/snapshot-db.ts                 # writes db-snapshots/<timestamp>.json
 *   npx tsx scripts/snapshot-db.ts my-label        # writes db-snapshots/<timestamp>-my-label.json
 */
import { config } from "dotenv";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDb } from "../apps/api/src/db/client";
import {
  cities,
  controls,
  experiments,
  modelResults,
  verdicts,
} from "../apps/api/src/db/schema";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
config({ path: path.join(repoRoot, ".env") });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to snapshot");
}

// Never print the credential; the host alone is enough to prove which database was captured.
const host = (() => {
  try {
    return new URL(databaseUrl).host;
  } catch {
    return "unparseable";
  }
})();

async function main() {
  const db = createDb(databaseUrl!);
  const [cityRows, experimentRows, verdictRows, modelResultRows, controlRows] =
    await Promise.all([
      db.select().from(cities),
      db.select().from(experiments),
      db.select().from(verdicts),
      db.select().from(modelResults),
      db.select().from(controls),
    ]);

  const label = process.argv[2]?.replace(/[^a-zA-Z0-9_-]/g, "") ?? "";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = path.join(repoRoot, "db-snapshots");
  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${stamp}${label ? `-${label}` : ""}.json`);

  const payload = {
    capturedAt: new Date().toISOString(),
    databaseHost: host,
    counts: {
      cities: cityRows.length,
      experiments: experimentRows.length,
      verdicts: verdictRows.length,
      modelResults: modelResultRows.length,
      controls: controlRows.length,
    },
    tables: {
      cities: cityRows,
      experiments: experimentRows,
      verdicts: verdictRows,
      modelResults: modelResultRows,
      controls: controlRows,
    },
  };

  writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");
  console.log(`Snapshot written: ${outPath}`);
  console.log(`  database host: ${host}`);
  console.log(`  ${JSON.stringify(payload.counts)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
