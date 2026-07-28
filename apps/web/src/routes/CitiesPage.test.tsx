import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { CityDto, TransferSummaryDto } from "@kerbside/shared";
import { CityTable } from "@/components/CityTable";
import { rankCitiesByHeldOutR2 } from "@/lib/cities";
import { formatSignedR2 } from "@/lib/verdicts";

const sampleCities: CityDto[] = [
  {
    id: "1",
    name: "Kent",
    laCode: "KENT",
    country: "England",
    nCountPoints: 525,
    heldOutR2: 0.443,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "2",
    name: "Lancashire",
    laCode: "LANCASHIRE",
    country: "England",
    nCountPoints: 392,
    heldOutR2: 0.56,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "3",
    name: "Hertfordshire",
    laCode: "HERTFORDSHIRE",
    country: "England",
    nCountPoints: 320,
    heldOutR2: 0.241,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

describe("rankCitiesByHeldOutR2", () => {
  it("ranks highest held-out R² first", () => {
    const ranked = rankCitiesByHeldOutR2(sampleCities);
    expect(ranked.map((c) => c.name)).toEqual([
      "Lancashire",
      "Kent",
      "Hertfordshire",
    ]);
  });

  it("does not include Cardiff in the transfer cohort ranking", () => {
    const ranked = rankCitiesByHeldOutR2(sampleCities);
    expect(ranked.some((c) => c.name === "Cardiff")).toBe(false);
  });
});

describe("Cardiff contrast (not a chart bar)", () => {
  it("renders Cardiff separately with destructive emphasis, not in the cohort table", () => {
    const summary: TransferSummaryDto = {
      withinCityR2: 0.415,
      acrossCityR2: 0.403,
      transferPenalty: -0.012,
      cohortNPoints: 8735,
      cohortNAuthorities: 36,
      cardiffOnlyR2: 0.398,
      cardiffFromElsewhereR2: 0.137,
      cardiffNPoints: 78,
    };

    render(
      <div>
        <div data-testid="cardiff-contrast" className="border-destructive/40">
          <p>{formatSignedR2(summary.cardiffFromElsewhereR2)}</p>
        </div>
        <CityTable cities={rankCitiesByHeldOutR2(sampleCities)} />
      </div>,
    );

    const contrast = screen.getByTestId("cardiff-contrast");
    expect(contrast.className).toContain("destructive");
    expect(contrast.textContent).toContain("+0.137");

    const table = screen.getByTestId("city-transfer-table");
    expect(table.textContent).not.toContain("Cardiff");
    expect(table.querySelectorAll("tbody tr")).toHaveLength(3);
  });
});
