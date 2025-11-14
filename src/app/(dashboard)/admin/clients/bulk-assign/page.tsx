import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { BulkAssignClients } from "@/components/admin/bulk-assign-clients"
import { getCachedUsers } from "@/lib/cache"

export default async function BulkAssignClientsPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const [clients, users] = await Promise.all([
    db.client.findMany({
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        lastName: "asc",
      },
      take: 1000, // Limit for performance
    }),
    getCachedUsers(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Masowe przydzielanie klientów</h1>
        <p className="text-muted-foreground mt-2">
          Wybierz klientów i przypisz ich do wybranego użytkownika
        </p>
      </div>

      <BulkAssignClients clients={clients} users={users} />
    </div>
  )
}

