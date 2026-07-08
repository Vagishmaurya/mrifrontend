import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Building2, Home, MapPin, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { autocompleteAddress } from "@/lib/api"
import type { USAddressSchema } from "@/lib/types"

type Mode = "rentals" | "properties"

export function SearchBar({
  variant = "hero",
  mode: initialMode = "rentals",
  defaultValue = "",
  className,
}: {
  variant?: "hero" | "compact"
  mode?: Mode
  defaultValue?: string
  className?: string
}) {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>(initialMode)
  const [value, setValue] = useState(defaultValue)
  const [suggestions, setSuggestions] = useState<USAddressSchema[]>([])
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState<USAddressSchema | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  // Debounced autocomplete against /addresses/autocomplete.
  useEffect(() => {
    if (picked && picked.formatted_address === value) return
    const q = value.trim()
    if (q.length < 2) {
      setSuggestions([])
      return
    }
    const handle = setTimeout(() => {
      autocompleteAddress(q)
        .then((res) => {
          setSuggestions(res.addresses)
          setOpen(res.addresses.length > 0)
        })
        .catch(() => setSuggestions([]))
    }, 200)
    return () => clearTimeout(handle)
  }, [value, picked])

  // Close dropdown on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  function choose(a: USAddressSchema) {
    setPicked(a)
    setValue(a.formatted_address)
    setOpen(false)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const isPicked = !!picked && picked.formatted_address === value
    const params = new URLSearchParams()

    if (isPicked && picked) {
      // Pass the structured components of the chosen suggestion so the backend
      // can fuzzy-match precisely. Both /rentals and /properties accept
      // street/city/state/zip_code. Photon returns street === city for bare
      // place names (e.g. "New York, New York"), so only send `street` when it
      // is an actual street distinct from the city.
      if (picked.city) params.set("city", picked.city)
      if (picked.state) params.set("state", picked.state)
      if (picked.zip_code) params.set("zip_code", picked.zip_code)
      if (picked.street && picked.street !== picked.city)
        params.set("street", picked.street)
    } else {
      const q = value.trim()
      if (q) {
        // Free text: a house number implies a street; otherwise treat as a city.
        params.set(/\d/.test(q) ? "street" : "city", q)
      }
    }

    // The mode toggle decides the target: /rentals -> getRentals,
    // /properties -> getProperties. Each page reads these params and calls its API.
    navigate(`/${mode}?${params.toString()}`)
  }

  return (
    <div ref={boxRef} className={cn("relative w-full", className)}>
      <form
        onSubmit={submit}
        className={cn(
          "flex w-full flex-col gap-2 rounded-2xl border bg-card p-2 shadow-sm sm:flex-row sm:items-center",
          variant === "hero" && "sm:rounded-full sm:p-2 sm:shadow-xl"
        )}
      >
        {/* Mode toggle */}
        <div className="flex gap-1 rounded-xl bg-muted p-1 sm:rounded-full">
          {(["rentals", "properties"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors sm:rounded-full",
                mode === m
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {m === "rentals" ? (
                <Home className="h-4 w-4" />
              ) : (
                <Building2 className="h-4 w-4" />
              )}
              <span className="capitalize">{m}</span>
            </button>
          ))}
        </div>

        <div className="hidden h-6 w-px bg-border sm:block" />

        <div className="flex flex-1 items-center gap-2 px-2">
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
          <Input
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setPicked(null)
            }}
            onFocus={() => suggestions.length && setOpen(true)}
            placeholder="Search an address, city, or ZIP"
            className="border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
            autoComplete="off"
          />
        </div>

        <Button type="submit" size="lg" className="rounded-xl sm:rounded-full">
          <Search className="h-4 w-4" />
          Search
        </Button>
      </form>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-2 max-h-72 w-full overflow-auto rounded-2xl border bg-popover p-1.5 text-left shadow-xl">
          {suggestions.map((a) => (
            <li key={a.formatted_address}>
              <button
                type="button"
                onClick={() => choose(a)}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm hover:bg-accent"
              >
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="font-medium">{a.formatted_address}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
