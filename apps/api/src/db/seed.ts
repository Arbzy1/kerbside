import { config } from "dotenv";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { eq, sql } from "drizzle-orm";
import { createDb } from "./client";
import { cities, experiments, modelResults, verdicts } from "./schema";

const seedDir = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.resolve(seedDir, "../..");
const monorepoRoot = path.resolve(apiRoot, "../..");

config({ path: path.join(monorepoRoot, ".env") });
config({ path: path.join(apiRoot, ".env") });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed");
}

const resultsDir = path.join(monorepoRoot, "packages", "data", "results");

type CsvRow = Record<string, string>;

function parseCsvLine(line: string): string[] {
  const cols: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      cols.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cols.push(current.trim());
  return cols;
}

function parseCsv(filePath: string): CsvRow[] {
  const raw = readFileSync(filePath, "utf8").trim();
  if (!raw) {
    return [];
  }
  const lines = raw.split(/\r?\n/);
  const headerLine = lines[0];
  if (!headerLine) {
    return [];
  }
  const headers = parseCsvLine(headerLine);
  return lines.slice(1).filter(Boolean).map((line) => {
    const cols = parseCsvLine(line);
    const row: CsvRow = {};
    for (let i = 0; i < headers.length; i += 1) {
      const key = headers[i];
      if (key) {
        row[key] = (cols[i] ?? "").trim();
      }
    }
    return row;
  });
}

function requireCol(row: CsvRow, key: string): string {
  const value = row[key];
  if (value === undefined) {
    throw new Error(`Missing CSV column "${key}" in row ${JSON.stringify(row)}`);
  }
  return value;
}

function parseOptionalNumber(value: string | undefined): number | null {
  if (value === undefined || value === "") {
    return null;
  }
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid number: ${value}`);
  }
  return n;
}

function parseOptionalInt(value: string | undefined): number | null {
  const n = parseOptionalNumber(value);
  return n === null ? null : Math.trunc(n);
}

function laCodeFromName(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

const EXPERIMENT_SEED = [
  {
    slug: "exp1",
    title: "Spatial cross-validation",
    question: "How much does random KFold overstate sDNA/POI performance versus spatial CV?",
    methodNote: "n = 198 Cardiff DfT points; random KFold vs spatial GroupKFold vs leave-1-cluster-out.",
  },
  {
    slug: "exp2",
    title: "Permutation test on the POI gain",
    question: "Is the POI R² gain distinguishable from adding noise columns?",
    methodNote: "200 permutations of the POI feature block under random and spatial CV.",
  },
  {
    slug: "exp3",
    title: "Which sDNA measures actually work",
    question: "Which sDNA families and radii improve cycle-flow prediction under spatial CV?",
    methodNote: "Ablation by measure family and by radius band on Cardiff counts.",
  },
  {
    slug: "exp4",
    title: "PageRank vs betweenness",
    question: "Does PageRank / eigenvector centrality improve on sDNA betweenness?",
    methodNote: "Dual graph from the sDNA network; PageRank α ladder and eigenvector family vs sDNA baselines.",
  },
  {
    slug: "exp5",
    title: "National scale-up and Cooper 2019 tests",
    question: "Do road class and traffic composition findings hold nationally, and do models transfer across cities?",
    methodNote: "19,925 count points across 209 LAs (2019+); leave-city-out and within-city CV.",
  },
  {
    slug: "exp6",
    title: "Is the target well specified?",
    question: "Is the modelling target (cycle flow) well enough specified for feature claims?",
    methodNote: "Diagnostic checks on target definition and data coverage.",
  },
  {
    slug: "exp7",
    title: "CV streetscape features, tested properly",
    question: "Do computer-vision streetscape features improve prediction under spatial CV?",
    methodNote: "Ladder of sDNA / POI / CV feature sets with spatial CV on a small snapped sample.",
  },
] as const;

const VERDICT_SEED = [
  {
    claim: "POI gravity attractors improve flow prediction",
    verdict: "proven" as const,
    evidence: "+0.064 R², survives spatial CV, permutation p = 0.015",
    experimentSlug: "exp1",
  },
  {
    claim: "Road class substitutes for motor traffic (Cooper 2019)",
    verdict: "proven" as const,
    evidence: "+0.305 vs −0.014, n = 19,925 across 209 LAs",
    experimentSlug: "exp5",
  },
  {
    claim: "Traffic composition beats traffic volume",
    verdict: "proven" as const,
    evidence: "+0.518 vs +0.387 when bus/car split added",
    experimentSlug: "exp5",
  },
  {
    claim: "Cycle-flow models transfer between cities",
    verdict: "proven" as const,
    evidence: "transfer penalty only −0.012 across 36 LAs",
    experimentSlug: "exp5",
  },
  {
    claim: "PageRank / eigenvector centrality (his idea #6)",
    verdict: "disproven" as const,
    evidence: "−0.072 when added to sDNA; ρ = −0.02 alone",
    experimentSlug: "exp4",
  },
  {
    claim: "Global radius (radius n) is useful",
    verdict: "harmful" as const,
    evidence: "−0.392 under spatial CV",
    experimentSlug: "exp3",
  },
  {
    claim: "MAD (mean angular distance) is useful",
    verdict: "harmful" as const,
    evidence: "−0.293 under spatial CV",
    experimentSlug: "exp3",
  },
  {
    claim: "CV streetscape features don't help (Phase 6)",
    verdict: "untested" as const,
    evidence: "n = 56, median snap 69 m, permutation p = 0.407",
    experimentSlug: null,
  },
] as const;

async function upsertExperiments(db: ReturnType<typeof createDb>) {
  for (const row of EXPERIMENT_SEED) {
    await db
      .insert(experiments)
      .values(row)
      .onConflictDoUpdate({
        target: experiments.slug,
        set: {
          title: row.title,
          question: row.question,
          methodNote: row.methodNote,
        },
      });
  }
}

async function experimentIdBySlug(
  db: ReturnType<typeof createDb>,
  slug: string,
): Promise<string> {
  const rows = await db
    .select({ id: experiments.id })
    .from(experiments)
    .where(eq(experiments.slug, slug))
    .limit(1);
  const id = rows[0]?.id;
  if (!id) {
    throw new Error(`Experiment not found after seed: ${slug}`);
  }
  return id;
}

async function upsertModelResult(
  db: ReturnType<typeof createDb>,
  row: {
    experimentId: string;
    modelName: string;
    k: number | null;
    randomR2: number | null;
    spatialR2: number | null;
    locoR2: number | null;
    n: number | null;
    notes: string;
  },
) {
  // Neon HTTP driver: use raw upsert so NULL k matches NULLS NOT DISTINCT unique index.
  await db.execute(sql`
    INSERT INTO model_results (
      experiment_id, model_name, k, random_r2, spatial_r2, loco_r2, n, notes
    ) VALUES (
      ${row.experimentId}::uuid,
      ${row.modelName},
      ${row.k},
      ${row.randomR2},
      ${row.spatialR2},
      ${row.locoR2},
      ${row.n},
      ${row.notes}
    )
    ON CONFLICT (experiment_id, model_name, k, notes) DO UPDATE SET
      random_r2 = EXCLUDED.random_r2,
      spatial_r2 = EXCLUDED.spatial_r2,
      loco_r2 = EXCLUDED.loco_r2,
      n = EXCLUDED.n
  `);
}

async function seedModelResults(db: ReturnType<typeof createDb>) {
  const exp1Id = await experimentIdBySlug(db, "exp1");
  for (const row of parseCsv(path.join(resultsDir, "exp1_cv_comparison.csv"))) {
    await upsertModelResult(db, {
      experimentId: exp1Id,
      modelName: requireCol(row, "model"),
      k: parseOptionalInt(row.k),
      randomR2: parseOptionalNumber(row.random_r2),
      spatialR2: parseOptionalNumber(row.spatial_r2),
      locoR2: parseOptionalNumber(row.loco_r2),
      n: null,
      notes: "",
    });
  }

  const exp3Id = await experimentIdBySlug(db, "exp3");
  for (const row of parseCsv(path.join(resultsDir, "exp3_ablation.csv"))) {
    await upsertModelResult(db, {
      experimentId: exp3Id,
      modelName: requireCol(row, "group"),
      k: parseOptionalInt(row.k),
      randomR2: parseOptionalNumber(row.random_r2),
      spatialR2: parseOptionalNumber(row.spatial_r2),
      locoR2: null,
      n: null,
      notes: requireCol(row, "kind"),
    });
  }

  const exp4Id = await experimentIdBySlug(db, "exp4");
  for (const row of parseCsv(path.join(resultsDir, "exp4_pagerank.csv"))) {
    await upsertModelResult(db, {
      experimentId: exp4Id,
      modelName: requireCol(row, "model"),
      k: parseOptionalInt(row.k),
      randomR2: parseOptionalNumber(row.random_r2),
      spatialR2: parseOptionalNumber(row.spatial_r2),
      locoR2: null,
      n: parseOptionalInt(row.n),
      notes: "",
    });
  }

  const exp5Id = await experimentIdBySlug(db, "exp5");
  for (const row of parseCsv(path.join(resultsDir, "exp5_national.csv"))) {
    await upsertModelResult(db, {
      experimentId: exp5Id,
      modelName: requireCol(row, "spec"),
      k: null,
      randomR2: parseOptionalNumber(row.random_r2),
      spatialR2: parseOptionalNumber(row.city_out_r2),
      locoR2: null,
      n: parseOptionalInt(row.n),
      notes: requireCol(row, "question"),
    });
  }

  const exp7Id = await experimentIdBySlug(db, "exp7");
  for (const row of parseCsv(path.join(resultsDir, "exp7_ladder.csv"))) {
    await upsertModelResult(db, {
      experimentId: exp7Id,
      modelName: requireCol(row, "model"),
      k: parseOptionalInt(row.k),
      randomR2: parseOptionalNumber(row.random_r2),
      spatialR2: parseOptionalNumber(row.spatial_r2),
      locoR2: null,
      n: parseOptionalInt(row.n),
      notes: "",
    });
  }
}

async function seedCities(db: ReturnType<typeof createDb>) {
  for (const row of parseCsv(path.join(resultsDir, "exp5_per_city.csv"))) {
    const name = requireCol(row, "city");
    const nCountPoints = parseOptionalInt(row.n);
    const heldOutR2 = parseOptionalNumber(row.r2);
    if (nCountPoints === null) {
      throw new Error(`City ${name} missing n`);
    }
    if (heldOutR2 === null) {
      throw new Error(`City ${name} missing r2`);
    }
    const laCode = laCodeFromName(name);
    await db
      .insert(cities)
      .values({
        name,
        laCode,
        country: "England",
        nCountPoints,
        heldOutR2,
      })
      .onConflictDoUpdate({
        target: cities.laCode,
        set: {
          name,
          country: "England",
          nCountPoints,
          heldOutR2,
        },
      });
  }
}

const TRANSFER_SUMMARY_NOTES = "transfer_summary";

async function seedTransferSummary(db: ReturnType<typeof createDb>) {
  const exp5Id = await experimentIdBySlug(db, "exp5");
  for (const row of parseCsv(
    path.join(resultsDir, "exp5_transfer_summary.csv"),
  )) {
    const metric = requireCol(row, "metric");
    const label = requireCol(row, "label");
    await upsertModelResult(db, {
      experimentId: exp5Id,
      modelName: metric,
      k: parseOptionalInt(row.n_authorities),
      randomR2: parseOptionalNumber(row.value),
      spatialR2: null,
      locoR2: null,
      n: parseOptionalInt(row.n_points),
      notes: `${TRANSFER_SUMMARY_NOTES}|${label}`,
    });
  }
}

async function seedVerdicts(db: ReturnType<typeof createDb>) {
  for (const row of VERDICT_SEED) {
    const experimentId =
      row.experimentSlug === null
        ? null
        : await experimentIdBySlug(db, row.experimentSlug);
    await db
      .insert(verdicts)
      .values({
        claim: row.claim,
        verdict: row.verdict,
        evidence: row.evidence,
        experimentId,
      })
      .onConflictDoUpdate({
        target: verdicts.claim,
        set: {
          verdict: row.verdict,
          evidence: row.evidence,
          experimentId,
        },
      });
  }
}

async function countRows(db: ReturnType<typeof createDb>) {
  const [c, e, m, v] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(cities),
    db.select({ count: sql<number>`count(*)::int` }).from(experiments),
    db.select({ count: sql<number>`count(*)::int` }).from(modelResults),
    db.select({ count: sql<number>`count(*)::int` }).from(verdicts),
  ]);
  return {
    cities: c[0]?.count ?? 0,
    experiments: e[0]?.count ?? 0,
    modelResults: m[0]?.count ?? 0,
    verdicts: v[0]?.count ?? 0,
  };
}

async function main() {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to seed");
  }
  const db = createDb(databaseUrl);
  await upsertExperiments(db);
  await seedModelResults(db);
  await seedTransferSummary(db);
  await seedCities(db);
  await seedVerdicts(db);
  const counts = await countRows(db);
  console.log("Seed complete:", counts);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
