import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react"

export default async function AdminHealthPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  // Fetch health status from API endpoint
  let health: any = null
  
  try {
    const headersList = await headers()
    const host = headersList.get("host") || "localhost:3000"
    const cookie = headersList.get("cookie") || ""
    const baseUrl = process.env.NEXTAUTH_URL || (host.includes("localhost") 
      ? "http://localhost:3000" 
      : `https://${host}`)
    
    const response = await fetch(`${baseUrl}/api/admin/health`, {
      cache: "no-store",
      headers: {
        Cookie: cookie,
      },
    })
    
    if (response.ok) {
      health = await response.json()
    }
  } catch (error: any) {
    console.error("[AdminHealthPage] Error fetching health status:", error)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ok":
      case "configured":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ok":
      case "configured":
        return "text-green-600"
      case "error":
        return "text-red-600"
      default:
        return "text-yellow-600"
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Status systemu</h1>
        <p className="text-muted-foreground mt-2">
          Health check systemu, bazy danych i integracji
        </p>
      </div>

      {health ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Ogólny status</span>
                <span className={`text-lg font-semibold ${getStatusColor(health.status)}`}>
                  {health.status === "ok" ? "Działa poprawnie" : health.status === "degraded" ? "Działa z ograniczeniami" : "Błąd"}
                </span>
              </CardTitle>
              <CardDescription>
                Wersja systemu: {health.version} | Ostatnia aktualizacja: {new Date(health.timestamp).toLocaleString("pl-PL")}
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(health.checks || {}).map(([key, check]: [string, any]) => (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {getStatusIcon(check.status)}
                    <span className="capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                  </CardTitle>
                  <CardDescription className={getStatusColor(check.status)}>
                    {check.message || check.status}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Nie udało się pobrać statusu systemu</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


