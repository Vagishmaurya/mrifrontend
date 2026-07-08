import { Link } from "react-router-dom"
import { Building2, DoorOpen, MapPin, Maximize } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  entityCityState,
  entityTitle,
  formatCurrency,
  formatSqft,
  isEntityActive,
} from "@/lib/format"
import { entityImage } from "@/lib/images"
import type { PropertyListing } from "@/lib/types"

export function PropertyCard({ property }: { property: PropertyListing }) {
  const active = isEntityActive(property)
  const rents = property.units.map((u) => u.mri_rent)
  const minRent = rents.length ? Math.min(...rents) : null
  const maxRent = rents.length ? Math.max(...rents) : null
  const availableCount = property.units.filter((u) => u.status === "Available").length

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-[16/10] overflow-hidden">
        <Link to={`/properties/${property.entity_id}`}>
          <img
            src={entityImage(property.entity_id)}
            alt={entityTitle(property)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </Link>
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {property.property_type_description && (
            <Badge className="shadow-sm">{property.property_type_description}</Badge>
          )}
          {property.property_class && (
            <Badge variant="secondary" className="bg-background/90 shadow-sm">
              Class {property.property_class}
            </Badge>
          )}
        </div>
        <div className="absolute right-3 top-3">
          <Badge
            variant="outline"
            className={cn(
              "border-transparent shadow-sm",
              active ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"
            )}
          >
            {active ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Building2 className="h-3.5 w-3.5" />
          <span className="font-mono">{property.entity_id}</span>
        </div>

        <Link to={`/properties/${property.entity_id}`} className="mt-1">
          <h3 className="line-clamp-1 font-semibold transition-colors group-hover:text-primary">
            {entityTitle(property)}
          </h3>
        </Link>
        <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-1">{entityCityState(property)}</span>
        </p>

        <div className="mt-3 flex items-center gap-4 border-t pt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <DoorOpen className="h-4 w-4" />
            {property.units.length} {property.units.length === 1 ? "unit" : "units"}
          </span>
          <span className="flex items-center gap-1.5">
            <Maximize className="h-4 w-4" />
            {formatSqft(property.square_feet)}
          </span>
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Rent from</p>
            <p className="font-semibold">
              {minRent != null ? formatCurrency(minRent) : "—"}
              {maxRent != null && maxRent !== minRent && (
                <span className="text-sm font-normal text-muted-foreground">
                  {" "}
                  – {formatCurrency(maxRent)}
                </span>
              )}
              <span className="text-sm font-normal text-muted-foreground">/mo</span>
            </p>
          </div>
          {availableCount > 0 && (
            <Badge variant="secondary" className="h-6">
              {availableCount} available
            </Badge>
          )}
        </div>

        <Button asChild variant="outline" className="mt-4">
          <Link to={`/properties/${property.entity_id}`}>View property</Link>
        </Button>
      </div>
    </div>
  )
}
