import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { checkFeature, FEATURE_KEYS } from "@/lib/feature-flags"

export default async function PoliciesPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/signin")
  }

  const hasInsuranceAgents = await checkFeature(user.id, FEATURE_KEYS.INSURANCE_AGENTS)
  if (!hasInsuranceAgents) {
    redirect("/dashboard")
  }

  const insuranceAgent = await db.insuranceAgent.findUnique({
    where: { userId: user.id },
  })

  if (!insuranceAgent || !insuranceAgent.isActive) {
    redirect("/dashboard")
  }

  // Get user with organizationId from database
  const userWithOrg = await db.user.findUnique({
    where: { id: user.id },
    select: { organizationId: true },
  })

  const policies = await db.policy.findMany({
    where: {
      organizationId: userWithOrg?.organizationId || undefined,
      agentId: user.id, // agentId w Policy to userId, nie insuranceAgent.id
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          companyName: true,
          type: true,
        },
      },
      vehicle: {
        select: {
          id: true,
          vin: true,
          registrationNumber: true,
        },
      },
      insuranceCompany: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
        },
      },
    },
  })

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Polisy</h1>
          <p className="text-muted-foreground mt-2">
            Zarządzaj polisami ubezpieczeniowymi
          </p>
        </div>
        <Button asChild>
          <Link href="/insurance-agent/policies/new">
            <Plus className="h-4 w-4 mr-2" />
            Nowa polisa
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista polis</CardTitle>
        </CardHeader>
        <CardContent>
          {policies.length === 0 ? (
            <p className="text-sm text-muted-foreground">Brak polis</p>
          ) : (
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
                          {policy.client?.type === 'COMPANY'
                            ? policy.client.companyName || 'Brak nazwy'
                            : `${policy.client?.firstName || ''} ${policy.client?.lastName || ''}`.trim() || 'Brak nazwy'}
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}

