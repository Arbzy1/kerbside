import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router";
import type { VerdictDto } from "@kerbside/shared";
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
];

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("groupVerdicts", () => {
  it("buckets verdicts by kind", () => {
    const grouped = groupVerdicts(sampleVerdicts);
    expect(grouped.proven.map((v) => v.claim)).toEqual(["Proven claim"]);
    expect(grouped.disproven.map((v) => v.claim)).toEqual(["Disproven claim"]);
    expect(grouped.harmful.map((v) => v.claim)).toEqual(["Harmful claim"]);
    expect(grouped.untested.map((v) => v.claim)).toEqual(["Untested claim"]);
  });
});

describe("ScoreboardView", () => {
  it("renders verdict groups in proven → disproven → harmful → untested order", () => {
    render(
      <MemoryRouter>
        <ScoreboardView verdicts={sampleVerdicts} />
      </MemoryRouter>,
    );

    const groups = [
      screen.getByTestId("verdict-group-proven"),
      screen.getByTestId("verdict-group-disproven"),
      screen.getByTestId("verdict-group-harmful"),
      screen.getByTestId("verdict-group-untested"),
    ];

    expect(groups.map((el) => el.getAttribute("data-testid"))).toEqual([
      "verdict-group-proven",
      "verdict-group-disproven",
      "verdict-group-harmful",
      "verdict-group-untested",
    ]);

    expect(within(groups[0]!).getByText("Proven claim")).toBeTruthy();
    expect(within(groups[1]!).getByText("Disproven claim")).toBeTruthy();
    expect(within(groups[2]!).getByText("Harmful claim")).toBeTruthy();
    expect(within(groups[3]!).getByText("Untested claim")).toBeTruthy();
  });

  it("links cards from experimentSlug without a separate experiments map", () => {
    render(
      <MemoryRouter>
        <ScoreboardView verdicts={sampleVerdicts} />
      </MemoryRouter>,
    );

    const hrefs = screen
      .getAllByTestId("verdict-card-link")
      .map((el) => el.getAttribute("href"));
    expect(new Set(hrefs)).toEqual(
      new Set(["/experiments/exp1", "/experiments/exp4"]),
    );
  });
});

describe("ScoreboardPage fetch behaviour", () => {
  it("requests only /api/verdicts (no /api/experiments)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ verdicts: sampleVerdicts }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
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
    expect(urls.length).toBeGreaterThan(0);
    expect(urls.every((url) => url === "/api/verdicts")).toBe(true);
    expect(urls.some((url) => url.includes("/api/experiments"))).toBe(false);
  });
});
