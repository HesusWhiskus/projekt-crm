"use client"

import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { FileCheck } from "lucide-react"
import Link from "next/link"
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns"
import { pl } from "date-fns/locale"

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

interface CalculationsTimelineProps {
  calculations: Calculation[]
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

const groupCalculationsByDate = (calculations: Calculation[]) => {
  const groups: Record<string, Calculation[]> = {
    today: [],
    yesterday: [],
    thisWeek: [],
    thisMonth: [],
    older: [],
  }

  calculations.forEach((calculation) => {
    const date = new Date(calculation.createdAt)
    if (isToday(date)) {
      groups.today.push(calculation)
    } else if (isYesterday(date)) {
      groups.yesterday.push(calculation)
    } else if (isThisWeek(date)) {
      groups.thisWeek.push(calculation)
    } else if (isThisMonth(date)) {
      groups.thisMonth.push(calculation)
    } else {
      groups.older.push(calculation)
    }
  })

  return groups
}

const getGroupLabel = (group: string): string => {
  switch (group) {
    case "today":
      return "Dzisiaj"
    case "yesterday":
      return "Wczoraj"
    case "thisWeek":
      return "Ten tydzień"
    case "thisMonth":
      return "Ten miesiąc"
    case "older":
      return "Starsze"
    default:
      return group
  }
}

export function CalculationsTimeline({ calculations }: CalculationsTimelineProps) {
  const groupedCalculations = groupCalculationsByDate(calculations)

  const getClientDisplayName = (client: Calculation["client"]): string => {
    if (!client) return "Brak klienta"
    if (client.type === "COMPANY") {
      return client.companyName || "Brak nazwy firmy"
    }
    const name = [client.firstName, client.lastName].filter(Boolean).join(" ")
    return name || "Brak nazwy"
  }

  if (calculations.length === 0) {
    return (
      <EmptyState
        icon={FileCheck}
        title="Brak kalkulacji"
        description="Historia kalkulacji pojawi się tutaj"
      />
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedCalculations).map(([group, groupCalculations]) => {
        if (groupCalculations.length === 0) return null

        return (
          <div key={group}>
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
              {getGroupLabel(group)}
            </h3>
            <div className="space-y-4">
              {groupCalculations.map((calculation) => {
                const value = calculation.value ? (typeof calculation.value === "number" ? calculation.value : Number(calculation.value)) : null

                return (
                  <div key={calculation.id} className="relative pl-8">
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-border" />
                    <div className="absolute left-0 top-2 w-4 h-4 rounded-full bg-primary border-2 border-background" />
                    <Card className="ml-4">
                      <CardContent className="p-4">
                        <Link
                          href={`/insurance-agent/calculations/${calculation.id}`}
                          className="block hover:opacity-80 transition-opacity"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <FileCheck className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  Kalkulacja #{calculation.id.slice(-8)}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[calculation.status] || 'bg-gray-100 text-gray-800'}`}>
                                  {statusLabels[calculation.status] || calculation.status}
                                </span>
                              </div>
                              <div className="text-sm text-muted-foreground mb-2">
                                Utworzona: {format(new Date(calculation.createdAt), "d MMMM yyyy, HH:mm", { locale: pl })}
                              </div>
                              <div className="text-sm mb-2">
                                <div className="flex items-center gap-4">
                                  <span className="text-muted-foreground">Klient:</span>
                                  <span className="font-medium">{getClientDisplayName(calculation.client)}</span>
                                </div>
                                {calculation.vehicle && (
                                  <div className="flex items-center gap-4 mt-1">
                                    <span className="text-muted-foreground">Pojazd:</span>
                                    <span>{calculation.vehicle.registrationNumber || calculation.vehicle.vin || 'Brak'}</span>
                                  </div>
                                )}
                                {value && (
                                  <div className="flex items-center gap-4 mt-1">
                                    <span className="text-muted-foreground">Wartość:</span>
                                    <span className="font-medium">{value.toFixed(2)} zł</span>
                                  </div>
                                )}
                                {calculation.offers && calculation.offers.length > 0 && (() => {
                                  const cheapestOffer = calculation.offers[0];
                                  const offerPrice = typeof cheapestOffer.price === "number" ? cheapestOffer.price : Number(cheapestOffer.price);
                                  return (
                                    <div className="flex items-center gap-4 mt-1">
                                      <span className="text-muted-foreground">Najtańsza oferta:</span>
                                      <span>{cheapestOffer.insuranceCompany.name} - {offerPrice.toFixed(2)} zł</span>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        </Link>
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

