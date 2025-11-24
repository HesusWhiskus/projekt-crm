"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pagination } from "@/components/ui/pagination"
import { Button } from "@/components/ui/button"
import { List, Clock } from "lucide-react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { PoliciesTimeline } from "./policies-timeline"

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

interface PoliciesListProps {
  policies: Policy[]
  total: number
  page: number
  limit: number
  totalPages: number
  view?: string
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

export function PoliciesList({ policies, total, page, limit, totalPages, view = 'list' }: PoliciesListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleViewChange = (newView: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', newView)
    router.push(`/insurance-agent/policies?${params.toString()}`)
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
          <CardTitle>Lista polis{pagination ? ` (${pagination.total})` : ''}</CardTitle>
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
        {policies.length === 0 ? (
          <p className="text-sm text-muted-foreground">Brak polis</p>
        ) : view === "timeline" ? (
          <PoliciesTimeline policies={policies} />
        ) : (
          <>
            <div className="space-y-2">
              {policies.map((policy) => {
                const isExpiringSoon = policy.status === 'ACTIVE' && 
                  new Date(policy.validTo) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) &&
                  new Date(policy.validTo) >= new Date()

                return (
                  <Link
                    key={policy.id}
                    href={`/insurance-agent/policies/${policy.id}`}
                    className="flex items-center justify-between p-4 border rounded hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {policy.client?.type === 'PERSON'
                            ? `${policy.client?.firstName || ''} ${policy.client?.lastName || ''}`.trim() || 'Brak nazwy'
                            : policy.client?.companyName || 'Brak nazwy'}
                        </p>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[policy.status] || 'bg-gray-100 text-gray-800'}`}>
                          {statusLabels[policy.status] || policy.status}
                        </span>
                        {isExpiringSoon && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
                            Wygasa wkrótce
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Polisa: {policy.policyNumber}
                        {policy.insuranceCompany && ` | TU: ${policy.insuranceCompany.name}`}
                        {policy.vehicle && ` | Pojazd: ${policy.vehicle.registrationNumber || policy.vehicle.vin || 'Brak'}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Ważna od: {new Date(policy.validFrom).toLocaleDateString('pl-PL')} do: {new Date(policy.validTo).toLocaleDateString('pl-PL')}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
            {pagination && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                limit={pagination.limit}
                basePath="/insurance-agent/policies"
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

