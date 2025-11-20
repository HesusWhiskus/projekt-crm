"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { OfferCard } from "./offer-card"
import { Search, ArrowUpDown } from "lucide-react"
import { InsuranceScope } from "@prisma/client"

interface OffersListProps {
  offers: Array<{
    id: string
    insuranceCompany: {
      id: string
      name: string
      logoUrl: string | null
    }
    price: number | string
    packageType: string | null
    scopes: InsuranceScope[]
    installments: number | null
    installmentAmount: number | string | null
    validUntil: Date | string | null
    isSelected: boolean
    status?: string | null
  }>
  onSelectOffer?: (offerId: string) => void
  showSelectButton?: boolean
}

type SortOption = "price-asc" | "price-desc" | "company-asc" | "company-desc"

export function OffersList({ offers, onSelectOffer, showSelectButton = true }: OffersListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("price-asc")
  const [filterByCompany, setFilterByCompany] = useState<string>("all")

  // Filtrowanie i sortowanie
  const filteredAndSortedOffers = offers
    .filter((offer) => {
      const matchesSearch = 
        offer.insuranceCompany.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.packageType?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCompany = filterByCompany === "all" || offer.insuranceCompany.id === filterByCompany

      return matchesSearch && matchesCompany
    })
    .sort((a, b) => {
      const priceA = typeof a.price === "number" ? a.price : Number(a.price)
      const priceB = typeof b.price === "number" ? b.price : Number(b.price)

      switch (sortBy) {
        case "price-asc":
          return priceA - priceB
        case "price-desc":
          return priceB - priceA
        case "company-asc":
          return a.insuranceCompany.name.localeCompare(b.insuranceCompany.name)
        case "company-desc":
          return b.insuranceCompany.name.localeCompare(a.insuranceCompany.name)
        default:
          return 0
      }
    })

  const uniqueCompanies = Array.from(
    new Set(offers.map((offer) => offer.insuranceCompany.id))
  ).map((id) => {
    const offer = offers.find((o) => o.insuranceCompany.id === id)
    return offer?.insuranceCompany
  }).filter(Boolean) as Array<{ id: string; name: string }>

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Oferty ({filteredAndSortedOffers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Szukaj po nazwie towarzystwa lub pakiecie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterByCompany} onValueChange={setFilterByCompany}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtruj po towarzystwie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie towarzystwa</SelectItem>
                {uniqueCompanies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Sortuj" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price-asc">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    Cena: od najtańszej
                  </div>
                </SelectItem>
                <SelectItem value="price-desc">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    Cena: od najdroższej
                  </div>
                </SelectItem>
                <SelectItem value="company-asc">Nazwa: A-Z</SelectItem>
                <SelectItem value="company-desc">Nazwa: Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredAndSortedOffers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Brak ofert spełniających kryteria wyszukiwania
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAndSortedOffers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  onSelect={onSelectOffer}
                  showSelectButton={showSelectButton}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

