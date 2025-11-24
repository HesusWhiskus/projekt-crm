"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"

export function VehicleSearchInput() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSearchChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('search', value)
    } else {
      params.delete('search')
    }
    // Reset page to 1 when searching
    params.delete('page')
    router.push(`/insurance-agent/vehicles?${params.toString()}`)
  }

  return (
    <div className="relative">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Numer rejestracyjny, VIN, właściciel..."
        defaultValue={searchParams.get("search") || ""}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSearchChange(e.currentTarget.value)
          }
        }}
        onBlur={(e) => handleSearchChange(e.target.value)}
        className="pl-8"
      />
    </div>
  )
}

