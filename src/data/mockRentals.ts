// Mock RentCast rental listings — shaped exactly like `RentalListingSchema`
// (including the `history` map) so the UI renders identically against the
// live `/rentals` API.
import type {
  RentalListingSchema,
  RentalListingHistoryEntrySchema,
} from "@/lib/types"

interface Seed {
  id: string
  line1: string
  line2?: string | null
  city: string
  state: string
  zip: string
  lat: number
  lng: number
  beds: number
  baths: number
  sqft: number
  type: string
  price: number
}

const SEEDS: Seed[] = [
  { id: "rc-90001", line1: "418 Waverly Pl", line2: "Apt 3B", city: "New York", state: "NY", zip: "10014", lat: 40.7338, lng: -74.0021, beds: 2, baths: 2, sqft: 1180, type: "Apartment", price: 6200 },
  { id: "rc-90002", line1: "77 Battery Wharf", line2: "Unit 12F", city: "New York", state: "NY", zip: "10004", lat: 40.7033, lng: -74.0170, beds: 3, baths: 2, sqft: 1520, type: "Condo", price: 8900 },
  { id: "rc-90003", line1: "1209 Bedford Ave", line2: null, city: "Brooklyn", state: "NY", zip: "11216", lat: 40.6787, lng: -73.9540, beds: 0, baths: 1, sqft: 520, type: "Apartment", price: 2650 },
  { id: "rc-90004", line1: "34 Cedar Row", line2: null, city: "Brooklyn", state: "NY", zip: "11215", lat: 40.6681, lng: -73.9806, beds: 4, baths: 3, sqft: 2100, type: "Townhouse", price: 7400 },
  { id: "rc-90005", line1: "500 Lexington Loop", line2: "Apt 9A", city: "New York", state: "NY", zip: "10022", lat: 40.7566, lng: -73.9702, beds: 1, baths: 1, sqft: 760, type: "Apartment", price: 4100 },
  { id: "rc-90006", line1: "88 Riverside Dr", line2: null, city: "New York", state: "NY", zip: "10024", lat: 40.7859, lng: -73.9787, beds: 2, baths: 2, sqft: 1240, type: "Apartment", price: 5600 },
  { id: "rc-90007", line1: "2400 W Warehouse Ln", line2: "Loft 5", city: "Chicago", state: "IL", zip: "60616", lat: 41.8497, lng: -87.6314, beds: 1, baths: 1, sqft: 900, type: "Loft", price: 2350 },
  { id: "rc-90008", line1: "155 N Wacker Dr", line2: "Unit 2201", city: "Chicago", state: "IL", zip: "60606", lat: 41.8843, lng: -87.6369, beds: 2, baths: 2, sqft: 1350, type: "Condo", price: 3900 },
  { id: "rc-90009", line1: "6200 Sunset Blvd", line2: "Apt 410", city: "Los Angeles", state: "CA", zip: "90028", lat: 34.0980, lng: -118.3267, beds: 2, baths: 2, sqft: 1150, type: "Apartment", price: 4300 },
  { id: "rc-90010", line1: "1010 Brickell Ave", line2: "Unit 3805", city: "Miami", state: "FL", zip: "33131", lat: 25.7616, lng: -80.1918, beds: 3, baths: 3, sqft: 1680, type: "Condo", price: 6100 },
  { id: "rc-90011", line1: "77 Old Mill Rd", line2: null, city: "Austin", state: "TX", zip: "78744", lat: 30.2010, lng: -97.7550, beds: 3, baths: 2, sqft: 1420, type: "House", price: 2900 },
  { id: "rc-90012", line1: "500 Congress Ave", line2: "Apt 610", city: "Austin", state: "TX", zip: "78701", lat: 30.2669, lng: -97.7428, beds: 1, baths: 1, sqft: 680, type: "Apartment", price: 2200 },
]

const LISTING_TYPES = ["Standard", "Standard", "Standard"]

// Deterministic pseudo-history so charts have something meaningful to plot,
// without pulling in Math.random (unavailable in some runtimes and non-repro).
function buildHistory(
  seed: Seed,
  index: number
): Record<string, RentalListingHistoryEntrySchema> {
  const months = [
    { key: "2025-08", date: "2025-08-01T00:00:00" },
    { key: "2025-11", date: "2025-11-01T00:00:00" },
    { key: "2026-02", date: "2026-02-01T00:00:00" },
    { key: "2026-05", date: "2026-05-01T00:00:00" },
  ]
  const history: Record<string, RentalListingHistoryEntrySchema> = {}
  months.forEach((m, i) => {
    // Gentle wave around the current price, trending toward it by the latest entry.
    const wave = Math.sin((i + index) * 0.7) * 0.05
    const drift = (i - months.length + 1) * 0.015
    const raw = seed.price * (1 + wave + drift)
    const price = Math.round(raw / 25) * 25
    const isLatest = i === months.length - 1
    const nextDate = months[i + 1]?.date ?? null
    const dom = nextDate
      ? Math.round(
          (new Date(nextDate).getTime() - new Date(m.date).getTime()) / 86400000
        )
      : 30
    history[m.key] = {
      event: isLatest ? "Listed for rent" : i === 0 ? "Listed for rent" : "Price change",
      price: isLatest ? seed.price : price,
      listing_type: LISTING_TYPES[i % LISTING_TYPES.length],
      listed_date: m.date,
      removed_date: isLatest ? null : nextDate,
      days_on_market: dom,
    }
  })
  return history
}

export const mockRentals: RentalListingSchema[] = SEEDS.map((s, i) => ({
  id: s.id,
  formatted_address: `${s.line1}${s.line2 ? " " + s.line2 : ""}, ${s.city}, ${s.state} ${s.zip}`,
  address_line1: s.line1,
  address_line2: s.line2 ?? null,
  city: s.city,
  state: s.state,
  zip_code: s.zip,
  latitude: s.lat,
  longitude: s.lng,
  bedrooms: s.beds,
  bathrooms: s.baths,
  square_footage: s.sqft,
  property_type: s.type,
  price: s.price,
  history: buildHistory(s, i),
}))
