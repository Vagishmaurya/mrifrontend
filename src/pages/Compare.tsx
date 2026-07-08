import { useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Building2, Database, Minus, Scale, TrendingDown, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { getPriceComparisons, type PriceComparison } from "@/lib/api"
import { useAsync } from "@/lib/useAsync"
import { bedsLabel, formatCurrency, formatSqft } from "@/lib/format"
import { CompareAreaChart } from "@/components/charts/CompareAreaChart"

export function Compare() {
  const { data, loading } = useAsync(() => getPriceComparisons(), [])
  const comparisons = useMemo(() => data ?? [], [data])
  const [searchParams] = useSearchParams()
  // A card can deep-link a specific property via `?property=<listing id>`.
  const [selectedKey, setSelectedKey] = useState<string | null>(
    searchParams.get("property")
  )

  const selected = useMemo(() => {
    if (!comparisons.length) return null
    return comparisons.find((c) => c.key === selectedKey) ?? comparisons[0]
  }, [comparisons, selectedKey])

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Scale className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Compare prices across sites
          </h1>
          <p className="mt-1 text-muted-foreground">
            See how the MRI portfolio rent compares to the live RentCast market
            rent for the same property.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[300px_1fr]">
          <Skeleton className="h-96 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      ) : !selected ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed py-16 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 font-semibold">No comparable properties</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            We couldn’t find a property listed by both MRI and RentCast. Try again
            once both data sources are connected.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Property picker */}
          <aside className="lg:sticky lg:top-20 lg:h-fit">
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">
              Choose a property ({comparisons.length})
            </h2>
            <div className="flex flex-col gap-2">
              {comparisons.map((c) => {
                const active = c.key === selected.key
                return (
                  <button
                    key={c.key}
                    onClick={() => setSelectedKey(c.key)}
                    className={cn(
                      "w-full rounded-xl border p-3 text-left transition-colors",
                      active
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50"
                    )}
                  >
                    <p className="truncate font-medium">{c.address}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.city}, {c.state} · {c.propertyType}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="rounded bg-muted px-1.5 py-0.5 tabular-nums">
                        MRI {formatCurrency(c.mriRent)}
                      </span>
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 tabular-nums text-primary">
                        RentCast {formatCurrency(c.rentcastRent)}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </aside>

          {/* Comparison panel */}
          <ComparePanel c={selected} />
        </div>
      )}
    </div>
  )
}

function ComparePanel({ c }: { c: PriceComparison }) {
  const mri = c.mriRent
  const rc = c.rentcastRent
  const both = mri != null && rc != null
  const diff = both ? mri - rc : null
  const pct = both && rc ? (diff! / rc) * 100 : null

  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-6">
      {/* Property header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{c.address}</h2>
          <p className="text-sm text-muted-foreground">
            {c.city}, {c.state} {c.zip_code}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary">{c.propertyType}</Badge>
          <span>{bedsLabel(c.bedrooms)}</span>
          <span>·</span>
          <span>{formatSqft(c.squareFootage)}</span>
        </div>
      </div>

      {/* Two source cards */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row">
        <SourceCard
          source="MRI"
          sub={c.entity.entity_name ?? "Portfolio record"}
          badge="Portfolio rent"
          amount={mri}
          accent="mri"
          cheaper={both ? mri < rc : null}
        />
        <SourceCard
          source="RentCast"
          sub="Live market listing"
          badge="Market rent"
          amount={rc}
          accent="rentcast"
          cheaper={both ? rc < mri : null}
        />
      </div>

      {/* Difference summary */}
      {both && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border bg-muted/30 px-4 py-3 text-sm">
          {diff === 0 ? (
            <>
              <Minus className="h-4 w-4 text-muted-foreground" />
              <span>MRI and RentCast price this property identically.</span>
            </>
          ) : (
            <>
              {diff! < 0 ? (
                <TrendingDown className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <TrendingUp className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              )}
              <span>
                MRI is{" "}
                <strong className="tabular-nums">
                  {formatCurrency(Math.abs(diff!))}/mo
                </strong>{" "}
                {diff! < 0 ? "lower" : "higher"} than RentCast
                {pct != null && (
                  <span className="tabular-nums">
                    {" "}
                    ({diff! < 0 ? "−" : "+"}
                    {Math.abs(pct).toFixed(1)}%)
                  </span>
                )}
                .
              </span>
            </>
          )}
        </div>
      )}

      {/* Rent trend — MRI vs RentCast */}
      <div className="mt-6">
        <h3 className="text-sm font-medium">Rent trend</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          MRI portfolio rent vs RentCast market rent over time.
        </p>
        <CompareAreaChart comparison={c} className="aspect-auto h-[280px] w-full" />
      </div>

      {/* Source note */}
      <div className="mt-6 flex items-center gap-2 border-t pt-4 text-xs text-muted-foreground">
        <Database className="h-3.5 w-3.5" />
        MRI figure is the portfolio asking rent; RentCast figure is the live
        market rent for the same address.
      </div>

      <div className="mt-4">
        <Link
          to={`/rentals/${c.listing.id}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          View the RentCast listing →
        </Link>
      </div>
    </section>
  )
}

function SourceCard({
  source,
  sub,
  badge,
  amount,
  accent,
  cheaper,
}: {
  source: string
  sub: string
  badge: string
  amount: number | null
  accent: "mri" | "rentcast"
  cheaper: boolean | null
}) {
  return (
    <div
      className={cn(
        "relative flex-1 rounded-2xl border p-5",
        accent === "rentcast"
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-background"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{source}</span>
        {cheaper === true && (
          <Badge
            variant="secondary"
            className="h-5 px-1.5 text-[10px] uppercase text-emerald-700 dark:text-emerald-400"
          >
            Lower
          </Badge>
        )}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight">
        {amount != null ? formatCurrency(amount) : "—"}
        {amount != null && (
          <span className="text-base font-normal text-muted-foreground">/mo</span>
        )}
      </p>
      <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
        {badge}
      </p>
      <p className="mt-2 truncate text-sm text-muted-foreground" title={sub}>
        {sub}
      </p>
    </div>
  )
}
