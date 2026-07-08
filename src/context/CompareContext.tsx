import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { RentalListingSchema } from "@/lib/types"

const MAX_COMPARE = 4
const STORAGE_KEY = "mri:compare"

interface CompareContextValue {
  items: RentalListingSchema[]
  ids: string[]
  count: number
  max: number
  has: (id: string) => boolean
  toggle: (listing: RentalListingSchema) => void
  remove: (id: string) => void
  clear: () => void
  isFull: boolean
}

const CompareContext = createContext<CompareContextValue | null>(null)

function readInitial(): RentalListingSchema[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as RentalListingSchema[]) : []
  } catch {
    return []
  }
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<RentalListingSchema[]>(readInitial)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* ignore */
    }
  }, [items])

  const has = useCallback((id: string) => items.some((i) => i.id === id), [items])

  const toggle = useCallback((listing: RentalListingSchema) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === listing.id))
        return prev.filter((i) => i.id !== listing.id)
      if (prev.length >= MAX_COMPARE) return prev
      return [...prev, listing]
    })
  }, [])

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const value = useMemo<CompareContextValue>(
    () => ({
      items,
      ids: items.map((i) => i.id),
      count: items.length,
      max: MAX_COMPARE,
      has,
      toggle,
      remove,
      clear,
      isFull: items.length >= MAX_COMPARE,
    }),
    [items, has, toggle, remove, clear]
  )

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
}

export function useCompare(): CompareContextValue {
  const ctx = useContext(CompareContext)
  if (!ctx) throw new Error("useCompare must be used within a CompareProvider")
  return ctx
}
