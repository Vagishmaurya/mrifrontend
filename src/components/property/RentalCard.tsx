import { Link } from "react-router-dom"
import { Bath, BedDouble, Heart, MapPin, Maximize, Scale } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { bedsLabel, formatCurrency, formatSqft } from "@/lib/format"
import { rentalImage } from "@/lib/images"
import type { RentalListingSchema } from "@/lib/types"

export function RentalCard({
  listing,
  matchScore,
}: {
  listing: RentalListingSchema
  matchScore?: number
}) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Link to={`/rentals/${listing.id}`}>
          <img
            src={rentalImage(listing.id)}
            alt={listing.formatted_address}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        <div className="absolute left-3 top-3 flex gap-2">
          <Badge className="shadow-sm">{listing.property_type}</Badge>
          {matchScore !== undefined && (
            <Badge variant="secondary" className="bg-background/90 shadow-sm">
              {Math.round(matchScore)}% match
            </Badge>
          )}
        </div>

        <div className="absolute right-3 top-3">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur transition-colors hover:text-rose-500"
            aria-label="Save listing"
          >
            <Heart className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xl font-semibold tracking-tight">
          {formatCurrency(listing.price)}
          <span className="text-sm font-normal text-muted-foreground">/mo</span>
        </p>

        <Link to={`/rentals/${listing.id}`} className="mt-1">
          <h3 className="line-clamp-1 font-medium transition-colors group-hover:text-primary">
            {listing.address_line1}
            {listing.address_line2 ? ` ${listing.address_line2}` : ""}
          </h3>
        </Link>
        <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-1">
            {listing.city}, {listing.state} {listing.zip_code}
          </span>
        </p>

        <div className="mt-3 flex items-center gap-4 border-t pt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <BedDouble className="h-4 w-4" />
            {bedsLabel(listing.bedrooms)}
          </span>
          <span className="flex items-center gap-1.5">
            <Bath className="h-4 w-4" />
            {listing.bathrooms ?? "—"} ba
          </span>
          <span className="flex items-center gap-1.5">
            <Maximize className="h-4 w-4" />
            {formatSqft(listing.square_footage)}
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <Button asChild variant="outline" className="w-full">
            <Link to={`/rentals/${listing.id}`}>View details</Link>
          </Button>
          <Button asChild variant="secondary" className="w-full">
            <Link to={`/compare?property=${listing.id}`}>
              <Scale className="h-4 w-4" />
              Compare prices
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
