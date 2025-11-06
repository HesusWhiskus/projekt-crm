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

  return (
    <div className="flex gap-8">
      <aside className="w-64 flex-shrink-0">
        <SettingsNav user={user} />
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  )
}

