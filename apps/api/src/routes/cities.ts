import { desc, eq, like } from "drizzle-orm";
import { Hono } from "hono";
import {
  STUDY_CITIES,
  type CitiesListResponse,
  type CityDto,
  type TransferSummaryDto,
} from "@kerbside/shared";
import { createDb } from "../db/client";
import { cities, experiments, modelResults } from "../db/schema";
import { requireDatabaseUrl, type AppEnv } from "../env";

const TRANSFER_HEADLINE_PREFIX = "transfer_headline|";
const WORKING_CITY_NOTES = "k173_working";

function requireMetric(
  byMetric: Map<
    string,
    { randomR2: number; spatialR2: number; nPoints: number; k: number }
  >,
  metric: string,
): { randomR2: number; spatialR2: number; nPoints: number; k: number } {
  const row = byMetric.get(metric);
  if (!row) {
    throw new Error(`Missing transfer headline metric: ${metric}`);
  }
  return row;
}

export const citiesRoutes = new Hono<AppEnv>();

citiesRoutes.get("/", async (c) => {
  const db = createDb(requireDatabaseUrl(c.env.DATABASE_URL));

  const [cityRows, summaryRows, workingRows] = await Promise.all([
    db.select().from(cities).orderBy(desc(cities.heldOutR2)),
    db
      .select({
        modelName: modelResults.modelName,
        randomR2: modelResults.randomR2,
        spatialR2: modelResults.spatialR2,
        n: modelResults.n,
        k: modelResults.k,
        notes: modelResults.notes,
      })
      .from(modelResults)
      .innerJoin(experiments, eq(modelResults.experimentId, experiments.id))
      .where(like(modelResults.notes, `${TRANSFER_HEADLINE_PREFIX}%`)),
    db
      .select({
        city: modelResults.city,
        randomR2: modelResults.randomR2,
        spatialR2: modelResults.spatialR2,
      })
      .from(modelResults)
      .where(eq(modelResults.notes, WORKING_CITY_NOTES)),
  ]);

  const byMetric = new Map<
    string,
    { randomR2: number; spatialR2: number; nPoints: number; k: number }
  >();
  for (const row of summaryRows) {
    if (
      row.randomR2 === null ||
      row.spatialR2 === null ||
      row.n === null ||
      row.k === null
    ) {
      throw new Error(`Incomplete transfer headline row: ${row.modelName}`);
    }
    byMetric.set(row.modelName, {
      randomR2: row.randomR2,
      spatialR2: row.spatialR2,
      nPoints: row.n,
      k: row.k,
    });
  }

  const workingSet = requireMetric(byMetric, "working_set");
  const r2k2 = requireMetric(byMetric, "r2_at_k2");
  const r2k11 = requireMetric(byMetric, "r2_at_k11");
  const local10 = requireMetric(byMetric, "local10");

  const transferSummary: TransferSummaryDto = {
    nCities: workingSet.k,
    nPoints: workingSet.nPoints,
    r2AtK2: r2k2.randomR2,
    r2AtK11: r2k11.randomR2,
    r2DetAtK2: r2k2.spatialR2,
    r2DetAtK11: r2k11.spatialR2,
    local10R2: local10.randomR2,
    oracleR2: local10.spatialR2,
    envelope: "800/1600/3200",
  };

  const extras = new Map<
    string,
    { heldOutR2Corr: number; local10R2: number }
  >();
  for (const row of workingRows) {
    if (!row.city || row.randomR2 === null || row.spatialR2 === null) {
      throw new Error(`Incomplete working-city row: ${row.city}`);
    }
    extras.set(row.city.toLowerCase(), {
      heldOutR2Corr: row.randomR2,
      local10R2: row.spatialR2,
    });
  }

  const body: CitiesListResponse = {
    cities: cityRows.map((row): CityDto => {
      const extra = extras.get(row.name.toLowerCase());
      if (!extra) {
        throw new Error(`Missing K173 extras for city ${row.name}`);
      }
      return {
        id: row.id,
        name: row.name,
        laCode: row.laCode,
        country: row.country,
        nCountPoints: row.nCountPoints,
        heldOutR2: row.heldOutR2,
        heldOutR2Corr: extra.heldOutR2Corr,
        local10R2: extra.local10R2,
        createdAt: row.createdAt.toISOString(),
      };
    }),
    transferSummary,
    studyCities: STUDY_CITIES.map((city) => ({
      city: city.city,
      n: city.n,
      noiseFloorMin: city.noiseFloorMin,
      noiseFloorMax: city.noiseFloorMax,
    })),
  };
  return c.json(body);
});
