import { describe, expect, it } from "vitest";
import type { VerdictDto } from "@kerbside/shared";
import {
  groupTopicIntoBands,
  groupVerdictsByTopic,
  outcomeBandForVerdict,
  topicLabelForVerdict,
} from "./claimTopics";
import { VERDICT_ORDER } from "./verdicts";

function v(
  partial: Pick<VerdictDto, "id" | "claim" | "verdict" | "experimentSlug">,
): VerdictDto {
  return {
    experimentId: null,
    evidence: "e",
    ...partial,
  };
}

describe("outcomeBandForVerdict", () => {
  it("maps proven/suggestive to held_up and negatives to did_not_hold", () => {
    expect(outcomeBandForVerdict("proven")).toBe("held_up");
    expect(outcomeBandForVerdict("suggestive")).toBe("held_up");
    expect(outcomeBandForVerdict("city_specific")).toBe("city_specific");
    expect(outcomeBandForVerdict("disproven")).toBe("did_not_hold");
    expect(outcomeBandForVerdict("withdrawn")).toBe("did_not_hold");
    expect(outcomeBandForVerdict("harmful")).toBe("did_not_hold");
    expect(outcomeBandForVerdict("untested")).toBe("did_not_hold");
  });
});

describe("groupTopicIntoBands", () => {
  it("keeps disproven out of the Held up band", () => {
    const items = [
      v({
        id: "1",
        claim: "Proven claim",
        verdict: "proven",
        experimentSlug: "radius",
      }),
      v({
        id: "2",
        claim: "Disproven claim",
        verdict: "disproven",
        experimentSlug: "radius",
      }),
      v({
        id: "3",
        claim: "City claim",
        verdict: "city_specific",
        experimentSlug: "radius",
      }),
    ];
    const bands = groupTopicIntoBands(items, VERDICT_ORDER);
    expect(bands.map((b) => b.id)).toEqual([
      "held_up",
      "city_specific",
      "did_not_hold",
    ]);
    expect(bands[0]!.items.map((i) => i.claim)).toEqual(["Proven claim"]);
    expect(bands[2]!.items.map((i) => i.claim)).toEqual(["Disproven claim"]);
  });
});

describe("groupVerdictsByTopic", () => {
  it("attaches bands per strand", () => {
    const groups = groupVerdictsByTopic(
      [
        v({
          id: "1",
          claim: "Proven claim",
          verdict: "proven",
          experimentSlug: "radius",
        }),
        v({
          id: "2",
          claim: "Withdrawn claim",
          verdict: "withdrawn",
          experimentSlug: "controls",
        }),
      ],
      VERDICT_ORDER,
    );
    expect(groups[0]!.topic.id).toBe("headline");
    expect(groups[0]!.bands[0]!.id).toBe("held_up");
    expect(topicLabelForVerdict(groups[0]!.items[0]!)).toBe(
      "Radius and weighting",
    );
  });
});
