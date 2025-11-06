import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SettingsNav } from "@/components/settings/settings-nav"

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/signin")
  }

  // Serialize user data for client component
  const userData = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as "ADMIN" | "USER",
  }

  return (
    <div className="flex gap-8">
      <aside className="w-64 flex-shrink-0">
        <SettingsNav user={userData} />
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  )
}

