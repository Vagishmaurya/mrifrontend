import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

export function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-6xl font-semibold tracking-tight text-primary">404</p>
      <h1 className="mt-4 text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-muted-foreground">
        The page you're looking for doesn't exist or has moved.
      </p>
      <Button asChild className="mt-6">
        <Link to="/">Back home</Link>
      </Button>
    </div>
  )
}
