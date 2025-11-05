import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { ClientsList } from "@/components/clients/clients-list"

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: { status?: string; search?: string; assignedTo?: string }
}) {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/signin")
  }

  const where: any = {}

  // Apply access control
  if (user.role !== "ADMIN") {
    where.OR = [
      { assignedTo: user.id },
      { sharedGroups: { some: { users: { some: { userId: user.id } } } } },
    ]
  }

  // Apply filters
  if (searchParams.status) {
    where.status = searchParams.status
  }

  if (searchParams.search) {
    where.OR = [
      ...(where.OR || []),
      { agencyName: { contains: searchParams.search, mode: "insensitive" } },
      { firstName: { contains: searchParams.search, mode: "insensitive" } },
      { lastName: { contains: searchParams.search, mode: "insensitive" } },
      { email: { contains: searchParams.search, mode: "insensitive" } },
    ]
  }

  if (searchParams.assignedTo) {
    where.assignedTo = searchParams.assignedTo
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

