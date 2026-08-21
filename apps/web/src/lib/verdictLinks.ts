/**
 * Scoreboard cards share experiment pages. Map each claim to the page (and
 * section hash) that actually shows its evidence — otherwise several cards
 * land on the wrong-looking top of a long page, and Controls claims hit a
 * stub redirect at /experiments/controls.
 */

function normalizeClaimKey(claim: string): string {
  return claim
    .replace(/[\u2018\u2019\u2032]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

/** Keys are normalized with normalizeClaimKey. */
const EXACT_HREF: Record<string, string> = {
  "The weight field fails a permutation null in both cities tested":
    "/controls",
  "POI gravity weighting encodes demand": "/controls",
  "Absorption is informational, not regression mechanics": "/controls",
  "Population beats network length as the everywhere origin": "/controls",

  "Widening the radius envelope improves cycle-flow prediction":
    "/experiments/radius#k80_radius_pooled",
  "Attractor weighting improves cycle-flow prediction":
    "/experiments/radius#k80b_factorial",
  "Radius and attractor weighting are largely the SAME lever":
    "/experiments/radius#k80b_factorial",
  "An empirical distance-decay curve for cycling":
    "/experiments/radius#k80_decay_curve",
  "Do the established results survive the better radius envelope?":
    "/experiments/radius#k88_slope_narrow",
  "The radius optimum is different in all three cities - the pooled one fits Bristol":
    "/experiments/radius#k80_radius_pooled",
  "sDNA's one continuous decay parameter is real and mis-set - the null was diluted":
    "/experiments/radius#k80_decay_curve",

  "LSOA GVA does not correlate better with pedestrian than vehicular accessibility":
    "/experiments/gva#k82_gva_walk",
  "'sDNA does not predict GVA' is configuration-specific, not a property of sDNA":
    "/experiments/gva#k82_gva_walk",
  "sDNA betweenness predicts LSOA GVA": "/experiments/gva#k82_gva_walk",
  "Local POI density predicts LSOA GVA": "/experiments/gva#k82_gva_walk",
  "PageRank and PT accessibility on a PEDESTRIAN network (ideas I5/I6 as worded)":
    "/experiments/gva#k89_walk_pagerank_pt",

  "DEM data-quality defects are real, measurable and immaterial":
    "/experiments/elevation#k83_orig",
  "Network structure does not predict WHO chooses to cycle in any transferable way":
    "/experiments/mode_share#k85_mode_share",
  "Public transport as a modelled outcome (ORR station usage)":
    "/experiments/rail#k90_rail_usage",
  "sDNA's cycle preset under-penalises turns on larger networks":
    "/experiments/turn_cost#k81",
  "Slope improves prediction": "/experiments/slope#k60_matched",
  "sDNA's published slope calibration is not optimal for Cardiff":
    "/experiments/slope_ladder#k96_slope_ladder",
  "WITHDRAWN - 'Cardiff wants a steeper slope response than the default'":
    "/experiments/slope_ladder#k96_slope_ladder",
  "sDNA's published slope calibration is too STEEP for two of three cities":
    "/experiments/slope_x_radius#k97_slope_x_radius",
  "The slope restatement survives re-testing at Cardiff's own radius envelope":
    "/experiments/slope_x_radius#k97_slope_x_radius",
  "Slope and radius are ADDITIVE - unlike radius and attractor weighting":
    "/experiments/slope_x_radius#k97_factorial",
  "An argmax is not an optimum unless it clears its neighbours by more than the floor":
    "/experiments/estimator#k91_min_detectable",

  "Two spatial-CV estimators are in circulation, and the better one is free":
    "/experiments/estimator#k91_floor_pooled",
  "Cardiff's detection limit is delta ~ 0.05 and no method choice changes it":
    "/experiments/estimator#k91_min_detectable",
  "Six results were scored too conservatively to be seen":
    "/experiments/estimator#k94_changed",
  "11 of 26 ladders in this project are plateaux, not point optima":
    "/experiments/estimator",
  "Under multiplicity correction, none of the permutation-null claims survives":
    "/experiments/estimator#k144_fdr",
  "Under multiplicity correction, two permutation-null claims survive":
    "/experiments/estimator#k144_fdr",
  "sDNA multimodal routing works; station-usage test is underpowered":
    "/experiments/multimodal#k93_multimodal",
  "WITHDRAWN - 'the multimodal build perturbed the road network'":
    "/experiments/multimodal#k93_multimodal",

  "Public transport accessibility predicts cycle flow - but only at a mis-set radius":
    "/experiments/pt_accessibility",
  "WITHDRAWN - 'PT accessibility fails on a pedestrian network too'":
    "/experiments/pt_accessibility",
  "The pedestrian null is not a radius artefact": "/experiments/pedestrian",

  "Cycle provision as routing impedance improves prediction - in Manchester":
    "/experiments/cycle_provision#k133_i4_direct_osm",
  "The cycle-infrastructure ground truth was in OpenStreetMap all along":
    "/experiments/cycle_provision#k130_osm_ground_truth",
  "The cycle-lane detection failure was geometric, not a model failure":
    "/experiments/cycle_detection#k139b_geometry",
  "The angular coefficient is the one preset that was already well chosen":
    "/experiments/angular_coefficient#k140_angular",

  "Attractor covariates stop helping once attractors are in the assignment":
    "/experiments/absorption#absorption-ladder",
  "The absorption decline is monotonic":
    "/experiments/absorption#absorption-ladder",
  "Radius banding helps": "/experiments/absorption#absorption-ladder",

  "Configuration ranking transfers across held-out cities":
    "/experiments/transfer#k73_pooled",
  "sDNA configuration effects do not transfer between cities":
    "/experiments/transfer#k73_loco",
  "The model does transfer between cities - and the shape transfers almost exactly":
    "/experiments/transfer#k143_scale_transfer",
  "Ranking transfers at two cities; scale barely does at eleven":
    "/experiments/transfer",
  "Shared slopes transfer; the missing piece is a local intercept":
    "/experiments/transfer",
  "At 12 cities the narrow radius envelope is rejected; 800/1600/3200 is not separable from wider":
    "/experiments/radius",
  "Hybrid radius (MATCH_ANALYTICAL) is not a free upgrade":
    "/experiments/radius",
  "sDNA Learn on nine columns does not close the published 0.854":
    "/experiments/estimator",
  "Dropping traffic-free from the routing graph is not a new spec":
    "/experiments/cycle_provision",
};

export function verdictHref(
  claim: string,
  experimentSlug: string | null,
): string | null {
  const exact = EXACT_HREF[normalizeClaimKey(claim)];
  if (exact) {
    return exact;
  }
  if (!experimentSlug) {
    return null;
  }
  if (experimentSlug === "controls") {
    return "/controls";
  }
  return `/experiments/${experimentSlug}`;
}

export type RelatedVerdictLink = {
  href: string;
  label: string;
};

/** Cross-claim links required by prompt 27 (provision ↔ transfer ↔ multiplicity). */
export function relatedVerdictLinks(claim: string): RelatedVerdictLink[] {
  const key = normalizeClaimKey(claim);
  if (
    key === "The cycle-lane detection failure was geometric, not a model failure"
  ) {
    return [
      {
        href: "/experiments/cycle_provision#k130_osm_ground_truth",
        label: "See the OpenStreetMap ground truth",
      },
    ];
  }
  if (
    key ===
    "WITHDRAWN - 'Cardiff wants a steeper slope response than the default'"
  ) {
    return [
      {
        href: "/experiments/slope_x_radius#k97_slope_x_radius",
        label: "See the corrected slope result",
      },
    ];
  }
  if (key === "WITHDRAWN - 'the multimodal build perturbed the road network'") {
    return [
      {
        href: "/experiments/multimodal#k93_multimodal",
        label: "See the corrected multimodal result",
      },
    ];
  }
  if (
    key ===
    "Cycle provision as routing impedance improves prediction - in Manchester"
  ) {
    return [
      {
        href: "/experiments/transfer#k143_scale_transfer",
        label: "See scale-normalised transfer",
      },
      {
        href: "/experiments/estimator#k144_fdr",
        label: "See multiplicity correction",
      },
    ];
  }
  if (key.startsWith("Under multiplicity correction")) {
    return [
      {
        href: "/experiments/cycle_provision#k133_i4_direct_osm",
        label: "See the Manchester provision effect",
      },
    ];
  }
  if (
    key ===
    "The model does transfer between cities - and the shape transfers almost exactly"
  ) {
    return [
      {
        href: "/experiments/cycle_provision#k133_i4_direct_osm",
        label: "See cycle provision (LOCO rider)",
      },
    ];
  }
  if (
    key === "Ranking transfers at two cities; scale barely does at eleven"
  ) {
    return [
      {
        href: "/experiments/radius",
        label: "See the transferable radius envelope",
      },
    ];
  }
  if (
    key === "Shared slopes transfer; the missing piece is a local intercept"
  ) {
    return [
      {
        href: "/experiments/transfer",
        label: "See the twelve-city transfer curve",
      },
    ];
  }
  if (
    key ===
    "At 12 cities the narrow radius envelope is rejected; 800/1600/3200 is not separable from wider"
  ) {
    return [
      {
        href: "/experiments/transfer",
        label: "See twelve-city transfer",
      },
    ];
  }
  return [];
}

/** @deprecated prefer relatedVerdictLinks */
export function relatedVerdictHref(claim: string): RelatedVerdictLink | null {
  return relatedVerdictLinks(claim)[0] ?? null;
}
