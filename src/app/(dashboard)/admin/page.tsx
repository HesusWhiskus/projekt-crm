import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Settings, UserCheck, Shield, FileSpreadsheet, Building2, Flag } from "lucide-react"

export default async function AdminPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const [usersCount, groupsCount, organizationsCount] = await Promise.all([
    db.user.count(),
    db.group.count(),
    db.organization.count().catch(() => 0), // Ignore if table doesn't exist yet
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Panel administracyjny</h1>
        <p className="text-muted-foreground mt-2">
          Zarządzaj użytkownikami, grupami i uprawnieniami systemu
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/users">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Użytkownicy</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usersCount}</div>
              <p className="text-xs text-muted-foreground">Zarejestrowanych użytkowników</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/groups">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Grupy</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{groupsCount}</div>
              <p className="text-xs text-muted-foreground">Utworzonych grup</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/organizations">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Organizacje</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{organizationsCount}</div>
              <p className="text-xs text-muted-foreground">Zarejestrowanych organizacji</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/admin/import">
          <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileSpreadsheet className="h-5 w-5" />
                <span>Import danych z Excel</span>
              </CardTitle>
              <CardDescription>
                Masowy import klientów i kontaktów z plików Excel (.xlsx, .xls)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Import klientów z arkusza Excel</li>
                <li>• Import kontaktów z arkusza Excel</li>
                <li>• Automatyczne mapowanie kolumn</li>
                <li>• Aktualizacja istniejących danych</li>
              </ul>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}

