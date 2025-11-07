import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { DealDetail } from "@/components/deals/deal-detail"

export default async function DealDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/signin")
  }

  const deal = await db.deal.findUnique({
    where: { id: params.id },
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          agencyName: true,
          status: true,
        },
      },
      sharedGroups: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  if (!deal) {
    redirect("/deals")
  }

  // Check access - user must have access to the client
  const client = await db.client.findUnique({
    where: { id: deal.clientId },
    include: {
      assignee: {
        select: {
          id: true,
        },
      },
      sharedGroups: {
        select: {
          users: {
            select: {
              userId: true,
            },
          },
        },
      },
    },
  })

  if (!client) {
    redirect("/deals")
  }

  if (
    user.role !== "ADMIN" &&
    client.assignedTo !== user.id &&
    !client.sharedGroups.some((g) =>
      g.users.some((ug) => ug.userId === user.id)
    )
  ) {
    redirect("/deals")
  }

  const clients = await db.client.findMany({
    where:
      user.role === "ADMIN"
        ? {}
        : {
            OR: [
              { assignedTo: user.id },
              { sharedGroups: { some: { users: { some: { userId: user.id } } } } },
            ],
          },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      agencyName: true,
    },
    orderBy: {
      lastName: "asc",
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

  return (
    <DealDetail
      deal={{
        ...deal,
        value: deal.value.toNumber(),
      }}
      clients={clients}
      groups={groups}
      currentUser={user}
    />
  )
}

