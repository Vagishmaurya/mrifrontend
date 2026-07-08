import { useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Map as MapIcon, SearchX, SlidersHorizontal, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { SearchBar } from "@/components/property/SearchBar"
import { RentalCard } from "@/components/property/RentalCard"
import { LocationMap } from "@/components/property/LocationMap"
import { Pagination } from "@/components/property/Pagination"
import { getRentals } from "@/lib/api"
import { useAsync } from "@/lib/useAsync"
import { formatCurrency } from "@/lib/format"
import {
  isRentalSearchResult,
  type ListQuery,
  type RentalListingSchema,
} from "@/lib/types"

const PRICE_MIN = 1000
const PRICE_MAX = 10000

type SortKey = "relevance" | "price-asc" | "price-desc" | "sqft" | "beds"

interface FilterState {
  price: [number, number]
  beds: string
  types: string[]
}

const DEFAULT_FILTERS: FilterState = {
  price: [PRICE_MIN, PRICE_MAX],
  beds: "any",
  types: [],
}

function Filters({
  value,
  onChange,
  typeOptions,
}: {
  value: FilterState
  onChange: (next: FilterState) => void
  typeOptions: string[]
}) {
  const set = <K extends keyof FilterState>(k: K, v: FilterState[K]) =>
    onChange({ ...value, [k]: v })

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold">Monthly rent</h3>
        <Slider
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={100}
          value={value.price}
          onValueChange={(v) => set("price", [v[0], v[1]] as [number, number])}
        />
        <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
          <span className="rounded-md border px-2 py-1 tabular-nums">
            {formatCurrency(value.price[0])}
          </span>
          <span className="rounded-md border px-2 py-1 tabular-nums">
            {formatCurrency(value.price[1])}
            {value.price[1] === PRICE_MAX ? "+" : ""}
          </span>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="mb-3 text-sm font-semibold">Bedrooms</h3>
        <ToggleGroup
          type="single"
          value={value.beds}
          onValueChange={(v) => set("beds", v || "any")}
          className="flex flex-wrap justify-start gap-2"
        >
          {[
            ["any", "Any"],
            ["0", "Studio"],
            ["1", "1+"],
            ["2", "2+"],
            ["3", "3+"],
            ["4", "4+"],
          ].map(([v, label]) => (
            <ToggleGroupItem
              key={v}
              value={v}
              variant="outline"
              className="rounded-full px-3 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {typeOptions.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="mb-3 text-sm font-semibold">Property type</h3>
            <div className="space-y-2.5">
              {typeOptions.map((t) => (
                <label key={t} className="flex items-center gap-2.5 text-sm capitalize">
                  <Checkbox
                    checked={value.types.includes(t)}
                    onCheckedChange={(c) =>
                      set(
                        "types",
                        c ? [...value.types, t] : value.types.filter((x) => x !== t)
                      )
                    }
                  />
                  {t}
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export function Rentals() {
  const [params, setParams] = useSearchParams()
  const query: ListQuery = {
    city: params.get("city") ?? undefined,
    state: params.get("state") ?? undefined,
    zip_code: params.get("zip_code") ?? undefined,
    street: params.get("street") ?? undefined,
    page: Number(params.get("page") ?? "1"),
    page_size: 12,
  }
  const searchLabel =
    query.street || query.city || query.zip_code || query.state || ""

  const { data, loading, error } = useAsync(
    () => getRentals(query),
    [query.city, query.state, query.zip_code, query.street, query.page]
  )

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [sort, setSort] = useState<SortKey>("relevance")
  const [showMap, setShowMap] = useState(false)

  // Unwrap either response variant into listings + optional match scores.
  const rows = useMemo(() => {
    if (!data) return [] as { listing: RentalListingSchema; score?: number }[]
    return data.items.map((item) =>
      isRentalSearchResult(item)
        ? { listing: item.listing, score: item.match_score }
        : { listing: item, score: undefined }
    )
  }, [data])

  const typeOptions = useMemo(
    () =>
      Array.from(
        new Set(rows.map((r) => r.listing.property_type).filter(Boolean))
      ).sort(),
    [rows]
  )

  const filtered = useMemo(() => {
    const list = rows.filter(({ listing: p }) => {
      const price = p.price ?? 0
      if (price < filters.price[0] || price > filters.price[1]) return false
      if (filters.beds !== "any" && (p.bedrooms ?? 0) < Number(filters.beds))
        return false
      if (filters.types.length && !filters.types.includes(p.property_type))
        return false
      return true
    })
    const sorters: Record<SortKey, (a: typeof rows[0], b: typeof rows[0]) => number> = {
      relevance: (a, b) => (b.score ?? 0) - (a.score ?? 0),
      "price-asc": (a, b) => (a.listing.price ?? 0) - (b.listing.price ?? 0),
      "price-desc": (a, b) => (b.listing.price ?? 0) - (a.listing.price ?? 0),
      sqft: (a, b) => (b.listing.square_footage ?? 0) - (a.listing.square_footage ?? 0),
      beds: (a, b) => (b.listing.bedrooms ?? 0) - (a.listing.bedrooms ?? 0),
    }
    return [...list].sort(sorters[sort])
  }, [rows, filters, sort])

  const activeFilterCount =
    (filters.beds !== "any" ? 1 : 0) +
    filters.types.length +
    (filters.price[0] !== PRICE_MIN || filters.price[1] !== PRICE_MAX ? 1 : 0)

  function goToPage(p: number) {
    const next = new URLSearchParams(params)
    next.set("page", String(p))
    setParams(next)
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <SearchBar
          variant="compact"
          mode="rentals"
          defaultValue={query.street ?? query.city ?? ""}
        />
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-20 rounded-2xl border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Filters</h2>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-muted-foreground"
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                >
                  Reset
                </Button>
              )}
            </div>
            <Filters value={filters} onChange={setFilters} typeOptions={typeOptions} />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                {searchLabel ? `Rentals near "${searchLabel}"` : "All rentals"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {loading
                  ? "Searching listings…"
                  : `${data?.total ?? 0} listing${(data?.total ?? 0) === 1 ? "" : "s"} · RentCast market data`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                    {activeFilterCount > 0 && (
                      <Badge className="ml-1 h-5 min-w-5 justify-center rounded-full px-1">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="px-4 pb-8">
                    <Filters value={filters} onChange={setFilters} typeOptions={typeOptions} />
                  </div>
                </SheetContent>
              </Sheet>

              <Button
                variant={showMap ? "default" : "outline"}
                size="sm"
                onClick={() => setShowMap((s) => !s)}
                className="hidden sm:inline-flex"
              >
                <MapIcon className="h-4 w-4" />
                {showMap ? "Hide map" : "Map"}
              </Button>

              <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                <SelectTrigger size="sm" className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="price-asc">Rent: low to high</SelectItem>
                  <SelectItem value="price-desc">Rent: high to low</SelectItem>
                  <SelectItem value="beds">Most bedrooms</SelectItem>
                  <SelectItem value="sqft">Largest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center">
              <SearchX className="h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">No rentals for that search</h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                RentCast needs a resolvable location. Try picking an address from the
                search suggestions, or search a city like “Austin”.
              </p>
            </div>
          ) : loading ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center">
              <X className="h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">No rentals match your filters</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Try widening your rent range or clearing a few filters.
              </p>
              <Button className="mt-5" onClick={() => setFilters(DEFAULT_FILTERS)}>
                Reset filters
              </Button>
            </div>
          ) : (
            <>
              <div
                className={
                  showMap
                    ? "grid gap-6 xl:grid-cols-[1fr_1fr]"
                    : "grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
                }
              >
                <div className={showMap ? "grid gap-6 sm:grid-cols-2" : "contents"}>
                  {filtered.map(({ listing, score }) => (
                    <RentalCard key={listing.id} listing={listing} matchScore={score} />
                  ))}
                </div>

                {showMap && (
                  <div className="hidden xl:block">
                    <LocationMap
                      variant="price"
                      markers={filtered.map(({ listing }) => ({
                        id: listing.id,
                        lat: listing.latitude,
                        lng: listing.longitude,
                        label: `${formatCurrency(listing.price)}/mo`,
                        sub: `${listing.address_line1}, ${listing.city}`,
                        to: `/rentals/${listing.id}`,
                      }))}
                      className="sticky top-20 h-[calc(100svh-6rem)]"
                    />
                  </div>
                )}
              </div>

              <Pagination
                page={data?.page ?? 1}
                totalPages={data?.total_pages ?? 1}
                onPageChange={goToPage}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
