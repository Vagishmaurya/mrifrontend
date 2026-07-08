// TypeScript models mapped 1:1 from the FastAPI OpenAPI schema.
// Source of truth: the MRI backend swagger.json.

/** MRI Property Entity record from the Entity Listing API (`GET /properties`). */
export interface MRIPropertyEntity {
  entity_id: string
  entity_name?: string | null
  address1?: string | null
  address2?: string | null
  address3?: string | null
  state?: string | null
  city?: string | null
  zip_code?: string | null
  property_type?: string | null
  property_type_description?: string | null
  property_sub_type?: string | null
  property_class?: string | null
  location_id?: string | null
  entity_type?: string | null
  square_feet?: string | null
  year_end_period?: string | null
  /** ISO date-time string. */
  last_date?: string | null
  county?: string | null
  active?: string | null
}

/** Property search result with fuzzy match score (returned when `street` is set). */
export interface PropertySearchResultSchema {
  entity: MRIPropertyEntity
  /** 0–100. */
  match_score: number
}

/**
 * A single rentable unit inside a property. MRI exposes the portfolio rent
 * (`mri_rent`); RentCast supplies the live market estimate (`rentcast_rent`)
 * used for the side-by-side price comparison.
 */
export interface PropertyUnit {
  id: string
  /** Unit label, e.g. "Unit 3B". */
  name: string
  bedrooms: number
  bathrooms: number
  square_footage: number
  /** Unit style, e.g. "Apartment", "Condo". */
  unit_type: string
  /** MRI portfolio asking rent (monthly, USD). */
  mri_rent: number
  /** RentCast market rent estimate (monthly, USD) — the comparison price. */
  rentcast_rent: number
  status: "Available" | "Occupied"
  /** Asking-rent history for this unit, keyed by period. */
  history?: Record<string, RentalListingHistoryEntrySchema> | null
}

/**
 * A property shown on the listing page. Extends the MRI entity with map
 * coordinates and the set of units it contains.
 */
export interface PropertyListing extends MRIPropertyEntity {
  latitude: number
  longitude: number
  units: PropertyUnit[]
}

/** A single rental listing history event. */
export interface RentalListingHistoryEntrySchema {
  event?: string | null
  price?: number | null
  listing_type?: string | null
  /** ISO date-time string. */
  listed_date?: string | null
  /** ISO date-time string. */
  removed_date?: string | null
  days_on_market?: number | null
}

/** RentCast rental listing record (`GET /rentals`). */
export interface RentalListingSchema {
  id: string
  formatted_address: string
  address_line1: string
  address_line2?: string | null
  city: string
  state: string
  zip_code: string
  latitude: number
  longitude: number
  bedrooms?: number | null
  bathrooms?: number | null
  square_footage?: number | null
  property_type: string
  price?: number | null
  /** Keyed by an opaque event id or period. */
  history?: Record<string, RentalListingHistoryEntrySchema> | null
}

/** Rental listing search result with fuzzy match score. */
export interface RentalListingSearchResultSchema {
  listing: RentalListingSchema
  /** 0–100. */
  match_score: number
}

/** US formatted address for autocomplete (`GET /addresses/autocomplete`). */
export interface USAddressSchema {
  street: string
  city: string
  state: string
  zip_code: string
  formatted_address: string
}

export interface AddressAutocompleteResponse {
  addresses: USAddressSchema[]
}

/** Generic paginated envelope used by both list endpoints. */
export interface PaginatedResponseSchema<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

/** Shared query parameters accepted by `/properties` and `/rentals`. */
export interface ListQuery {
  city?: string
  state?: string
  zip_code?: string
  /** When present, the endpoint fuzzy-matches and returns `match_score`. */
  street?: string
  page?: number
  page_size?: number
}

// Convenience unions for the two possible response shapes of each list endpoint.
export type PropertiesResponse =
  | PaginatedResponseSchema<MRIPropertyEntity>
  | PaginatedResponseSchema<PropertySearchResultSchema>

export type RentalsResponse =
  | PaginatedResponseSchema<RentalListingSchema>
  | PaginatedResponseSchema<RentalListingSearchResultSchema>

// --- Narrowing helpers ---------------------------------------------------

export function isPropertySearchResult(
  item: MRIPropertyEntity | PropertySearchResultSchema
): item is PropertySearchResultSchema {
  return (item as PropertySearchResultSchema).entity !== undefined
}

export function isRentalSearchResult(
  item: RentalListingSchema | RentalListingSearchResultSchema
): item is RentalListingSearchResultSchema {
  return (item as RentalListingSearchResultSchema).listing !== undefined
}

/** Unwrap a properties item to the underlying entity regardless of variant. */
export function toEntity(
  item: MRIPropertyEntity | PropertySearchResultSchema
): MRIPropertyEntity {
  return isPropertySearchResult(item) ? item.entity : item
}

/** Unwrap a rentals item to the underlying listing regardless of variant. */
export function toListing(
  item: RentalListingSchema | RentalListingSearchResultSchema
): RentalListingSchema {
  return isRentalSearchResult(item) ? item.listing : item
}
