import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Car, Shield, TrendingUp, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"
import { checkFeature, FEATURE_KEYS } from "@/lib/feature-flags"

export default async function InsuranceAgentDashboardPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/signin")
  }

  // Check if insurance agents feature is enabled
  const hasInsuranceAgents = await checkFeature(user.id, FEATURE_KEYS.INSURANCE_AGENTS)
  if (!hasInsuranceAgents) {
    redirect("/dashboard")
  }

  // Check if user is an insurance agent
  const insuranceAgent = await db.insuranceAgent.findUnique({
    where: { userId: user.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  if (!insuranceAgent || !insuranceAgent.isActive) {
    redirect("/dashboard")
  }

  // Get user with organizationId from database
  const userWithOrg = await db.user.findUnique({
    where: { id: user.id },
    select: { organizationId: true },
  })

  // Build where clause for access control
  const where = {
    organizationId: userWithOrg?.organizationId || undefined,
    agentId: user.id, // agentId w Calculation/Policy to userId, nie insuranceAgent.id
  }

  // Get statistics
  const [
    calculationsCount,
    calculationsDraft,
    calculationsSent,
    calculationsAccepted,
    policiesCount,
    policiesActive,
    policiesExpiringSoon,
    vehiclesCount,
    recentCalculations,
    upcomingRenewals,
  ] = await Promise.all([
    db.calculation.count({ where }),
    db.calculation.count({ where: { ...where, status: 'DRAFT' } }),
    db.calculation.count({ where: { ...where, status: 'SENT' } }),
    db.calculation.count({ where: { ...where, status: 'ACCEPTED' } }),
    db.policy.count({ where }),
    db.policy.count({ where: { ...where, status: 'ACTIVE' } }),
    db.policy.count({
      where: {
        ...where,
        status: 'ACTIVE',
        validTo: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
        },
      },
    }),
    db.vehicle.count({
      where: {
        organizationId: userWithOrg?.organizationId || undefined,
      },
    }),
    db.calculation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 5,
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
    }),
    db.policy.findMany({
      where: {
        ...where,
        status: 'ACTIVE',
        validTo: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { validTo: 'asc' },
      take: 5,
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
    }),
  ])

  const stats = [
    {
      name: "Kalkulacje",
      value: calculationsCount,
      icon: FileText,
      description: "Łączna liczba kalkulacji",
      color: "text-blue-500",
    },
    {
      name: "Polisy",
      value: policiesCount,
      icon: Shield,
      description: "Wystawione polisy",
      color: "text-green-500",
    },
    {
      name: "Pojazdy",
      value: vehiclesCount,
      icon: Car,
      description: "Zarządzane pojazdy",
      color: "text-purple-500",
    },
    {
      name: "Akceptacje",
      value: calculationsAccepted,
      icon: TrendingUp,
      description: "Zaakceptowane kalkulacje",
      color: "text-emerald-500",
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Agenta Ubezpieczeniowego</h1>
        <p className="text-muted-foreground mt-2">
          Witaj, {user.name || user.email}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status kalkulacji</CardTitle>
            <CardDescription>Przegląd kalkulacji według statusu</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Szkice</span>
                <span className="font-medium">{calculationsDraft}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Wysłane</span>
                <span className="font-medium">{calculationsSent}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Zaakceptowane</span>
                <span className="font-medium text-green-600">{calculationsAccepted}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Polisy</CardTitle>
            <CardDescription>Status polis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Aktywne</span>
                <span className="font-medium text-green-600">{policiesActive}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Wygasające w ciągu 30 dni</span>
                <span className="font-medium text-orange-600">{policiesExpiringSoon}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ostatnie kalkulacje</CardTitle>
          <CardDescription>Najnowsze kalkulacje ubezpieczeniowe</CardDescription>
        </CardHeader>
        <CardContent>
          {recentCalculations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Brak kalkulacji</p>
          ) : (
            <div className="space-y-2">
              {recentCalculations.map((calculation) => (
                <Link
                  key={calculation.id}
                  href={`/insurance-agent/calculations/${calculation.id}`}
                  className="flex items-center justify-between p-2 border rounded hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">
                      {calculation.client?.type === 'PERSON'
                        ? `${calculation.client?.firstName || ''} ${calculation.client?.lastName || ''}`.trim() || 'Brak nazwy'
                        : calculation.client?.companyName || 'Brak nazwy'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Status: {calculation.status} | 
                      {calculation.vehicle && ` Pojazd: ${calculation.vehicle.registrationNumber || calculation.vehicle.vin || 'Brak'}`}
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

      <Card>
        <CardHeader>
          <CardTitle>Nadchodzące odnowienia</CardTitle>
          <CardDescription>Polisy wymagające odnowienia w ciągu 30 dni</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingRenewals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Brak polis wymagających odnowienia</p>
          ) : (
            <div className="space-y-2">
              {upcomingRenewals.map((policy) => (
                <Link
                  key={policy.id}
                  href={`/insurance-agent/policies/${policy.id}`}
                  className="flex items-center justify-between p-2 border rounded hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">
                      {policy.client?.type === 'PERSON'
                        ? `${policy.client?.firstName || ''} ${policy.client?.lastName || ''}`.trim() || 'Brak nazwy'
                        : policy.client?.companyName || 'Brak nazwy'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Polisa: {policy.policyNumber} | 
                      {policy.insuranceCompany && ` TU: ${policy.insuranceCompany.name}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-orange-600">
                      Wygasa: {new Date(policy.validTo).toLocaleDateString('pl-PL')}
                    </p>
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

