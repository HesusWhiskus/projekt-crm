"use client"

import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Shield } from "lucide-react"
import Link from "next/link"
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns"
import { pl } from "date-fns/locale"

interface Policy {
  id: string
  policyNumber: string
  validFrom: string
  validTo: string
  status: string
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
  insuranceCompany?: {
    id: string
    name: string
    logoUrl: string | null
  } | null
}

interface PoliciesTimelineProps {
  policies: Policy[]
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  EXPIRED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
  RENEWED: 'bg-blue-100 text-blue-800',
}

const statusLabels: Record<string, string> = {
  ACTIVE: 'Aktywna',
  EXPIRED: 'Wygasła',
  CANCELLED: 'Anulowana',
  RENEWED: 'Odnowiona',
}

const groupPoliciesByDate = (policies: Policy[]) => {
  const groups: Record<string, Policy[]> = {
    today: [],
    yesterday: [],
    thisWeek: [],
    thisMonth: [],
    older: [],
  }

  policies.forEach((policy) => {
    const date = new Date(policy.createdAt)
    if (isToday(date)) {
      groups.today.push(policy)
    } else if (isYesterday(date)) {
      groups.yesterday.push(policy)
    } else if (isThisWeek(date)) {
      groups.thisWeek.push(policy)
    } else if (isThisMonth(date)) {
      groups.thisMonth.push(policy)
    } else {
      groups.older.push(policy)
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

export function PoliciesTimeline({ policies }: PoliciesTimelineProps) {
  const groupedPolicies = groupPoliciesByDate(policies)

  const getClientDisplayName = (client: Policy["client"]): string => {
    if (!client) return "Brak klienta"
    if (client.type === "COMPANY") {
      return client.companyName || "Brak nazwy firmy"
    }
    const name = [client.firstName, client.lastName].filter(Boolean).join(" ")
    return name || "Brak nazwy"
  }

  if (policies.length === 0) {
    return (
      <EmptyState
        icon={Shield}
        title="Brak polis"
        description="Historia polis pojawi się tutaj"
      />
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedPolicies).map(([group, groupPolicies]) => {
        if (groupPolicies.length === 0) return null

        return (
          <div key={group}>
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
              {getGroupLabel(group)}
            </h3>
            <div className="space-y-4">
              {groupPolicies.map((policy) => {
                const isExpiringSoon = policy.status === 'ACTIVE' && 
                  new Date(policy.validTo) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) &&
                  new Date(policy.validTo) >= new Date()

                return (
                  <div key={policy.id} className="relative pl-8">
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-border" />
                    <div className="absolute left-0 top-2 w-4 h-4 rounded-full bg-primary border-2 border-background" />
                    <Card className="ml-4">
                      <CardContent className="p-4">
                        <Link
                          href={`/insurance-agent/policies/${policy.id}`}
                          className="block hover:opacity-80 transition-opacity"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Shield className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  Polisa {policy.policyNumber}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[policy.status] || 'bg-gray-100 text-gray-800'}`}>
                                  {statusLabels[policy.status] || policy.status}
                                </span>
                                {isExpiringSoon && (
                                  <span className="px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                    Wygasa wkrótce
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground mb-2">
                                Utworzona: {format(new Date(policy.createdAt), "d MMMM yyyy, HH:mm", { locale: pl })}
                              </div>
                              <div className="text-sm mb-2">
                                <div className="flex items-center gap-4">
                                  <span className="text-muted-foreground">Klient:</span>
                                  <span className="font-medium">{getClientDisplayName(policy.client)}</span>
                                </div>
                                {policy.insuranceCompany && (
                                  <div className="flex items-center gap-4 mt-1">
                                    <span className="text-muted-foreground">TU:</span>
                                    <span>{policy.insuranceCompany.name}</span>
                                  </div>
                                )}
                                {policy.vehicle && (
                                  <div className="flex items-center gap-4 mt-1">
                                    <span className="text-muted-foreground">Pojazd:</span>
                                    <span>{policy.vehicle.registrationNumber || policy.vehicle.vin || 'Brak'}</span>
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Ważna od: {format(new Date(policy.validFrom), "d MMM yyyy", { locale: pl })} do: {format(new Date(policy.validTo), "d MMM yyyy", { locale: pl })}
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

