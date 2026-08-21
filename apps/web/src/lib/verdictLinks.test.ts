import { describe, expect, it } from "vitest";
import {
  relatedVerdictHref,
  relatedVerdictLinks,
  verdictHref,
} from "./verdictLinks";

describe("verdictHref", () => {
  it("sends controls-family claims to /controls", () => {
    expect(
      verdictHref(
        "The weight field fails a permutation null in both cities tested",
        "controls",
      ),
    ).toBe("/controls");
    expect(verdictHref("Withdrawn claim", "controls")).toBe("/controls");
  });

  it("deep-links radius family claims to distinct sections", () => {
    expect(
      verdictHref("An empirical distance-decay curve for cycling", "radius"),
    ).toBe("/experiments/radius#k80_decay_curve");
    expect(
      verdictHref(
        "Attractor weighting improves cycle-flow prediction",
        "radius",
      ),
    ).toBe("/experiments/radius#k80b_factorial");
  });

  it("keeps cycle provision and lane detection on different evidence pages", () => {
    expect(
      verdictHref(
        "Cycle provision as routing impedance improves prediction - in Manchester",
        "cycle_provision",
      ),
    ).toBe("/experiments/cycle_provision#k133_i4_direct_osm");
    expect(
      verdictHref(
        "The cycle-lane detection failure was geometric, not a model failure",
        "cycle_detection",
      ),
    ).toBe("/experiments/cycle_detection#k139b_geometry");
    expect(
      relatedVerdictHref(
        "The cycle-lane detection failure was geometric, not a model failure",
      ),
    ).toEqual({
      href: "/experiments/cycle_provision#k130_osm_ground_truth",
      label: "See the OpenStreetMap ground truth",
    });
  });

  it("routes corrected slope claims to the corrected-envelope evidence", () => {
    expect(
      verdictHref(
        "Slope and radius are ADDITIVE — unlike radius and attractor weighting",
        "slope_x_radius",
      ),
    ).toBe("/experiments/slope_x_radius#k97_factorial");
    expect(
      relatedVerdictHref(
        "WITHDRAWN — 'Cardiff wants a steeper slope response than the default'",
      ),
    ).toEqual({
      href: "/experiments/slope_x_radius#k97_slope_x_radius",
      label: "See the corrected slope result",
    });
  });

  it("cross-links provision to scale_transfer and multiplicity (prompt 27)", () => {
    expect(
      relatedVerdictLinks(
        "Cycle provision as routing impedance improves prediction - in Manchester",
      ),
    ).toEqual([
      {
        href: "/experiments/transfer#k143_scale_transfer",
        label: "See scale-normalised transfer",
      },
      {
        href: "/experiments/estimator#k144_fdr",
        label: "See multiplicity correction",
      },
    ]);
    expect(
      verdictHref(
        "The model does transfer between cities - and the shape transfers almost exactly",
        "transfer",
      ),
    ).toBe("/experiments/transfer#k143_scale_transfer");
    expect(
      verdictHref(
        "Under multiplicity correction, two permutation-null claims survive",
        "estimator",
      ),
    ).toBe("/experiments/estimator#k144_fdr");
  });

  it("routes twelve-city transfer claims to transfer and radius pages", () => {
    expect(
      verdictHref(
        "Ranking transfers at two cities; scale barely does at eleven",
        "transfer",
      ),
    ).toBe("/experiments/transfer");
    expect(
      verdictHref(
        "Shared slopes transfer; the missing piece is a local intercept",
        "transfer",
      ),
    ).toBe("/experiments/transfer");
    expect(
      verdictHref(
        "At 12 cities the narrow radius envelope is rejected; 800/1600/3200 is not separable from wider",
        "radius",
      ),
    ).toBe("/experiments/radius");
    expect(
      verdictHref(
        "Hybrid radius (MATCH_ANALYTICAL) is not a free upgrade",
        "radius",
      ),
    ).toBe("/experiments/radius");
    expect(
      verdictHref(
        "sDNA Learn on nine columns does not close the published 0.854",
        "estimator",
      ),
    ).toBe("/experiments/estimator");
    expect(
      verdictHref(
        "Dropping traffic-free from the routing graph is not a new spec",
        "cycle_provision",
      ),
    ).toBe("/experiments/cycle_provision");
    expect(
      relatedVerdictLinks(
        "Ranking transfers at two cities; scale barely does at eleven",
      ),
    ).toEqual([
      {
        href: "/experiments/radius",
        label: "See the transferable radius envelope",
      },
    ]);
  });
});
