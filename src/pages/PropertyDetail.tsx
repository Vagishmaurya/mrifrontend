import { useMemo } from "react"
import { Link, useParams } from "react-router-dom"
import {
  ArrowLeft,
  Bath,
  Bed,
  Building2,
  CalendarDays,
  ChevronRight,
  DoorOpen,
  Hash,
  MapPin,
  Maximize,
  Scale,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { getPropertyById, getUnits, geocodeAddress } from "@/lib/api"
import { useAsync } from "@/lib/useAsync"
import { LocationMap } from "@/components/property/LocationMap"
import {
  bedsLabel,
  entityAddress,
  entityTitle,
  formatCurrency,
  formatDate,
  formatSqft,
  isEntityActive,
  unitBathrooms,
  unitBedrooms,
  unitIsAvailable,
  unitLabel,
  unitRent,
  unitSqft,
} from "@/lib/format"
import { entityImage } from "@/lib/images"
import type { MRIPropertyEntity, MRIResidentialUnit } from "@/lib/types"

/** Build the Compare deep-link for a unit — carries everything `/optimal-rent` needs. */
function compareHref(entity: MRIPropertyEntity, unit: MRIResidentialUnit): string {
  const params = new URLSearchParams({
    entity_id: entity.entity_id,
    city: entity.city ?? "",
    state: entity.state ?? "",
    zip_code: entity.zip_code ?? "",
    bedrooms: String(unitBedrooms(unit) ?? 0),
    bathrooms: String(unitBathrooms(unit) ?? 0),
    square_footage: String(unitSqft(unit) ?? 0),
    unit: unit.unit_id,
  })
  const street = unit.unit_address ?? entity.address1
  if (street) params.set("street", street)
  return `/compare?${params.toString()}`
}

export function PropertyDetail() {
  const { id } = useParams()

  const { data, loading } = useAsync(async () => {
    const entity = await getPropertyById(id ?? "")
    if (!entity) return { entity: undefined, units: [] as MRIResidentialUnit[] }
    const units = await getUnits(entity.entity_id)
    return { entity, units }
  }, [id])

  const entity = data?.entity
  const units = useMemo(() => data?.units ?? [], [data])

  const { data: coords } = useAsync(
    () => (entity ? geocodeAddress(entityAddress(entity)) : Promise.resolve(null)),
    [entity?.entity_id]
  )

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="mt-6 h-8 w-1/2" />
      </div>
    )
  }

  if (!entity) {
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

  const active = isEntityActive(entity)
  const rents = units.map(unitRent).filter((n): n is number => n != null)
  const minRent = rents.length ? Math.min(...rents) : null
  const maxRent = rents.length ? Math.max(...rents) : null
  const availableCount = units.filter(unitIsAvailable).length

  const details: [string, string | null | undefined][] = [
    ["Entity ID", entity.entity_id],
    ["Location ID", entity.location_id],
    ["Entity type", entity.entity_type],
    ["Type description", entity.property_type_description],
    ["Sub-type", entity.property_sub_type],
    ["Property class", entity.property_class ? `Class ${entity.property_class}` : null],
    ["Square feet", entity.square_feet ? formatSqft(entity.square_feet) : null],
    ["County", entity.county],
    ["Units", String(units.length)],
    ["Last activity", entity.last_date ? formatDate(entity.last_date) : null],
    ["Status", active ? "Active" : "Inactive"],
  ]

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/properties" className="inline-flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Properties
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{entityTitle(entity)}</span>
      </div>

      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl">
        <img
          src={entityImage(entity.entity_id, 1600)}
          alt={entityTitle(entity)}
          className="h-56 w-full object-cover sm:h-72"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10" />
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-3 text-white">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {entity.property_type_description && (
                <Badge className="shadow">{entity.property_type_description}</Badge>
              )}
              {entity.property_class && (
                <Badge variant="secondary" className="bg-white/90 text-foreground shadow">
                  Class {entity.property_class}
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
              {entityTitle(entity)}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-white/85">
              <MapPin className="h-4 w-4" />
              {entityAddress(entity)}
            </p>
          </div>
        </div>
      </div>

      {/* Key stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: DoorOpen, label: "Units", value: String(units.length) },
          { icon: Maximize, label: "Square feet", value: formatSqft(entity.square_feet) },
          { icon: Building2, label: "Type", value: entity.property_type_description ?? "—" },
          { icon: CalendarDays, label: "Last activity", value: formatDate(entity.last_date) },
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
              Each unit’s details and MRI rent. Hit <strong>Compare</strong> to see
              the live RentCast market rent and the recommended optimal rent.
            </p>

            {units.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                No residential units are listed for this property in MRI.
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[680px] text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr className="border-b">
                      <th className="py-2 pr-3 font-medium">Unit</th>
                      <th className="py-2 pr-3 font-medium">Beds / Baths</th>
                      <th className="py-2 pr-3 font-medium">Size</th>
                      <th className="py-2 pr-3 text-right font-medium">MRI rent</th>
                      <th className="py-2 pr-3 font-medium">Status</th>
                      <th className="py-2 text-right font-medium">Compare</th>
                    </tr>
                  </thead>
                  <tbody>
                    {units.map((u) => {
                      const beds = unitBedrooms(u)
                      const baths = unitBathrooms(u)
                      const available = unitIsAvailable(u)
                      return (
                        <tr key={u.unit_id} className="border-b last:border-0">
                          <td className="py-3 pr-3">
                            <div className="font-medium">{unitLabel(u)}</div>
                            <div className="text-xs text-muted-foreground">
                              {u.unit_kind ?? u.classification ?? u.unit_id}
                            </div>
                          </td>
                          <td className="py-3 pr-3 text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Bed className="h-3.5 w-3.5" />
                              {beds == null ? "—" : bedsLabel(beds)}
                            </span>
                            <span className="mx-1.5">·</span>
                            <span className="inline-flex items-center gap-1">
                              <Bath className="h-3.5 w-3.5" />
                              {baths ?? "—"}
                            </span>
                          </td>
                          <td className="py-3 pr-3 text-muted-foreground">
                            {formatSqft(unitSqft(u))}
                          </td>
                          <td className="py-3 pr-3 text-right font-mono tabular-nums">
                            {formatCurrency(unitRent(u))}
                          </td>
                          <td className="py-3 pr-3">
                            <Badge
                              variant="outline"
                              className={cn(
                                "border-transparent",
                                available
                                  ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {available ? "Available" : u.unit_status ?? "Occupied"}
                            </Badge>
                          </td>
                          <td className="py-3 text-right">
                            <Button asChild size="sm" className="gap-1">
                              <Link to={compareHref(entity, u)}>
                                <Scale className="h-3.5 w-3.5" />
                                Compare
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
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
              <p className="text-sm text-muted-foreground">MRI rent range (per unit)</p>
              <p className="text-3xl font-semibold tracking-tight">
                {minRent != null ? formatCurrency(minRent) : "—"}
                {maxRent != null && maxRent !== minRent && (
                  <span className="text-lg font-normal text-muted-foreground">
                    {" – "}
                    {formatCurrency(maxRent)}
                  </span>
                )}
                <span className="text-base font-normal text-muted-foreground">/mo</span>
              </p>
              <dl className="mt-4 space-y-2 border-t pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Total units</dt>
                  <dd className="font-medium tabular-nums">{units.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Available now</dt>
                  <dd className="font-medium tabular-nums">{availableCount}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border bg-card p-5">
              <div className="mb-3 flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium">Location</span>
              </div>
              {coords ? (
                <LocationMap
                  markers={[
                    {
                      id: entity.entity_id,
                      lat: coords.lat,
                      lng: coords.lng,
                      label: entityTitle(entity),
                      sub: entityAddress(entity),
                    },
                  ]}
                  className="h-56 w-full"
                />
              ) : (
                <div className="flex h-56 w-full items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
                  Locating…
                </div>
              )}
              <p className="mt-3 flex items-start gap-1.5 text-sm text-muted-foreground">
                <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {entityAddress(entity)}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
