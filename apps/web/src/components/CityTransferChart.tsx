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
  heldOutR2Corr: {
    label: "Held-out r²",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

type CityTransferChartProps = {
  cities: CityDto[];
};

export function CityTransferChart({ cities }: CityTransferChartProps) {
  const data = cities.map((city) => ({
    city: city.name,
    heldOutR2: city.heldOutR2,
    heldOutR2Corr: city.heldOutR2Corr,
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
            dataKey="heldOutR2Corr"
            fill="var(--color-heldOutR2Corr)"
            radius={4}
            name="Held-out r²"
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
        Bars are the {cities.length} working cities. r² is ranking; R² is scale.
        Cardiff is the best held-out city. The intercept uses ten random local
        counts, not the busiest ten.
      </p>
    </div>
  );
}
