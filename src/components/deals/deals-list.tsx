"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { DealStage, UserRole } from "@prisma/client"
import { Plus, Search, TrendingUp } from "lucide-react"
import Link from "next/link"
import { DealForm } from "./deal-form"

interface Deal {
  id: string
  clientId: string
  value: number
  currency: string
  probability: number
  stage: DealStage
  expectedCloseDate: Date | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
  client: {
    id: string
    firstName: string
    lastName: string
    agencyName: string | null
  }
  sharedGroups: Array<{
    id: string
    name: string
  }>
}

interface DealsListProps {
  deals: Deal[]
  clients: Array<{
    id: string
    firstName: string
    lastName: string
    agencyName: string | null
  }>
  groups?: Array<{
    id: string
    name: string
  }>
  currentUser: {
    id: string
    role: UserRole
  }
}

const stageLabels: Record<DealStage, string> = {
  INITIAL_CONTACT: "Pierwszy kontakt",
  PROPOSAL: "Oferta",
  NEGOTIATION: "Negocjacje",
  CLOSING: "Zamykanie",
  WON: "Wygrany",
  LOST: "Przegrany",
}

const stageColors: Record<DealStage, string> = {
  INITIAL_CONTACT: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  PROPOSAL: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  NEGOTIATION: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  CLOSING: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  WON: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  LOST: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

export function DealsList({ deals, clients, groups, currentUser }: DealsListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isCreating, setIsCreating] = useState(false)
  const [filters, setFilters] = useState({
    clientId: searchParams.get("clientId") || "",
    stage: searchParams.get("stage") || "",
    search: searchParams.get("search") || "",
  })

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    const params = new URLSearchParams()
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    router.push(`/deals?${params.toString()}`)
  }

  const filteredDeals = deals.filter((deal) => {
    if (filters.clientId && deal.clientId !== filters.clientId) return false
    if (filters.stage && deal.stage !== filters.stage) return false
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesSearch =
        deal.notes?.toLowerCase().includes(searchLower) ||
        deal.client.firstName.toLowerCase().includes(searchLower) ||
        deal.client.lastName.toLowerCase().includes(searchLower) ||
        deal.client.agencyName?.toLowerCase().includes(searchLower)
      if (!matchesSearch) return false
    }
    return true
  })

  const totalValue = filteredDeals
    .filter((d) => d.stage !== "LOST")
    .reduce((sum, deal) => sum + deal.value, 0)

  const wonValue = filteredDeals
    .filter((d) => d.stage === "WON")
    .reduce((sum, deal) => sum + deal.value, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Deale</h1>
          <p className="text-muted-foreground mt-2">
            Zarządzanie ofertami sprzedażowymi
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Dodaj deal
        </Button>
      </div>

      {isCreating && (
        <DealForm
          clients={clients}
          groups={groups}
          currentUser={currentUser}
          onClose={() => setIsCreating(false)}
          onSuccess={() => {
            setIsCreating(false)
            router.refresh()
          }}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Statystyki</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Wszystkie deale</div>
              <div className="text-2xl font-bold">{filteredDeals.length}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Wartość aktywnych</div>
              <div className="text-2xl font-bold">
                {totalValue.toLocaleString("pl-PL", {
                  style: "currency",
                  currency: "PLN",
                })}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Wartość wygranych</div>
              <div className="text-2xl font-bold text-green-600">
                {wonValue.toLocaleString("pl-PL", {
                  style: "currency",
                  currency: "PLN",
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filtry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client">Klient</Label>
              <Select
                id="client"
                value={filters.clientId}
                onChange={(e) => handleFilterChange("clientId", e.target.value)}
              >
                <option value="">Wszyscy klienci</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.firstName} {client.lastName}
                    {client.agencyName ? ` (${client.agencyName})` : ""}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage">Etap</Label>
              <Select
                id="stage"
                value={filters.stage}
                onChange={(e) => handleFilterChange("stage", e.target.value)}
              >
                <option value="">Wszystkie etapy</option>
                {Object.entries(stageLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="search">Wyszukaj</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Szukaj po notatkach, kliencie..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista deali ({filteredDeals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDeals.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Brak deali spełniających kryteria
            </p>
          ) : (
            <div className="space-y-2">
              {filteredDeals.map((deal) => (
                <Link key={deal.id} href={`/deals/${deal.id}`}>
                  <div className="border rounded p-4 hover:bg-muted/50 cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          <span className="font-medium">
                            <Link
                              href={`/clients/${deal.client.id}`}
                              className="text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {deal.client.firstName} {deal.client.lastName}
                              {deal.client.agencyName ? ` (${deal.client.agencyName})` : ""}
                            </Link>
                          </span>
                        </div>
                        <div className="mt-2 flex items-center space-x-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Wartość: </span>
                            <span className="font-semibold">
                              {deal.value.toLocaleString("pl-PL", {
                                style: "currency",
                                currency: deal.currency || "PLN",
                              })}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Prawdopodobieństwo: </span>
                            <span className="font-semibold">{deal.probability}%</span>
                          </div>
                          {deal.expectedCloseDate && (
                            <div>
                              <span className="text-muted-foreground">Data zamknięcia: </span>
                              <span className="font-semibold">
                                {new Date(deal.expectedCloseDate).toLocaleDateString("pl-PL")}
                              </span>
                            </div>
                          )}
                        </div>
                        {deal.notes && (
                          <div className="mt-2 text-sm text-muted-foreground line-clamp-2">
                            {deal.notes}
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex flex-col items-end space-y-2">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${stageColors[deal.stage]}`}
                        >
                          {stageLabels[deal.stage]}
                        </span>
                        <div className="text-xs text-muted-foreground">
                          {new Date(deal.updatedAt).toLocaleDateString("pl-PL")}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

