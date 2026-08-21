import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ModelResultDto } from "@kerbside/shared";
import { ContrastCiChart } from "@/components/ContrastCiChart";
import { DecayCurveChart } from "@/components/DecayCurveChart";
import { FactorialBarChart } from "@/components/FactorialBarChart";
import { NarrowVsWideChart } from "@/components/NarrowVsWideChart";
import { PooledVsLocoChart } from "@/components/PooledVsLocoChart";
import { TransferCurveChart } from "@/components/TransferCurveChart";
import { TurnCostSweepChart } from "@/components/TurnCostSweepChart";

function row(
  partial: Partial<ModelResultDto> & Pick<ModelResultDto, "id" | "modelName" | "notes">,
): ModelResultDto {
  return {
    experimentId: "exp",
    city: null,
    k: null,
    randomR2: null,
    spatialR2: null,
    locoR2: null,
    n: null,
    ...partial,
  };
}

describe("K80-era charts", () => {
  it("renders factorial bar chart", () => {
    render(
      <FactorialBarChart
        results={[
          row({
            id: "1",
            modelName: "narrow_plain (400,800,1600)",
            notes: "k80b_factorial",
            spatialR2: 0.46,
            locoR2: 0.35,
            randomR2: 0.57,
          }),
          row({
            id: "2",
            modelName: "wide_plain (800,1600,3200)",
            notes: "k80b_factorial",
            spatialR2: 0.52,
            locoR2: 0.41,
            randomR2: 0.66,
          }),
          row({
            id: "3",
            modelName: "narrow_weight (400,800,1600)",
            notes: "k80b_factorial",
            spatialR2: 0.52,
            locoR2: 0.42,
            randomR2: 0.73,
          }),
          row({
            id: "4",
            modelName: "wide_weight (800,1600,3200)",
            notes: "k80b_factorial",
            spatialR2: 0.53,
            locoR2: 0.44,
            randomR2: 0.75,
          }),
        ]}
      />,
    );
    expect(screen.getByTestId("factorial-bar-chart")).toBeTruthy();
  });

  it("renders decay curve chart", () => {
    render(
      <DecayCurveChart
        results={[
          row({
            id: "1",
            modelName: "decay band 400 m",
            notes: "k80_decay_curve",
            spatialR2: 0.53,
          }),
          row({
            id: "2",
            modelName: "decay band 800 m",
            notes: "k80_decay_curve",
            spatialR2: 1.05,
          }),
        ]}
      />,
    );
    expect(screen.getByTestId("decay-curve-chart")).toBeTruthy();
  });

  it("renders contrast CI chart", () => {
    render(
      <ContrastCiChart
        results={[
          row({
            id: "1",
            modelName: "radius @ unweighted",
            notes: "k84_posterior|p=0.985",
            randomR2: 0.006,
            spatialR2: 0.07,
            locoR2: 0.12,
          }),
          row({
            id: "2",
            modelName: "weighting @ narrow",
            notes: "k84_posterior|p=0.885",
            randomR2: -0.045,
            spatialR2: 0.08,
            locoR2: 0.21,
          }),
        ]}
      />,
    );
    expect(screen.getByTestId("contrast-ci-chart")).toBeTruthy();
  });

  it("renders turn-cost sweep chart", () => {
    render(
      <TurnCostSweepChart
        results={[
          row({
            id: "1",
            modelName: "turn_j02 (13.4 m / 90°)",
            notes: "k81|cost=13.44|resolvable=False",
            city: "cardiff",
            spatialR2: 0.32,
          }),
          row({
            id: "2",
            modelName: "turn_j64 (430.1 m / 90°)",
            notes: "k81|cost=430.08|resolvable=True",
            city: "manchester",
            spatialR2: 0.19,
          }),
        ]}
      />,
    );
    expect(screen.getByTestId("turn-cost-sweep-chart")).toBeTruthy();
  });

  it("renders pooled vs LOCO chart", () => {
    render(
      <PooledVsLocoChart
        results={[
          row({
            id: "1",
            modelName: "grav_high · sdna",
            notes: "k85_mode_share",
            spatialR2: 0.28,
            locoR2: -0.23,
          }),
        ]}
      />,
    );
    expect(screen.getByTestId("pooled-vs-loco-chart")).toBeTruthy();
  });

  it("renders narrow vs wide slope chart", () => {
    render(
      <NarrowVsWideChart
        results={[
          row({
            id: "1",
            modelName: "slope Δ at narrow radii",
            notes: "k88_slope_narrow",
            city: "bristol",
            spatialR2: 0.023,
          }),
          row({
            id: "2",
            modelName: "slope Δ at wide radii",
            notes: "k88_slope_wide",
            city: "bristol",
            spatialR2: -0.03,
          }),
        ]}
      />,
    );
    expect(screen.getByTestId("narrow-vs-wide-chart")).toBeTruthy();
  });
});

describe("TransferCurveChart", () => {
  it("renders the twelve-city k-curve", () => {
    render(
      <TransferCurveChart
        results={[
          row({
            id: "1",
            modelName: "k=2",
            notes: "k173_curve",
            k: 2,
            randomR2: 0.306,
            spatialR2: -0.085,
            locoR2: 0.216,
          }),
          row({
            id: "2",
            modelName: "k=11",
            notes: "k173_curve",
            k: 11,
            randomR2: 0.322,
            spatialR2: 0.033,
            locoR2: 0.185,
          }),
        ]}
      />,
    );
    expect(screen.getByTestId("transfer-curve-chart")).toBeTruthy();
  });
});
