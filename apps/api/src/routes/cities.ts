import { desc, eq, like } from "drizzle-orm";
import { Hono } from "hono";
import type {
  CitiesListResponse,
  CityDto,
  TransferSummaryDto,
} from "@kerbside/shared";
import { createDb } from "../db/client";
import { cities, experiments, modelResults } from "../db/schema";
import { requireDatabaseUrl, type AppEnv } from "../env";

const TRANSFER_SUMMARY_PREFIX = "transfer_summary|";

function toCityDto(row: typeof cities.$inferSelect): CityDto {
  return {
    id: row.id,
    name: row.name,
    laCode: row.laCode,
    country: row.country,
    nCountPoints: row.nCountPoints,
    heldOutR2: row.heldOutR2,
    createdAt: row.createdAt.toISOString(),
  };
}

function requireMetric(
  byMetric: Map<string, { value: number; nPoints: number; nAuthorities: number }>,
  metric: string,
): { value: number; nPoints: number; nAuthorities: number } {
  const row = byMetric.get(metric);
  if (!row) {
    throw new Error(`Missing transfer summary metric: ${metric}`);
  }
  return row;
}

export const citiesRoutes = new Hono<AppEnv>();

citiesRoutes.get("/", async (c) => {
  const db = createDb(requireDatabaseUrl(c.env.DATABASE_URL));

  const [cityRows, summaryRows] = await Promise.all([
    db.select().from(cities).orderBy(desc(cities.heldOutR2)),
    db
      .select({
        modelName: modelResults.modelName,
        randomR2: modelResults.randomR2,
        n: modelResults.n,
        k: modelResults.k,
        notes: modelResults.notes,
      })
      .from(modelResults)
      .innerJoin(experiments, eq(modelResults.experimentId, experiments.id))
      .where(like(modelResults.notes, `${TRANSFER_SUMMARY_PREFIX}%`)),
  ]);

  const byMetric = new Map<
    string,
    { value: number; nPoints: number; nAuthorities: number }
  >();
  for (const row of summaryRows) {
    if (row.randomR2 === null || row.n === null || row.k === null) {
      throw new Error(`Incomplete transfer summary row: ${row.modelName}`);
    }
    byMetric.set(row.modelName, {
      value: row.randomR2,
      nPoints: row.n,
      nAuthorities: row.k,
    });
  }

  const within = requireMetric(byMetric, "within_city");
  const across = requireMetric(byMetric, "across_city");
  const penalty = requireMetric(byMetric, "transfer_penalty");
  const cardiffOnly = requireMetric(byMetric, "cardiff_only");
  const cardiffElsewhere = requireMetric(byMetric, "cardiff_from_elsewhere");

  const transferSummary: TransferSummaryDto = {
    withinCityR2: within.value,
    acrossCityR2: across.value,
    transferPenalty: penalty.value,
    cohortNPoints: within.nPoints,
    cohortNAuthorities: within.nAuthorities,
    cardiffOnlyR2: cardiffOnly.value,
    cardiffFromElsewhereR2: cardiffElsewhere.value,
    cardiffNPoints: cardiffOnly.nPoints,
  };

  const body: CitiesListResponse = {
    cities: cityRows.map(toCityDto),
    transferSummary,
  };
  return c.json(body);
});
