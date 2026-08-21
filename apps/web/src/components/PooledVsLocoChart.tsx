import {
  Bar,
  BarChart,
  CartesianGrid,
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
import { formatSignedR2 } from "@/lib/verdicts";

const chartConfig = {
  pooled: { label: "Pooled R²", color: "var(--primary)" },
  loco: { label: "LOCO R²", color: "var(--secondary)" },
} satisfies ChartConfig;

type PooledVsLocoChartProps = {
  results: ModelResultDto[];
  /** Optional caption under the chart. */
  caption?: string;
  testId?: string;
};

export function PooledVsLocoChart({
  results,
  caption = "Pooled skill can look strong while leave-one-city-out is negative — the configuration does not transfer.",
  testId = "pooled-vs-loco-chart",
}: PooledVsLocoChartProps) {
  const data = results
    .filter((r) => r.spatialR2 !== null || r.locoR2 !== null)
    .map((r) => ({
      model: r.modelName,
      pooled: r.spatialR2 ?? 0,
      loco: r.locoR2 ?? 0,
    }));

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3" data-testid={testId}>
      <ChartContainer config={chartConfig} className="min-h-[320px] w-full">
        <BarChart data={data} accessibilityLayer>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="model"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval={0}
            angle={-28}
            textAnchor="end"
            height={72}
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
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="pooled" fill="var(--color-pooled)" radius={4} />
          <Bar dataKey="loco" fill="var(--color-loco)" radius={4} />
        </BarChart>
      </ChartContainer>
      <p className="text-muted-foreground text-sm leading-relaxed">{caption}</p>
    </div>
  );
}
