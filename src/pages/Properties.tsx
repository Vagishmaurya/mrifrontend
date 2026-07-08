import { useMemo, useState } from "react"
import { Search, SearchX } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { PropertyCard } from "@/components/property/PropertyCard"
import { getPropertyListings } from "@/lib/api"
import { useAsync } from "@/lib/useAsync"
import { entityTitle } from "@/lib/format"

export function Properties() {
  const { data, loading } = useAsync(() => getPropertyListings(), [])
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    const list = data ?? []
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter((p) =>
      `${entityTitle(p)} ${p.city ?? ""} ${p.address1 ?? ""}`
        .toLowerCase()
        .includes(q)
    )
  }, [data, search])

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Properties</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse the MRI portfolio and drill into each property’s units and pricing.
        </p>
      </div>

      {/* Title search */}
      <div className="mb-8 max-w-xl">
        <div className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 shadow-sm">
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search properties by title…"
            className="border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
            autoComplete="off"
          />
        </div>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        {loading
          ? "Loading properties…"
          : `${filtered.length} ${filtered.length === 1 ? "property" : "properties"}`}
      </p>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[16/10] w-full rounded-2xl" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center">
          <SearchX className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 font-semibold">No properties match “{search}”</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Try a different property title.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((property) => (
            <PropertyCard key={property.entity_id} property={property} />
          ))}
        </div>
      )}
    </div>
  )
}
