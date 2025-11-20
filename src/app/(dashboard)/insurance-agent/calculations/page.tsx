import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { checkFeature, FEATURE_KEYS } from "@/lib/feature-flags"

export default async function CalculationsPage() {
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

  const calculations = await db.calculation.findMany({
    where: {
      organizationId: userWithOrg?.organizationId || undefined,
      agentId: user.id, // agentId w Calculation to userId, nie insuranceAgent.id
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
    },
  })

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Kalkulacje</h1>
          <p className="text-muted-foreground mt-2">
            Zarządzaj kalkulacjami ubezpieczeniowymi
          </p>
        </div>
        <Button asChild>
          <Link href="/insurance-agent/calculations/new">
            <Plus className="h-4 w-4 mr-2" />
            Nowa kalkulacja
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista kalkulacji</CardTitle>
        </CardHeader>
        <CardContent>
          {calculations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Brak kalkulacji</p>
          ) : (
            <div className="space-y-2">
              {calculations.map((calculation) => (
                <Link
                  key={calculation.id}
                  href={`/insurance-agent/calculations/${calculation.id}`}
                  className="flex items-center justify-between p-4 border rounded hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {calculation.client?.type === 'COMPANY'
                          ? calculation.client.companyName || 'Brak nazwy'
                          : `${calculation.client?.firstName || ''} ${calculation.client?.lastName || ''}`.trim() || 'Brak nazwy'}
                      </p>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[calculation.status] || 'bg-gray-100 text-gray-800'}`}>
                        {statusLabels[calculation.status] || calculation.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {calculation.vehicle && `Pojazd: ${calculation.vehicle.registrationNumber || calculation.vehicle.vin || 'Brak'}`}
                      {calculation.value && ` | Wartość: ${calculation.value.toFixed(2)} zł`}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(calculation.createdAt).toLocaleDateString('pl-PL')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

