import {
  Bar,
  BarChart,
  CartesianGrid,
  ErrorBar,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import type { ModelResultDto } from "@kerbside/shared";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { filterByNotesFamily, parseNotesPGt0 } from "@/lib/chartData";
import { formatSignedR2 } from "@/lib/verdicts";

const chartConfig = {
  point: { label: "LOCO Δ R²", color: "var(--primary)" },
} satisfies ChartConfig;

type ContrastCiChartProps = {
  results: ModelResultDto[];
};

type CiRow = {
  contrast: string;
  point: number;
  lo: number;
  hi: number;
  /** Asymmetric [below, above] deviations for Recharts ErrorBar. */
  error: [number, number];
  clearsZero: boolean;
  pGt0: number | null;
};

export function ContrastCiChart({ results }: ContrastCiChartProps) {
  const data: CiRow[] = filterByNotesFamily(results, "k84_posterior")
    .map((r) => {
      const point = r.spatialR2;
      const lo = r.randomR2;
      const hi = r.locoR2;
      if (point === null || lo === null || hi === null) {
        return null;
      }
      return {
        contrast: r.modelName,
        point,
        lo,
        hi,
        error: [point - lo, hi - point] as [number, number],
        clearsZero: lo > 0,
        pGt0: parseNotesPGt0(r.notes),
      };
    })
    .filter((r): r is CiRow => r !== null);

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3" data-testid="contrast-ci-chart">
      <ChartContainer config={chartConfig} className="min-h-[280px] w-full">
        <BarChart
          data={data}
          layout="vertical"
          accessibilityLayer
          margin={{ left: 8, right: 16 }}
        >
          <CartesianGrid horizontal={false} />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatSignedR2(Number(v))}
          />
          <YAxis
            type="category"
            dataKey="contrast"
            width={140}
            tickLine={false}
            axisLine={false}
          />
          <ReferenceLine x={0} stroke="var(--border)" strokeDasharray="4 4" />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, _name, item) => {
                  const row = item?.payload as CiRow | undefined;
                  if (!row) {
                    return formatSignedR2(
                      typeof value === "number" ? value : Number(value),
                    );
                  }
                  const p =
                    row.pGt0 === null
                      ? ""
                      : ` · P(Δ>0)=${row.pGt0.toFixed(3)}`;
                  return `${formatSignedR2(row.point)} [${formatSignedR2(row.lo)}, ${formatSignedR2(row.hi)}]${p}`;
                }}
              />
            }
          />
          <Bar
            dataKey="point"
            fill="var(--color-point)"
            radius={4}
            name="LOCO Δ R²"
          >
            <ErrorBar
              dataKey="error"
              direction="x"
              width={4}
              strokeWidth={1.5}
              stroke="var(--foreground)"
            />
          </Bar>
        </BarChart>
      </ChartContainer>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Bootstrap 95% intervals on LOCO contrasts (K84). Only{" "}
        <span className="text-foreground">radius @ unweighted</span> clears
        zero — weighting&apos;s interval includes zero, so it stays
        city-specific / not established.
      </p>
    </div>
  );
}
