import { Link, useSearchParams } from "react-router-dom"
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  Database,
  Info,
  Scale,
  Sparkles,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { getOptimalRent } from "@/lib/api"
import { useAsync } from "@/lib/useAsync"
import { bedsLabel, formatCurrency, formatSqft } from "@/lib/format"
import type { OptimalRentQuery, OptimalRentResponse } from "@/lib/types"

/** Read the unit profile the Compare page was opened with from the URL. */
function readQuery(params: URLSearchParams): OptimalRentQuery | null {
  const entity_id = params.get("entity_id")
  const city = params.get("city")
  const state = params.get("state")
  const zip_code = params.get("zip_code")
  if (!entity_id || !city || !state || !zip_code) return null
  return {
    entity_id,
    city,
    state,
    zip_code,
    street: params.get("street") ?? undefined,
    bedrooms: Number(params.get("bedrooms") ?? "0"),
    bathrooms: Number(params.get("bathrooms") ?? "0"),
    square_footage: Number(params.get("square_footage") ?? "0"),
  }
}

export function Compare() {
  const [params] = useSearchParams()
  const query = readQuery(params)

  const { data, loading, error } = useAsync(
    () => (query ? getOptimalRent(query) : Promise.resolve(null)),
    [params.toString()]
  )

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Scale className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Optimal rent comparison
          </h1>
          <p className="mt-1 text-muted-foreground">
            The MRI portfolio rent, the live RentCast market rent, and the
            recommended optimal rent for this unit profile.
          </p>
        </div>
      </div>

      {!query ? (
        <EmptyState />
      ) : loading ? (
        <div className="mt-8 space-y-6">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : error || !data ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed py-16 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 font-semibold">Couldn’t compute an optimal rent</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {error ??
              "RentCast returned no comparable listings for this unit profile. Try a unit with more common specs."}
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link to={`/properties/${query.entity_id}`}>Back to property</Link>
          </Button>
        </div>
      ) : (
        <Result data={data} entityId={query.entity_id} unitLabel={params.get("unit")} />
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed py-16 text-center">
      <Scale className="h-10 w-10 text-muted-foreground" />
      <h2 className="mt-4 font-semibold">Pick a unit to compare</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Open a property, then hit <strong>Compare</strong> on any unit to see its
        MRI rent next to the live RentCast market rate.
      </p>
      <Button asChild className="mt-6">
        <Link to="/properties">Browse properties</Link>
      </Button>
    </div>
  )
}

function Result({
  data,
  entityId,
  unitLabel,
}: {
  data: OptimalRentResponse
  entityId: string
  unitLabel: string | null
}) {
  const specs = [
    bedsLabel(data.bedrooms),
    `${data.bathrooms} ba`,
    data.square_footage ? formatSqft(data.square_footage) : null,
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <div className="mt-8 space-y-6">
      {/* Breadcrumb + profile */}
      <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link
          to={`/properties/${entityId}`}
          className="inline-flex items-center gap-1 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Property
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{unitLabel ?? "Unit"} · {specs}</span>
      </div>

      {/* The three headline numbers */}
      <div className="grid gap-4 sm:grid-cols-3">
        <RentCard
          label="MRI portfolio rent"
          amount={data.mri_rent_estimate}
          sub={`${data.mri_unit_count} matching MRI unit${data.mri_unit_count === 1 ? "" : "s"}`}
          accent="mri"
        />
        <RentCard
          label="RentCast market rent"
          amount={data.market_rent_estimate}
          sub={`${data.market_comp_count} comparable${data.market_comp_count === 1 ? "" : "s"}`}
          accent="rentcast"
        />
        <RentCard
          label="Optimal rent"
          amount={data.optimal_rent}
          sub="Recommended blended rate"
          accent="optimal"
        />
      </div>

      {/* Range */}
      {(data.rent_range_min != null || data.rent_range_max != null) && (
        <div className="flex items-center gap-2 rounded-xl border bg-muted/30 px-4 py-3 text-sm">
          <Info className="h-4 w-4 text-muted-foreground" />
          <span>
            Observed rent range for this profile:{" "}
            <strong className="tabular-nums">
              {formatCurrency(data.rent_range_min)} – {formatCurrency(data.rent_range_max)}
            </strong>
            /mo
          </span>
        </div>
      )}

      {/* RentCast comparables */}
      <section className="rounded-2xl border bg-card p-6">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">RentCast comparables</h2>
          <Badge variant="secondary" className="ml-1">{data.market_comparables.length}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Live market listings used to estimate the market rent, best match first.
        </p>

        {data.market_comparables.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No RentCast comparables matched this unit profile.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2 pr-3 font-medium">Address</th>
                  <th className="py-2 pr-3 font-medium">Beds / Baths</th>
                  <th className="py-2 pr-3 font-medium">Size</th>
                  <th className="py-2 pr-3 text-right font-medium">Rent</th>
                  <th className="py-2 text-right font-medium">Match</th>
                </tr>
              </thead>
              <tbody>
                {data.market_comparables.map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="py-3 pr-3">
                      <div className="line-clamp-1 font-medium">{c.formatted_address}</div>
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {bedsLabel(c.bedrooms)} · {c.bathrooms ?? "—"} ba
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {formatSqft(c.square_footage)}
                    </td>
                    <td className="py-3 pr-3 text-right font-mono tabular-nums">
                      {formatCurrency(c.rent)}
                    </td>
                    <td className="py-3 text-right">
                      <span className="tabular-nums text-muted-foreground">
                        {Math.round((c.address_match_score + c.spec_match_score) / 2)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="flex items-center gap-2 border-t pt-4 text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5" />
        Optimal rent blends the RentCast market rent (55%) with the MRI portfolio
        rent (45%) for units matching {data.bedrooms} bd / {data.bathrooms} ba.
      </div>
    </div>
  )
}

function RentCard({
  label,
  amount,
  sub,
  accent,
}: {
  label: string
  amount: number | null | undefined
  sub: string
  accent: "mri" | "rentcast" | "optimal"
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5",
        accent === "optimal"
          ? "border-primary bg-primary/5"
          : accent === "rentcast"
            ? "border-primary/30 bg-primary/[0.03]"
            : "border-border bg-background"
      )}
    >
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">
        {amount != null ? formatCurrency(amount) : "—"}
        {amount != null && (
          <span className="text-base font-normal text-muted-foreground">/mo</span>
        )}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">{sub}</p>
    </div>
  )
}
