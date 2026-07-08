import { Button } from "@/components/ui/button"
import { Logo } from "./Logo"
import { ThemeToggle } from "@/components/theme/ThemeToggle"

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Logo />

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <Button className="ml-2">Sign in</Button>
        </div>
      </div>
    </header>
  )
}
