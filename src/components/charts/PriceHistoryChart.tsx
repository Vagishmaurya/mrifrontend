import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { priceChartConfig, currency } from "@/lib/chartConfig"
import { rentalHistoryPoints } from "@/lib/format"
import type { RentalListingSchema } from "@/lib/types"

// Plots a rental's asking-rent history (from the `history` map) over time.
export function PriceHistoryChart({
  listing,
  className,
}: {
  listing: RentalListingSchema
  className?: string
}) {
  const data = rentalHistoryPoints(listing)

  if (data.length < 2) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Not enough price history to chart.
      </div>
    )
  }

  return (
    <ChartContainer config={priceChartConfig} className={className}>
      <LineChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={60}
          tickMargin={4}
          tickFormatter={(v) => currency(v as number)}
          domain={["dataMin - 150", "dataMax + 150"]}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelKey="label"
              formatter={(value, _name, item) => (
                <div className="flex w-full flex-col gap-0.5">
                  <span className="font-mono font-medium tabular-nums">
                    {currency(value as number)}
                  </span>
                  {item?.payload?.event && (
                    <span className="text-xs text-muted-foreground">
                      {item.payload.event}
                    </span>
                  )}
                </div>
              )}
            />
          }
        />
        <Line
          dataKey="price"
          type="monotone"
          stroke="var(--color-price)"
          strokeWidth={2.5}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ChartContainer>
  )
}
