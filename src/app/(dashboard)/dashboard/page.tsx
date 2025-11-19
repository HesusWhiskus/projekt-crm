import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, CheckSquare, Calendar, Clock, AlertCircle, Shield, Car, TrendingUp } from "lucide-react"
import Link from "next/link"
import { checkFeature, FEATURE_KEYS } from "@/lib/feature-flags"

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) return null

  // Build where clause for client access
  const clientWhere = user.role === "ADMIN"
    ? {}
    : {
        OR: [
          { assignedTo: user.id },
          { sharedGroups: { some: { users: { some: { userId: user.id } } } } },
        ],
      }

  // Check if insurance agents feature is enabled and user is an active agent
  const hasInsuranceAgents = await checkFeature(user.id, FEATURE_KEYS.INSURANCE_AGENTS)
  let insuranceAgent = null
  let insuranceStats = null
  
  if (hasInsuranceAgents) {
    insuranceAgent = await db.insuranceAgent.findUnique({
      where: { userId: user.id },
      select: { id: true, isActive: true },
    })
    
    if (insuranceAgent?.isActive) {
      const userWithOrg = await db.user.findUnique({
        where: { id: user.id },
        select: { organizationId: true },
      })
      
      const where = {
        organizationId: userWithOrg?.organizationId || undefined,
        agentId: insuranceAgent.id,
      }
      
      const [
        calculationsCount,
        calculationsDraft,
        calculationsSent,
        calculationsAccepted,
        calculationsRejected,
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
        db.calculation.count({ where: { ...where, status: 'REJECTED' } }),
        db.policy.count({ where }),
        db.policy.count({ where: { ...where, status: 'ACTIVE' } }),
        db.policy.count({
          where: {
            ...where,
            status: 'ACTIVE',
            validTo: {
              gte: new Date(),
              lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
      
      insuranceStats = {
        calculationsCount,
        calculationsDraft,
        calculationsSent,
        calculationsAccepted,
        calculationsRejected,
        policiesCount,
        policiesActive,
        policiesExpiringSoon,
        vehiclesCount,
        recentCalculations,
        upcomingRenewals,
      }
    }
  }

  // Get statistics
  const [
    clientsCount,
    contactsCount,
    tasksCount,
    upcomingTasks,
    noContact7Days,
    noContact30Days,
    followUpToday,
  ] = await Promise.all([
    db.client.count({
      where: clientWhere,
    }),
    db.contact.count({
      where: { userId: user.id },
    }),
    db.task.count({
      where: {
        ...(user.role !== "ADMIN" && {
          OR: [
            { assignedTo: user.id },
            { sharedGroups: { some: { users: { some: { userId: user.id } } } } },
          ],
        }),
      },
    }),
    db.task.findMany({
      where: {
        assignedTo: user.id,
        status: { not: "COMPLETED" },
        dueDate: { gte: new Date() },
      },
      take: 5,
      orderBy: { dueDate: "asc" },
      include: { 
        client: { 
          select: { 
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            type: true 
          } 
        } 
      },
    }),
    // Klienci bez kontaktu przez 7 dni
    db.client.count({
      where: {
        AND: [
          clientWhere,
          {
            OR: [
              { lastContactAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
              { lastContactAt: null },
            ],
          },
        ],
      },
    }),
    // Klienci bez kontaktu przez 30 dni
    db.client.count({
      where: {
        AND: [
          clientWhere,
          {
            OR: [
              { lastContactAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
              { lastContactAt: null },
            ],
          },
        ],
      },
    }),
    // Klienci z follow-up dzisiaj
    db.client.count({
      where: {
        ...clientWhere,
        nextFollowUpAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    }),
  ])

  const stats = [
    {
      name: "Klienci",
      value: clientsCount,
      icon: Users,
      description: "Łączna liczba klientów",
    },
    {
      name: "Kontakty",
      value: contactsCount,
      icon: FileText,
      description: "Twoje interakcje",
    },
    {
      name: "Zadania",
      value: tasksCount,
      icon: CheckSquare,
      description: "Wszystkie zadania",
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Witaj, {user.name || user.email}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Zarządzanie leadami</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/clients?noContactDays=7">
              <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Bez kontaktu 7+ dni</p>
                      <p className="text-2xl font-bold">{noContact7Days}</p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/clients?noContactDays=30">
              <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Bez kontaktu 30+ dni</p>
                      <p className="text-2xl font-bold">{noContact30Days}</p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/clients?followUpToday=true">
              <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Follow-up dzisiaj</p>
                      <p className="text-2xl font-bold">{followUpToday}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nadchodzące zadania</CardTitle>
          <CardDescription>Zadania przypisane do Ciebie</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Brak nadchodzących zadań</p>
          ) : (
            <ul className="space-y-2">
              {upcomingTasks.map((task) => (
                <li key={task.id}>
                  <Link
                    href={`/tasks/${task.id}`}
                    className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{task.title}</p>
                      {task.client && (
                        <p className="text-sm text-muted-foreground">
                          {task.client.type === "COMPANY" ? (task.client.companyName || "Brak nazwy firmy") : `${task.client.firstName} ${task.client.lastName}`.trim() || "Brak nazwy"}
                        </p>
                      )}
                    </div>
                    {task.dueDate && (
                      <p className="text-sm text-muted-foreground">
                        {new Date(task.dueDate).toLocaleDateString("pl-PL")}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {insuranceStats && (
        <div className="pt-8 border-t">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Agenci ubezpieczeniowi</h2>
            <p className="text-muted-foreground mt-1">
              Statystyki i przegląd działań ubezpieczeniowych
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Kalkulacje</CardTitle>
                <FileText className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{insuranceStats.calculationsCount}</div>
                <p className="text-xs text-muted-foreground">Łączna liczba kalkulacji</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Polisy</CardTitle>
                <Shield className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{insuranceStats.policiesCount}</div>
                <p className="text-xs text-muted-foreground">Wystawione polisy</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pojazdy</CardTitle>
                <Car className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{insuranceStats.vehiclesCount}</div>
                <p className="text-xs text-muted-foreground">Zarządzane pojazdy</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Akceptacje</CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{insuranceStats.calculationsAccepted}</div>
                <p className="text-xs text-muted-foreground">Zaakceptowane kalkulacje</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Status kalkulacji</CardTitle>
                <CardDescription>Przegląd kalkulacji według statusu</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Szkice</span>
                    <span className="font-medium">{insuranceStats.calculationsDraft}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Wysłane</span>
                    <span className="font-medium">{insuranceStats.calculationsSent}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Zaakceptowane</span>
                    <span className="font-medium text-green-600">{insuranceStats.calculationsAccepted}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Odrzucone</span>
                    <span className="font-medium text-red-600">{insuranceStats.calculationsRejected}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Link
                    href="/insurance-agent/calculations"
                    className="text-sm text-primary hover:underline"
                  >
                    Zobacz wszystkie kalkulacje →
                  </Link>
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
                    <span className="font-medium text-green-600">{insuranceStats.policiesActive}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Wygasające w ciągu 30 dni</span>
                    <span className="font-medium text-orange-600">{insuranceStats.policiesExpiringSoon}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Link
                    href="/insurance-agent/policies"
                    className="text-sm text-primary hover:underline"
                  >
                    Zobacz wszystkie polisy →
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Ostatnie kalkulacje</CardTitle>
                <CardDescription>Najnowsze kalkulacje ubezpieczeniowe</CardDescription>
              </CardHeader>
              <CardContent>
                {insuranceStats.recentCalculations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Brak kalkulacji</p>
                ) : (
                  <div className="space-y-2">
                    {insuranceStats.recentCalculations.map((calculation) => (
                      <Link
                        key={calculation.id}
                        href={`/insurance-agent/calculations/${calculation.id}`}
                        className="flex items-center justify-between p-2 border rounded hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <p className="font-medium">
                            {calculation.client?.type === 'COMPANY'
                              ? calculation.client.companyName || 'Brak nazwy'
                              : `${calculation.client?.firstName || ''} ${calculation.client?.lastName || ''}`.trim() || 'Brak nazwy'}
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
                <div className="mt-4 pt-4 border-t">
                  <Link
                    href="/insurance-agent/calculations"
                    className="text-sm text-primary hover:underline"
                  >
                    Zobacz wszystkie →
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Nadchodzące odnowienia</CardTitle>
                <CardDescription>Polisy wymagające odnowienia w ciągu 30 dni</CardDescription>
              </CardHeader>
              <CardContent>
                {insuranceStats.upcomingRenewals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Brak polis wymagających odnowienia</p>
                ) : (
                  <div className="space-y-2">
                    {insuranceStats.upcomingRenewals.map((policy) => (
                      <Link
                        key={policy.id}
                        href={`/insurance-agent/policies/${policy.id}`}
                        className="flex items-center justify-between p-2 border rounded hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <p className="font-medium">
                            {policy.client?.type === 'COMPANY'
                              ? policy.client.companyName || 'Brak nazwy'
                              : `${policy.client?.firstName || ''} ${policy.client?.lastName || ''}`.trim() || 'Brak nazwy'}
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
                <div className="mt-4 pt-4 border-t">
                  <Link
                    href="/insurance-agent/policies"
                    className="text-sm text-primary hover:underline"
                  >
                    Zobacz wszystkie →
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

