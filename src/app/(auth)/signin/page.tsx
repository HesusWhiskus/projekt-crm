import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthHeader } from "@/components/auth-header"
import SignInForm from "./signin-form"
import { db } from "@/lib/db"

// Force dynamic rendering to prevent static generation
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SignInPage() {
  // Get system settings for branding
  let systemName = "Internal CRM"
  let systemLogo: string | null = null

  console.log("[SignInPage] Starting to fetch system settings...")
  
  try {
    const [nameResult, logoResult] = await Promise.all([
      db.systemSettings.findUnique({ where: { key: "system_name" } }).catch((err) => {
        console.error("[SignInPage] Error fetching system_name:", err)
        return null
      }),
      db.systemSettings.findUnique({ where: { key: "system_logo" } }).catch((err) => {
        console.error("[SignInPage] Error fetching system_logo:", err)
        return null
      }),
    ])

    console.log("[SignInPage] nameResult:", nameResult)
    console.log("[SignInPage] logoResult:", logoResult ? "exists" : "null")

    if (nameResult?.value) {
      systemName = nameResult.value
      console.log("[SignInPage] Using system name from DB:", systemName)
    } else {
      console.log("[SignInPage] No system name in DB, using default:", systemName)
    }
    
    if (logoResult?.value && logoResult.value.trim() !== "") {
      systemLogo = logoResult.value
      console.log("[SignInPage] Logo found in DB")
    } else {
      console.log("[SignInPage] No logo in DB")
    }
  } catch (error) {
    console.error("[SignInPage] Error fetching system settings:", error)
    // Use defaults if error
  }

  console.log("[SignInPage] Final values - systemName:", systemName, "systemLogo:", systemLogo ? "exists" : "null")

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <AuthHeader systemName={systemName} systemLogo={systemLogo} />
          <CardTitle className="text-2xl text-center">Logowanie</CardTitle>
          <CardDescription className="text-center">
            Zaloguj się do systemu
          </CardDescription>
        </CardHeader>
        <Suspense
          fallback={
            <CardContent>
              <div className="text-center">Ładowanie...</div>
            </CardContent>
          }
        >
          <SignInForm />
        </Suspense>
      </Card>
    </div>
  )
}
