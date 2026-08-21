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
import { filterByNotesFamily } from "@/lib/chartData";
import { formatSignedR2 } from "@/lib/verdicts";

const chartConfig = {
  narrow: { label: "Narrow radii", color: "var(--primary)" },
  wide: { label: "Wide radii", color: "var(--secondary)" },
} satisfies ChartConfig;

const CITY_ORDER = ["cardiff", "bristol", "manchester"] as const;

type NarrowVsWideChartProps = {
  results: ModelResultDto[];
};

export function NarrowVsWideChart({ results }: NarrowVsWideChartProps) {
  const narrow = filterByNotesFamily(results, "k88_slope_narrow");
  const wide = filterByNotesFamily(results, "k88_slope_wide");
  if (narrow.length === 0 && wide.length === 0) {
    return null;
  }

  const narrowByCity = new Map(
    narrow.map((r) => [r.city?.toLowerCase() ?? "", r.spatialR2] as const),
  );
  const wideByCity = new Map(
    wide.map((r) => [r.city?.toLowerCase() ?? "", r.spatialR2] as const),
  );

  const data = CITY_ORDER.filter(
    (c) => narrowByCity.has(c) || wideByCity.has(c),
  ).map((city) => ({
    city: city.charAt(0).toUpperCase() + city.slice(1),
    narrow: narrowByCity.get(city) ?? 0,
    wide: wideByCity.get(city) ?? 0,
  }));

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3" data-testid="narrow-vs-wide-chart">
      <ChartContainer config={chartConfig} className="min-h-[280px] w-full">
        <BarChart data={data} accessibilityLayer>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="city"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
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
          <Bar dataKey="narrow" fill="var(--color-narrow)" radius={4} />
          <Bar dataKey="wide" fill="var(--color-wide)" radius={4} />
        </BarChart>
      </ChartContainer>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Slope isolation (cycle − hybrid) at the project&apos;s fixed radii vs
        the better envelope (K88). Bristol flips sign — established claims can
        be radius-dependent.
      </p>
    </div>
  );
}
