import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { AdminSettings } from "@/components/settings/admin-settings"

export default async function AdminSettingsPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  // Get system settings
  const [systemName, systemLogo, defaultColorScheme] = await Promise.all([
    db.systemSettings.findUnique({ where: { key: "system_name" } }),
    db.systemSettings.findUnique({ where: { key: "system_logo" } }),
    db.systemSettings.findUnique({ where: { key: "default_color_scheme" } }),
  ])

  let parsedColorScheme = null
  if (defaultColorScheme) {
    try {
      parsedColorScheme = JSON.parse(defaultColorScheme.value)
    } catch {
      // Invalid JSON, ignore
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Ustawienia systemowe</h1>
        <p className="text-muted-foreground mt-2">
          Zarządzaj ustawieniami systemu i personalizacją
        </p>
      </div>
      <AdminSettings
        systemName={systemName?.value || "Internal CRM"}
        systemLogo={systemLogo?.value || null}
        defaultColorScheme={parsedColorScheme}
      />
    </div>
  )
}

