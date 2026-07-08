import { useEffect } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { Navbar } from "./Navbar"
import { Footer } from "./Footer"

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])
  return null
}

export function Layout() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <ScrollToTop />
      <Navbar />
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
