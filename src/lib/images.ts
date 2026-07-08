// Presentation-only imagery. The API returns no photos, so we deterministically
// map a record id to a stable stock image purely for a richer demo UI.
const RENTAL_IMAGES = [
  "photo-1502672260266-1c1ef2d93688",
  "photo-1522708323590-d24dbb6b0267",
  "photo-1560448204-e02f11c3d0e2",
  "photo-1568605114967-8130f3a36994",
  "photo-1560185007-cde436f6a4d0",
  "photo-1512918728675-ed5a9ecdebfd",
  "photo-1536376072261-38c75010e6c9",
  "photo-1502005229762-cf1b2da7c5d6",
  "photo-1554995207-c18c203602cb",
  "photo-1493809842364-78817add7ffb",
  "photo-1484154218962-a197022b5858",
  "photo-1560184897-ae75f418493e",
]

const ENTITY_IMAGES = [
  "photo-1486406146926-c627a92ad1ab",
  "photo-1479839672679-a46483c0e7c8",
  "photo-1497366216548-37526070297c",
  "photo-1497366811353-6870744d04b2",
  "photo-1554469384-e58fac16e23a",
  "photo-1577760258779-e787a1733016",
]

function hash(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h
}

const unsplash = (photo: string, w: number) =>
  `https://images.unsplash.com/${photo}?w=${w}&q=80&auto=format&fit=crop`

export function rentalImage(id: string, w = 800): string {
  return unsplash(RENTAL_IMAGES[hash(id) % RENTAL_IMAGES.length], w)
}

export function rentalGallery(id: string, w = 1200): string[] {
  const start = hash(id) % RENTAL_IMAGES.length
  return Array.from({ length: 4 }, (_, i) =>
    unsplash(RENTAL_IMAGES[(start + i) % RENTAL_IMAGES.length], w)
  )
}

export function entityImage(id: string, w = 800): string {
  return unsplash(ENTITY_IMAGES[hash(id) % ENTITY_IMAGES.length], w)
}
