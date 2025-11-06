import { redirect } from "next/navigation"

export default function SettingsPage() {
  // Redirect to profile by default
  redirect("/settings/profile")
}

