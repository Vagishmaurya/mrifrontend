import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { priceChartConfig, currency } from "@/lib/chartConfig"
import type { RentalListingSchema } from "@/lib/types"

// One bar per rental — the cheapest is highlighted at full opacity.
export function CompareBarChart({
  listings,
  className,
}: {
  listings: RentalListingSchema[]
  className?: string
}) {
  const data = listings.map((l) => ({
    name: l.address_line1,
    price: l.price ?? 0,
  }))
  const min = Math.min(...data.map((d) => d.price).filter((p) => p > 0))

  return (
    <ChartContainer config={priceChartConfig} className={className}>
      <BarChart data={data} margin={{ left: 4, right: 8, top: 8 }} barCategoryGap={24}>
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
              formatter={(value) => (
                <span className="font-mono font-medium tabular-nums">
                  {currency(value as number)}/mo
                </span>
              )}
            />
          }
        />
        <Bar dataKey="price" radius={[4, 4, 0, 0]}>
          {data.map((d) => (
            <Cell
              key={d.name}
              fill="var(--color-price)"
              fillOpacity={d.price === min ? 1 : 0.5}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
