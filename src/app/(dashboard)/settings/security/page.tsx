import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SecuritySettings } from "@/components/settings/security-settings"

export default async function SecuritySettingsPage() {
  const sessionUser = await getCurrentUser()
  if (!sessionUser) {
    redirect("/signin")
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Bezpieczeństwo</h1>
        <p className="text-muted-foreground mt-2">
          Zarządzaj hasłem i bezpieczeństwem konta
        </p>
      </div>
      <SecuritySettings />
    </div>
  )
}

