import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { PreferencesSettings } from "@/components/settings/preferences-settings"

export default async function PreferencesSettingsPage() {
  const sessionUser = await getCurrentUser()
  if (!sessionUser) {
    redirect("/signin")
  }

  // Get user preferences (with error handling)
  let preferences = null
  try {
    preferences = await db.userPreferences.findUnique({
      where: { userId: sessionUser.id },
    })
  } catch (error) {
    console.error("Error fetching user preferences:", error)
    // Table might not exist yet, continue with null
  }

  // Get system default color scheme (with error handling)
  let defaultColorScheme = null
  try {
    const systemColorScheme = await db.systemSettings.findUnique({
      where: { key: "default_color_scheme" },
    })

    if (systemColorScheme) {
      try {
        defaultColorScheme = JSON.parse(systemColorScheme.value)
      } catch {
        // Invalid JSON, ignore
      }
    }
  } catch (error) {
    console.error("Error fetching system color scheme:", error)
    // Table might not exist yet, continue with null
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

