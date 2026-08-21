import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import type { AbsorptionLadderResponse } from "@kerbside/shared";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatSignedR2 } from "@/lib/verdicts";

const chartConfig = {
  cardiff: { label: "Cardiff", color: "var(--chart-1)" },
  manchester: { label: "Manchester", color: "var(--chart-2)" },
  bristol: { label: "Bristol", color: "var(--chart-4)" },
} satisfies ChartConfig;

type LadderChartProps = {
  ladder: AbsorptionLadderResponse;
};

export function LadderChart({ ladder }: LadderChartProps) {
  const data = ladder.rungs.map((rung, i) => {
    const point: Record<string, string | number> = { rung };
    for (const city of ladder.cities) {
      const delta = city.deltas[i];
      if (delta !== undefined) {
        point[city.city] = delta;
      }
    }
    return point;
  });

  return (
    <div className="space-y-3" data-testid="absorption-ladder-chart">
      <ChartContainer config={chartConfig} className="min-h-[320px] w-full">
        <LineChart data={data} accessibilityLayer margin={{ left: 8, right: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="rung"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval={0}
            angle={-18}
            textAnchor="end"
            height={64}
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
                  formatSignedR2(typeof value === "number" ? value : Number(value))
                }
              />
            }
          />
          <Legend />
          {ladder.cities.map((city) => (
            <Line
              key={city.city}
              type="monotone"
              dataKey={city.city}
              name={
                city.city.charAt(0).toUpperCase() + city.city.slice(1)
              }
              stroke={`var(--color-${city.city})`}
              strokeWidth={city.monotonic ? 2.5 : 2}
              strokeDasharray={city.monotonic ? undefined : "6 4"}
              dot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ChartContainer>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Stage-2 POI-covariate δ on one prepared network (K61). Solid line =
        monotonic decline (Cardiff only). Dashed = non-monotonic. All three end
        ≤ 0 at the weighted rung.
      </p>
    </div>
  );
}
