import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkFeature, FEATURE_KEYS } from "@/lib/feature-flags"
import { DashboardWidgets } from "@/components/dashboard/dashboard-widgets"
import { Users, FileText, CheckSquare, Calendar, Clock, AlertCircle, Shield, Car, TrendingUp } from "lucide-react"

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Witaj, {user.name || user.email}
        </p>
      </div>

      <DashboardWidgets
        stats={{
          clientsCount,
          contactsCount,
          tasksCount,
          noContact7Days,
          noContact30Days,
          followUpToday,
        }}
        upcomingTasks={upcomingTasks}
        insuranceStats={insuranceStats}
      />
    </div>
  )
}
