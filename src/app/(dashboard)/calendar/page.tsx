import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { TasksCalendar } from "@/components/tasks/tasks-calendar"

export default async function CalendarPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/signin")
  }

  // Fetch tasks for calendar view
  const tasks = await db.task.findMany({
    where:
      user.role === "ADMIN"
        ? {}
        : {
            OR: [
              { assignedTo: user.id },
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
            ],
          },
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
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Kalendarz</h1>
        <p className="text-muted-foreground mt-2">
          Przeglądaj zadania w widoku kalendarza
        </p>
      </div>
      <TasksCalendar tasks={tasks} users={users} clients={clients} groups={groups} currentUser={user} />
    </div>
  )
}

