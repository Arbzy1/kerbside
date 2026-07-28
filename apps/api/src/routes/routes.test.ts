import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { app } from "../index";
import type {
  ApiErrorResponse,
  CitiesListResponse,
  ExperimentDetailResponse,
  ExperimentResultsResponse,
  ExperimentsListResponse,
  VerdictsListResponse,
} from "@kerbside/shared";

const monorepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../..",
);
config({ path: path.join(monorepoRoot, ".env") });

function env() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL required for route tests");
  }
  return { DATABASE_URL };
}

describe("GET /api/experiments", () => {
  beforeAll(() => {
    env();
  });

  it("returns the experiment list", async () => {
    const res = await app.request("/api/experiments", {}, env());
    expect(res.status).toBe(200);
    const body = (await res.json()) as ExperimentsListResponse;
    expect(body.experiments.length).toBeGreaterThanOrEqual(7);
    expect(body.experiments.some((e) => e.slug === "exp1")).toBe(true);
  });
});

describe("GET /api/experiments/:slug", () => {
  it("returns an experiment by slug", async () => {
    const res = await app.request("/api/experiments/exp1", {}, env());
    expect(res.status).toBe(200);
    const body = (await res.json()) as ExperimentDetailResponse;
    expect(body.experiment.slug).toBe("exp1");
  });

  it("returns 404 JSON for an unknown slug", async () => {
    const res = await app.request("/api/experiments/does-not-exist", {}, env());
    expect(res.status).toBe(404);
    const body = (await res.json()) as ApiErrorResponse;
    expect(body.error).toBe("not_found");
  });
});

describe("GET /api/experiments/:slug/results", () => {
  it("returns model results for an experiment", async () => {
    const res = await app.request("/api/experiments/exp1/results", {}, env());
    expect(res.status).toBe(200);
    const body = (await res.json()) as ExperimentResultsResponse;
    expect(body.experiment.slug).toBe("exp1");
    expect(body.results.length).toBeGreaterThan(0);
    expect(typeof body.results[0]?.randomR2).toBe("number");
  });

  it("returns 404 JSON for an unknown slug", async () => {
    const res = await app.request(
      "/api/experiments/missing/results",
      {},
      env(),
    );
    expect(res.status).toBe(404);
    const body = (await res.json()) as ApiErrorResponse;
    expect(body.error).toBe("not_found");
  });
});

describe("GET /api/verdicts", () => {
  it("returns verdicts with experimentSlug from a join", async () => {
    const res = await app.request("/api/verdicts", {}, env());
    expect(res.status).toBe(200);
    const body = (await res.json()) as VerdictsListResponse;
    expect(body.verdicts.length).toBe(8);

    const poi = body.verdicts.find((v) =>
      v.claim.includes("POI gravity attractors"),
    );
    expect(poi).toBeDefined();
    expect(poi?.experimentId).not.toBeNull();
    expect(poi?.experimentSlug).toBe("exp1");

    const unlinked = body.verdicts.find((v) => v.experimentId === null);
    expect(unlinked).toBeDefined();
    expect(unlinked?.experimentSlug).toBeNull();
  });
});

describe("GET /api/cities", () => {
  it("returns ranked cities with heldOutR2 and transfer summary", async () => {
    const res = await app.request("/api/cities", {}, env());
    expect(res.status).toBe(200);
    const body = (await res.json()) as CitiesListResponse;
    expect(body.cities.length).toBe(15);
    expect(body.cities.every((c) => typeof c.heldOutR2 === "number")).toBe(
      true,
    );
    expect(body.cities.some((c) => c.name === "Cardiff")).toBe(false);
    expect(body.transferSummary.cohortNAuthorities).toBe(36);
    expect(body.transferSummary.cardiffNPoints).toBe(78);
    expect(body.transferSummary.withinCityR2).toBeGreaterThan(0.4);
    expect(body.transferSummary.acrossCityR2).toBeGreaterThan(0.4);
    expect(body.transferSummary.transferPenalty).toBeLessThan(0);
    expect(body.transferSummary.cardiffFromElsewhereR2).toBeLessThan(
      body.transferSummary.acrossCityR2,
    );
  });
});
