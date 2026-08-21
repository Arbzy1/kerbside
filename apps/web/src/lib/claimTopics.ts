import type { VerdictDto, VerdictKind } from "@kerbside/shared";

export type ClaimTopicId =
  | "headline"
  | "cycle_infra"
  | "slope"
  | "transfer_methods"
  | "controls"
  | "failed_outcomes"
  | "other";

export type ClaimTopic = {
  id: ClaimTopicId;
  label: string;
  blurb: string;
};

export type OutcomeBandId = "held_up" | "city_specific" | "did_not_hold";

export type OutcomeBand = {
  id: OutcomeBandId;
  label: string;
  items: VerdictDto[];
};

export const CLAIM_TOPICS: ClaimTopic[] = [
  {
    id: "headline",
    label: "Radius and weighting",
    blurb:
      "How far the model looks along the network, and whether attractor weights are a separate lever.",
  },
  {
    id: "cycle_infra",
    label: "Cycle provision vs detection",
    blurb:
      "Two different I4 questions: Street View lane detection (closed) vs OSM provision as routing impedance (city-specific).",
  },
  {
    id: "slope",
    label: "Slope & terrain",
    blurb:
      "DEM quality, slope exponents, and how those results change with the radius envelope.",
  },
  {
    id: "transfer_methods",
    label: "Transfer & scoring",
    blurb:
      "Twelve-city transfer curve, local intercept, estimators, multiplicity correction, and multimodal builds.",
  },
  {
    id: "controls",
    label: "Controls & absorption",
    blurb:
      "Permutation nulls, demand stories, and whether attractor covariates still help once weights are in the assignment.",
  },
  {
    id: "failed_outcomes",
    label: "Outcomes that failed",
    blurb: "GVA, mode share, rail volume, PageRank, and similar dead ends.",
  },
  {
    id: "other",
    label: "Other spine claims",
    blurb: "Remaining register rows not in the strands above.",
  },
];

const SLUG_TOPIC: Record<string, ClaimTopicId> = {
  radius: "headline",
  turn_cost: "headline",
  cycle_provision: "cycle_infra",
  cycle_detection: "cycle_infra",
  angular_coefficient: "cycle_infra",
  slope: "slope",
  slope_ladder: "slope",
  slope_x_radius: "slope",
  elevation: "slope",
  transfer: "transfer_methods",
  estimator: "transfer_methods",
  multimodal: "transfer_methods",
  pt_accessibility: "transfer_methods",
  pedestrian: "failed_outcomes",
  controls: "controls",
  absorption: "controls",
  gva: "failed_outcomes",
  mode_share: "failed_outcomes",
  rail: "failed_outcomes",
  exp1: "other",
  exp2: "other",
  exp3: "other",
  exp4: "failed_outcomes",
  exp5: "other",
  exp6: "other",
  exp7: "cycle_infra",
};

function claimTopicFallback(claim: string): ClaimTopicId {
  const c = claim.toLowerCase();
  if (c.includes("radius") || c.includes("weight") || c.includes("decay") || c.includes("hybrid")) {
    return "headline";
  }
  if (
    c.includes("cycle") ||
    c.includes("street view") ||
    c.includes("openstreetmap") ||
    c.includes("angular") ||
    c.includes("traffic-free")
  ) {
    return "cycle_infra";
  }
  if (c.includes("slope") || c.includes("dem") || c.includes("elevation")) {
    return "slope";
  }
  if (
    c.includes("transfer") ||
    c.includes("estimator") ||
    c.includes("learn") ||
    c.includes("multiplicity") ||
    c.includes("multimodal") ||
    c.includes("plateau") ||
    c.includes("public transport accessibility")
  ) {
    return "transfer_methods";
  }
  if (
    c.includes("absorption") ||
    c.includes("population beats") ||
    c.includes("permutation null") ||
    c.includes("informational")
  ) {
    return "controls";
  }
  if (
    c.includes("gva") ||
    c.includes("mode share") ||
    c.includes("pagerank") ||
    c.includes("rail") ||
    c.includes("who chooses")
  ) {
    return "failed_outcomes";
  }
  return "other";
}

export function topicForVerdict(verdict: VerdictDto): ClaimTopicId {
  const fromSlug = verdict.experimentSlug
    ? SLUG_TOPIC[verdict.experimentSlug]
    : undefined;
  if (fromSlug) {
    return fromSlug;
  }
  return claimTopicFallback(verdict.claim);
}

export function topicLabelForVerdict(verdict: VerdictDto): string {
  const id = topicForVerdict(verdict);
  return CLAIM_TOPICS.find((t) => t.id === id)?.label ?? "Other";
}

export function outcomeBandForVerdict(kind: VerdictKind): OutcomeBandId {
  if (kind === "proven" || kind === "suggestive") {
    return "held_up";
  }
  if (kind === "city_specific") {
    return "city_specific";
  }
  return "did_not_hold";
}

const BAND_META: Array<{ id: OutcomeBandId; label: string }> = [
  { id: "held_up", label: "Held up" },
  { id: "city_specific", label: "City-specific" },
  { id: "did_not_hold", label: "Did not hold" },
];

/** Split a strand's claims into Held up / City-specific / Did not hold. */
export function groupTopicIntoBands(
  items: VerdictDto[],
  verdictOrder: readonly VerdictKind[],
): OutcomeBand[] {
  const rank = new Map(verdictOrder.map((k, i) => [k, i]));
  const buckets: Record<OutcomeBandId, VerdictDto[]> = {
    held_up: [],
    city_specific: [],
    did_not_hold: [],
  };
  for (const item of items) {
    buckets[outcomeBandForVerdict(item.verdict)].push(item);
  }
  for (const id of Object.keys(buckets) as OutcomeBandId[]) {
    buckets[id].sort(
      (a, b) =>
        (rank.get(a.verdict) ?? 99) - (rank.get(b.verdict) ?? 99) ||
        a.claim.localeCompare(b.claim),
    );
  }
  return BAND_META.map((meta) => ({
    ...meta,
    items: buckets[meta.id],
  })).filter((band) => band.items.length > 0);
}

export function groupVerdictsByTopic(
  verdicts: VerdictDto[],
  verdictOrder: readonly VerdictKind[],
): Array<{ topic: ClaimTopic; items: VerdictDto[]; bands: OutcomeBand[] }> {
  const byTopic = new Map<ClaimTopicId, VerdictDto[]>();
  for (const topic of CLAIM_TOPICS) {
    byTopic.set(topic.id, []);
  }
  for (const verdict of verdicts) {
    const id = topicForVerdict(verdict);
    byTopic.get(id)!.push(verdict);
  }
  const rank = new Map(verdictOrder.map((k, i) => [k, i]));
  return CLAIM_TOPICS.map((topic) => {
    const items = [...(byTopic.get(topic.id) ?? [])].sort(
      (a, b) =>
        (rank.get(a.verdict) ?? 99) - (rank.get(b.verdict) ?? 99) ||
        a.claim.localeCompare(b.claim),
    );
    return {
      topic,
      items,
      bands: groupTopicIntoBands(items, verdictOrder),
    };
  }).filter((g) => g.items.length > 0);
}
