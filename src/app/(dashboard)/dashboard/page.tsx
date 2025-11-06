import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, CheckSquare, Calendar, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) return null

  // Build where clause for client access
  const clientWhere = user.role === "ADMIN"
    ? {}
    : {
        OR: [
          { assignedTo: user.id },
          { sharedGroups: { some: { users: { some: { userId: user.id } } } } },
        ],
      }

  // Get statistics
  const [
    clientsCount,
    contactsCount,
    tasksCount,
    upcomingTasks,
    noContact7Days,
    noContact30Days,
    followUpToday,
  ] = await Promise.all([
    db.client.count({
      where: clientWhere,
    }),
    db.contact.count({
      where: { userId: user.id },
    }),
    db.task.count({
      where: {
        ...(user.role !== "ADMIN" && {
          OR: [
            { assignedTo: user.id },
            { sharedGroups: { some: { users: { some: { userId: user.id } } } } },
          ],
        }),
      },
    }),
    db.task.findMany({
      where: {
        assignedTo: user.id,
        status: { not: "COMPLETED" },
        dueDate: { gte: new Date() },
      },
      take: 5,
      orderBy: { dueDate: "asc" },
      include: { 
        client: { 
          select: { 
            id: true,
            firstName: true,
            lastName: true,
            agencyName: true 
          } 
        } 
      },
    }),
    // Klienci bez kontaktu przez 7 dni
    db.client.count({
      where: {
        ...clientWhere,
        OR: [
          { lastContactAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
          { lastContactAt: null },
        ],
      },
    }),
    // Klienci bez kontaktu przez 30 dni
    db.client.count({
      where: {
        ...clientWhere,
        OR: [
          { lastContactAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
          { lastContactAt: null },
        ],
      },
    }),
    // Klienci z follow-up dzisiaj
    db.client.count({
      where: {
        ...clientWhere,
        nextFollowUpAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    }),
  ])

  const stats = [
    {
      name: "Klienci",
      value: clientsCount,
      icon: Users,
      description: "Łączna liczba klientów",
    },
    {
      name: "Kontakty",
      value: contactsCount,
      icon: FileText,
      description: "Twoje interakcje",
    },
    {
      name: "Zadania",
      value: tasksCount,
      icon: CheckSquare,
      description: "Wszystkie zadania",
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Witaj, {user.name || user.email}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Zarządzanie leadami</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/clients?noContactDays=7">
              <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Bez kontaktu 7+ dni</p>
                      <p className="text-2xl font-bold">{noContact7Days}</p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/clients?noContactDays=30">
              <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Bez kontaktu 30+ dni</p>
                      <p className="text-2xl font-bold">{noContact30Days}</p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/clients?followUpToday=true">
              <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Follow-up dzisiaj</p>
                      <p className="text-2xl font-bold">{followUpToday}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nadchodzące zadania</CardTitle>
          <CardDescription>Zadania przypisane do Ciebie</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Brak nadchodzących zadań</p>
          ) : (
            <ul className="space-y-2">
              {upcomingTasks.map((task) => (
                <li key={task.id}>
                  <Link
                    href={`/tasks/${task.id}`}
                    className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{task.title}</p>
                      {task.client && (
                        <p className="text-sm text-muted-foreground">
                          {task.client.firstName} {task.client.lastName} {task.client.agencyName ? `(${task.client.agencyName})` : ""}
                        </p>
                      )}
                    </div>
                    {task.dueDate && (
                      <p className="text-sm text-muted-foreground">
                        {new Date(task.dueDate).toLocaleDateString("pl-PL")}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

