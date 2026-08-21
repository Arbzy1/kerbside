import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { GuidePage } from "@/routes/GuidePage";

describe("GuidePage", () => {
  it("renders the story page", () => {
    render(
      <MemoryRouter>
        <GuidePage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("guide-page")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Ranking transfers; scale needs a local intercept" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "1. What this is" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "2. The two numbers" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "4. Headlines" })).toBeTruthy();
    expect(screen.getByText("Scale needs a local intercept")).toBeTruthy();
    expect(
      screen.getByText("Radius: the narrow envelope is out"),
    ).toBeTruthy();
    expect(screen.getAllByText(/Rotherham/).length).toBeGreaterThan(0);
    expect(
      screen
        .getByRole("link", { name: "Street View lane detection" })
        .getAttribute("href"),
    ).toBe("/experiments/cycle_detection#k139b_geometry");
    expect(
      screen
        .getByRole("link", { name: "Cycle provision as routing impedance" })
        .getAttribute("href"),
    ).toBe("/experiments/cycle_provision#k133_i4_direct_osm");
    expect(
      screen
        .getByRole("link", { name: "twelve-city transfer" })
        .getAttribute("href"),
    ).toBe("/experiments/transfer");
    expect(screen.getByRole("heading", { name: "6. What did not hold" })).toBeTruthy();
    expect(screen.getByText(/Hybrid radius/)).toBeTruthy();
    expect(screen.getByText(/sDNA Learn on nine columns/)).toBeTruthy();
    expect(document.getElementById("two-numbers")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "The two numbers" }).getAttribute("href"),
    ).toBe("#two-numbers");
  });
});
