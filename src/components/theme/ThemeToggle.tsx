import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

function getInitial(): boolean {
  if (typeof window === "undefined") return false
  const stored = window.localStorage.getItem("mir:theme")
  if (stored) return stored === "dark"
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

export function ThemeToggle() {
  const [dark, setDark] = useState(getInitial)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("dark", dark)
    window.localStorage.setItem("mir:theme", dark ? "dark" : "light")
  }, [dark])

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setDark((d) => !d)}
    >
      <Sun className="h-5 w-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-5 w-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
    </Button>
  )
}
