// API client for the MRI backend. When VITE_API_BASE_URL is configured the
// client calls the real FastAPI endpoints; otherwise it serves schema-accurate
// mock data (so the UI runs standalone). Every function mirrors an operation
// from the OpenAPI spec.
import type {
  AddressAutocompleteResponse,
  ListQuery,
  MRIPropertyEntity,
  PaginatedResponseSchema,
  PropertiesResponse,
  PropertySearchResultSchema,
  RentalListingSchema,
  RentalListingSearchResultSchema,
  RentalsResponse,
  USAddressSchema,
} from "./types"
import { toEntity, toListing } from "./types"
import type { PropertyListing } from "./types"
import { mockEntities } from "@/data/mockEntities"
import { mockRentals } from "@/data/mockRentals"
import { mockProperties } from "@/data/mockProperties"
import { fuzzyScore } from "./fuzzy"
import { entityAddress } from "./format"

// Data source is controlled by VITE_USE_MOCK:
//   "true"  (or unset) -> built-in mock data, runs with no backend
//   "false"            -> call the real backend at VITE_API_BASE_URL
const BASE_URL = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || "http://localhost:8000"
).replace(/\/$/, "")

export const USING_MOCK =
  String(import.meta.env.VITE_USE_MOCK ?? "true").toLowerCase() !== "false"

// --- Real HTTP layer -----------------------------------------------------

function buildQuery(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "" && v !== null) q.set(k, String(v))
  }
  const s = q.toString()
  return s ? `?${s}` : ""
}

async function httpGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Accept: "application/json" },
  })
  if (!res.ok) {
    throw new Error(`Request to ${path} failed (${res.status})`)
  }
  return (await res.json()) as T
}

// --- Mock helpers --------------------------------------------------------

const MOCK_LATENCY = 220

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY))
}

function paginate<T>(items: T[], page: number, pageSize: number): PaginatedResponseSchema<T> {
  const total = items.length
  const total_pages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    total,
    page,
    page_size: pageSize,
    total_pages,
  }
}

function matchesLocality(
  q: ListQuery,
  fields: { city?: string | null; state?: string | null; zip?: string | null }
): boolean {
  if (q.city && (fields.city ?? "").toLowerCase() !== q.city.toLowerCase()) {
    // allow partial city match
    if (!(fields.city ?? "").toLowerCase().includes(q.city.toLowerCase())) return false
  }
  if (q.state && (fields.state ?? "").toLowerCase() !== q.state.toLowerCase()) return false
  if (q.zip_code && (fields.zip ?? "") !== q.zip_code) return false
  return true
}

// The spec exposes no GET-by-id route, so we remember every entity/listing the
// list endpoints return. Detail pages then resolve instantly for anything the
// user has already seen, with a query-based fallback for direct URL hits.
const entityById = new Map<string, MRIPropertyEntity>()
const rentalById = new Map<string, RentalListingSchema>()

// --- Properties ----------------------------------------------------------

export async function getProperties(query: ListQuery = {}): Promise<PropertiesResponse> {
  const page = query.page ?? 1
  const pageSize = query.page_size ?? 20
  let res: PropertiesResponse

  if (!USING_MOCK) {
    res = await httpGet<PropertiesResponse>(
      `/properties${buildQuery({ ...query, page, page_size: pageSize })}`
    )
  } else {
    const entities = mockEntities.filter((e) =>
      matchesLocality(query, { city: e.city, state: e.state, zip: e.zip_code })
    )
    if (query.street && query.street.trim()) {
      const scored: PropertySearchResultSchema[] = entities
        .map((entity) => ({
          entity,
          match_score: fuzzyScore(query.street as string, entityAddress(entity)),
        }))
        .filter((r) => r.match_score > 20)
        .sort((a, b) => b.match_score - a.match_score)
      res = await delay(paginate(scored, page, pageSize))
    } else {
      res = await delay(paginate(entities, page, pageSize))
    }
  }

  res.items.forEach((i) => {
    const e = toEntity(i)
    entityById.set(e.entity_id, e)
  })
  return res
}

export async function getPropertyById(id: string): Promise<MRIPropertyEntity | undefined> {
  if (entityById.has(id)) return entityById.get(id)

  if (!USING_MOCK) {
    // Entity ids are opaque (not address-derivable), and there is no by-id
    // route, so on a cold/direct load we scan pages until we find it.
    for (let page = 1; page <= 6; page++) {
      const res = (await getProperties({
        page,
        page_size: 100,
      })) as PaginatedResponseSchema<MRIPropertyEntity | PropertySearchResultSchema>
      const hit = res.items.map(toEntity).find((e) => e.entity_id === id)
      if (hit) return hit
      if (page >= res.total_pages) break
    }
    return undefined
  }
  return mockEntities.find((e) => e.entity_id === id)
}

// --- Property listings (properties + units) ------------------------------
// Always mock: MRI's Entity API exposes no unit roster or rent, and the
// RentCast comparison is derived, so this dataset can't be sourced live.

/** Return properties, optionally filtered by a title (entity name) search. */
export async function getPropertyListings(search = ""): Promise<PropertyListing[]> {
  const q = search.trim().toLowerCase()
  const list = q
    ? mockProperties.filter((p) =>
        `${p.entity_name ?? ""} ${p.address1 ?? ""} ${p.city ?? ""}`
          .toLowerCase()
          .includes(q)
      )
    : mockProperties
  return delay(list)
}

/** Resolve a single property (with its units) by entity id. */
export async function getPropertyListingById(
  id: string
): Promise<PropertyListing | undefined> {
  return delay(mockProperties.find((p) => p.entity_id === id))
}

// --- Rentals -------------------------------------------------------------

// RentCast needs a location — `/rentals` 400s with no filter and 500s on
// state-only. For "browse" calls with no city/street we fall back to this city.
export const DEFAULT_RENTAL_CITY = "Austin"

export async function getRentals(query: ListQuery = {}): Promise<RentalsResponse> {
  const page = query.page ?? 1
  const pageSize = query.page_size ?? 20
  let res: RentalsResponse

  if (!USING_MOCK) {
    const q = { ...query }
    if (!q.street?.trim() && !q.city?.trim()) q.city = DEFAULT_RENTAL_CITY
    res = await httpGet<RentalsResponse>(
      `/rentals${buildQuery({ ...q, page, page_size: pageSize })}`
    )
  } else {
    const listings = mockRentals.filter((r) =>
      matchesLocality(query, { city: r.city, state: r.state, zip: r.zip_code })
    )
    if (query.street && query.street.trim()) {
      const scored: RentalListingSearchResultSchema[] = listings
        .map((listing) => ({
          listing,
          match_score: fuzzyScore(query.street as string, listing.formatted_address),
        }))
        .filter((r) => r.match_score > 20)
        .sort((a, b) => b.match_score - a.match_score)
      res = await delay(paginate(scored, page, pageSize))
    } else {
      res = await delay(paginate(listings, page, pageSize))
    }
  }

  res.items.forEach((i) => {
    const l = toListing(i)
    rentalById.set(l.id, l)
  })
  return res
}

// RentCast returns different ids for the same address across endpoints
// (e.g. "505-W-7th-St,-Apt-204,..." vs "property-505-W-7th-St-Apt-204-...").
// Normalize to an address key so we can match a listing regardless of source.
function normalizeRentalId(id: string): string {
  return id.replace(/^property-/i, "").replace(/[^a-z0-9]+/gi, "").toLowerCase()
}

export async function getRentalById(id: string): Promise<RentalListingSchema | undefined> {
  if (rentalById.has(id)) return rentalById.get(id)

  if (!USING_MOCK) {
    // Direct URL / refresh: the id embeds the address, so search by street and
    // match on the normalized address key.
    const street = id.replace(/[-_]+/g, " ").trim()
    const res = await getRentals({ street, page_size: 25 })
    const items = res.items.map(toListing)
    const target = normalizeRentalId(id)
    return (
      items.find((r) => r.id === id) ??
      items.find((r) => normalizeRentalId(r.id) === target)
    )
  }
  return mockRentals.find((r) => r.id === id)
}

// --- Address autocomplete ------------------------------------------------

// --- Geocoding (OpenStreetMap Nominatim) ---------------------------------
// MRI entities carry no lat/long, so we resolve their address to coordinates
// for the map. Free, no API key. Results are cached per-session.

const geocodeCache = new Map<string, { lat: number; lng: number } | null>()

export async function geocodeAddress(
  query: string
): Promise<{ lat: number; lng: number } | null> {
  const key = query.trim().toLowerCase()
  if (!key) return null
  if (geocodeCache.has(key)) return geocodeCache.get(key) ?? null

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(
      query
    )}`
    // Abort slow geocodes so the map never hangs in a "locating…" state.
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 6000)
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    }).finally(() => clearTimeout(timer))
    if (!res.ok) throw new Error(String(res.status))
    const data = (await res.json()) as Array<{ lat: string; lon: string }>
    const hit = data[0]
      ? { lat: Number(data[0].lat), lng: Number(data[0].lon) }
      : null
    geocodeCache.set(key, hit)
    return hit
  } catch {
    geocodeCache.set(key, null)
    return null
  }
}

export async function autocompleteAddress(q: string): Promise<AddressAutocompleteResponse> {
  if (!q.trim()) return { addresses: [] }

  if (!USING_MOCK) {
    return httpGet<AddressAutocompleteResponse>(
      `/addresses/autocomplete${buildQuery({ q })}`
    )
  }

  // Derive a suggestion pool from mock rentals + entities.
  const pool: USAddressSchema[] = [
    ...mockRentals.map((r) => ({
      street: r.address_line1,
      city: r.city,
      state: r.state,
      zip_code: r.zip_code,
      formatted_address: `${r.address_line1}, ${r.city}, ${r.state} ${r.zip_code}`,
    })),
    ...mockEntities
      .filter((e) => e.address1 && e.city && e.state && e.zip_code)
      .map((e) => ({
        street: e.address1 as string,
        city: e.city as string,
        state: e.state as string,
        zip_code: e.zip_code as string,
        formatted_address: `${e.address1}, ${e.city}, ${e.state} ${e.zip_code}`,
      })),
  ]

  const seen = new Set<string>()
  const ranked = pool
    .map((a) => ({ a, score: fuzzyScore(q, a.formatted_address) }))
    .filter(({ a, score }) => {
      if (score <= 15) return false
      if (seen.has(a.formatted_address)) return false
      seen.add(a.formatted_address)
      return true
    })
    .sort((x, y) => y.score - x.score)
    .slice(0, 6)
    .map(({ a }) => a)

  return delay({ addresses: ranked })
}

// --- MRI vs RentCast price comparison ------------------------------------

/** One property priced by both sources (MRI portfolio + RentCast market). */
export interface PriceComparison {
  /** Stable id (the RentCast listing id). */
  key: string
  address: string
  city: string
  state: string
  zip_code: string
  /** RentCast listing type — the unit actually being priced. */
  propertyType: string
  squareFootage: number | null
  bedrooms: number | null
  bathrooms: number | null
  /** The MRI portfolio record for the same address. */
  entity: MRIPropertyEntity
  /** The RentCast listing for the same address. */
  listing: RentalListingSchema
  /** MRI portfolio asking rent (monthly, USD). */
  mriRent: number | null
  /** RentCast market rent (monthly, USD). */
  rentcastRent: number | null
}

// MRI's Entity Listing API returns no price, so we derive a stable "portfolio"
// rent that differs from the live RentCast market rent by a fixed per-property
// spread (keyed by ZIP). This is mock data: when the backend exposes a real MRI
// price, replace `mriRentFor` with that field and the Compare page is unchanged.
const MRI_RENT_SPREAD: Record<string, number> = {
  "10014": -400,
  "10004": 600,
  "11216": -150,
  "11215": 200,
  "10022": -150,
  "10024": 300,
  "60616": -150,
  "60606": 300,
  "90028": -250,
  "33131": 400,
  "78744": -150,
  "78701": 150,
}

function mriRentFor(listing: RentalListingSchema): number | null {
  if (listing.price == null) return null
  return listing.price + (MRI_RENT_SPREAD[listing.zip_code.trim()] ?? 0)
}

// A single property, priced by both MRI and RentCast, for the Compare page.
// An MRI entity and a RentCast listing describe the same property when they
// share a ZIP (the two datasets pair 1:1 there).
export async function getPriceComparisons(): Promise<PriceComparison[]> {
  // Always mock: MRI's live Entity API returns no price, so a real
  // MRI-vs-RentCast price comparison can't be sourced from the backend.
  const entities: MRIPropertyEntity[] = mockEntities
  const listings: RentalListingSchema[] = mockRentals

  const entityByZip = new Map<string, MRIPropertyEntity>()
  for (const e of entities) {
    const z = e.zip_code?.trim()
    if (z && !entityByZip.has(z)) entityByZip.set(z, e)
  }

  const comparisons: PriceComparison[] = []
  for (const l of listings) {
    const entity = entityByZip.get(l.zip_code.trim())
    if (!entity) continue
    comparisons.push({
      key: l.id,
      address: l.address_line1,
      city: l.city,
      state: l.state,
      zip_code: l.zip_code,
      propertyType: l.property_type,
      squareFootage: l.square_footage ?? null,
      bedrooms: l.bedrooms ?? null,
      bathrooms: l.bathrooms ?? null,
      entity,
      listing: l,
      mriRent: mriRentFor(l),
      rentcastRent: l.price ?? null,
    })
  }

  return delay(comparisons)
}
