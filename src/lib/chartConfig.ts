import type { ChartConfig } from "@/components/ui/chart"

// Single price series, CVD-safe blue with a per-mode step.
export const priceChartConfig: ChartConfig = {
  price: {
    label: "Rent / mo",
    theme: { light: "#2a78d6", dark: "#3987e5" },
  },
}

export const currency = (v: number) => `$${Math.round(v).toLocaleString("en-US")}`
