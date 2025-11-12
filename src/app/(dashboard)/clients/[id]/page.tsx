import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { ClientDetail } from "@/components/clients/client-detail"
import { getCachedUsers, getCachedGroups } from "@/lib/cache"
import { checkFeature, FEATURE_KEYS } from "@/lib/feature-flags"

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
    select: {
      id: true,
      firstName: true,
      lastName: true,
      type: true,
      email: true,
      phone: true,
      website: true,
      address: true,
      source: true,
      status: true,
      priority: true,
      assignedTo: true,
      lastContactAt: true,
      nextFollowUpAt: true,
      createdAt: true,
      updatedAt: true,
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
        select: {
          id: true,
          clientId: true,
          type: true,
          date: true,
          notes: true,
          isNote: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
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
        select: {
          id: true,
          title: true,
          description: true,
          dueDate: true,
          status: true,
          assignedTo: true,
          clientId: true,
          createdAt: true,
          updatedAt: true,
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
        select: {
          id: true,
          clientId: true,
          status: true,
          changedAt: true,
          changedBy: true,
          notes: true,
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

  const [users, groups, hasIntegrationTabs] = await Promise.all([
    getCachedUsers(),
    getCachedGroups(),
    checkFeature(user.id, FEATURE_KEYS.INTEGRATION_TABS),
  ])

  return (
    <ClientDetail
      client={client}
      users={users}
      groups={groups}
      currentUser={user}
      integrationTabsEnabled={hasIntegrationTabs}
    />
  )
}

