import { Link } from "react-router-dom"
import { Logo } from "./Logo"

const columns = [
  {
    title: "Explore",
    links: [
      { label: "Rental listings", to: "/rentals" },
      { label: "Portfolio properties", to: "/properties" },
      { label: "Compare prices", to: "/compare" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About MRI", to: "/" },
      { label: "Careers", to: "/" },
      { label: "Press", to: "/" },
      { label: "Contact", to: "/" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Address lookup", to: "/rentals" },
      { label: "Market data", to: "/rentals" },
      { label: "Help center", to: "/" },
      { label: "API docs", to: "/" },
    ],
  },
]

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="space-y-4">
            <Logo />
            <p className="max-w-xs text-sm text-muted-foreground">
              MRI Property brings your entity portfolio and live rental market data
              into one place — search, explore, and compare with confidence.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-sm font-semibold">{col.title}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="transition-colors hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t pt-6 text-sm text-muted-foreground sm:flex-row">
          <p>© 2026 MRI Property. Demo interface — sample data only.</p>
          <div className="flex gap-6">
            <Link to="/" className="hover:text-foreground">Privacy</Link>
            <Link to="/" className="hover:text-foreground">Terms</Link>
            <Link to="/" className="hover:text-foreground">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
