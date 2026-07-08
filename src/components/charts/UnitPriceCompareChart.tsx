import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import { currency } from "@/lib/chartConfig"
import type { PropertyUnit } from "@/lib/types"

// Grouped bars comparing MRI portfolio rent vs the RentCast market estimate,
// one pair per unit.
const compareConfig: ChartConfig = {
  mri: { label: "MRI rent", theme: { light: "#2a78d6", dark: "#3987e5" } },
  rentcast: { label: "RentCast est.", theme: { light: "#e0803a", dark: "#f0954e" } },
}

export function UnitPriceCompareChart({
  units,
  className,
}: {
  units: PropertyUnit[]
  className?: string
}) {
  const data = units.map((u) => ({
    name: u.name,
    mri: u.mri_rent,
    rentcast: u.rentcast_rent,
  }))

  return (
    <ChartContainer config={compareConfig} className={className}>
      <BarChart data={data} margin={{ left: 4, right: 8, top: 8 }} barCategoryGap={20}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval={0}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={60}
          tickMargin={4}
          tickFormatter={(v) => currency(v as number)}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <span className="flex w-full items-center justify-between gap-3">
                  <span className="text-muted-foreground capitalize">{name}</span>
                  <span className="font-mono font-medium tabular-nums">
                    {currency(value as number)}/mo
                  </span>
                </span>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="mri" fill="var(--color-mri)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="rentcast" fill="var(--color-rentcast)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
