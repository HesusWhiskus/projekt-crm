import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { checkFeature, FEATURE_KEYS } from "@/lib/feature-flags"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ReportsDashboard } from "@/components/reports/reports-dashboard"
import { db } from "@/lib/db"
import { ClientStatus } from "@prisma/client"

export default async function SalesReportPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/signin")
  }

  const hasAccess = await checkFeature(user.id, FEATURE_KEYS.ADVANCED_REPORTS)
  if (!hasAccess) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Raport sprzedażowy</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Funkcja niedostępna
            </CardTitle>
            <CardDescription>Zaawansowane raporty są dostępne tylko w planie PRO</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/pro-features">
              <Button>
                Zobacz funkcje PRO
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Build where clause for client access
  const clientWhere = user.role === "ADMIN"
    ? {}
    : {
        OR: [
          { assignedTo: user.id },
          { sharedGroups: { some: { users: { some: { userId: user.id } } } } },
        ],
      }

  // Get user with organizationId (not used but kept for future use)
  // const userWithOrg = await db.user.findUnique({
  //   where: { id: user.id },
  //   select: { organizationId: true },
  // })

  // Get clients grouped by status
  const statusCounts = await Promise.all([
    db.client.count({ where: { ...clientWhere, status: "NEW_LEAD" } }),
    db.client.count({ where: { ...clientWhere, status: "IN_CONTACT" } }),
    db.client.count({ where: { ...clientWhere, status: "DEMO_SENT" } }),
    db.client.count({ where: { ...clientWhere, status: "NEGOTIATION" } }),
    db.client.count({ where: { ...clientWhere, status: "ACTIVE_CLIENT" } }),
    db.client.count({ where: { ...clientWhere, status: "LOST" } }),
  ])

  const totalClients = statusCounts.reduce((sum, count) => sum + count, 0)
  const activeClients = statusCounts[4] // ACTIVE_CLIENT
  const newLeads = statusCounts[0] // NEW_LEAD

  // Calculate conversion rate (NEW_LEAD -> ACTIVE_CLIENT)
  const conversionRate = newLeads > 0 ? (activeClients / newLeads) * 100 : 0

  // Calculate average deal value (placeholder - would need actual deal values)
  const averageDealValue = 0 // TODO: Calculate from actual deals/transactions

  const salesFunnelData = [
    {
      status: "NEW_LEAD" as ClientStatus,
      count: statusCounts[0],
      percentage: totalClients > 0 ? (statusCounts[0] / totalClients) * 100 : 0,
    },
    {
      status: "IN_CONTACT" as ClientStatus,
      count: statusCounts[1],
      percentage: totalClients > 0 ? (statusCounts[1] / totalClients) * 100 : 0,
    },
    {
      status: "DEMO_SENT" as ClientStatus,
      count: statusCounts[2],
      percentage: totalClients > 0 ? (statusCounts[2] / totalClients) * 100 : 0,
    },
    {
      status: "NEGOTIATION" as ClientStatus,
      count: statusCounts[3],
      percentage: totalClients > 0 ? (statusCounts[3] / totalClients) * 100 : 0,
    },
    {
      status: "ACTIVE_CLIENT" as ClientStatus,
      count: statusCounts[4],
      percentage: totalClients > 0 ? (statusCounts[4] / totalClients) * 100 : 0,
    },
  ]

  return (
    <div className="space-y-8">
      <ReportsDashboard
        salesFunnelData={salesFunnelData}
        totalClients={totalClients}
        conversionRate={conversionRate}
        averageDealValue={averageDealValue}
      />
    </div>
  )
}

