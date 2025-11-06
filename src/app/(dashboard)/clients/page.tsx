import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { ClientsList } from "@/components/clients/clients-list"

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: { status?: string; search?: string; assignedTo?: string; noContactDays?: string; followUpToday?: string }
}) {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/signin")
  }

  const where: any = {}
  const andConditions: any[] = []

  // Apply access control
  if (user.role !== "ADMIN") {
    andConditions.push({
      OR: [
        { assignedTo: user.id },
        { sharedGroups: { some: { users: { some: { userId: user.id } } } } },
      ]
    })
  }

  // Apply filters
  if (searchParams.status) {
    where.status = searchParams.status
  }

  if (searchParams.search) {
    andConditions.push({
      OR: [
        { agencyName: { contains: searchParams.search, mode: "insensitive" } },
        { firstName: { contains: searchParams.search, mode: "insensitive" } },
        { lastName: { contains: searchParams.search, mode: "insensitive" } },
        { email: { contains: searchParams.search, mode: "insensitive" } },
      ]
    })
  }

  if (searchParams.assignedTo) {
    where.assignedTo = searchParams.assignedTo
  }

  // Filter by noContactDays (clients without contact for X days)
  if (searchParams.noContactDays) {
    const days = parseInt(searchParams.noContactDays)
    if (!isNaN(days) && days > 0) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      cutoffDate.setHours(0, 0, 0, 0)
      
      andConditions.push({
        OR: [
          { lastContactAt: { lt: cutoffDate } },
          { lastContactAt: null }
        ]
      })
    }
  }

  // Filter by followUpToday (clients with follow-up today)
  if (searchParams.followUpToday === "true") {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    where.nextFollowUpAt = {
      gte: today,
      lt: tomorrow
    }
  }

  // Combine all AND conditions
  if (andConditions.length > 0) {
    where.AND = andConditions
  }

  const clients = await db.client.findMany({
    where,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      agencyName: true,
      email: true,
      phone: true,
      status: true,
      priority: true,
      lastContactAt: true,
      nextFollowUpAt: true,
      source: true,
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
        },
      },
      _count: {
        select: {
          contacts: true,
          tasks: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  })

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

  return <ClientsList clients={clients} users={users} groups={groups} currentUser={user} />
}

