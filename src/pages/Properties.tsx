import { useMemo, useState, type FormEvent } from "react"
import { useSearchParams } from "react-router-dom"
import { Search, SearchX } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PropertyCard } from "@/components/property/PropertyCard"
import { Pagination } from "@/components/property/Pagination"
import { getAllProperties, getPropertiesByName } from "@/lib/api"
import { useAsync } from "@/lib/useAsync"
import {
  toEntity,
  type MRIPropertyEntity,
  type PropertiesResponse,
} from "@/lib/types"

const PAGE_SIZE = 12

export function Properties() {
  const [params, setParams] = useSearchParams()
  const name = params.get("name") ?? ""
  const page = Number(params.get("page") ?? "1")

  // Draft text in the search box before it's committed to the URL.
  const [draft, setDraft] = useState(name)

  // No search term -> list the whole portfolio; otherwise search by entity name.
  const { data, loading, error } = useAsync<PropertiesResponse>(
    () =>
      name.trim()
        ? getPropertiesByName(name, page, PAGE_SIZE)
        : getAllProperties(page, PAGE_SIZE),
    [name, page]
  )

  // Unwrap either response variant into entities + optional match scores.
  const rows = useMemo(() => {
    if (!data) return [] as { entity: MRIPropertyEntity; score?: number }[]
    return data.items.map((item) => {
      const entity = toEntity(item)
      const score = "match_score" in item ? item.match_score : undefined
      return { entity, score }
    })
  }, [data])

  function submitSearch(e: FormEvent) {
    e.preventDefault()
    const next = new URLSearchParams()
    if (draft.trim()) next.set("name", draft.trim())
    setParams(next)
  }

  function clearSearch() {
    setDraft("")
    setParams(new URLSearchParams())
  }

  function goToPage(p: number) {
    const next = new URLSearchParams(params)
    next.set("page", String(p))
    setParams(next)
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Properties</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse the MRI portfolio and drill into each property’s units and pricing.
        </p>
      </div>

      {/* Search by entity name. */}
      <form onSubmit={submitSearch} className="mb-8 flex max-w-xl gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-full border bg-card px-4 py-2 shadow-sm">
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Search properties by name…"
            className="border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
            autoComplete="off"
          />
        </div>
        <Button type="submit" className="rounded-full">
          Search
        </Button>
        {name && (
          <Button
            type="button"
            variant="ghost"
            className="rounded-full"
            onClick={clearSearch}
          >
            Clear
          </Button>
        )}
      </form>

      <p className="mb-4 text-sm text-muted-foreground">
        {loading
          ? "Loading properties…"
          : name
            ? `${data?.total ?? 0} ${(data?.total ?? 0) === 1 ? "property" : "properties"} matching “${name}”`
            : `${data?.total ?? 0} ${(data?.total ?? 0) === 1 ? "property" : "properties"} in the portfolio`}
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
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center">
          <SearchX className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 font-semibold">Couldn’t load properties</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">{error}</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center">
          <SearchX className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 font-semibold">No properties found</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Try a different name or clear your search.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map(({ entity, score }) => (
              <PropertyCard
                key={entity.entity_id}
                property={entity}
                matchScore={name ? score : undefined}
              />
            ))}
          </div>

          <Pagination
            page={data?.page ?? 1}
            totalPages={data?.total_pages ?? 1}
            onPageChange={goToPage}
          />
        </>
      )}
    </div>
  )
}
