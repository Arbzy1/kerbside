import { asc } from "drizzle-orm";
import { Hono } from "hono";
import type {
  ControlCategory,
  ControlDto,
  ControlsListResponse,
} from "@kerbside/shared";
import { createDb } from "../db/client";
import { controls } from "../db/schema";
import { requireDatabaseUrl, type AppEnv } from "../env";

function categoryForTestName(testName: string): ControlCategory {
  switch (testName) {
    case "POI absorption":
      return "absorption";
    case "random-weight gain":
      return "random_weight_gain";
    default:
      throw new Error(`Unknown controls test name: ${testName}`);
  }
}

function toControlDto(row: typeof controls.$inferSelect): ControlDto {
  const draws = Array.isArray(row.nullDraws)
    ? row.nullDraws.filter((n): n is number => typeof n === "number")
    : [];
  return {
    id: row.id,
    experimentId: row.experimentId,
    city: row.city,
    testName: row.testName,
    configName: row.configName,
    realValue: row.realValue,
    nullMean: row.nullMean,
    nullSd: row.nullSd,
    nullN: row.nullN,
    percentile: row.percentile,
    interpretation: row.interpretation,
    nullDraws: draws,
    category: categoryForTestName(row.testName),
  };
}

export const controlsRoutes = new Hono<AppEnv>();

controlsRoutes.get("/", async (c) => {
  const db = createDb(requireDatabaseUrl(c.env.DATABASE_URL));
  const rows = await db
    .select()
    .from(controls)
    .orderBy(asc(controls.city), asc(controls.testName), asc(controls.configName));

  const body: ControlsListResponse = {
    controls: rows.map(toControlDto),
  };
  return c.json(body);
});
