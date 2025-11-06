import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { PreferencesSettings } from "@/components/settings/preferences-settings"

export default async function PreferencesSettingsPage() {
  const sessionUser = await getCurrentUser()
  if (!sessionUser) {
    redirect("/signin")
  }

  // Get user preferences
  const preferences = await db.userPreferences.findUnique({
    where: { userId: sessionUser.id },
  })

  // Get system default color scheme
  const systemColorScheme = await db.systemSettings.findUnique({
    where: { key: "default_color_scheme" },
  })

  let defaultColorScheme = null
  if (systemColorScheme) {
    try {
      defaultColorScheme = JSON.parse(systemColorScheme.value)
    } catch {
      // Invalid JSON, ignore
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Preferencje</h1>
        <p className="text-muted-foreground mt-2">
          Dostosuj wygląd i zachowanie aplikacji do swoich potrzeb
        </p>
      </div>
      <PreferencesSettings
        preferences={preferences}
        defaultColorScheme={defaultColorScheme}
      />
    </div>
  )
}

