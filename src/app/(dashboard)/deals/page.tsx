import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { DealsList } from "@/components/deals/deals-list"

export default async function DealsPage({
  searchParams,
}: {
  searchParams: { clientId?: string; stage?: string; search?: string }
}) {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/signin")
  }

  // Fetch deals from API (we'll use direct DB query for now, but could use API)
  const where: any = {}

  if (user.role !== "ADMIN") {
    where.OR = [
      { client: { assignedTo: user.id } },
      { sharedGroups: { some: { users: { some: { userId: user.id } } } } },
    ]
  }

  if (searchParams.clientId) {
    where.clientId = searchParams.clientId
  }

  if (searchParams.stage) {
    where.stage = searchParams.stage
  }

  if (searchParams.search) {
    where.OR = [
      ...(where.OR || []),
      { notes: { contains: searchParams.search, mode: "insensitive" } },
      { client: { OR: [
        { firstName: { contains: searchParams.search, mode: "insensitive" } },
        { lastName: { contains: searchParams.search, mode: "insensitive" } },
        { agencyName: { contains: searchParams.search, mode: "insensitive" } },
      ] } },
    ]
  }

  const deals = await db.deal.findMany({
    where,
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          agencyName: true,
        },
      },
      sharedGroups: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  })

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
    <DealsList
      deals={deals.map(deal => ({
        ...deal,
        value: deal.value.toNumber(),
      }))}
      clients={clients}
      groups={groups}
      currentUser={user}
    />
  )
}

