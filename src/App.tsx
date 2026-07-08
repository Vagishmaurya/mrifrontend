import { Route, Routes } from "react-router-dom"
import { Layout } from "@/components/layout/Layout"
import { Home } from "@/pages/Home"
import { Rentals } from "@/pages/Rentals"
import { RentalDetail } from "@/pages/RentalDetail"
import { Properties } from "@/pages/Properties"
import { PropertyDetail } from "@/pages/PropertyDetail"
import { Compare } from "@/pages/Compare"
import { NotFound } from "@/pages/NotFound"

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/rentals" element={<Rentals />} />
        <Route path="/rentals/:id" element={<RentalDetail />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/properties/:id" element={<PropertyDetail />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
