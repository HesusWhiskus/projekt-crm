"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pagination } from "@/components/ui/pagination"
import { Button } from "@/components/ui/button"
import { List, Clock } from "lucide-react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { CalculationsTimeline } from "./calculations-timeline"

interface Calculation {
  id: string
  status: string
  value: number | null
  createdAt: string
  client?: {
    id: string
    firstName: string | null
    lastName: string | null
    companyName: string | null
    type: string
  } | null
  vehicle?: {
    id: string
    vin: string | null
    registrationNumber: string | null
  } | null
  offers?: Array<{
    id: string
    price: number | string
    insuranceCompany: {
      id: string
      name: string
      logoUrl: string | null
    }
  }>
}

interface CalculationsListProps {
  calculations: Calculation[]
  total: number
  page: number
  limit: number
  totalPages: number
  view?: string
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Szkic',
  SENT: 'Wysłane',
  ACCEPTED: 'Zaakceptowane',
  REJECTED: 'Odrzucone',
}

export function CalculationsList({ calculations, total, page, limit, totalPages, view = 'list' }: CalculationsListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleViewChange = (newView: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', newView)
    router.push(`/insurance-agent/calculations?${params.toString()}`)
  }

  const pagination = totalPages > 1 ? {
    page,
    limit,
    total,
    totalPages,
    hasMore: page * limit < total,
  } : null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Lista kalkulacji{pagination ? ` (${pagination.total})` : ''}</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={view === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => handleViewChange("list")}
              aria-label="Widok listy"
            >
              <List className="h-4 w-4 mr-2" />
              Lista
            </Button>
            <Button
              variant={view === "timeline" ? "default" : "outline"}
              size="sm"
              onClick={() => handleViewChange("timeline")}
              aria-label="Widok timeline"
            >
              <Clock className="h-4 w-4 mr-2" />
              Timeline
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {calculations.length === 0 ? (
          <p className="text-sm text-muted-foreground">Brak kalkulacji</p>
        ) : view === "timeline" ? (
          <CalculationsTimeline calculations={calculations} />
        ) : (
          <>
            <div className="space-y-2">
              {calculations.map((calculation) => {
                const value = calculation.value ? (typeof calculation.value === "number" ? calculation.value : Number(calculation.value)) : null;
                return (
                  <Link
                    key={calculation.id}
                    href={`/insurance-agent/calculations/${calculation.id}`}
                    className="flex items-center justify-between p-4 border rounded hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {calculation.client?.type === 'PERSON'
                            ? `${calculation.client?.firstName || ''} ${calculation.client?.lastName || ''}`.trim() || 'Brak nazwy'
                            : calculation.client?.companyName || 'Brak nazwy'}
                        </p>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[calculation.status] || 'bg-gray-100 text-gray-800'}`}>
                          {statusLabels[calculation.status] || calculation.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {calculation.vehicle && `Pojazd: ${calculation.vehicle.registrationNumber || calculation.vehicle.vin || 'Brak'}`}
                        {value && ` | Wartość: ${value.toFixed(2)} zł`}
                        {calculation.offers && calculation.offers.length > 0 && (() => {
                          const cheapestOffer = calculation.offers[0];
                          const offerPrice = typeof cheapestOffer.price === "number" ? cheapestOffer.price : Number(cheapestOffer.price);
                          return ` | Najtańsza oferta: ${cheapestOffer.insuranceCompany.name} - ${offerPrice.toFixed(2)} zł`;
                        })()}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(calculation.createdAt).toLocaleDateString('pl-PL')}
                    </span>
                  </Link>
                );
              })}
            </div>
            {pagination && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                limit={pagination.limit}
                basePath="/insurance-agent/calculations"
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

