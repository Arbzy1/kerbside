import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router";
import type { AbsorptionLadderResponse, VerdictDto } from "@kerbside/shared";
import { ScoreboardPage } from "@/routes/ScoreboardPage";
import { ScoreboardView } from "@/routes/Scoreboard";
import { groupVerdicts } from "@/lib/verdicts";

const sampleVerdicts: VerdictDto[] = [
  {
    id: "1",
    experimentId: "exp-a",
    experimentSlug: "exp1",
    claim: "Proven claim",
    verdict: "proven",
    evidence: "e1",
  },
  {
    id: "2",
    experimentId: null,
    experimentSlug: null,
    claim: "Harmful claim",
    verdict: "harmful",
    evidence: "e2",
  },
  {
    id: "3",
    experimentId: "exp-b",
    experimentSlug: "exp4",
    claim: "Disproven claim",
    verdict: "disproven",
    evidence: "e3",
  },
  {
    id: "4",
    experimentId: null,
    experimentSlug: null,
    claim: "Untested claim",
    verdict: "untested",
    evidence: "e4",
  },
  {
    id: "5",
    experimentId: "exp-c",
    experimentSlug: "controls",
    claim: "Withdrawn claim",
    verdict: "withdrawn",
    evidence: "e5",
  },
  {
    id: "6",
    experimentId: "exp-d",
    experimentSlug: "absorption",
    claim: "City-specific claim",
    verdict: "city_specific",
    evidence: "e6",
  },
  {
    id: "7",
    experimentId: "exp-e",
    experimentSlug: "radius",
    claim: "Suggestive claim",
    verdict: "suggestive",
    evidence: "e7",
  },
];

const sampleLadder: AbsorptionLadderResponse = {
  rungs: [
    "angular, nested",
    "+ banded radii",
    "+ 3-D slope",
    "+ attractor weights",
  ],
  cities: [
    {
      city: "cardiff",
      deltas: [0.242, 0.195, 0.08, -0.069],
      monotonic: true,
      endsLe0: true,
    },
  ],
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("groupVerdicts", () => {
  it("buckets verdicts by kind including suggestive, withdrawn and city_specific", () => {
    const grouped = groupVerdicts(sampleVerdicts);
    expect(grouped.proven.map((v) => v.claim)).toEqual(["Proven claim"]);
    expect(grouped.suggestive.map((v) => v.claim)).toEqual(["Suggestive claim"]);
    expect(grouped.disproven.map((v) => v.claim)).toEqual(["Disproven claim"]);
    expect(grouped.harmful.map((v) => v.claim)).toEqual(["Harmful claim"]);
    expect(grouped.untested.map((v) => v.claim)).toEqual(["Untested claim"]);
    expect(grouped.withdrawn.map((v) => v.claim)).toEqual(["Withdrawn claim"]);
    expect(grouped.city_specific.map((v) => v.claim)).toEqual([
      "City-specific claim",
    ]);
  });
});

describe("ScoreboardView", () => {
  it("provides headlines, guide link, and claim search", () => {
    render(
      <MemoryRouter>
        <ScoreboardView
          verdicts={sampleVerdicts}
          ladder={null}
          standingWarning="Radius-sensitive claims remain provisional."
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Findings",
      }),
    ).toBeTruthy();
    expect(screen.getByTestId("at-a-glance")).toBeTruthy();
    expect(screen.getByText("Ranking transfers")).toBeTruthy();
    expect(screen.getByText("Local intercept")).toBeTruthy();
    expect(screen.getByText("Radius: narrow rejected")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Cities" })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Read the story/i }),
    ).toBeTruthy();
    expect(screen.getByTestId("standing-warning").textContent).toContain(
      "Radius-sensitive claims remain provisional.",
    );

    fireEvent.change(screen.getByRole("searchbox", { name: "Search claims" }), {
      target: { value: "city-specific" },
    });

    expect(screen.getByText("City-specific claim")).toBeTruthy();
    expect(screen.queryByText("Proven claim")).toBeNull();
  });

  it("bands outcomes inside strands so disproven is not peer to held-up", () => {
    render(
      <MemoryRouter>
        <ScoreboardView verdicts={sampleVerdicts} ladder={sampleLadder} />
      </MemoryRouter>,
    );

    const headline = screen.getByTestId("topic-group-headline");
    expect(
      within(headline).getByTestId("outcome-band-held_up"),
    ).toBeTruthy();
    expect(
      within(within(headline).getByTestId("outcome-band-held_up")).getByText(
        "Suggestive claim",
      ),
    ).toBeTruthy();

    const controls = screen.getByTestId("topic-group-controls");
    expect(
      within(controls).getByTestId("outcome-band-city_specific"),
    ).toBeTruthy();
    expect(
      within(controls).getByTestId("outcome-band-did_not_hold"),
    ).toBeTruthy();
    expect(
      within(
        within(controls).getByTestId("outcome-band-did_not_hold"),
      ).getByText("Withdrawn claim"),
    ).toBeTruthy();
    expect(screen.getByTestId("absorption-ladder-chart")).toBeTruthy();
  });

  it("can switch to by-verdict view with strand tags", () => {
    render(
      <MemoryRouter>
        <ScoreboardView verdicts={sampleVerdicts} ladder={null} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "By verdict" }));
    expect(screen.getByTestId("verdict-group-proven")).toBeTruthy();
    expect(screen.getAllByTestId("verdict-strand-tag").length).toBeGreaterThan(
      0,
    );
  });

  it("shows the twelve-city k-curve above the claim pile", () => {
    render(
      <MemoryRouter>
        <ScoreboardView
          verdicts={sampleVerdicts}
          ladder={null}
          transferResults={[
            {
              id: "t1",
              experimentId: "transfer",
              modelName: "k=2",
              city: null,
              k: 2,
              randomR2: 0.306,
              spatialR2: -0.085,
              locoR2: 0.216,
              n: 12,
              notes: "k173_curve",
            },
          ]}
        />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("scoreboard-transfer-curve")).toBeTruthy();
    expect(screen.getByTestId("transfer-curve-chart")).toBeTruthy();
  });

  it("links cards from experimentSlug without a separate experiments map", () => {
    render(
      <MemoryRouter>
        <ScoreboardView verdicts={sampleVerdicts} ladder={null} />
      </MemoryRouter>,
    );

    const hrefs = screen
      .getAllByTestId("verdict-card-link")
      .map((el) => el.getAttribute("href"));
    expect(new Set(hrefs)).toEqual(
      new Set([
        "/experiments/exp1",
        "/experiments/exp4",
        "/controls",
        "/experiments/absorption",
        "/experiments/radius",
      ]),
    );
  });
});

describe("ScoreboardPage fetch behaviour", () => {
  it("requests /api/verdicts, /api/ladder, radius and transfer results", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      const u = String(url);
      if (u.includes("/api/ladder")) {
        return Promise.resolve(
          new Response(JSON.stringify(sampleLadder), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
      if (u.includes("/api/experiments/radius/results")) {
        return Promise.resolve(
          new Response(JSON.stringify({ experiment: null, results: [] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
      if (u.includes("/api/experiments/transfer/results")) {
        return Promise.resolve(
          new Response(JSON.stringify({ experiment: null, results: [] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify({ verdicts: sampleVerdicts }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter>
        <ScoreboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getAllByTestId("scoreboard").length).toBeGreaterThan(0);
    });

    const urls = fetchMock.mock.calls.map((call) => String(call[0]));
    expect(urls.some((url) => url.includes("/api/verdicts"))).toBe(true);
    expect(urls.some((url) => url.includes("/api/ladder"))).toBe(true);
    expect(
      urls.some((url) => url.includes("/api/experiments/radius/results")),
    ).toBe(true);
    expect(
      urls.some((url) => url.includes("/api/experiments/transfer/results")),
    ).toBe(true);
  });
});
