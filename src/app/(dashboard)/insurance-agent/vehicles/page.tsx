import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { checkFeature, FEATURE_KEYS } from "@/lib/feature-flags"

export default async function VehiclesPage() {
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

  const vehicles = await db.vehicle.findMany({
    where: {
      organizationId: userWithOrg?.organizationId || undefined,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      owners: {
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
        },
      },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pojazdy</h1>
          <p className="text-muted-foreground mt-2">
            Zarządzaj pojazdami
          </p>
        </div>
        <Button asChild>
          <Link href="/insurance-agent/vehicles/new">
            <Plus className="h-4 w-4 mr-2" />
            Nowy pojazd
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista pojazdów</CardTitle>
        </CardHeader>
        <CardContent>
          {vehicles.length === 0 ? (
            <p className="text-sm text-muted-foreground">Brak pojazdów</p>
          ) : (
            <div className="space-y-2">
              {vehicles.map((vehicle) => (
                <Link
                  key={vehicle.id}
                  href={`/insurance-agent/vehicles/${vehicle.id}`}
                  className="flex items-center justify-between p-4 border rounded hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {vehicle.registrationNumber || vehicle.vin || 'Brak numeru'}
                      </p>
                      {vehicle.vin && (
                        <span className="text-xs text-muted-foreground">
                          VIN: {vehicle.vin}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Właściciele: {vehicle.owners.length > 0 
                        ? vehicle.owners.map(owner => 
                            owner.client.type === 'COMPANY'
                              ? owner.client.companyName || 'Brak nazwy'
                              : `${owner.client.firstName || ''} ${owner.client.lastName || ''}`.trim() || 'Brak nazwy'
                          ).join(', ')
                        : 'Brak'}
                    </p>
                    {vehicle.firstRegistrationDate && (
                      <p className="text-sm text-muted-foreground">
                        Data pierwszej rejestracji: {new Date(vehicle.firstRegistrationDate).toLocaleDateString('pl-PL')}
                      </p>
                    )}
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

