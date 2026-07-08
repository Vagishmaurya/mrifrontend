import { Link, useLocation } from "react-router-dom"
import { ArrowRight, Scale, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCompare } from "@/context/CompareContext"
import { formatCurrency } from "@/lib/format"
import { rentalImage } from "@/lib/images"

export function CompareTray() {
  const { items, remove, clear, count, max } = useCompare()
  const location = useLocation()

  if (count === 0 || location.pathname === "/compare") return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-4">
      <div className="pointer-events-auto mx-auto flex max-w-5xl flex-col gap-3 rounded-2xl border bg-background/95 p-3 shadow-2xl backdrop-blur-md sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 pl-1">
          <Scale className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold">
            Compare <span className="text-muted-foreground">({count}/{max})</span>
          </span>
        </div>

        <div className="flex flex-1 gap-2 overflow-x-auto">
          {items.map((l) => (
            <div
              key={l.id}
              className="group relative flex min-w-[180px] items-center gap-3 rounded-xl border bg-card p-2"
            >
              <img
                src={rentalImage(l.id, 200)}
                alt={l.address_line1}
                className="h-11 w-14 rounded-md object-cover"
                loading="lazy"
              />
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{l.address_line1}</p>
                <p className="text-xs text-primary">{formatCurrency(l.price)}/mo</p>
              </div>
              <button
                onClick={() => remove(l.id)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm hover:text-foreground"
                aria-label={`Remove ${l.address_line1}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={clear}>
            Clear
          </Button>
          <Button asChild disabled={count < 2}>
            <Link to="/compare">
              Compare
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
