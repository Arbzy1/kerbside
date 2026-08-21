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
import { filterByNotesPrefix, parseNotesCost } from "@/lib/chartData";
import { formatSignedR2 } from "@/lib/verdicts";

const chartConfig = {
  cardiff: { label: "Cardiff", color: "var(--chart-1)" },
  manchester: { label: "Manchester", color: "var(--chart-2)" },
  bristol: { label: "Bristol", color: "var(--chart-4)" },
} satisfies ChartConfig;

const CITIES = ["cardiff", "manchester", "bristol"] as const;
const PRESET_TURN_COST_M = 13.4;

type TurnCostSweepChartProps = {
  results: ModelResultDto[];
};

export function TurnCostSweepChart({ results }: TurnCostSweepChartProps) {
  const rows = filterByNotesPrefix(results, "k81");
  if (rows.length === 0) {
    return null;
  }

  const byCost = new Map<number, Record<string, number>>();
  for (const row of rows) {
    const cost = parseNotesCost(row.notes);
    const city = row.city?.toLowerCase();
    const r2 = row.spatialR2;
    if (cost === null || !city || r2 === null) {
      continue;
    }
    const point = byCost.get(cost) ?? { cost };
    point[city] = r2;
    byCost.set(cost, point);
  }

  const data = [...byCost.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([cost, point]) => ({ ...point, cost }));

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3" data-testid="turn-cost-sweep-chart">
      <ChartContainer config={chartConfig} className="min-h-[320px] w-full">
        <LineChart data={data} accessibilityLayer margin={{ left: 8, right: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="cost"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            scale="log"
            domain={["auto", "auto"]}
            tickFormatter={(v) => `${Number(v).toFixed(0)}`}
            label={{
              value: "Turn cost (m / 90°)",
              position: "insideBottom",
              offset: -2,
              className: "fill-muted-foreground text-xs",
            }}
            height={48}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={(v) => formatSignedR2(Number(v))}
          />
          <ReferenceLine
            x={PRESET_TURN_COST_M}
            stroke="var(--muted-foreground)"
            strokeDasharray="3 3"
            label={{
              value: "preset",
              position: "insideTopLeft",
              className: "fill-muted-foreground text-[10px]",
            }}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) =>
                  formatSignedR2(
                    typeof value === "number" ? value : Number(value),
                  )
                }
                labelFormatter={(label) => `${label} m / 90°`}
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          {CITIES.map((city) => (
            <Line
              key={city}
              type="monotone"
              dataKey={city}
              stroke={`var(--color-${city})`}
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ChartContainer>
      <p className="text-muted-foreground text-sm leading-relaxed">
        juncformula sweep with line term fixed (K81). Manchester peaks far above
        the cycle preset (~13.4 m); Cardiff resolves nothing — its noise floor
        is 4.8× larger.
      </p>
    </div>
  );
}
