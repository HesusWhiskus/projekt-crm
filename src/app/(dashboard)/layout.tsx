import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { DashboardNav } from "@/components/dashboard-nav"
import { db } from "@/lib/db"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const sessionUser = await getCurrentUser()

  if (!sessionUser) {
    redirect("/signin")
  }

  // Get full user data from database (to get latest name and position)
  const user = await db.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      position: true,
      // organizationId: true, // Skip organization relation to avoid migration issues
    },
  })

  if (!user) {
    redirect("/signin")
  }

  // Get system settings for branding (with error handling)
  let systemName = null
  let systemLogo = null
  let userPreferences = null
  let parsedDefaultColorScheme = null

  try {
    const [nameResult, logoResult, preferencesResult, colorSchemeResult] = await Promise.all([
      db.systemSettings.findUnique({ where: { key: "system_name" } }).catch(() => null),
      db.systemSettings.findUnique({ where: { key: "system_logo" } }).catch(() => null),
      db.userPreferences.findUnique({ where: { userId: user.id } }).catch(() => null),
      db.systemSettings.findUnique({ where: { key: "default_color_scheme" } }).catch(() => null),
    ])

    systemName = nameResult
    systemLogo = logoResult
    userPreferences = preferencesResult

    if (colorSchemeResult) {
      try {
        parsedDefaultColorScheme = JSON.parse(colorSchemeResult.value)
      } catch {
        // Invalid JSON, ignore
      }
    }
  } catch (error) {
    console.error("Error fetching settings:", error)
    // Tables might not exist yet, continue with defaults
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav
        user={user}
        systemName={systemName?.value || "Internal CRM"}
        systemLogo={systemLogo?.value || null}
        userColorScheme={userPreferences}
        defaultColorScheme={parsedDefaultColorScheme}
      />
      <main className="max-w-[98%] mx-auto px-4 py-6">{children}</main>
    </div>
  )
}

