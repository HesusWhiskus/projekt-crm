import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { ProfileSettings } from "@/components/settings/profile-settings"

export default async function ProfileSettingsPage() {
  const sessionUser = await getCurrentUser()
  if (!sessionUser) {
    redirect("/signin")
  }

  // Get full user data from database
  const user = await db.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      position: true,
    },
  })

  if (!user) {
    redirect("/signin")
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Profil</h1>
        <p className="text-muted-foreground mt-2">Zarządzaj swoimi danymi osobowymi</p>
      </div>
      <ProfileSettings user={user} />
    </div>
  )
}

