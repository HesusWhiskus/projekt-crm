import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { ClientDetail } from "@/components/clients/client-detail"

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
      deals: {
        orderBy: { updatedAt: "desc" },
        include: {
          sharedGroups: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      statusHistory: {
        orderBy: { changedAt: "desc" },
        include: {
          client: {
            select: {
              agencyName: true,
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

  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: {
      name: "asc",
    },
  })

  const groups = await db.group.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  })

  return <ClientDetail client={client} users={users} groups={groups} currentUser={user} />
}

