import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { ContactsList } from "@/components/contacts/contacts-list"

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: { type?: string; clientId?: string; userId?: string }
}) {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/signin")
  }

  const where: any = {}

  if (user.role !== "ADMIN") {
    where.OR = [
      {
        client: {
          OR: [
            { assignedTo: user.id },
            { sharedGroups: { some: { users: { some: { userId: user.id } } } } },
          ],
        },
      },
      {
        sharedGroups: {
          some: {
            users: {
              some: {
                userId: user.id,
              },
            },
          },
        },
      },
    ]
  }

  if (searchParams.type) {
    where.type = searchParams.type
  }

  if (searchParams.clientId) {
    where.clientId = searchParams.clientId
  }

  if (searchParams.userId) {
    where.userId = searchParams.userId
  }

  const contacts = await db.contact.findMany({
    where,
    include: {
      client: {
        select: {
          id: true,
          agencyName: true,
          firstName: true,
          lastName: true,
        },
      },
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
    orderBy: {
      date: "desc",
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

  return <ContactsList contacts={contacts} clients={clients} users={users} groups={groups} currentUser={user} />
}

