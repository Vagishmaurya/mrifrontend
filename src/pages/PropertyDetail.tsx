import { Link, useParams } from "react-router-dom"
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  ChevronRight,
  DoorOpen,
  Hash,
  MapPin,
  Maximize,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { getPropertyListingById } from "@/lib/api"
import { useAsync } from "@/lib/useAsync"
import { LocationMap } from "@/components/property/LocationMap"
import { UnitPriceCompareChart } from "@/components/charts/UnitPriceCompareChart"
import {
  bedsLabel,
  entityAddress,
  entityTitle,
  formatCurrency,
  formatDate,
  formatSqft,
  isEntityActive,
} from "@/lib/format"
import { entityImage } from "@/lib/images"
import type { PropertyUnit } from "@/lib/types"

function priceDelta(unit: PropertyUnit) {
  return unit.rentcast_rent - unit.mri_rent
}

export function PropertyDetail() {
  const { id } = useParams()
  const { data: property, loading } = useAsync(
    () => getPropertyListingById(id ?? ""),
    [id]
  )

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="mt-6 h-8 w-1/2" />
      </div>
    )
  }

  if (!property) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">Property not found</h1>
        <p className="mt-2 text-muted-foreground">
          This property may have been archived.
        </p>
        <Button asChild className="mt-6">
          <Link to="/properties">Browse properties</Link>
        </Button>
      </div>
    )
  }

  const active = isEntityActive(property)
  const units = property.units

  const totalMri = units.reduce((s, u) => s + u.mri_rent, 0)
  const totalRentcast = units.reduce((s, u) => s + u.rentcast_rent, 0)
  const totalDelta = totalRentcast - totalMri

  const details: [string, string | null | undefined][] = [
    ["Entity ID", property.entity_id],
    ["Location ID", property.location_id],
    ["Entity type", property.entity_type],
    ["Type description", property.property_type_description],
    ["Sub-type", property.property_sub_type],
    ["Property class", property.property_class ? `Class ${property.property_class}` : null],
    ["Square feet", property.square_feet ? formatSqft(property.square_feet) : null],
    ["County", property.county],
    ["Units", String(units.length)],
    ["Last activity", property.last_date ? formatDate(property.last_date) : null],
    ["Status", active ? "Active" : "Inactive"],
  ]

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/properties" className="inline-flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Properties
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{entityTitle(property)}</span>
      </div>

      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl">
        <img
          src={entityImage(property.entity_id, 1600)}
          alt={entityTitle(property)}
          className="h-56 w-full object-cover sm:h-72"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10" />
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-3 text-white">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {property.property_type_description && (
                <Badge className="shadow">{property.property_type_description}</Badge>
              )}
              {property.property_class && (
                <Badge variant="secondary" className="bg-white/90 text-foreground shadow">
                  Class {property.property_class}
                </Badge>
              )}
              <Badge
                className={cn(
                  "border-transparent shadow",
                  active ? "bg-emerald-600 text-white" : "bg-muted text-foreground"
                )}
              >
                {active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              {entityTitle(property)}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-white/85">
              <MapPin className="h-4 w-4" />
              {entityAddress(property)}
            </p>
          </div>
        </div>
      </div>

      {/* Key stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: DoorOpen, label: "Units", value: String(units.length) },
          { icon: Maximize, label: "Square feet", value: formatSqft(property.square_feet) },
          { icon: Building2, label: "Type", value: property.property_type_description ?? "—" },
          { icon: CalendarDays, label: "Last activity", value: formatDate(property.last_date) },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <s.icon className="h-3.5 w-3.5" />
              {s.label}
            </div>
            <p className="mt-1 truncate font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-8">
          {/* Units */}
          <section className="rounded-2xl border bg-card p-6">
            <div className="flex items-center gap-2">
              <DoorOpen className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Units</h2>
              <Badge variant="secondary" className="ml-1">{units.length}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Each unit’s details, MRI book rent, and the RentCast market estimate.
            </p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-2 pr-3 font-medium">Unit</th>
                    <th className="py-2 pr-3 font-medium">Beds / Baths</th>
                    <th className="py-2 pr-3 font-medium">Size</th>
                    <th className="py-2 pr-3 text-right font-medium">MRI rent</th>
                    <th className="py-2 pr-3 text-right font-medium">RentCast est.</th>
                    <th className="py-2 pr-3 text-right font-medium">Difference</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {units.map((u) => {
                    const delta = priceDelta(u)
                    return (
                      <tr key={u.id} className="border-b last:border-0">
                        <td className="py-3 pr-3">
                          <div className="font-medium">{u.name}</div>
                          <div className="text-xs text-muted-foreground">{u.unit_type}</div>
                        </td>
                        <td className="py-3 pr-3 text-muted-foreground">
                          {bedsLabel(u.bedrooms)} · {u.bathrooms} ba
                        </td>
                        <td className="py-3 pr-3 text-muted-foreground">
                          {formatSqft(u.square_footage)}
                        </td>
                        <td className="py-3 pr-3 text-right font-mono tabular-nums">
                          {formatCurrency(u.mri_rent)}
                        </td>
                        <td className="py-3 pr-3 text-right font-mono tabular-nums">
                          {formatCurrency(u.rentcast_rent)}
                        </td>
                        <td className="py-3 pr-3 text-right">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 font-mono tabular-nums",
                              delta > 0 ? "text-emerald-600" : delta < 0 ? "text-rose-600" : "text-muted-foreground"
                            )}
                          >
                            {delta > 0 ? (
                              <TrendingUp className="h-3.5 w-3.5" />
                            ) : delta < 0 ? (
                              <TrendingDown className="h-3.5 w-3.5" />
                            ) : null}
                            {delta === 0 ? "—" : `${delta > 0 ? "+" : "−"}${formatCurrency(Math.abs(delta))}`}
                          </span>
                        </td>
                        <td className="py-3">
                          <Badge
                            variant="outline"
                            className={cn(
                              "border-transparent",
                              u.status === "Available"
                                ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {u.status}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Price comparison */}
          <section className="rounded-2xl border bg-card p-6">
            <h2 className="text-lg font-semibold">MRI vs RentCast pricing</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Portfolio book rent compared with live RentCast market estimates, per unit.
            </p>
            <div className="mt-4 rounded-xl border bg-background p-4">
              <UnitPriceCompareChart
                units={units}
                className="aspect-auto h-[320px] w-full"
              />
            </div>
          </section>

          {/* Property details */}
          <section className="rounded-2xl border bg-card p-6">
            <h2 className="text-lg font-semibold">Property details</h2>
            <dl className="mt-4 divide-y">
              {details
                .filter(([, v]) => v)
                .map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between py-2.5 text-sm">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                ))}
            </dl>
          </section>
        </div>

        {/* Sidebar */}
        <aside>
          <div className="sticky top-20 space-y-4">
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">Total monthly rent (all units)</p>
              <p className="text-3xl font-semibold tracking-tight">
                {formatCurrency(totalMri)}
                <span className="text-base font-normal text-muted-foreground">/mo</span>
              </p>
              <dl className="mt-4 space-y-2 border-t pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">MRI portfolio total</dt>
                  <dd className="font-medium tabular-nums">{formatCurrency(totalMri)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">RentCast market total</dt>
                  <dd className="font-medium tabular-nums">{formatCurrency(totalRentcast)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Market vs book</dt>
                  <dd
                    className={cn(
                      "inline-flex items-center gap-1 font-medium tabular-nums",
                      totalDelta > 0 ? "text-emerald-600" : totalDelta < 0 ? "text-rose-600" : ""
                    )}
                  >
                    {totalDelta > 0 ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : totalDelta < 0 ? (
                      <TrendingDown className="h-3.5 w-3.5" />
                    ) : null}
                    {totalDelta === 0
                      ? "—"
                      : `${totalDelta > 0 ? "+" : "−"}${formatCurrency(Math.abs(totalDelta))}/mo`}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border bg-card p-5">
              <div className="mb-3 flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium">Location</span>
              </div>
              <LocationMap
                markers={[
                  {
                    id: property.entity_id,
                    lat: property.latitude,
                    lng: property.longitude,
                    label: entityTitle(property),
                    sub: entityAddress(property),
                  },
                ]}
                className="h-56 w-full"
              />
              <p className="mt-3 flex items-start gap-1.5 text-sm text-muted-foreground">
                <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {entityAddress(property)}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
