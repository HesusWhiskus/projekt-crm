import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthHeader } from "@/components/auth-header"
import SignUpForm from "./signup-form"
import { db } from "@/lib/db"

// Force dynamic rendering to prevent static generation
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SignUpPage() {
  // Get system settings for branding
  let systemName = "Internal CRM"
  let systemLogo: string | null = null

  try {
    const [nameResult, logoResult] = await Promise.all([
      db.systemSettings.findUnique({ where: { key: "system_name" } }).catch(() => null),
      db.systemSettings.findUnique({ where: { key: "system_logo" } }).catch(() => null),
    ])

    if (nameResult?.value) {
      systemName = nameResult.value
    }
    if (logoResult?.value && logoResult.value.trim() !== "") {
      systemLogo = logoResult.value
    }
  } catch (error) {
    console.error("Error fetching system settings for signup page:", error)
    // Use defaults if error
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <AuthHeader systemName={systemName} systemLogo={systemLogo} />
          <CardTitle className="text-2xl text-center">Rejestracja</CardTitle>
          <CardDescription className="text-center">
            Utwórz nowe konto w systemie
          </CardDescription>
        </CardHeader>
        <SignUpForm />
      </Card>
    </div>
  )
}
