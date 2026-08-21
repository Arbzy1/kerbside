import { and, asc, eq, like } from "drizzle-orm";
import { Hono } from "hono";
import type { AbsorptionLadderResponse } from "@kerbside/shared";
import { createDb } from "../db/client";
import { experiments, modelResults } from "../db/schema";
import { requireDatabaseUrl, type AppEnv } from "../env";

const RUNG_ORDER = [
  "angular, nested",
  "+ banded radii",
  "+ 3-D slope",
  "+ attractor weights",
] as const;

export const ladderRoutes = new Hono<AppEnv>();

ladderRoutes.get("/", async (c) => {
  const db = createDb(requireDatabaseUrl(c.env.DATABASE_URL));
  const expRows = await db
    .select()
    .from(experiments)
    .where(eq(experiments.slug, "absorption"))
    .limit(1);
  const experiment = expRows[0];
  if (!experiment) {
    const empty: AbsorptionLadderResponse = { rungs: [...RUNG_ORDER], cities: [] };
    return c.json(empty);
  }

  const rows = await db
    .select()
    .from(modelResults)
    .where(
      and(
        eq(modelResults.experimentId, experiment.id),
        like(modelResults.notes, "stage2|%"),
      ),
    )
    .orderBy(asc(modelResults.city), asc(modelResults.k));

  const byCity = new Map<
    string,
    { deltas: number[]; monotonic: boolean; endsLe0: boolean }
  >();

  for (const row of rows) {
    if (!row.city || row.spatialR2 === null) {
      continue;
    }
    const existing = byCity.get(row.city) ?? {
      deltas: [],
      monotonic: false,
      endsLe0: false,
    };
    const rungIndex = RUNG_ORDER.indexOf(
      row.modelName as (typeof RUNG_ORDER)[number],
    );
    if (rungIndex < 0) {
      continue;
    }
    existing.deltas[rungIndex] = row.spatialR2;
    existing.monotonic = row.notes.includes("monotonic=true");
    existing.endsLe0 = row.notes.includes("ends_le0=true");
    byCity.set(row.city, existing);
  }

  const cityOrder = ["cardiff", "manchester", "bristol"];
  const body: AbsorptionLadderResponse = {
    rungs: [...RUNG_ORDER],
    cities: cityOrder
      .filter((city) => byCity.has(city))
      .map((city) => {
        const row = byCity.get(city)!;
        return {
          city,
          deltas: row.deltas,
          monotonic: row.monotonic,
          endsLe0: row.endsLe0,
        };
      }),
  };
  return c.json(body);
});
