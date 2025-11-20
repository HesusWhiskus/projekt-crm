import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import dynamic from "next/dynamic"
import { getCachedUsers, getCachedGroups } from "@/lib/cache"
import { checkFeature, FEATURE_KEYS } from "@/lib/feature-flags"
import { Skeleton } from "@/components/ui/skeleton"

// Lazy load ClientDetail component
const ClientDetail = dynamic(
  () => import("@/components/clients/client-detail").then((mod) => ({ default: mod.ClientDetail })),
  {
    loading: () => (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    ),
    ssr: true, // Keep SSR for SEO and initial load performance
  }
)

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/signin")
  }

  const client = await db.client.findUnique({
    where: { id: params.id },
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      sharedGroups: {
        select: {
          id: true,
          name: true,
          users: {
            select: {
              userId: true,
            },
          },
        },
      },
      contacts: {
        orderBy: { date: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          attachments: true,
          sharedGroups: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      tasks: {
        orderBy: { dueDate: "asc" },
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      statusHistory: {
        orderBy: { changedAt: "desc" },
        include: {
          client: {
            select: {
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

  if (!client) {
    redirect("/clients")
  }

  // Check access
  if (
    user.role !== "ADMIN" &&
    client.assignedTo !== user.id &&
    !client.sharedGroups.some((g) =>
      g.users.some((ug) => ug.userId === user.id)
    )
  ) {
    redirect("/clients")
  }

  // Get user with organizationId from database
  const userWithOrg = await db.user.findUnique({
    where: { id: user.id },
    select: { organizationId: true },
  })

  const [users, groups, hasIntegrationTabs, hasInsuranceAgents] = await Promise.all([
    getCachedUsers(),
    getCachedGroups(),
    checkFeature(user.id, FEATURE_KEYS.INTEGRATION_TABS),
    checkFeature(user.id, FEATURE_KEYS.INSURANCE_AGENTS),
  ])

  // Fetch insurance-related data if feature is enabled
  let vehicles: any[] = []
  let calculations: any[] = []
  let policies: any[] = []

  if (hasInsuranceAgents) {
    const [vehiclesData, calculationsData, policiesData] = await Promise.all([
      db.vehicle.findMany({
        where: {
          organizationId: userWithOrg?.organizationId || undefined,
          owners: {
            some: {
              clientId: client.id,
            },
          },
        },
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
      }),
      db.calculation.findMany({
        where: {
          clientId: client.id,
          organizationId: userWithOrg?.organizationId || undefined,
        },
        orderBy: { createdAt: 'desc' },
        include: {
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
          clientId: client.id,
          organizationId: userWithOrg?.organizationId || undefined,
        },
        orderBy: { createdAt: 'desc' },
        include: {
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

    vehicles = vehiclesData
    calculations = calculationsData
    policies = policiesData
  }

  return (
    <ClientDetail
      client={client}
      users={users}
      groups={groups}
      currentUser={user}
      integrationTabsEnabled={hasIntegrationTabs}
      insuranceAgentsEnabled={hasInsuranceAgents}
      vehicles={vehicles}
      calculations={calculations}
      policies={policies}
    />
  )
}

