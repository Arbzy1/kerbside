import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { app } from "../index";
import type {
  AbsorptionLadderResponse,
  ApiErrorResponse,
  CitiesListResponse,
  ControlsListResponse,
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
  it("returns K80-era verdicts including suggestive and radius headline", async () => {
    const res = await app.request("/api/verdicts", {}, env());
    expect(res.status).toBe(200);
    const body = (await res.json()) as VerdictsListResponse;
    expect(body.verdicts.length).toBeGreaterThanOrEqual(25);

    const kinds = new Set(body.verdicts.map((v) => v.verdict));
    expect(kinds.has("withdrawn")).toBe(true);
    expect(kinds.has("city_specific")).toBe(true);
    expect(kinds.has("proven")).toBe(true);
    expect(kinds.has("suggestive")).toBe(true);

    const demand = body.verdicts.find((v) =>
      v.claim.includes("weight field fails a permutation null"),
    );
    expect(demand?.verdict).toBe("withdrawn");

    const weighting = body.verdicts.find((v) =>
      v.claim.includes("Attractor weighting improves cycle-flow"),
    );
    expect(weighting?.verdict).toBe("city_specific");
    expect(weighting?.experimentSlug).toBe("radius");

    // The radius headline was reworded when K181/K182/K186/K187 established that the
    // baseline envelope is NOT separable from the wider one. The claim that survives is the
    // rejection of the narrow envelope, and the evidence must still carry the tie.
    const radius = body.verdicts.find((v) =>
      v.claim.includes("inherited narrow radius envelope is too narrow"),
    );
    expect(radius?.verdict).toBe("proven");
    expect(radius?.experimentSlug).toBe("radius");
    expect(radius?.evidence).toMatch(/1600,3200,6400|K181|tie-break/i);
    // and it must NOT claim the baseline beats the wider envelope
    expect(radius?.evidence).toMatch(/does NOT establish|not separable|tie-break/i);

    const subAdditive = body.verdicts.find((v) =>
      v.claim.includes("SAME lever"),
    );
    expect(subAdditive?.verdict).toBe("suggestive");

    const estimator = body.verdicts.find((v) =>
      v.claim.includes("Two spatial-CV estimators"),
    );
    expect(estimator?.verdict).toBe("proven");

    const recovered = body.verdicts.find((v) =>
      v.claim.includes("scored too conservatively"),
    );
    expect(recovered?.verdict).toBe("proven");

    const slopeLadder = body.verdicts.find((v) =>
      v.claim.includes("slope calibration is too STEEP"),
    );
    expect(slopeLadder?.verdict).toBe("city_specific");
    expect(slopeLadder?.experimentSlug).toBe("slope_x_radius");

    const ranking = body.verdicts.find((v) =>
      v.claim.includes("Configuration ranking transfers"),
    );
    expect(ranking?.verdict).toBe("city_specific");

    const gvaPoi = body.verdicts.find((v) =>
      v.claim.includes("Local POI density predicts LSOA GVA"),
    );
    expect(gvaPoi?.verdict).toBe("proven");

    const nonTransfer = body.verdicts.find((v) =>
      v.claim.includes("configuration effects do not transfer"),
    );
    expect(nonTransfer?.verdict).toBe("withdrawn");

    const endpoint = body.verdicts.find((v) =>
      v.claim.includes("Attractor covariates stop helping"),
    );
    expect(endpoint?.verdict).toBe("proven");
    expect(endpoint?.experimentSlug).toBe("absorption");

    const provision = body.verdicts.find((v) =>
      v.claim.startsWith("Cycle provision as routing impedance"),
    );
    expect(provision?.verdict).toBe("city_specific");
    expect(provision?.experimentSlug).toBe("cycle_provision");
    expect(provision?.evidence).toMatch(
      /floor_multiple=\+156\.5|bristol_delta=-0\.0071|placebo_delta=\+0\.0163/,
    );
    expect(provision?.evidence).toMatch(/FOUR riders/);

    const detection = body.verdicts.find((v) =>
      v.claim.includes("detection failure was geometric"),
    );
    expect(detection?.experimentSlug).toBe("cycle_detection");

    const osm = body.verdicts.find((v) =>
      v.claim.includes("ground truth was in OpenStreetMap"),
    );
    expect(osm?.experimentSlug).toBe("cycle_provision");

    const angular = body.verdicts.find((v) =>
      v.claim.includes("angular coefficient"),
    );
    expect(angular?.experimentSlug).toBe("angular_coefficient");
  });
});

describe("GET /api/cities", () => {
  it("returns twelve working cities with r², R², local-10 and K173 headline", async () => {
    const res = await app.request("/api/cities", {}, env());
    expect(res.status).toBe(200);
    const body = (await res.json()) as CitiesListResponse;
    expect(body.cities.length).toBe(12);
    expect(body.cities.every((c) => typeof c.heldOutR2 === "number")).toBe(
      true,
    );
    expect(body.cities.every((c) => typeof c.heldOutR2Corr === "number")).toBe(
      true,
    );
    const cardiff = body.cities.find((c) => c.name === "Cardiff");
    expect(cardiff).toBeDefined();
    expect(cardiff!.heldOutR2).toBeGreaterThan(0.4);
    expect(body.cities[0]?.name).toBe("Cardiff");
    expect(body.transferSummary.nCities).toBe(12);
    expect(body.transferSummary.nPoints).toBe(2334);
    expect(body.transferSummary.r2AtK2).toBeCloseTo(0.306, 2);
    expect(body.transferSummary.r2DetAtK11).toBeCloseTo(0.033, 2);
    expect(body.transferSummary.local10R2).toBeCloseTo(0.208, 2);
    expect(body.transferSummary.envelope).toBe("800/1600/3200");
    expect(body.studyCities.length).toBe(3);
    expect(body.studyCities.map((c) => c.city).sort()).toEqual([
      "bristol",
      "cardiff",
      "manchester",
    ]);
  });
});

describe("GET /api/controls", () => {
  it("returns control null distributions", async () => {
    const res = await app.request("/api/controls", {}, env());
    expect(res.status).toBe(200);
    const body = (await res.json()) as ControlsListResponse;
    expect(body.controls.length).toBeGreaterThanOrEqual(5);
    const cardiffAbs = body.controls.find(
      (c) =>
        c.city === "cardiff" &&
        c.testName === "POI absorption" &&
        c.configName === "grav_sq2s",
    );
    expect(cardiffAbs).toBeDefined();
    expect(cardiffAbs?.percentile).toBe(10);
    expect(cardiffAbs?.nullDraws.length).toBe(20);
  });
});

describe("GET /api/ladder", () => {
  it("returns the three-city absorption ladder", async () => {
    const res = await app.request("/api/ladder", {}, env());
    expect(res.status).toBe(200);
    const body = (await res.json()) as AbsorptionLadderResponse;
    expect(body.rungs).toHaveLength(4);
    expect(body.cities).toHaveLength(3);
    const cardiff = body.cities.find((c) => c.city === "cardiff");
    expect(cardiff?.monotonic).toBe(true);
    expect(cardiff?.deltas[3]).toBeCloseTo(-0.035, 3);
  });
});
