import { useMemo } from "react"
import { Link, useParams } from "react-router-dom"
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Building,
  CalendarDays,
  ChevronRight,
  Heart,
  MapPin,
  Maximize,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getRentalById, getRentals } from "@/lib/api"
import { useAsync } from "@/lib/useAsync"
import {
  bedsLabel,
  formatCurrency,
  formatDate,
  formatSqft,
  rentalHistoryPoints,
} from "@/lib/format"
import { isRentalSearchResult } from "@/lib/types"
import { RentalCard } from "@/components/property/RentalCard"
import { LocationMap } from "@/components/property/LocationMap"
import { PriceHistoryChart } from "@/components/charts/PriceHistoryChart"

export function RentalDetail() {
  const { id } = useParams()
  const { data: listing, loading } = useAsync(
    () => getRentalById(id ?? ""),
    [id]
  )
  const { data: more } = useAsync(
    () => getRentals({ city: listing?.city, page_size: 12 }),
    [listing?.city]
  )

  const similar = useMemo(() => {
    if (!more || !listing) return []
    return more.items
      .map((i) => (isRentalSearchResult(i) ? i.listing : i))
      .filter((l) => l.id !== listing.id && l.property_type === listing.property_type)
      .slice(0, 3)
  }, [more, listing])

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="mt-6 h-8 w-1/2" />
        <Skeleton className="mt-3 h-4 w-1/3" />
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">Listing not found</h1>
        <p className="mt-2 text-muted-foreground">
          This rental may have been removed from the market.
        </p>
        <Button asChild className="mt-6">
          <Link to="/rentals">Browse rentals</Link>
        </Button>
      </div>
    )
  }

  const history = rentalHistoryPoints(listing)
  const firstPrice = history[0]?.price
  const lastPrice = history[history.length - 1]?.price
  const trend =
    firstPrice != null && lastPrice != null ? lastPrice - firstPrice : 0

  const facts = [
    { icon: BedDouble, label: bedsLabel(listing.bedrooms) },
    { icon: Bath, label: `${listing.bathrooms ?? "—"} Baths` },
    { icon: Maximize, label: formatSqft(listing.square_footage) },
    { icon: Building, label: listing.property_type },
  ]

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/rentals" className="inline-flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Rentals
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span>
          {listing.city}, {listing.state}
        </span>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{listing.address_line1}</span>
      </div>

      {/* Location map (replaces photo gallery) */}
      <LocationMap
        markers={[
          {
            id: listing.id,
            lat: listing.latitude,
            lng: listing.longitude,
            label: `${formatCurrency(listing.price)}/mo`,
            sub: listing.formatted_address,
          },
        ]}
        className="h-72 w-full sm:h-[420px]"
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {listing.address_line1}
                {listing.address_line2 ? ` ${listing.address_line2}` : ""}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {listing.formatted_address}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" aria-label="Save">
                <Heart className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {facts.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-3 rounded-xl border bg-card p-3"
              >
                <f.icon className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{f.label}</span>
              </div>
            ))}
          </div>

          <Separator className="my-8" />

          <Tabs defaultValue="history">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="history">Price history</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="pt-6">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Asking-rent history</h2>
                {trend !== 0 && (
                  <Badge
                    variant="secondary"
                    className="gap-1"
                  >
                    {trend < 0 ? (
                      <TrendingDown className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <TrendingUp className="h-3 w-3 text-rose-600" />
                    )}
                    {trend < 0 ? "Down " : "Up "}
                    {formatCurrency(Math.abs(trend))}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                How this listing’s asking rent has moved over time.
              </p>
              <div className="mt-4 rounded-2xl border bg-card p-4">
                <PriceHistoryChart
                  listing={listing}
                  className="aspect-auto h-[300px] w-full"
                />
              </div>

              {history.length > 0 && (
                <div className="mt-6 overflow-hidden rounded-2xl border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2 font-medium">Date</th>
                        <th className="px-4 py-2 font-medium">Event</th>
                        <th className="px-4 py-2 text-right font-medium">Rent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...history].reverse().map((h) => (
                        <tr key={h.date} className="border-t">
                          <td className="px-4 py-2">{formatDate(h.date)}</td>
                          <td className="px-4 py-2 text-muted-foreground">
                            {h.event ?? "—"}
                          </td>
                          <td className="px-4 py-2 text-right font-mono tabular-nums">
                            {formatCurrency(h.price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="details" className="pt-6">
              <h2 className="text-lg font-semibold">Listing details</h2>
              <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                {[
                  ["Listing ID", listing.id],
                  ["Property type", listing.property_type],
                  ["Bedrooms", bedsLabel(listing.bedrooms)],
                  ["Bathrooms", listing.bathrooms ?? "—"],
                  ["Square footage", formatSqft(listing.square_footage)],
                  ["City", listing.city],
                  ["State", listing.state],
                  ["ZIP code", listing.zip_code],
                  ["Latitude", listing.latitude],
                  ["Longitude", listing.longitude],
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="flex items-center justify-between border-b py-2"
                  >
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-medium">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </TabsContent>
          </Tabs>

          {similar.length > 0 && (
            <>
              <Separator className="my-10" />
              <h2 className="text-xl font-semibold tracking-tight">Similar rentals</h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {similar.map((l) => (
                  <RentalCard key={l.id} listing={l} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Sticky sidebar */}
        <aside>
          <div className="sticky top-20 space-y-4">
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">Current asking rent</p>
              <p className="text-3xl font-semibold tracking-tight">
                {formatCurrency(listing.price)}
                <span className="text-base font-normal text-muted-foreground">/mo</span>
              </p>

              <Separator className="my-4" />

              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Beds / Baths</dt>
                  <dd className="font-medium">
                    {bedsLabel(listing.bedrooms)} · {listing.bathrooms ?? "—"} ba
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Size</dt>
                  <dd className="font-medium">{formatSqft(listing.square_footage)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Rent / ft²</dt>
                  <dd className="font-medium">
                    {listing.price && listing.square_footage
                      ? `$${(listing.price / listing.square_footage).toFixed(2)}`
                      : "—"}
                  </dd>
                </div>
              </dl>

              <Button className="mt-4 w-full" size="lg">
                Request a tour
              </Button>
            </div>

            <div className="rounded-2xl border bg-card p-5">
              <div className="flex items-center gap-2 text-sm">
                <CalendarDays className="h-4 w-4 text-primary" />
                <span className="font-medium">Market snapshot</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {history.length} recorded price {history.length === 1 ? "point" : "points"} ·
                data sourced from RentCast.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
