import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { OrganizationsList } from "@/components/admin/organizations-list"

export default async function OrganizationsPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const organizations = await db.organization.findMany({
    include: {
      _count: {
        select: {
          users: true,
          clients: true,
          featureFlags: true,
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
        <h1 className="text-3xl font-bold">Organizacje</h1>
        <p className="text-muted-foreground mt-2">
          Zarządzaj organizacjami, planami i funkcjami
        </p>
      </div>
      <OrganizationsList organizations={organizations} />
    </div>
  )
}

