// Mock properties for the listing + detail pages. Each property is an MRI
// entity augmented with map coordinates and a set of rentable units. Every
// unit carries both an MRI portfolio rent and a RentCast market estimate so
// the detail page can compare the two side by side.
//
// Shapes match `PropertyListing` / `PropertyUnit`, so the UI renders identically
// once a real backend supplies the same fields.
import type {
  PropertyListing,
  PropertyUnit,
  RentalListingHistoryEntrySchema,
} from "@/lib/types"
import { mockEntities } from "./mockEntities"
import { mockRentals } from "./mockRentals"

// Coordinates per property, keyed by ZIP (the mock rentals sit at the same
// addresses, so we borrow their lat/long instead of geocoding).
const coordsByZip = new Map<string, { lat: number; lng: number }>()
for (const r of mockRentals) {
  if (!coordsByZip.has(r.zip_code)) {
    coordsByZip.set(r.zip_code, { lat: r.latitude, lng: r.longitude })
  }
}

// A small unit "menu" per property type. Each property draws a few of these,
// scaled by its size, to produce a believable unit mix.
const UNIT_TEMPLATES: Record<
  string,
  { name: string; beds: number; baths: number; sqft: number; type: string; rent: number }[]
> = {
  Office: [
    { name: "Suite 100", beds: 0, baths: 1, sqft: 1800, type: "Office suite", rent: 5200 },
    { name: "Suite 210", beds: 0, baths: 2, sqft: 3200, type: "Office suite", rent: 8600 },
    { name: "Suite 305", beds: 0, baths: 2, sqft: 2400, type: "Office suite", rent: 6900 },
    { name: "Penthouse Floor", beds: 0, baths: 3, sqft: 5400, type: "Full floor", rent: 14200 },
  ],
  Retail: [
    { name: "Storefront A", beds: 0, baths: 1, sqft: 1200, type: "Retail bay", rent: 4200 },
    { name: "Storefront B", beds: 0, baths: 1, sqft: 900, type: "Retail bay", rent: 3400 },
    { name: "Corner Unit", beds: 0, baths: 2, sqft: 2100, type: "Anchor space", rent: 6800 },
  ],
  Residential: [
    { name: "Unit 2A", beds: 1, baths: 1, sqft: 720, type: "Apartment", rent: 2600 },
    { name: "Unit 3B", beds: 2, baths: 2, sqft: 1120, type: "Apartment", rent: 3900 },
    { name: "Unit 4C", beds: 2, baths: 2, sqft: 1180, type: "Apartment", rent: 4200 },
    { name: "Unit PH", beds: 3, baths: 2, sqft: 1680, type: "Penthouse", rent: 6400 },
  ],
  Industrial: [
    { name: "Bay 1", beds: 0, baths: 1, sqft: 8000, type: "Warehouse bay", rent: 7200 },
    { name: "Bay 2", beds: 0, baths: 1, sqft: 6500, type: "Warehouse bay", rent: 6100 },
    { name: "Flex Suite", beds: 0, baths: 2, sqft: 3200, type: "Flex space", rent: 4300 },
  ],
  "Mixed Use": [
    { name: "Retail Level", beds: 0, baths: 2, sqft: 2400, type: "Retail bay", rent: 7100 },
    { name: "Unit 5A", beds: 2, baths: 2, sqft: 1240, type: "Apartment", rent: 4600 },
    { name: "Unit 8C", beds: 1, baths: 1, sqft: 780, type: "Apartment", rent: 3100 },
    { name: "Unit PH", beds: 3, baths: 3, sqft: 2100, type: "Penthouse", rent: 8900 },
  ],
}

// RentCast market estimate relative to the MRI portfolio rent, keyed by ZIP.
// Positive = the market is asking more than MRI's book rent.
const RENTCAST_SPREAD: Record<string, number> = {
  "10014": 400,
  "10004": -600,
  "11216": 150,
  "11215": -200,
  "10022": 150,
  "10024": -300,
  "60616": 150,
  "60606": -300,
  "90028": 250,
  "33131": -400,
  "78744": 150,
  "78701": -150,
}

// Deterministic asking-rent history (no Math.random, so it is reproducible).
function buildUnitHistory(
  baseRent: number,
  seed: number
): Record<string, RentalListingHistoryEntrySchema> {
  const months = [
    { key: "2025-08", date: "2025-08-01T00:00:00" },
    { key: "2025-11", date: "2025-11-01T00:00:00" },
    { key: "2026-02", date: "2026-02-01T00:00:00" },
    { key: "2026-05", date: "2026-05-01T00:00:00" },
  ]
  const history: Record<string, RentalListingHistoryEntrySchema> = {}
  months.forEach((m, i) => {
    const wave = Math.sin((i + seed) * 0.6) * 0.045
    const drift = (i - months.length + 1) * 0.02
    const isLatest = i === months.length - 1
    const price = isLatest ? baseRent : Math.round((baseRent * (1 + wave + drift)) / 25) * 25
    history[m.key] = {
      event: i === 0 ? "Listed for rent" : isLatest ? "Current asking rent" : "Price change",
      price,
      listing_type: "Standard",
      listed_date: m.date,
      removed_date: isLatest ? null : months[i + 1]?.date ?? null,
      days_on_market: 30,
    }
  })
  return history
}

function buildUnits(
  entityId: string,
  typeDescription: string,
  spread: number
): PropertyUnit[] {
  const templates =
    UNIT_TEMPLATES[typeDescription] ?? UNIT_TEMPLATES.Residential
  // 2–4 units per property, chosen deterministically from the id.
  const idNum = Number(entityId.replace(/\D/g, "")) || 0
  const count = 2 + (idNum % (templates.length - 1))

  return templates.slice(0, count).map((t, i) => {
    const mriRent = t.rent
    const rentcastRent = Math.max(0, mriRent + spread + (i - 1) * 60)
    return {
      id: `${entityId}-U${i + 1}`,
      name: t.name,
      bedrooms: t.beds,
      bathrooms: t.baths,
      square_footage: t.sqft,
      unit_type: t.type,
      mri_rent: mriRent,
      rentcast_rent: rentcastRent,
      status: (idNum + i) % 3 === 0 ? "Occupied" : "Available",
      history: buildUnitHistory(mriRent, idNum + i),
    }
  })
}

export const mockProperties: PropertyListing[] = mockEntities.map((e) => {
  const coords = coordsByZip.get(e.zip_code ?? "") ?? { lat: 39.5, lng: -98.35 }
  const typeDesc = e.property_type_description ?? "Residential"
  const spread = RENTCAST_SPREAD[e.zip_code?.trim() ?? ""] ?? 100
  return {
    ...e,
    latitude: coords.lat,
    longitude: coords.lng,
    units: buildUnits(e.entity_id, typeDesc, spread),
  }
})
