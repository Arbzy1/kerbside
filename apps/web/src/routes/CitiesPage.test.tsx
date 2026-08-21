import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { CityDto, TransferSummaryDto } from "@kerbside/shared";
import { CityTable } from "@/components/CityTable";
import { rankCitiesByHeldOutR2 } from "@/lib/cities";
import { formatSignedR2 } from "@/lib/verdicts";

const sampleCities: CityDto[] = [
  {
    id: "1",
    name: "Cardiff",
    laCode: "CARDIFF",
    country: "Wales",
    nCountPoints: 149,
    heldOutR2: 0.441,
    heldOutR2Corr: 0.561,
    local10R2: 0.388,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "2",
    name: "Nottingham",
    laCode: "NOTTINGHAM",
    country: "England",
    nCountPoints: 147,
    heldOutR2: 0.303,
    heldOutR2Corr: 0.406,
    local10R2: 0.351,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "3",
    name: "Rotherham",
    laCode: "ROTHERHAM",
    country: "England",
    nCountPoints: 166,
    heldOutR2: -1.348,
    heldOutR2Corr: 0.223,
    local10R2: -0.049,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

describe("rankCitiesByHeldOutR2", () => {
  it("ranks highest held-out R² first", () => {
    const ranked = rankCitiesByHeldOutR2(sampleCities);
    expect(ranked.map((c) => c.name)).toEqual([
      "Cardiff",
      "Nottingham",
      "Rotherham",
    ]);
  });

  it("includes Cardiff in the twelve-city working set", () => {
    const ranked = rankCitiesByHeldOutR2(sampleCities);
    expect(ranked.some((c) => c.name === "Cardiff")).toBe(true);
    expect(ranked[0]?.name).toBe("Cardiff");
  });
});

describe("twelve-city transfer framing", () => {
  it("shows Cardiff in the ranked table with r² and R², not as a failure contrast", () => {
    const summary: TransferSummaryDto = {
      nCities: 12,
      nPoints: 2334,
      r2AtK2: 0.306,
      r2AtK11: 0.322,
      r2DetAtK2: -0.085,
      r2DetAtK11: 0.033,
      local10R2: 0.208,
      oracleR2: 0.28,
      envelope: "800/1600/3200",
    };

    render(
      <div>
        <div data-testid="transfer-framing">
          <p>
            ranking transfers at two cities ({formatSignedR2(summary.r2AtK2)})
          </p>
        </div>
        <div data-testid="cardiff-best">
          Cardiff is the best held-out city
        </div>
        <CityTable cities={rankCitiesByHeldOutR2(sampleCities)} />
      </div>,
    );

    expect(screen.getByTestId("cardiff-best").textContent).toContain(
      "best held-out city",
    );
    expect(screen.queryByTestId("cardiff-contrast")).toBeNull();

    const table = screen.getByTestId("city-transfer-table");
    expect(table.textContent).toContain("Cardiff");
    expect(table.textContent).toContain("+0.561");
    expect(table.textContent).toContain("+0.441");
    expect(table.querySelectorAll("tbody tr")).toHaveLength(3);
  });
});
