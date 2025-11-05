import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { TasksList } from "@/components/tasks/tasks-list"

export default async function TasksPage({
  searchParams,
}: {
  searchParams: { status?: string; assignedTo?: string; view?: string }
}) {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/signin")
  }

  const where: any = {}

  if (user.role !== "ADMIN") {
    where.OR = [
      { assignedTo: user.id },
      { sharedGroups: { some: { users: { some: { userId: user.id } } } } },
    ]
  }

  if (searchParams.status) {
    where.status = searchParams.status
  }

  if (searchParams.assignedTo) {
    where.assignedTo = searchParams.assignedTo
  }

  const tasks = await db.task.findMany({
    where,
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      client: {
        select: {
          id: true,
          agencyName: true,
        },
      },
    },
    orderBy: {
      dueDate: "asc",
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
    <TasksList
      tasks={tasks}
      users={users}
      clients={clients}
      groups={groups}
      currentUser={user}
      view={searchParams.view || "list"}
    />
  )
}

