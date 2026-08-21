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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { filterByNotesFamily } from "@/lib/chartData";
import { formatSignedR2 } from "@/lib/verdicts";

const chartConfig = {
  r2Corr: { label: "held-out r²", color: "var(--chart-1)" },
  r2Det: { label: "held-out R²", color: "var(--destructive)" },
  nullR2: { label: "null r²", color: "var(--muted-foreground)" },
} satisfies ChartConfig;

type TransferCurveChartProps = {
  results: ModelResultDto[];
};

export function TransferCurveChart({ results }: TransferCurveChartProps) {
  const rows = filterByNotesFamily(results, "k173_curve")
    .map((r) => ({
      k: r.k,
      r2Corr: r.randomR2,
      r2Det: r.spatialR2,
      nullR2: r.locoR2,
    }))
    .filter(
      (
        r,
      ): r is {
        k: number;
        r2Corr: number;
        r2Det: number;
        nullR2: number;
      } =>
        r.k !== null &&
        r.r2Corr !== null &&
        r.r2Det !== null &&
        r.nullR2 !== null,
    )
    .sort((a, b) => a.k - b.k);

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3" data-testid="transfer-curve-chart">
      <ChartContainer config={chartConfig} className="min-h-[280px] w-full">
        <LineChart data={rows} accessibilityLayer margin={{ left: 8, right: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="k"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(v) => `${v}`}
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
                labelFormatter={(label) => `${label} training cities`}
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Line
            type="monotone"
            dataKey="r2Corr"
            stroke="var(--color-r2Corr)"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            name="held-out r²"
          />
          <Line
            type="monotone"
            dataKey="r2Det"
            stroke="var(--color-r2Det)"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            name="held-out R²"
          />
          <Line
            type="monotone"
            dataKey="nullR2"
            stroke="var(--color-nullR2)"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            name="null r²"
          />
        </LineChart>
      </ChartContainer>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Fit on <span className="text-foreground font-medium">k</span> of twelve
        cities, predict a held-out one. Ranking (r²) is already there at two
        training cities; scale (R²) stays near zero unless a local intercept is
        set. The dashed line is a shuffled-city null.
      </p>
    </div>
  );
}
