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

const chartConfig = {
  randomR2: {
    label: "Random R²",
    color: "var(--secondary)",
  },
  spatialR2: {
    label: "Spatial R²",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

type LadderChartProps = {
  results: ModelResultDto[];
};

export function LadderChart({ results }: LadderChartProps) {
  const data = results.map((row) => ({
    model: row.modelName,
    randomR2: row.randomR2 ?? 0,
    spatialR2: row.spatialR2 ?? 0,
  }));

  return (
    <ChartContainer config={chartConfig} className="min-h-[280px] w-full">
      <BarChart data={data} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="model"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval={0}
          angle={-25}
          textAnchor="end"
          height={70}
        />
        <YAxis tickLine={false} axisLine={false} width={48} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="randomR2"
          fill="var(--color-randomR2)"
          radius={4}
          name="Random R²"
        />
        <Bar
          dataKey="spatialR2"
          fill="var(--color-spatialR2)"
          radius={4}
          name="Spatial R²"
        />
      </BarChart>
    </ChartContainer>
  );
}
