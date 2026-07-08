import { Link } from "react-router-dom"
import { ArrowRight, Building2, Database } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function Home() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="relative isolate flex flex-1 items-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=2000&q=80&auto=format&fit=crop"
          alt=""
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/55 to-black/70" />

        <div className="mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center text-white">
            <Badge className="mb-5 gap-1.5 border-white/20 bg-white/10 text-white backdrop-blur">
              <Database className="h-3.5 w-3.5" />
              Portfolio + live rental market data
            </Badge>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
              Your properties and the market,{" "}
              <span className="text-primary underline decoration-primary decoration-4 underline-offset-8">
                in one place
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-pretty text-lg text-white/80">
              Browse your MRI portfolio, drill into each property’s units, and
              compare book rent against live RentCast market pricing.
            </p>

            <div className="mt-10 flex justify-center">
              <Button asChild size="lg" className="h-12 rounded-full px-7 text-base">
                <Link to="/properties">
                  <Building2 className="h-5 w-5" />
                  Go to Properties
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
