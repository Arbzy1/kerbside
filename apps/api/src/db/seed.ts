import { config } from "dotenv";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { eq, sql } from "drizzle-orm";
import { STUDY_CITIES } from "@kerbside/shared";
import { createDb } from "./client";
import { cities, controls, experiments, modelResults, verdicts } from "./schema";

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

function mean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function sd(values: number[]): number {
  if (values.length < 2) {
    return 0;
  }
  const m = mean(values);
  const variance =
    values.reduce((acc, v) => acc + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
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
    methodNote: "19,925 count points across 209 LAs (2019+); leave-city-out and within-city CV. exp5b extends to all roads.",
  },
  {
    slug: "exp6",
    title: "Is the target well specified?",
    question: "Is the modelling target (cycle flow) well enough specified for feature claims?",
    methodNote: "Diagnostic checks on target definition and data coverage.",
  },
  {
    slug: "exp7",
    title: "CV streetscape features under spatial CV",
    question: "Do computer-vision streetscape features improve prediction under spatial CV?",
    methodNote: "Ladder of sDNA / POI / CV feature sets with spatial CV on a small snapped sample.",
  },
  {
    slug: "absorption",
    title: "Absorption ladder (stage 2, one prepared network)",
    question: "Once attractors are inside the assignment, do attractor covariates stop helping — and is the path monotonic?",
    methodNote:
      "K61 rebuild: all four rungs on prep3d_uniform. Stage-2 δ = POI-covariate contribution. Cardiff monotonic; Manchester and Bristol are not.",
  },
  {
    slug: "controls",
    title: "Random-weight controls",
    question: "Does the real gravity / absorption effect sit outside a random-weight null?",
    methodNote: "K55 / K55b Cardiff and K58 Manchester: 20 curve random-weight draws each.",
  },
  {
    slug: "slope",
    title: "Slope matched isolation",
    question: "Does 3-D slope improve prediction once the network is held fixed?",
    methodNote: "K60 matched isolation: cycle − hybrid on identical features. Terrain-conditional.",
  },
  {
    slug: "transfer",
    title: "Pooled calibration and leave-one-city-out",
    question:
      "Does ranking transfer across cities, and does scale transfer without a local intercept?",
    methodNote:
      "K173/K172 on 12 working cities (London boroughs out). Fit on k cities, predict a held-out one; shuffled-city null; then ten local counts with slopes frozen (local intercept). Quote r² and R² together. Do not quote in-sample pooled city-FE as transfer.",
  },
  {
    slug: "radius",
    title: "Radius envelope and attractor-weight factorial",
    question:
      "Does widening the betweenness radius envelope improve prediction, and is it the same lever as attractor weighting?",
    methodNote:
      "K80 three-city ladder, restated at twelve cities by K174 leave-one-city-out. K181 puts an interval on it: 800/1600/3200 beats the narrow envelope by +0.021 r² (95% CI +0.012 to +0.032, 11 of 12 cities) but is NOT separable from the wide one (+0.003, CI -0.012 to +0.017, 7 of 12, sign p=0.774). Retained on C1's pre-declared r² tie-break, not because it won. Within-city winners split three ways. Quote r² and R² together; do not say wide wins, and do not say baseline wins.",
  },
  {
    slug: "turn_cost",
    title: "Turn-cost sweep on the cycle preset",
    question: "Does sDNA's cycle preset under-penalise turns on larger networks?",
    methodNote:
      "K81 + K94 on the original envelope; restated at 800/1600/3200 on K170 bike networks by K81c. Manchester's 430 m peak does not survive; do not quote 430 m as the turn result.",
  },
  {
    slug: "gva",
    title: "LSOA GVA against pedestrian and vehicular accessibility",
    question:
      "Does LSOA GVA correlate better with pedestrian accessibility than with vehicular measures?",
    methodNote:
      "K82/K89: Cardiff walk network (53k links) vs drive arms; PageRank and PT accessibility on the pedestrian network.",
  },
  {
    slug: "elevation",
    title: "DEM gradient correction",
    question: "Does correcting implausible DEM gradients change the slope effect?",
    methodNote:
      "K83: dose-ordered corrections in three cities; registered Bristol prediction failed.",
  },
  {
    slug: "mode_share",
    title: "Census mode-share transfer",
    question:
      "Does network structure predict who chooses to cycle in a transferable way?",
    methodNote: "K85: Census 2021 travel-to-work by LSOA; pooled vs leave-one-city-out.",
  },
  {
    slug: "rail",
    title: "ORR station usage as a PT outcome",
    question: "Can network structure predict public-transport station usage?",
    methodNote: "K90: ORR station volumes (n=85) — UKRailFlows O/D maps only, no licensed flows.",
  },
  {
    slug: "estimator",
    title: "Noise-floor estimators (mean-per-fold vs pooled OOF)",
    question:
      "Does switching to pooled out-of-fold R² buy free sensitivity without new sDNA runs?",
    methodNote:
      "K91: floors and detection limits by city; K94: re-score prior 'within floor' contrasts under the better estimator.",
  },
  {
    slug: "slope_ladder",
    title: "Slope cost-function ladder",
    question:
      "Is sDNA's published cycle slope calibration optimal, or do the six unused constants move prediction?",
    methodNote:
      "K96: three-city sweep of exponent, steepness factors and band edges under pooled-OOF. Run at radii=400,800,1600; superseded by K97 at the corrected envelope — see C23.",
  },
  {
    slug: "slope_x_radius",
    title: "Slope exponent × radius envelope",
    question:
      "Do the slope and radius gains stack, and does the optimal exponent depend on the radius?",
    methodNote:
      "K97: 2×2 factorial plus per-city exponent ladders at both envelopes, pooled-OOF. The wide preset arm reproduces the independently built radius result exactly in all three cities.",
  },
  {
    slug: "multimodal",
    title: "Multimodal PUBLIC_TRANSPORT network",
    question:
      "Can sDNA's native multimodal metric be built correctly, and does it predict station usage?",
    methodNote:
      "K93: verified multimodal build + underpowered n=26 ORR test. Method result, not a demand claim.",
  },
  {
    slug: "pt_accessibility",
    title: "Public-transport accessibility",
    question:
      "Does correctly specified public-transport accessibility add predictive value?",
    methodNote:
      "K114/K115: rail-inclusive accessibility, tested at both the inherited and city-preferred radius envelopes and on the pedestrian network.",
  },
  {
    slug: "pedestrian",
    title: "Pedestrian-network tests",
    question:
      "Do pedestrian accessibility results depend on the inherited cycling radius envelope?",
    methodNote:
      "K82/K89/K112: Cardiff pedestrian network, GVA proxy outcome, and a five-rung walking-scale radius ladder.",
  },
  {
    slug: "cycle_provision",
    title: "Cycle provision as routing impedance",
    question:
      "Does penalising links without mapped cycle infrastructure improve cycle-flow prediction?",
    methodNote:
      "K130/K133–K135/K141: OpenStreetMap provision classes, direct lineformula impedance ladders, city replication, leave-one-city-out, permutation nulls, and a road-hierarchy placebo.",
  },
  {
    slug: "cycle_detection",
    title: "Street View cycle-lane detection",
    question:
      "Why did repeated computer-vision lane detection fail?",
    methodNote:
      "K103/K104/K108 close lane detection as triple-negative; K139b isolates capture geometry as a necessary-condition failure. This is separate from the successful OSM-based provision test.",
  },
  {
    slug: "angular_coefficient",
    title: "Angular coefficient sweep",
    question:
      "Is the cycle preset's angular coefficient mis-set?",
    methodNote:
      "K140: line and junction angular coefficients swept across Cardiff, Bristol, and Manchester at pooled and city-preferred radius envelopes.",
  },
] as const;

type VerdictKindSeed =
  | "proven"
  | "suggestive"
  | "disproven"
  | "harmful"
  | "untested"
  | "withdrawn"
  | "city_specific";

type WebsiteExportClaim = {
  id: string;
  title: string;
  verdict: VerdictKindSeed;
  summary: string;
  numbers: Record<string, number>;
  evidence: string[];
  chapter: string;
  caveat: string;
};

type WebsiteExport = {
  generated: string;
  claims: WebsiteExportClaim[];
};

const EXPORT_EXPERIMENT_SLUG: Record<string, string | null> = {
  radius: "radius",
  weighting: "radius",
  sub_additive: "radius",
  demand_null: "controls",
  decay_curve: "radius",
  turn_cost: "turn_cost",
  gva_pedestrian: "gva",
  gva_config_specific: "gva",
  elevation: "elevation",
  mode_share: "mode_share",
  radius_robustness: "radius",
  pagerank_pedestrian: "gva",
  rail_usage: "rail",
  estimator: "estimator",
  cardiff_limit: "estimator",
  recovered_verdicts: "estimator",
  slope_ladder: "slope_ladder",
  slope_calibration: "slope_x_radius",
  slope_correction_holds: "slope_x_radius",
  slope_x_radius: "slope_x_radius",
  argmax_not_optimum: "estimator",
  radius_per_city: "radius",
  nqpdd_decay: "radius",
  plateau_audit: "estimator",
  multimodal_placebo: "multimodal",
  pt_accessibility: "pt_accessibility",
  pt_pedestrian_withdrawn: "pt_accessibility",
  pedestrian_radius_ladder: "pedestrian",
  multimodal: "multimodal",
  cycle_provision: "cycle_provision",
  osm_ground_truth: "cycle_provision",
  detection_geometry: "cycle_detection",
  angular_coefficient: "angular_coefficient",
  scale_transfer: "transfer",
  transfer_law: "transfer",
  local_intercept: "transfer",
  radius_twelve: "radius",
  multiplicity_correction: "estimator",
  match_analytical: "radius",
  sdnalearn: "estimator",
  roadonly_routing: "cycle_provision",

  // ---- the hardening passes (K181-K199). These claims existed in WEBSITE_EXPORT.json but
  // had no mapping, so the seed refused them and none of the hardening work reached the site.
  intervals: "transfer",                 // bootstrap intervals on the three headline claims
  counted_only: "estimator",             // DfT Counted vs Estimated as a sample question
  noise_floor: "estimator",              // the floor rebuilt as a distribution (K185)
  duplicate_points: "estimator",         // coincident count points (K186)
  selection_audit: "estimator",          // best-of-N selection null across 747 arm labels
  blocking: "transfer",                  // spatial-blocking sensitivity (K188)
  diagnostics_twelve: "transfer",        // residual/collinearity diagnostics at twelve
  baseline_family: "transfer",           // every margin re-scored against four baselines (K196)
  traffic_term: "angular_coefficient",   // `_t`, a cost-function term like `_a`
  traffic_published_values: "angular_coefficient",  // the same term, Chan & Cooper's values
  bidirectional_identity: "radius",      // a betweenness-configuration question (K197)
  directed_traffic: "angular_coefficient",  // `_t` on a directed network (K199)
  continuous_space: "radius",            // cont x banded radii incompatibility (K198)
  census_od_weights: "controls",         // census OD as assignment weights (K200)
};

function formatSigned(value: number, digits = 3): string {
  const rounded = value.toFixed(digits);
  return value >= 0 ? `+${rounded}` : rounded;
}

function formatNumbers(numbers: Record<string, number>): string {
  return Object.entries(numbers)
    .map(([key, value]) => {
      const digits = key.endsWith("_delta") ? 4 : key === "floor_multiple" ? 1 : 3;
      return `${key}=${formatSigned(value, digits)}`;
    })
    .join("; ");
}

function evidenceFromExport(claim: WebsiteExportClaim): string {
  const files = claim.evidence.join(", ");
  return `${claim.summary} Numbers (from ${files}): ${formatNumbers(claim.numbers)}. Caveat: ${claim.caveat}`;
}

function loadWebsiteExportClaims(): Array<{
  claim: string;
  verdict: VerdictKindSeed;
  evidence: string;
  experimentSlug: string | null;
}> {
  const candidates = [
    path.resolve(monorepoRoot, "..", "results", "WEBSITE_EXPORT.json"),
    path.join(resultsDir, "WEBSITE_EXPORT.json"),
  ];
  const exportPath = candidates.find((p) => {
    try {
      readFileSync(p);
      return true;
    } catch {
      return false;
    }
  });
  if (!exportPath) {
    throw new Error(
      `WEBSITE_EXPORT.json not found. Tried: ${candidates.join(", ")}`,
    );
  }
  const raw = JSON.parse(readFileSync(exportPath, "utf8")) as WebsiteExport;
  return raw.claims.map((c) => {
    const experimentSlug = EXPORT_EXPERIMENT_SLUG[c.id];
    if (experimentSlug === undefined) {
      throw new Error(
        `WEBSITE_EXPORT claim "${c.id}" has no experiment-page mapping`,
      );
    }
    return {
      claim: c.title,
      verdict: c.verdict,
      evidence: evidenceFromExport(c),
      experimentSlug,
    };
  });
}

/**
 * Spine claims still current alongside WEBSITE_EXPORT.json (5 Aug 2026).
 * Export titles win on collision — do not duplicate weighting / demand_null.
 */
const LEGACY_VERDICT_SEED = [
  {
    claim: "Configuration ranking transfers across held-out cities",
    verdict: "city_specific" as const,
    evidence:
      "Spearman ρ: grav_sq2s then grav_p2all in all three LOCO cities. R² ranking does NOT transfer — Manchester prefers grav_p2all over grav_sq2s (K73 audit)",
    experimentSlug: "transfer",
  },
  {
    claim: "Attractor covariates stop helping once attractors are in the assignment",
    verdict: "proven" as const,
    evidence:
      "δ ≤ 0 in all three cities at the radii tested (400,800,1600) on clean stage-2 rebuild: −0.035 / −0.016 / −0.094. At the wider envelope (K88) Manchester is marginally positive (+0.006) — see radius-robustness claim",
    experimentSlug: "absorption",
  },
  {
    claim: "The absorption decline is monotonic",
    verdict: "city_specific" as const,
    evidence:
      "Cardiff yes (+0.255 → −0.035 stage-2 rebuild); Manchester and Bristol no. Bristol −1.08 rung withdrawn — double-log1p artefact in k59_ladder_rebuild",
    experimentSlug: "absorption",
  },
  {
    claim: "sDNA betweenness predicts LSOA GVA",
    verdict: "disproven" as const,
    evidence:
      "Spatial R² ≈ 0 or negative in all three cities; POI density alone +0.34–+0.35 (grok3rdaugust GVA probe, K33)",
    experimentSlug: "gva",
  },
  {
    claim: "Local POI density predicts LSOA GVA",
    verdict: "proven" as const,
    evidence:
      "POI-only spatial R² +0.338 Cardiff / +0.353 Manchester / +0.350 Bristol (n≈207–263 LSOAs). First use of Cooper’s GVA idea",
    experimentSlug: "gva",
  },
  {
    claim: "Absorption is informational, not regression mechanics",
    verdict: "city_specific" as const,
    evidence:
      "Cardiff ~10th / ~15th percentile of the random-weight null after clean single-log recompute (was overstated as 0th–5th); Manchester ~95th — mechanism fails (K55b / K58; grok3rdaugust)",
    experimentSlug: "controls",
  },
  {
    claim: "sDNA configuration effects do not transfer between cities",
    verdict: "withdrawn" as const,
    evidence:
      "K72 stopping rule — artefact of three separate models compared by sign. Overturned by pooled + LOCO (K73): mean effects and Spearman ranking transfer; R² ranking and magnitudes remain city-specific",
    experimentSlug: "transfer",
  },
  {
    claim: "Population beats network length as the everywhere origin",
    verdict: "withdrawn" as const,
    evidence: "grav_p2s at the 0th percentile — below every random draw (K55)",
    experimentSlug: "controls",
  },
  {
    claim: "Slope improves prediction",
    verdict: "city_specific" as const,
    evidence:
      "At the project's fixed radii: +0.039 Cardiff, +0.023 Bristol, −0.041 Manchester. At the better envelope (K88) Bristol flips to −0.030 — positive in Cardiff only, negative pooled. See radius-robustness",
    experimentSlug: "slope",
  },
  {
    claim: "Radius banding helps",
    verdict: "withdrawn" as const,
    evidence:
      "Matched isolation of banding inside a fixed envelope: +0.017 Cardiff, +0.004 Manchester — both inside the noise floor. Distinct from widening the envelope itself (K80, proven)",
    experimentSlug: "absorption",
  },
  {
    claim: "Routing metric (angular vs hybrid) matters",
    verdict: "disproven" as const,
    evidence:
      "Earlier ±0.001 matched null was a double-log artefact (K75). Regenerated Cardiff: angular slightly beats hybrid (+0.020–+0.025) at the edge of the floor — not a strong transferable effect",
    experimentSlug: "exp3",
  },
  {
    claim: "Route-choice randomisation improves prediction",
    verdict: "disproven" as const,
    evidence: "Clean null in all three cities (K53); gave the city-specific noise floors",
    experimentSlug: null,
  },
  {
    claim: "PT accessibility improves cycle-flow prediction",
    verdict: "disproven" as const,
    evidence: "As a weight −0.110 vs stop count; as a covariate +0.004, below Cardiff's floor",
    experimentSlug: null,
  },
  {
    claim: "Road class substitutes for motor traffic",
    verdict: "city_specific" as const,
    evidence: "+0.305 on major roads; inverts to +0.006 vs +0.366 on minor (exp5b)",
    experimentSlug: "exp5",
  },
  {
    claim: "PageRank / eigenvector centrality",
    verdict: "disproven" as const,
    evidence: "−0.043 to −0.072 when added to sDNA (cycle counts). Pedestrian-network re-test is a separate claim (K89)",
    experimentSlug: "exp4",
  },
  {
    claim: "Global radius n / MAD family",
    verdict: "harmful" as const,
    evidence: "−0.392 / −0.293 under spatial CV",
    experimentSlug: "exp3",
  },
  {
    claim: "CV streetscape features",
    verdict: "untested" as const,
    evidence: "n = 40 at 100 m (2019+), median snap 71 m — untestable, not null",
    experimentSlug: "exp7",
  },
] as const;

function buildVerdictSeed() {
  const fromExport = loadWebsiteExportClaims();
  const exportTitles = new Set(fromExport.map((c) => c.claim));
  const legacy = LEGACY_VERDICT_SEED.filter((c) => !exportTitles.has(c.claim));
  return [...fromExport, ...legacy];
}

/**
 * Stage-2 absorption ladder — clean single-log1p rebuild (grok3rdaugust, 3 Aug 2026).
 * Supersedes the unsaved K61 in-session figures and the double-log1p k59 primary path.
 */
const ABSORPTION_LADDER = {
  rungs: [
    "angular, nested",
    "+ banded radii",
    "+ 3-D slope",
    "+ attractor weights",
  ],
  cities: [
    {
      city: "cardiff",
      deltas: [0.255, 0.213, 0.108, -0.035],
      monotonic: true,
      endsLe0: true,
    },
    {
      city: "manchester",
      deltas: [0.391, 0.381, 0.403, -0.016],
      monotonic: false,
      endsLe0: true,
    },
    {
      city: "bristol",
      deltas: [0.03, 0.03, 0.102, -0.094],
      monotonic: false,
      endsLe0: true,
    },
  ],
} as const;

const SLOPE_MATCHED = [
  { city: "cardiff", delta: 0.039 },
  { city: "bristol", delta: 0.023 },
  { city: "manchester", delta: -0.041 },
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
    city: string | null;
    k: number | null;
    randomR2: number | null;
    spatialR2: number | null;
    locoR2: number | null;
    n: number | null;
    notes: string;
  },
) {
  await db.execute(sql`
    INSERT INTO model_results (
      experiment_id, model_name, city, k, random_r2, spatial_r2, loco_r2, n, notes
    ) VALUES (
      ${row.experimentId}::uuid,
      ${row.modelName},
      ${row.city},
      ${row.k},
      ${row.randomR2},
      ${row.spatialR2},
      ${row.locoR2},
      ${row.n},
      ${row.notes}
    )
    ON CONFLICT (experiment_id, model_name, k, notes, city) DO UPDATE SET
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
      city: null,
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
      city: null,
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
      city: null,
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
      city: null,
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
      city: null,
      k: parseOptionalInt(row.k),
      randomR2: parseOptionalNumber(row.random_r2),
      spatialR2: parseOptionalNumber(row.spatial_r2),
      locoR2: null,
      n: parseOptionalInt(row.n),
      notes: "",
    });
  }
}

async function seedAbsorptionLadder(db: ReturnType<typeof createDb>) {
  const experimentId = await experimentIdBySlug(db, "absorption");
  for (const cityRow of ABSORPTION_LADDER.cities) {
    const study = STUDY_CITIES.find((c) => c.city === cityRow.city);
    for (let i = 0; i < ABSORPTION_LADDER.rungs.length; i += 1) {
      const rung = ABSORPTION_LADDER.rungs[i]!;
      const delta = cityRow.deltas[i]!;
      await upsertModelResult(db, {
        experimentId,
        modelName: rung,
        city: cityRow.city,
        k: i + 1,
        randomR2: null,
        spatialR2: delta,
        locoR2: null,
        n: study?.n ?? null,
        notes: `stage2|monotonic=${cityRow.monotonic}|ends_le0=${cityRow.endsLe0}`,
      });
    }
  }
}

async function seedSlope(db: ReturnType<typeof createDb>) {
  const experimentId = await experimentIdBySlug(db, "slope");
  for (const row of SLOPE_MATCHED) {
    const study = STUDY_CITIES.find((c) => c.city === row.city);
    await upsertModelResult(db, {
      experimentId,
      modelName: "cycle − hybrid (matched)",
      city: row.city,
      k: null,
      randomR2: null,
      spatialR2: row.delta,
      locoR2: null,
      n: study?.n ?? null,
      notes: "k60_matched",
    });
  }
}

async function seedTransfer(db: ReturnType<typeof createDb>) {
  const experimentId = await experimentIdBySlug(db, "transfer");
  const pooledPath = path.join(resultsDir, "k73_pooled_summary.csv");
  const locoPath = path.join(resultsDir, "k73_pooled_loco.csv");

  for (const row of parseCsv(pooledPath)) {
    const config = requireCol(row, "config");
    const pooledR2 = parseOptionalNumber(row.pooled_r2);
    const locoMean = parseOptionalNumber(row.loco_mean_r2);
    const pooledRho = parseOptionalNumber(row.pooled_rho);
    await upsertModelResult(db, {
      experimentId,
      modelName: config,
      city: null,
      k: null,
      randomR2: pooledRho,
      spatialR2: pooledR2,
      locoR2: locoMean,
      n: 589,
      notes: "k73_pooled",
    });
  }

  for (const row of parseCsv(locoPath)) {
    const config = requireCol(row, "config");
    const city = requireCol(row, "held_out");
    const locoR2 = parseOptionalNumber(row.loco_r2);
    const locoRho = parseOptionalNumber(row.loco_rho);
    const study = STUDY_CITIES.find((c) => c.city === city);
    await upsertModelResult(db, {
      experimentId,
      modelName: config,
      city,
      k: null,
      randomR2: locoRho,
      spatialR2: null,
      locoR2,
      n: study?.n ?? null,
      notes: "k73_loco",
    });
  }

  // Scale-normalised LOCO (K143) — the transfer claim that survives C30.
  const scalePath = path.join(resultsDir, "k143_scale_normalised_transfer.csv");
  let hasScale = true;
  try {
    readFileSync(scalePath);
  } catch {
    hasScale = false;
  }
  if (hasScale) {
    for (const row of parseCsv(scalePath)) {
      const arm = requireCol(row, "arm");
      const heldOut = requireCol(row, "held_out");
      const k = row.k ?? "";
      await upsertModelResult(db, {
        experimentId,
        modelName:
          arm === "baseline"
            ? `baseline → ${heldOut}`
            : `fwd k=${k} → ${heldOut}`,
        city: heldOut,
        k: parseOptionalInt(String(k)),
        randomR2: parseOptionalNumber(row.r2_raw),
        spatialR2: parseOptionalNumber(row.r2_scaled),
        locoR2: parseOptionalNumber(row.r2_scaled),
        n: null,
        notes: `k143_scale_transfer|arm=${arm}`,
      });
    }
  }

  for (const row of parseCsv(path.join(resultsDir, "k173_curve.csv"))) {
    const k = parseOptionalInt(row.k);
    await upsertModelResult(db, {
      experimentId,
      modelName: `k=${row.k}`,
      city: null,
      k,
      randomR2: parseOptionalNumber(row.r2_corr),
      spatialR2: parseOptionalNumber(row.r2_det),
      locoR2: parseOptionalNumber(row.null_r2_corr),
      n: 12,
      notes: "k173_curve",
    });
  }

  const localByCity = new Map<string, number>();
  for (const row of parseCsv(path.join(resultsDir, "k172_loco.csv"))) {
    const held = requireCol(row, "held");
    const localR2 = parseOptionalNumber(row.local_r2);
    if (localR2 !== null) {
      localByCity.set(held.toLowerCase(), localR2);
    }
  }

  for (const row of parseCsv(path.join(resultsDir, "k173_loco11.csv"))) {
    const held = requireCol(row, "held");
    await upsertModelResult(db, {
      experimentId,
      modelName: held,
      city: held,
      k: 11,
      randomR2: parseOptionalNumber(row.r2_corr),
      spatialR2: localByCity.get(held.toLowerCase()) ?? null,
      locoR2: parseOptionalNumber(row.r2_det),
      n: parseOptionalInt(row.n),
      notes: "k173_working",
    });
  }
}

/** K80–K90 tables linked from the 5 Aug WEBSITE_EXPORT claims. */
async function seedRadiusFamily(db: ReturnType<typeof createDb>) {
  const experimentId = await experimentIdBySlug(db, "radius");

  for (const row of parseCsv(path.join(resultsDir, "k80b_factorial.csv"))) {
    const cell = requireCol(row, "cell");
    const radii = requireCol(row, "radii");
    await upsertModelResult(db, {
      experimentId,
      modelName: `${cell} (${radii})`,
      city: null,
      k: 9,
      randomR2: parseOptionalNumber(row.loco_rho),
      spatialR2: parseOptionalNumber(row.pooled_r2),
      locoR2: parseOptionalNumber(row.loco_r2),
      n: 589,
      notes: "k80b_factorial",
    });
  }

  for (const row of parseCsv(path.join(resultsDir, "k80_radius_pooled.csv"))) {
    if (requireCol(row, "matched_k") !== "True") {
      continue;
    }
    const arm = requireCol(row, "arm");
    if (arm === "high_b") {
      continue; // bit-identical replicate of high
    }
    await upsertModelResult(db, {
      experimentId,
      modelName: `radius ladder: ${arm}`,
      city: null,
      k: parseOptionalInt(row.k),
      randomR2: parseOptionalNumber(row.loco_mean_rho),
      spatialR2: parseOptionalNumber(row.pooled_r2),
      locoR2: parseOptionalNumber(row.loco_mean_r2),
      n: 589,
      notes: "k80_radius_pooled",
    });
  }

  for (const row of parseCsv(path.join(resultsDir, "k80_decay_curve.csv"))) {
    const radius = requireCol(row, "radius");
    await upsertModelResult(db, {
      experimentId,
      modelName: `decay band ${radius} m`,
      city: null,
      k: null,
      randomR2: null,
      spatialR2: parseOptionalNumber(row.std_coef),
      locoR2: null,
      n: 589,
      notes: "k80_decay_curve",
    });
  }

  for (const row of parseCsv(path.join(resultsDir, "k88_slope_by_radius.csv"))) {
    const city = requireCol(row, "city");
    const study = STUDY_CITIES.find((c) => c.city === city);
    await upsertModelResult(db, {
      experimentId,
      modelName: "slope Δ at narrow radii",
      city,
      k: null,
      randomR2: null,
      spatialR2: parseOptionalNumber(row.narrow),
      locoR2: null,
      n: study?.n ?? null,
      notes: "k88_slope_narrow",
    });
    await upsertModelResult(db, {
      experimentId,
      modelName: "slope Δ at wide radii",
      city,
      k: null,
      randomR2: null,
      spatialR2: parseOptionalNumber(row.wide),
      locoR2: null,
      n: study?.n ?? null,
      notes: "k88_slope_wide",
    });
  }
}

async function seedPosterior(db: ReturnType<typeof createDb>) {
  const experimentId = await experimentIdBySlug(db, "radius");
  for (const row of parseCsv(path.join(resultsDir, "k84_posterior.csv"))) {
    const contrast = requireCol(row, "contrast");
    const pGt0 = parseOptionalNumber(row.p_gt_0);
    const pTag = pGt0 === null ? "" : `|p=${pGt0}`;
    await upsertModelResult(db, {
      experimentId,
      modelName: contrast,
      city: null,
      k: null,
      randomR2: parseOptionalNumber(row.lo),
      spatialR2: parseOptionalNumber(row.point),
      locoR2: parseOptionalNumber(row.hi),
      n: 589,
      notes: `k84_posterior${pTag}`,
    });
  }
}

async function seedTurnCost(db: ReturnType<typeof createDb>) {
  const experimentId = await experimentIdBySlug(db, "turn_cost");
  for (const row of parseCsv(path.join(resultsDir, "k81_turn_sweep.csv"))) {
    const city = requireCol(row, "city");
    const arm = requireCol(row, "arm");
    const cost = parseOptionalNumber(row.turn_cost_m);
    const costLabel =
      cost === null ? arm : `${arm} (${cost.toFixed(1)} m / 90°)`;
    const costTag = cost === null ? "" : `|cost=${cost}`;
    await upsertModelResult(db, {
      experimentId,
      modelName: costLabel,
      city,
      k: null,
      randomR2: parseOptionalNumber(row.delta_vs_preset),
      spatialR2: parseOptionalNumber(row.r2),
      locoR2: null,
      n: parseOptionalInt(row.n),
      notes: `k81${costTag}|resolvable=${requireCol(row, "resolvable")}`,
    });
  }
}

async function seedGva(db: ReturnType<typeof createDb>) {
  const experimentId = await experimentIdBySlug(db, "gva");
  for (const row of parseCsv(path.join(resultsDir, "k82_gva_walk.csv"))) {
    const arm = requireCol(row, "arm");
    const model = requireCol(row, "model");
    await upsertModelResult(db, {
      experimentId,
      modelName: `${arm} · ${model}`,
      city: "cardiff",
      k: null,
      randomR2: null,
      spatialR2: parseOptionalNumber(row.pooled_oof_r2),
      locoR2: null,
      n: parseOptionalInt(row.n),
      notes: "k82_gva_walk",
    });
  }
  for (const row of parseCsv(path.join(resultsDir, "k89_walk_pagerank_pt.csv"))) {
    await upsertModelResult(db, {
      experimentId,
      modelName: requireCol(row, "block"),
      city: "cardiff",
      k: parseOptionalInt(row.k),
      randomR2: parseOptionalNumber(row.rho),
      spatialR2: parseOptionalNumber(row.pooled_r2),
      locoR2: null,
      n: parseOptionalInt(row.n),
      notes: "k89_walk_pagerank_pt",
    });
  }
}

async function seedElevation(db: ReturnType<typeof createDb>) {
  const experimentId = await experimentIdBySlug(db, "elevation");
  for (const row of parseCsv(path.join(resultsDir, "k83_elevation_slope.csv"))) {
    const city = requireCol(row, "city");
    await upsertModelResult(db, {
      experimentId,
      modelName: "slope Δ before DEM correction",
      city,
      k: null,
      randomR2: null,
      spatialR2: parseOptionalNumber(row.slope_orig),
      locoR2: null,
      n: parseOptionalInt(row.n),
      notes: "k83_orig",
    });
    await upsertModelResult(db, {
      experimentId,
      modelName: "Δ after ext20 DEM correction",
      city,
      k: null,
      randomR2: null,
      spatialR2: parseOptionalNumber(row.delta_ext20),
      locoR2: null,
      n: parseOptionalInt(row.n),
      notes: "k83_delta_ext20",
    });
  }
}

async function seedModeShare(db: ReturnType<typeof createDb>) {
  const experimentId = await experimentIdBySlug(db, "mode_share");
  for (const row of parseCsv(path.join(resultsDir, "k85_mode_share.csv"))) {
    const arm = requireCol(row, "arm");
    const block = requireCol(row, "block");
    await upsertModelResult(db, {
      experimentId,
      modelName: `${arm} · ${block}`,
      city: null,
      k: null,
      randomR2: parseOptionalNumber(row.rho),
      spatialR2: parseOptionalNumber(row.pooled_r2),
      locoR2: parseOptionalNumber(row.loco_r2),
      n: null,
      notes: "k85_mode_share",
    });
  }
}

async function seedRail(db: ReturnType<typeof createDb>) {
  const experimentId = await experimentIdBySlug(db, "rail");
  for (const row of parseCsv(path.join(resultsDir, "k90_rail_usage.csv"))) {
    const arm = requireCol(row, "arm");
    const radii = requireCol(row, "radii");
    await upsertModelResult(db, {
      experimentId,
      modelName: `${arm} (${radii})`,
      city: null,
      k: null,
      randomR2: parseOptionalNumber(row.rho),
      spatialR2: parseOptionalNumber(row.pooled_r2),
      locoR2: parseOptionalNumber(row.loco_r2),
      n: parseOptionalInt(row.n),
      notes: "k90_rail_usage",
    });
  }
}

async function seedEstimator(db: ReturnType<typeof createDb>) {
  const experimentId = await experimentIdBySlug(db, "estimator");

  for (const row of parseCsv(path.join(resultsDir, "k91_noise_floor.csv"))) {
    if (requireCol(row, "arm") !== "A_estimator") {
      continue;
    }
    if (requireCol(row, "sample") !== "2019+") {
      continue;
    }
    const city = requireCol(row, "city");
    await upsertModelResult(db, {
      experimentId,
      modelName: "floor: mean-per-fold",
      city,
      k: null,
      randomR2: null,
      spatialR2: parseOptionalNumber(row.floor_mean_per_fold),
      locoR2: null,
      n: parseOptionalInt(row.n),
      notes: "k91_floor_mean",
    });
    await upsertModelResult(db, {
      experimentId,
      modelName: "floor: pooled OOF",
      city,
      k: null,
      randomR2: null,
      spatialR2: parseOptionalNumber(row.floor_pooled_oof),
      locoR2: null,
      n: parseOptionalInt(row.n),
      notes: "k91_floor_pooled",
    });
  }

  for (const row of parseCsv(path.join(resultsDir, "k91_noise_floor.csv"))) {
    if (requireCol(row, "arm") !== "F_power") {
      continue;
    }
    if (requireCol(row, "estimator") !== "pooled_oof") {
      continue;
    }
    await upsertModelResult(db, {
      experimentId,
      modelName: "min detectable δ (pooled OOF)",
      city: requireCol(row, "city"),
      k: null,
      randomR2: null,
      spatialR2: parseOptionalNumber(row.min_detectable),
      locoR2: null,
      n: parseOptionalInt(row.n),
      notes: "k91_min_detectable",
    });
  }

  for (const row of parseCsv(path.join(resultsDir, "k94_pooled_rescore.csv"))) {
    if (requireCol(row, "changed") !== "True") {
      continue;
    }
    const experiment = requireCol(row, "experiment");
    const arm = requireCol(row, "arm");
    await upsertModelResult(db, {
      experimentId,
      modelName: `${experiment} · ${arm} (rescored)`,
      city: requireCol(row, "city"),
      k: null,
      randomR2: parseOptionalNumber(row.effect_mean_per_fold),
      spatialR2: parseOptionalNumber(row.effect_pooled_oof),
      locoR2: parseOptionalNumber(row.ratio_to_new_floor),
      n: parseOptionalInt(row.n),
      notes: "k94_changed",
    });
  }

  const fdrPath = path.join(resultsDir, "k144_fdr_across_nulls.csv");
  try {
    readFileSync(fdrPath);
  } catch {
    return;
  }
  for (const row of parseCsv(fdrPath)) {
    await upsertModelResult(db, {
      experimentId,
      modelName: requireCol(row, "test"),
      city: null,
      k: parseOptionalInt(row.n),
      randomR2: parseOptionalNumber(row.p),
      spatialR2: parseOptionalNumber(row.real),
      locoR2: parseOptionalNumber(row.bh_threshold),
      n: parseOptionalInt(row.n),
      notes:
        `k144_fdr|rank=${requireCol(row, "rank")}` +
        `|survives=${requireCol(row, "survives_fdr")}` +
        `|decidable=${requireCol(row, "decidable")}`,
    });
  }
}

async function seedSlopeLadder(db: ReturnType<typeof createDb>) {
  const experimentId = await experimentIdBySlug(db, "slope_ladder");
  for (const row of parseCsv(path.join(resultsDir, "k96_slope_ladder.csv"))) {
    await upsertModelResult(db, {
      experimentId,
      modelName: `${requireCol(row, "arm")}: ${requireCol(row, "label")}`,
      city: requireCol(row, "city"),
      k: null,
      randomR2: parseOptionalNumber(row.delta_vs_preset),
      spatialR2: parseOptionalNumber(row.r2),
      locoR2: null,
      n: parseOptionalInt(row.n),
      notes: `k96_slope_ladder|family=${requireCol(row, "family")}|resolvable=${requireCol(row, "resolvable")}`,
    });
  }
}

async function seedSlopeXRadius(db: ReturnType<typeof createDb>) {
  const experimentId = await experimentIdBySlug(db, "slope_x_radius");
  for (const row of parseCsv(path.join(resultsDir, "k97_slope_x_radius.csv"))) {
    await upsertModelResult(db, {
      experimentId,
      modelName: `${requireCol(row, "arm")} @ ${requireCol(row, "radii")}`,
      city: requireCol(row, "city"),
      k: null,
      randomR2: parseOptionalNumber(row.delta_vs_preset),
      spatialR2: parseOptionalNumber(row.r2),
      locoR2: null,
      n: parseOptionalInt(row.n),
      notes:
        `k97_slope_x_radius|s=${requireCol(row, "s")}` +
        `|radii=${requireCol(row, "radii")}` +
        `|resolvable=${requireCol(row, "resolvable")}`,
    });
  }

  for (const row of parseCsv(path.join(resultsDir, "k97_factorial.csv"))) {
    await upsertModelResult(db, {
      experimentId,
      modelName: `${requireCol(row, "cell")} @ ${requireCol(row, "radii")}`,
      city: null,
      k: null,
      randomR2: parseOptionalNumber(row.pooled_r2),
      spatialR2: parseOptionalNumber(row.loco_r2),
      locoR2: parseOptionalNumber(row.loco_rho),
      n: parseOptionalInt(row.n),
      notes: `k97_factorial|s=${requireCol(row, "s")}`,
    });
  }

  for (const row of parseCsv(path.join(resultsDir, "k97_decomposition.csv"))) {
    await upsertModelResult(db, {
      experimentId,
      modelName: `${requireCol(row, "metric")} interaction`,
      city: null,
      k: null,
      randomR2: parseOptionalNumber(row.interaction),
      spatialR2: parseOptionalNumber(row.both),
      locoR2: null,
      n: null,
      notes:
        `k97_decomposition|verdict=${requireCol(row, "verdict")}` +
        `|s_at_narrow=${requireCol(row, "s_at_narrow")}` +
        `|s_at_wide=${requireCol(row, "s_at_wide")}` +
        `|r_at_preset=${requireCol(row, "r_at_preset")}`,
    });
  }
}

async function seedCycleProvision(db: ReturnType<typeof createDb>) {
  const experimentId = await experimentIdBySlug(db, "cycle_provision");
  const armFiles = [
    ["cardiff", "k133_i4_direct_osm.csv"],
    ["bristol", "k134_bristol_arms.csv"],
    ["manchester", "k134_manchester_arms.csv"],
  ] as const;

  for (const [city, file] of armFiles) {
    for (const row of parseCsv(path.join(resultsDir, file))) {
      const env = requireCol(row, "env");
      const direction = requireCol(row, "direction");
      const k = requireCol(row, "k");
      await upsertModelResult(db, {
        experimentId,
        modelName: `${direction} k=${k} (${env})`,
        city,
        k: parseOptionalInt(row.n_core),
        randomR2: parseOptionalNumber(row.delta),
        spatialR2: parseOptionalNumber(row.r2),
        locoR2: null,
        n: parseOptionalInt(row.n),
        notes: `k133_i4_direct_osm|env=${env}|radii=${row.radii ?? "800,1600,3200"}|within_floor=${requireCol(row, "within_floor")}`,
      });
    }
  }

  for (const row of parseCsv(path.join(resultsDir, "k130_osm_cycle_ground_truth.csv"))) {
    await upsertModelResult(db, {
      experimentId,
      modelName: requireCol(row, "cls"),
      city: "cardiff",
      k: null,
      randomR2: parseOptionalNumber(row.pct),
      spatialR2: parseOptionalNumber(row.score),
      locoR2: null,
      n: parseOptionalInt(row.n_links),
      notes: "k130_osm_ground_truth",
    });
  }
}

async function seedDetectionGeometry(db: ReturnType<typeof createDb>) {
  const experimentId = await experimentIdBySlug(db, "cycle_detection");
  for (const row of parseCsv(path.join(resultsDir, "k139b_geometry_sweep.csv"))) {
    const pitch = requireCol(row, "pitch");
    const fov = requireCol(row, "fov");
    await upsertModelResult(db, {
      experimentId,
      modelName: `pitch=${pitch}°, fov=${fov}°`,
      city: null,
      k: null,
      randomR2: parseOptionalNumber(row.near_m),
      spatialR2: parseOptionalNumber(row.span_m),
      locoR2: parseOptionalNumber(row.far_m),
      n: null,
      notes: `k139b_geometry|pitch=${pitch}|fov=${fov}`,
    });
  }
}

async function seedAngularCoefficient(db: ReturnType<typeof createDb>) {
  const experimentId = await experimentIdBySlug(db, "angular_coefficient");
  for (const row of parseCsv(path.join(resultsDir, "k140_angular_coefficient.csv"))) {
    await upsertModelResult(db, {
      experimentId,
      modelName:
        `line a=${requireCol(row, "a")}; junction a=${requireCol(row, "junc")}` +
        ` @ ${requireCol(row, "radii")}`,
      city: requireCol(row, "city"),
      k: null,
      randomR2: parseOptionalNumber(row.delta),
      spatialR2: parseOptionalNumber(row.r2),
      locoR2: null,
      n: parseOptionalInt(row.n),
      notes:
        `k140_angular|env=${requireCol(row, "env")}` +
        `|kind=${requireCol(row, "kind")}` +
        `|within_floor=${requireCol(row, "within_floor")}`,
    });
  }
}

async function seedMultimodal(db: ReturnType<typeof createDb>) {
  const experimentId = await experimentIdBySlug(db, "multimodal");
  for (const row of parseCsv(path.join(resultsDir, "k93_multimodal.csv"))) {
    await upsertModelResult(db, {
      experimentId,
      modelName: requireCol(row, "arm"),
      city: "cardiff",
      k: null,
      randomR2: parseOptionalNumber(row.rho),
      spatialR2: parseOptionalNumber(row.pooled_r2),
      locoR2: parseOptionalNumber(row.vs_road_only),
      n: parseOptionalInt(row.n),
      notes: "k93_multimodal",
    });
  }
}

function titleCaseCity(slug: string): string {
  return slug.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function countryForCity(name: string): string {
  const key = name.toLowerCase();
  if (key === "cardiff") return "Wales";
  if (key === "glasgow" || key === "edinburgh") return "Scotland";
  return "England";
}

async function seedCities(db: ReturnType<typeof createDb>) {
  await db.delete(cities);
  for (const row of parseCsv(path.join(resultsDir, "k173_loco11.csv"))) {
    const slug = requireCol(row, "held");
    const name = titleCaseCity(slug);
    const nCountPoints = parseOptionalInt(row.n);
    const heldOutR2 = parseOptionalNumber(row.r2_det);
    if (nCountPoints === null) {
      throw new Error(`City ${name} missing n`);
    }
    if (heldOutR2 === null) {
      throw new Error(`City ${name} missing r2_det`);
    }
    await db.insert(cities).values({
      name,
      laCode: laCodeFromName(name),
      country: countryForCity(name),
      nCountPoints,
      heldOutR2,
    });
  }
}

const TRANSFER_HEADLINE_NOTES = "transfer_headline";

async function seedTransferSummary(db: ReturnType<typeof createDb>) {
  const experimentId = await experimentIdBySlug(db, "transfer");
  const curve = parseCsv(path.join(resultsDir, "k173_curve.csv"));
  const rowAt = (k: number) => {
    const row = curve.find((r) => parseOptionalInt(r.k) === k);
    if (!row) {
      throw new Error(`k173_curve.csv missing k=${k}`);
    }
    return row;
  };
  const k2 = rowAt(2);
  const k11 = rowAt(11);
  const loco = parseCsv(path.join(resultsDir, "k172_loco.csv"));
  const localVals = loco
    .map((r) => parseOptionalNumber(r.local_r2))
    .filter((n): n is number => n !== null);
  const oracleVals = loco
    .map((r) => parseOptionalNumber(r.oracle_r2))
    .filter((n): n is number => n !== null);
  const nPoints = parseCsv(path.join(resultsDir, "k173_loco11.csv"))
    .map((r) => parseOptionalInt(r.n))
    .filter((n): n is number => n !== null)
    .reduce((a, b) => a + b, 0);

  await upsertModelResult(db, {
    experimentId,
    modelName: "working_set",
    city: null,
    k: 12,
    randomR2: 12,
    spatialR2: nPoints,
    n: nPoints,
    locoR2: null,
    notes: `${TRANSFER_HEADLINE_NOTES}|working_set`,
  });
  await upsertModelResult(db, {
    experimentId,
    modelName: "r2_at_k2",
    city: null,
    k: 2,
    randomR2: parseOptionalNumber(k2.r2_corr),
    spatialR2: parseOptionalNumber(k2.r2_det),
    n: nPoints,
    locoR2: parseOptionalNumber(k2.null_r2_corr),
    notes: `${TRANSFER_HEADLINE_NOTES}|r2_at_k2`,
  });
  await upsertModelResult(db, {
    experimentId,
    modelName: "r2_at_k11",
    city: null,
    k: 11,
    randomR2: parseOptionalNumber(k11.r2_corr),
    spatialR2: parseOptionalNumber(k11.r2_det),
    n: nPoints,
    locoR2: parseOptionalNumber(k11.null_r2_corr),
    notes: `${TRANSFER_HEADLINE_NOTES}|r2_at_k11`,
  });
  await upsertModelResult(db, {
    experimentId,
    modelName: "local10",
    city: null,
    k: 10,
    randomR2: mean(localVals),
    spatialR2: mean(oracleVals),
    n: nPoints,
    locoR2: null,
    notes: `${TRANSFER_HEADLINE_NOTES}|local10`,
  });
}

type ControlSeed = {
  city: string;
  testName: string;
  configName: string;
  realValue: number;
  nullMean: number;
  nullSd: number;
  nullN: number;
  percentile: number;
  interpretation: string;
  nullDraws: number[];
};

function loadCardiffGainDraws(): number[] {
  return parseCsv(path.join(resultsDir, "k55_null_cardiff.csv"))
    .filter((row) => row.kind === "curve")
    .map((row) => parseOptionalNumber(row.delta_r2))
    .filter((n): n is number => n !== null);
}

function loadCardiffAbsorptionDraws(): number[] {
  return parseCsv(path.join(resultsDir, "k55b_absorption_null.csv"))
    .filter((row) => row.kind === "curve")
    .map((row) => parseOptionalNumber(row.delta_stage2))
    .filter((n): n is number => n !== null);
}

function loadManchesterGainDraws(): number[] {
  return parseCsv(path.join(resultsDir, "k58_manchester_controls.csv"))
    .filter((row) => row.test === "A_gain" && row.kind === "curve")
    .map((row) => parseOptionalNumber(row.delta))
    .filter((n): n is number => n !== null);
}

function loadManchesterAbsorptionDraws(): number[] {
  return parseCsv(path.join(resultsDir, "k58_manchester_controls.csv"))
    .filter((row) => row.test === "B_absorption" && row.kind === "curve")
    .map((row) => parseOptionalNumber(row.delta_stage2))
    .filter((n): n is number => n !== null);
}

function buildControlSeeds(): ControlSeed[] {
  const cardiffGain = loadCardiffGainDraws();
  const cardiffAbs = loadCardiffAbsorptionDraws();
  const manGain = loadManchesterGainDraws();
  const manAbs = loadManchesterAbsorptionDraws();

  return [
    {
      city: "cardiff",
      testName: "random-weight gain",
      configName: "grav_p2all",
      realValue: 0.121,
      nullMean: 0.109,
      nullSd: 0.027,
      nullN: 20,
      percentile: 65,
      interpretation:
        "Real gain sits inside the random-weight null — weighting helps; demand structure does not explain it.",
      nullDraws: cardiffGain,
    },
    {
      city: "cardiff",
      testName: "POI absorption",
      configName: "grav_sq2s",
      realValue: -0.037,
      nullMean: 0.004,
      nullSd: 0.033,
      nullN: 20,
      percentile: 10,
      interpretation:
        "Clean stage-2 real at ~10th percentile of the recorded null — still low; informational in Cardiff (was 0th).",
      nullDraws: cardiffAbs,
    },
    {
      city: "cardiff",
      testName: "POI absorption",
      configName: "grav_p2all",
      realValue: -0.03,
      nullMean: 0.004,
      nullSd: 0.033,
      nullN: 20,
      percentile: 15,
      interpretation:
        "Clean stage-2 real at ~15th percentile of random weights — informational in Cardiff (was 5th).",
      nullDraws: cardiffAbs,
    },
    {
      city: "manchester",
      testName: "random-weight gain",
      configName: "grav_p2all",
      realValue: 0.164,
      nullMean: mean(manGain.length ? manGain : [0.04]),
      nullSd: manGain.length ? sd(manGain) : 0.138,
      nullN: 20,
      percentile: 85,
      interpretation:
        "85th percentile — still ≈ null by the pre-registered rule, but far higher than Cardiff's 65th.",
      nullDraws: manGain,
    },
    {
      city: "manchester",
      testName: "POI absorption",
      configName: "grav_p2all",
      realValue: -0.033,
      nullMean: -0.079,
      nullSd: 0.03,
      nullN: 20,
      percentile: 95,
      interpretation:
        "Clean real ~95th of the recorded null — absorption mechanism fails in Manchester (stronger than the earlier ~65th reading).",
      nullDraws: manAbs,
    },
  ];
}

async function seedControls(db: ReturnType<typeof createDb>) {
  const experimentId = await experimentIdBySlug(db, "controls");
  for (const row of buildControlSeeds()) {
    await db
      .insert(controls)
      .values({
        experimentId,
        city: row.city,
        testName: row.testName,
        configName: row.configName,
        realValue: row.realValue,
        nullMean: row.nullMean,
        nullSd: row.nullSd,
        nullN: row.nullN,
        percentile: row.percentile,
        interpretation: row.interpretation,
        nullDraws: row.nullDraws,
      })
      .onConflictDoUpdate({
        target: [controls.city, controls.testName, controls.configName],
        set: {
          experimentId,
          realValue: row.realValue,
          nullMean: row.nullMean,
          nullSd: row.nullSd,
          nullN: row.nullN,
          percentile: row.percentile,
          interpretation: row.interpretation,
          nullDraws: row.nullDraws,
        },
      });
  }
}

async function seedVerdicts(db: ReturnType<typeof createDb>) {
  // Replace the full set — stale proven claims must not linger.
  await db.delete(verdicts);

  for (const row of buildVerdictSeed()) {
    const experimentId =
      row.experimentSlug === null
        ? null
        : await experimentIdBySlug(db, row.experimentSlug);
    await db.insert(verdicts).values({
      claim: row.claim,
      verdict: row.verdict,
      evidence: row.evidence,
      experimentId,
    });
  }
}

async function countRows(db: ReturnType<typeof createDb>) {
  const [c, e, m, v, ctl] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(cities),
    db.select({ count: sql<number>`count(*)::int` }).from(experiments),
    db.select({ count: sql<number>`count(*)::int` }).from(modelResults),
    db.select({ count: sql<number>`count(*)::int` }).from(verdicts),
    db.select({ count: sql<number>`count(*)::int` }).from(controls),
  ]);
  return {
    cities: c[0]?.count ?? 0,
    experiments: e[0]?.count ?? 0,
    modelResults: m[0]?.count ?? 0,
    verdicts: v[0]?.count ?? 0,
    controls: ctl[0]?.count ?? 0,
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
  await seedAbsorptionLadder(db);
  await seedSlope(db);
  await seedTransfer(db);
  await seedRadiusFamily(db);
  await seedPosterior(db);
  await seedTurnCost(db);
  await seedGva(db);
  await seedElevation(db);
  await seedModeShare(db);
  await seedRail(db);
  await seedEstimator(db);
  await seedSlopeLadder(db);
  await seedSlopeXRadius(db);
  await seedMultimodal(db);
  await seedCycleProvision(db);
  await seedDetectionGeometry(db);
  await seedAngularCoefficient(db);
  await seedCities(db);
  await seedControls(db);
  await seedVerdicts(db);
  const counts = await countRows(db);
  console.log("Seed complete:", counts);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
