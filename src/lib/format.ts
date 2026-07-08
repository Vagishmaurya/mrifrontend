// Presentation helpers shared across the app.
import type { MRIPropertyEntity, RentalListingSchema } from "./types"

export function formatCurrency(value?: number | null): string {
  if (value == null) return "—"
  return `$${Math.round(value).toLocaleString("en-US")}`
}

export function formatNumber(value?: number | string | null): string {
  if (value == null || value === "") return "—"
  const n = typeof value === "string" ? Number(value.replace(/[^0-9.]/g, "")) : value
  if (!Number.isFinite(n)) return String(value)
  return n.toLocaleString("en-US")
}

export function formatSqft(value?: number | string | null): string {
  const n = formatNumber(value)
  return n === "—" ? "—" : `${n} ft²`
}

export function formatDate(iso?: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function formatMonth(iso?: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
}

/** Build a single-line address from an MRI entity's parts. */
export function entityAddress(e: MRIPropertyEntity): string {
  const street = [e.address1, e.address2, e.address3].filter(Boolean).join(", ")
  const locality = [e.city, e.state].filter(Boolean).join(", ")
  const tail = [locality, e.zip_code].filter(Boolean).join(" ")
  return [street, tail].filter(Boolean).join(" · ") || "Address unavailable"
}

export function entityCityState(e: MRIPropertyEntity): string {
  return [e.city, e.state].filter(Boolean).join(", ") || "—"
}

export function entityTitle(e: MRIPropertyEntity): string {
  return e.entity_name?.trim() || e.address1?.trim() || `Entity ${e.entity_id}`
}

/** True when the `active` flag reads as an affirmative value. */
export function isEntityActive(e: MRIPropertyEntity): boolean {
  const v = (e.active ?? "").toString().trim().toLowerCase()
  return v === "y" || v === "yes" || v === "true" || v === "1" || v === "active"
}

export function bedsLabel(beds?: number | null): string {
  if (beds == null) return "—"
  return beds === 0 ? "Studio" : `${beds} bd`
}

/** Sorted price-history points for a rental, oldest → newest. */
export function rentalHistoryPoints(
  listing: RentalListingSchema
): { date: string; label: string; price: number; event?: string | null }[] {
  const entries = Object.values(listing.history ?? {})
  return entries
    .filter((h) => h.price != null && h.listed_date)
    .map((h) => ({
      date: h.listed_date as string,
      label: formatMonth(h.listed_date),
      price: h.price as number,
      event: h.event,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}
