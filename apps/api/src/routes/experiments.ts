import { and, eq, not, like } from "drizzle-orm";
import { Hono } from "hono";
import type {
  ApiErrorResponse,
  ExperimentDetailResponse,
  ExperimentDto,
  ExperimentResultsResponse,
  ExperimentsListResponse,
  ModelResultDto,
} from "@kerbside/shared";
import { createDb } from "../db/client";
import { experiments, modelResults } from "../db/schema";
import { requireDatabaseUrl, type AppEnv } from "../env";

function toExperimentDto(row: typeof experiments.$inferSelect): ExperimentDto {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    question: row.question,
    methodNote: row.methodNote,
  };
}

function toModelResultDto(row: typeof modelResults.$inferSelect): ModelResultDto {
  return {
    id: row.id,
    experimentId: row.experimentId,
    modelName: row.modelName,
    city: row.city,
    k: row.k,
    randomR2: row.randomR2,
    spatialR2: row.spatialR2,
    locoR2: row.locoR2,
    n: row.n,
    notes: row.notes,
  };
}

export const experimentsRoutes = new Hono<AppEnv>();

experimentsRoutes.get("/", async (c) => {
  const db = createDb(requireDatabaseUrl(c.env.DATABASE_URL));
  const rows = await db.select().from(experiments).orderBy(experiments.slug);
  const body: ExperimentsListResponse = {
    experiments: rows.map(toExperimentDto),
  };
  return c.json(body);
});

experimentsRoutes.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const db = createDb(requireDatabaseUrl(c.env.DATABASE_URL));
  const rows = await db
    .select()
    .from(experiments)
    .where(eq(experiments.slug, slug))
    .limit(1);
  const experiment = rows[0];
  if (!experiment) {
    const body: ApiErrorResponse = {
      error: "not_found",
      message: `Experiment not found: ${slug}`,
    };
    return c.json(body, 404);
  }
  const body: ExperimentDetailResponse = {
    experiment: toExperimentDto(experiment),
  };
  return c.json(body);
});

experimentsRoutes.get("/:slug/results", async (c) => {
  const slug = c.req.param("slug");
  const db = createDb(requireDatabaseUrl(c.env.DATABASE_URL));
  const rows = await db
    .select()
    .from(experiments)
    .where(eq(experiments.slug, slug))
    .limit(1);
  const experiment = rows[0];
  if (!experiment) {
    const body: ApiErrorResponse = {
      error: "not_found",
      message: `Experiment not found: ${slug}`,
    };
    return c.json(body, 404);
  }
  const results = await db
    .select()
    .from(modelResults)
    .where(
      and(
        eq(modelResults.experimentId, experiment.id),
        not(like(modelResults.notes, "transfer_summary|%")),
      ),
    )
    .orderBy(modelResults.modelName);
  const body: ExperimentResultsResponse = {
    experiment: toExperimentDto(experiment),
    results: results.map(toModelResultDto),
  };
  return c.json(body);
});
