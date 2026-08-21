import { ReferenceLine, Scatter, ScatterChart, XAxis, YAxis, ZAxis } from "recharts";
import type { ControlDto } from "@kerbside/shared";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatSignedR2 } from "@/lib/verdicts";
import { cn } from "@/lib/utils";

const chartConfig = {
  nullDraw: { label: "Null draw", color: "var(--muted-foreground)" },
  real: { label: "Real", color: "var(--destructive)" },
} satisfies ChartConfig;

type ControlNullChartProps = {
  control: ControlDto;
};

function cityLabel(city: string): string {
  return city.charAt(0).toUpperCase() + city.slice(1);
}

export function ControlNullChart({ control }: ControlNullChartProps) {
  const draws = control.nullDraws.length
    ? control.nullDraws
    : Array.from({ length: control.nullN }, (_, i) => {
        // Fallback synthetic strip if draws missing — prefer mean±sd jitter for layout only.
        const t = control.nullN <= 1 ? 0.5 : i / (control.nullN - 1);
        return control.nullMean + control.nullSd * (2 * t - 1);
      });

  const nullPoints = draws.map((value, i) => ({
    x: value,
    y: 0.15 + (i % 5) * 0.08,
    kind: "null" as const,
  }));
  const realPoint = [
    {
      x: control.realValue,
      y: 0.55,
      kind: "real" as const,
    },
  ];

  const outside =
    control.percentile <= 5 || control.percentile >= 95;
  // A permutation p cannot fall below 1/(n+1). Extreme percentiles must not
  // be read as p = 0 (prompt 27 / C29).
  const pFloor = 1 / (control.nullN + 1);
  const atExtreme =
    control.percentile <= 0 || control.percentile >= 100;

  return (
    <div
      className={cn(
        "glass-surface motion-interactive space-y-3 rounded-2xl border p-4",
        outside ? "border-destructive/40" : "border-border",
      )}
      data-testid="control-null-chart"
      data-city={control.city}
      data-test={control.testName}
      data-config={control.configName}
    >
      <div className="space-y-1">
        <h3 className="text-base font-semibold tracking-tight">
          {cityLabel(control.city)} · {control.testName} ·{" "}
          <span className="font-mono text-sm">{control.configName}</span>
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Real {formatSignedR2(control.realValue)} at the{" "}
          <span className="text-foreground font-medium">
            {control.percentile}th
          </span>{" "}
          percentile of {control.nullN} null draws
          {atExtreme ? (
            <>
              {" "}
              —{" "}
              <span className="text-foreground font-medium">
                p = {pFloor.toFixed(3)}
              </span>
              , the smallest value {control.nullN} draws can resolve
            </>
          ) : (
            <>
              {" "}
              — permutation p-floor {pFloor.toFixed(3)} (cannot be zero)
            </>
          )}{" "}
          (mean {formatSignedR2(control.nullMean)} ±{" "}
          {control.nullSd.toFixed(3)}).
        </p>
      </div>

      <ChartContainer config={chartConfig} className="min-h-[160px] w-full">
        <ScatterChart
          accessibilityLayer
          margin={{ top: 8, right: 12, bottom: 8, left: 12 }}
        >
          <XAxis
            type="number"
            dataKey="x"
            name="Δ R²"
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatSignedR2(Number(v))}
            domain={["auto", "auto"]}
          />
          <YAxis type="number" dataKey="y" hide domain={[0, 1]} />
          <ZAxis range={[40, 40]} />
          <ReferenceLine
            x={control.nullMean}
            stroke="var(--border)"
            strokeDasharray="3 3"
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) =>
                  formatSignedR2(typeof value === "number" ? value : Number(value))
                }
              />
            }
          />
          <Scatter
            name="Null draws"
            data={nullPoints}
            fill="var(--color-nullDraw)"
            fillOpacity={0.55}
          />
          <Scatter
            name="Real"
            data={realPoint}
            fill="var(--color-real)"
            shape="diamond"
          />
        </ScatterChart>
      </ChartContainer>

      <p className="text-muted-foreground text-sm leading-relaxed">
        {control.interpretation}
      </p>
    </div>
  );
}
