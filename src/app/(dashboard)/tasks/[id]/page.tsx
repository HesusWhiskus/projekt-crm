import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { TaskDetail } from "@/components/tasks/task-detail"
import { getCachedUsers, getCachedGroups } from "@/lib/cache"

export default async function TaskDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/signin")
  }

  const task = await db.task.findUnique({
    where: { id: params.id },
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
          firstName: true,
          lastName: true,
          firstName: true,
          lastName: true,
          companyName: true,
          type: true,
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
    },
  })

  if (!task) {
    redirect("/tasks")
  }

  // Check access
  if (
    user.role !== "ADMIN" &&
    task.assignedTo !== user.id &&
    !task.sharedGroups.some((g) =>
      g.users.some((ug) => ug.userId === user.id)
    )
  ) {
    redirect("/tasks")
  }

  const [users, groups, clients] = await Promise.all([
    getCachedUsers(),
    getCachedGroups(),
    db.client.findMany({
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
    }),
  ])

  return <TaskDetail task={task} users={users} clients={clients} groups={groups} currentUser={user} />
}

