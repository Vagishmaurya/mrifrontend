import { useEffect } from "react"
import { Link } from "react-router-dom"
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { cn } from "@/lib/utils"

export interface MapMarker {
  id: string
  lat: number
  lng: number
  /** Text shown inside a "price" marker or the popup title. */
  label?: string
  /** Optional popup body line. */
  sub?: string
  /** Navigation target for the popup link. */
  to?: string
}

// A teardrop pin (single-location detail views).
function pinIcon() {
  return L.divIcon({
    className: "",
    html: `<svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 10 15 25 15 25s15-15 15-25C30 6.7 23.3 0 15 0z" fill="var(--primary)"/>
      <circle cx="15" cy="15" r="6" fill="white"/>
    </svg>`,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -38],
  })
}

// A rounded price pill (multi-location list views).
function priceIcon(label: string) {
  return L.divIcon({
    className: "",
    html: `<span style="
      display:inline-flex;align-items:center;white-space:nowrap;
      background:var(--background);color:var(--foreground);
      border:1px solid var(--border);border-radius:9999px;
      padding:3px 9px;font-size:12px;font-weight:600;
      box-shadow:0 2px 6px rgba(0,0,0,.18);">${label}</span>`,
    iconSize: [0, 0],
    iconAnchor: [0, 14],
    popupAnchor: [0, -14],
  })
}

function FitBounds({ markers }: { markers: MapMarker[] }) {
  const map = useMap()
  useEffect(() => {
    if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], 15)
    } else if (markers.length > 1) {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number]))
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 })
    }
    // Leaflet occasionally needs a nudge after layout settles.
    const t = setTimeout(() => map.invalidateSize(), 200)
    return () => clearTimeout(t)
  }, [markers, map])
  return null
}

export function LocationMap({
  markers,
  variant = "pin",
  className,
}: {
  markers: MapMarker[]
  variant?: "pin" | "price"
  className?: string
}) {
  if (markers.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl border bg-muted/30 text-sm text-muted-foreground",
          className
        )}
      >
        No location data available.
      </div>
    )
  }

  const center: [number, number] = [markers[0].lat, markers[0].lng]

  return (
    <div className={cn("overflow-hidden rounded-2xl border", className)}>
      <MapContainer
        center={center}
        zoom={14}
        scrollWheelZoom={false}
        className="h-full w-full"
        style={{ background: "var(--muted)" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds markers={markers} />
        {markers.map((m) => (
          <Marker
            key={m.id}
            position={[m.lat, m.lng]}
            icon={variant === "price" && m.label ? priceIcon(m.label) : pinIcon()}
          >
            {(m.label || m.sub || m.to) && (
              <Popup>
                <div className="space-y-0.5">
                  {m.label && <p className="font-semibold">{m.label}</p>}
                  {m.sub && <p className="text-muted-foreground">{m.sub}</p>}
                  {m.to && (
                    <Link to={m.to} className="text-primary hover:underline">
                      View details →
                    </Link>
                  )}
                </div>
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
