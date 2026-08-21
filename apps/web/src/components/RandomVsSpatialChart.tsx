import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { ModelResultDto } from "@kerbside/shared";
import { Link } from "react-router";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { isBelowNoiseFloor } from "@/lib/verdicts";

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

type RandomVsSpatialChartProps = {
  results: ModelResultDto[];
};

export function RandomVsSpatialChart({ results }: RandomVsSpatialChartProps) {
  const data = results.map((row) => ({
    model: row.modelName,
    randomR2: row.randomR2 ?? 0,
    spatialR2: row.spatialR2 ?? 0,
    spatialBelowFloor: isBelowNoiseFloor(row.spatialR2, row.city),
  }));
  const hasSpatialNoise = data.some((row) => row.spatialBelowFloor);

  return (
    <div className="space-y-2">
      <ChartContainer
        config={chartConfig}
        className="min-h-[280px] w-full"
        data-testid="random-vs-spatial-chart"
      >
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
            fillOpacity={0.85}
          />
        </BarChart>
      </ChartContainer>
      {hasSpatialNoise ? (
        <p className="text-muted-foreground text-sm">
          Some spatial scores are at or below their city’s noise floor and are
          therefore unresolvable.{" "}
          <Link to="/guide#reading-a-result" className="underline underline-offset-2">
            Read the definition
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
