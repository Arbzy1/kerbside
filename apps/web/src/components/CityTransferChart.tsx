import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { CityDto } from "@kerbside/shared";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatSignedR2 } from "@/lib/verdicts";

const chartConfig = {
  heldOutR2: {
    label: "Held-out R²",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

type CityTransferChartProps = {
  cities: CityDto[];
};

export function CityTransferChart({ cities }: CityTransferChartProps) {
  const data = cities.map((city) => ({
    city: city.name,
    heldOutR2: city.heldOutR2,
  }));

  return (
    <div className="space-y-3" data-testid="city-transfer-chart">
      <ChartContainer config={chartConfig} className="min-h-[420px] w-full">
        <BarChart data={data} layout="vertical" accessibilityLayer margin={{ left: 8 }}>
          <CartesianGrid horizontal={false} />
          <XAxis type="number" tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="city"
            width={110}
            tickLine={false}
            axisLine={false}
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
          <Bar
            dataKey="heldOutR2"
            fill="var(--color-heldOutR2)"
            radius={4}
            name="Held-out R²"
          />
        </BarChart>
      </ChartContainer>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Bars are the {cities.length} authorities with ≥150 recent count points in
        the leave-city-out cohort (forest / primary). Cardiff is not among them —
        it has too few recent points for that threshold — so it appears below as
        the separate contrast case, not as a highlighted bar in this chart.
      </p>
    </div>
  );
}
