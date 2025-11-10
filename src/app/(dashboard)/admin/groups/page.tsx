import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { GroupsList } from "@/components/admin/groups-list"
import { getCachedUsers } from "@/lib/cache"

export default async function AdminGroupsPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const groups = await db.group.findMany({
    include: {
      users: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  const users = await getCachedUsers()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Zarządzanie grupami</h1>
        <p className="text-muted-foreground mt-2">
          Zarządzaj grupami użytkowników
        </p>
      </div>
      <GroupsList groups={groups} users={users} />
    </div>
  )
}

