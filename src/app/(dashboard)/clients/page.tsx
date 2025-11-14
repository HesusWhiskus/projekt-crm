import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { ClientsList } from "@/components/clients/clients-list"
import { getCachedUsers, getCachedGroups } from "@/lib/cache"

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: { 
    status?: string
    search?: string
    assignedTo?: string
    noContactDays?: string
    followUpToday?: string
    page?: string
    limit?: string
    sortBy?: string
    sortOrder?: string
    source?: string
    groupId?: string
  }
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
        { firstName: { contains: searchParams.search, mode: "insensitive" } },
        { lastName: { contains: searchParams.search, mode: "insensitive" } },
        { companyName: { contains: searchParams.search, mode: "insensitive" } },
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

  // Filter by source
  if (searchParams.source) {
    where.source = searchParams.source
  }

  // Filter by groupId
  if (searchParams.groupId) {
    andConditions.push({
      sharedGroups: {
        some: {
          id: searchParams.groupId
        }
      }
    })
  }

  // Combine all AND conditions
  if (andConditions.length > 0) {
    where.AND = andConditions
  }

  // Pagination
  const page = parseInt(searchParams.page || '1')
  const limit = parseInt(searchParams.limit || '50')
  const skip = (page - 1) * limit

  // Sortowanie
  const sortBy = searchParams.sortBy || 'updatedAt'
  const sortOrder = (searchParams.sortOrder === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc'
  
  const getOrderBy = (): any => {
    switch (sortBy) {
      case 'firstName':
        return { firstName: sortOrder }
      case 'lastName':
        return { lastName: sortOrder }
      case 'companyName':
        return { companyName: sortOrder }
      case 'email':
        return { email: sortOrder }
      case 'phone':
        return { phone: sortOrder }
      case 'status':
        return { status: sortOrder }
      case 'priority':
        return { priority: sortOrder }
      case 'assignee':
        return { assignee: { name: sortOrder } }
      case 'updatedAt':
      default:
        return { updatedAt: sortOrder }
    }
  }

  // Pobierz klientów i total count równolegle
  const [clients, total] = await Promise.all([
    db.client.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        companyName: true,
        type: true,
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
      orderBy: getOrderBy(),
      skip,
      take: limit,
    }),
    db.client.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)

  const [users, groups] = await Promise.all([
    getCachedUsers(),
    getCachedGroups(),
  ])

  return (
    <ClientsList 
      clients={clients} 
      users={users} 
      groups={groups} 
      currentUser={user}
      total={total}
      page={page}
      limit={limit}
      totalPages={totalPages}
    />
  )
}

