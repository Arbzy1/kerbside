import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { ModelResultDto } from "@kerbside/shared";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { factorialCellLabel, filterByNotesFamily } from "@/lib/chartData";
import { formatSignedR2 } from "@/lib/verdicts";

const chartConfig = {
  pooled: { label: "Pooled R²", color: "var(--primary)" },
  loco: { label: "LOCO R²", color: "var(--secondary)" },
} satisfies ChartConfig;

const CELL_ORDER = [
  "narrow_plain",
  "wide_plain",
  "narrow_weight",
  "wide_weight",
];

type FactorialBarChartProps = {
  results: ModelResultDto[];
};

export function FactorialBarChart({ results }: FactorialBarChartProps) {
  const rows = filterByNotesFamily(results, "k80b_factorial");
  if (rows.length === 0) {
    return null;
  }

  const byCell = new Map(
    rows.map((r) => [factorialCellLabel(r.modelName), r] as const),
  );
  const data = CELL_ORDER.filter((c) => byCell.has(c)).map((cell) => {
    const row = byCell.get(cell)!;
    return {
      cell,
      pooled: row.spatialR2 ?? 0,
      loco: row.locoR2 ?? 0,
    };
  });

  return (
    <div className="space-y-3" data-testid="factorial-bar-chart">
      <ChartContainer config={chartConfig} className="min-h-[280px] w-full">
        <BarChart data={data} accessibilityLayer>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="cell"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval={0}
            angle={-18}
            textAnchor="end"
            height={56}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={(v) => formatSignedR2(Number(v))}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) =>
                  formatSignedR2(
                    typeof value === "number" ? value : Number(value),
                  )
                }
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="pooled" fill="var(--color-pooled)" radius={4} />
          <Bar dataKey="loco" fill="var(--color-loco)" radius={4} />
        </BarChart>
      </ChartContainer>
      <p className="text-muted-foreground text-sm leading-relaxed">
        2×2 factorial (K80b): widening radii and attractor weighting each reach
        ~+0.515 pooled alone; combining them adds little more — largely the same
        lever.
      </p>
    </div>
  );
}
