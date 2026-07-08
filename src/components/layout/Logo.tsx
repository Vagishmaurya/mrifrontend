import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2.5", className)} aria-label="MRI Property — home">
      <img
        src="/mri_logo-crop-2.png"
        alt="MRI"
        width={1508}
        height={667}
        className="h-8 w-auto"
      />
      <span className="hidden text-sm font-medium text-muted-foreground sm:inline">
        Property
      </span>
    </Link>
  )
}
