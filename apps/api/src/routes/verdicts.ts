import { asc, eq } from "drizzle-orm";
import { Hono } from "hono";
import type { VerdictDto, VerdictsListResponse } from "@kerbside/shared";
import { createDb } from "../db/client";
import { experiments, verdicts } from "../db/schema";
import { requireDatabaseUrl, type AppEnv } from "../env";

export const verdictsRoutes = new Hono<AppEnv>();

verdictsRoutes.get("/", async (c) => {
  const db = createDb(requireDatabaseUrl(c.env.DATABASE_URL));
  const rows = await db
    .select({
      id: verdicts.id,
      experimentId: verdicts.experimentId,
      experimentSlug: experiments.slug,
      claim: verdicts.claim,
      verdict: verdicts.verdict,
      evidence: verdicts.evidence,
    })
    .from(verdicts)
    .leftJoin(experiments, eq(verdicts.experimentId, experiments.id))
    .orderBy(asc(verdicts.claim));

  const body: VerdictsListResponse = {
    verdicts: rows.map(
      (row): VerdictDto => ({
        id: row.id,
        experimentId: row.experimentId,
        experimentSlug: row.experimentSlug,
        claim: row.claim,
        verdict: row.verdict,
        evidence: row.evidence,
      }),
    ),
  };
  return c.json(body);
});
