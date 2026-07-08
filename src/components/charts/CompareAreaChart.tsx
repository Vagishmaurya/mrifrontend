import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { currency } from "@/lib/chartConfig"
import { rentalHistoryPoints } from "@/lib/format"
import type { PriceComparison } from "@/lib/api"

// Two distinct series colours (MRI = slate, RentCast = blue) via per-mode theme,
// since the shared --chart-* tokens are greyscale.
const compareChartConfig = {
  mri: { label: "MRI", theme: { light: "#64748b", dark: "#94a3b8" } },
  rentcast: { label: "RentCast", theme: { light: "#2a78d6", dark: "#3987e5" } },
} satisfies ChartConfig

// Area chart (with legend) comparing MRI portfolio rent vs RentCast market rent
// over time. RentCast history comes from the listing; the MRI series applies the
// current MRI-vs-RentCast spread across the timeline (mock).
export function CompareAreaChart({
  comparison,
  className,
}: {
  comparison: PriceComparison
  className?: string
}) {
  const rc = rentalHistoryPoints(comparison.listing)
  const offset =
    comparison.mriRent != null && comparison.rentcastRent != null
      ? comparison.mriRent - comparison.rentcastRent
      : 0
  const data = rc.map((p) => ({
    month: p.label,
    rentcast: p.price,
    mri: Math.round(p.price + offset),
  }))

  if (data.length < 2) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Not enough price history to chart.
      </div>
    )
  }

  return (
    <ChartContainer config={compareChartConfig} className={className}>
      <AreaChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={60}
          tickMargin={4}
          tickFormatter={(v) => currency(v as number)}
          domain={["dataMin - 200", "dataMax + 200"]}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              indicator="dot"
              formatter={(value, name) => (
                <div className="flex flex-1 items-center justify-between gap-4">
                  <span className="text-muted-foreground">
                    {name === "mri" ? "MRI" : "RentCast"}
                  </span>
                  <span className="font-mono font-medium tabular-nums">
                    {currency(value as number)}/mo
                  </span>
                </div>
              )}
            />
          }
        />
        <Area
          dataKey="mri"
          type="natural"
          fill="var(--color-mri)"
          fillOpacity={0.35}
          stroke="var(--color-mri)"
          strokeWidth={2}
        />
        <Area
          dataKey="rentcast"
          type="natural"
          fill="var(--color-rentcast)"
          fillOpacity={0.35}
          stroke="var(--color-rentcast)"
          strokeWidth={2}
        />
        <ChartLegend content={<ChartLegendContent />} />
      </AreaChart>
    </ChartContainer>
  )
}
