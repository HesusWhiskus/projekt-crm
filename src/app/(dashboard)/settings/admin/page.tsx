import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { AdminSettings } from "@/components/settings/admin-settings"

export default async function AdminSettingsPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  // Get system settings (with error handling)
  let systemName = null
  let systemLogo = null
  let parsedColorScheme = null

  try {
    const [nameResult, logoResult, colorSchemeResult] = await Promise.all([
      db.systemSettings.findUnique({ where: { key: "system_name" } }).catch(() => null),
      db.systemSettings.findUnique({ where: { key: "system_logo" } }).catch(() => null),
      db.systemSettings.findUnique({ where: { key: "default_color_scheme" } }).catch(() => null),
    ])

    systemName = nameResult
    systemLogo = logoResult

    if (colorSchemeResult) {
      try {
        parsedColorScheme = JSON.parse(colorSchemeResult.value)
      } catch {
        // Invalid JSON, ignore
      }
    }
  } catch (error) {
    console.error("Error fetching system settings:", error)
    // Tables might not exist yet, continue with defaults
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

