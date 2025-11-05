import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { UsersList } from "@/components/admin/users-list"

export default async function AdminUsersPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const users = await db.user.findMany({
    include: {
      groups: {
        include: {
          group: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Zarządzanie użytkownikami</h1>
        <p className="text-muted-foreground mt-2">
          Zarządzaj użytkownikami systemu
        </p>
      </div>
      <UsersList users={users} />
    </div>
  )
}

