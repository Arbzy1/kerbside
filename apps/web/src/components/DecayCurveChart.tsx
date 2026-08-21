import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import type { ModelResultDto } from "@kerbside/shared";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { filterByNotesFamily, parseDecayRadiusM } from "@/lib/chartData";
import { formatSignedR2 } from "@/lib/verdicts";

const chartConfig = {
  coef: { label: "Std. coefficient", color: "var(--chart-1)" },
} satisfies ChartConfig;

type DecayCurveChartProps = {
  results: ModelResultDto[];
};

export function DecayCurveChart({ results }: DecayCurveChartProps) {
  const rows = filterByNotesFamily(results, "k80_decay_curve")
    .map((r) => ({
      radius: parseDecayRadiusM(r.modelName),
      coef: r.spatialR2,
    }))
    .filter(
      (r): r is { radius: number; coef: number } =>
        r.radius !== null && r.coef !== null,
    )
    .sort((a, b) => a.radius - b.radius);

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3" data-testid="decay-curve-chart">
      <ChartContainer config={chartConfig} className="min-h-[280px] w-full">
        <LineChart data={rows} accessibilityLayer margin={{ left: 8, right: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="radius"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(v) => `${v} m`}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={(v) => formatSignedR2(Number(v))}
          />
          <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="4 4" />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) =>
                  formatSignedR2(
                    typeof value === "number" ? value : Number(value),
                  )
                }
                labelFormatter={(label) => `${label} m band`}
              />
            }
          />
          <Line
            type="monotone"
            dataKey="coef"
            stroke="var(--color-coef)"
            strokeWidth={2.5}
            dot={{ r: 4 }}
            name="Std. coefficient"
          />
        </LineChart>
      </ChartContainer>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Banded ridge coefficients (K80): marginal contribution peaks at 800 m.
        Negative large-radius coefficients are conditional on smaller bands
        being present — not evidence that wide radii harm.
      </p>
    </div>
  );
}
