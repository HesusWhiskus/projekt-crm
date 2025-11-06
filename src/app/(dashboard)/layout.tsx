import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { DashboardNav } from "@/components/dashboard-nav"
import { db } from "@/lib/db"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/signin")
  }

  // Get system settings for branding
  const [systemName, systemLogo] = await Promise.all([
    db.systemSettings.findUnique({ where: { key: "system_name" } }),
    db.systemSettings.findUnique({ where: { key: "system_logo" } }),
  ])

  // Get user preferences for color scheme
  const userPreferences = await db.userPreferences.findUnique({
    where: { userId: user.id },
  })

  // Get default color scheme
  const defaultColorScheme = await db.systemSettings.findUnique({
    where: { key: "default_color_scheme" },
  })

  let parsedDefaultColorScheme = null
  if (defaultColorScheme) {
    try {
      parsedDefaultColorScheme = JSON.parse(defaultColorScheme.value)
    } catch {
      // Invalid JSON, ignore
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
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

