import { Link } from "react-router-dom"
import { Building2, MapPin, Maximize } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  entityCityState,
  entityTitle,
  formatSqft,
  isEntityActive,
} from "@/lib/format"
import { entityImage } from "@/lib/images"
import type { MRIPropertyEntity } from "@/lib/types"

export function EntityCard({
  entity,
  matchScore,
}: {
  entity: MRIPropertyEntity
  matchScore?: number
}) {
  const active = isEntityActive(entity)

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-[16/10] overflow-hidden">
        <Link to={`/properties/${entity.entity_id}`}>
          <img
            src={entityImage(entity.entity_id)}
            alt={entityTitle(entity)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </Link>
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {entity.property_type_description && (
            <Badge className="shadow-sm">{entity.property_type_description}</Badge>
          )}
          {entity.property_class && (
            <Badge variant="secondary" className="bg-background/90 shadow-sm">
              Class {entity.property_class}
            </Badge>
          )}
        </div>
        <div className="absolute right-3 top-3">
          <Badge
            variant="outline"
            className={cn(
              "border-transparent shadow-sm",
              active
                ? "bg-emerald-600 text-white"
                : "bg-muted text-muted-foreground"
            )}
          >
            {active ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Building2 className="h-3.5 w-3.5" />
          <span className="font-mono">{entity.entity_id}</span>
          {matchScore !== undefined && (
            <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-[10px]">
              {Math.round(matchScore)}% match
            </Badge>
          )}
        </div>

        <Link to={`/properties/${entity.entity_id}`} className="mt-1">
          <h3 className="line-clamp-1 font-semibold transition-colors group-hover:text-primary">
            {entityTitle(entity)}
          </h3>
        </Link>
        <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-1">{entityCityState(entity)}</span>
        </p>

        <div className="mt-3 flex items-center gap-4 border-t pt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Maximize className="h-4 w-4" />
            {formatSqft(entity.square_feet)}
          </span>
          {entity.property_sub_type && (
            <span className="line-clamp-1">{entity.property_sub_type}</span>
          )}
        </div>

        <Button asChild variant="outline" className="mt-4">
          <Link to={`/properties/${entity.entity_id}`}>View entity</Link>
        </Button>
      </div>
    </div>
  )
}
