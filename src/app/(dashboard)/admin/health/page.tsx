import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, XCircle, AlertCircle, Activity, Clock, TrendingUp, Zap } from "lucide-react"

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

          {/* Performance Metrics */}
          {health.performance && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Metryki wydajności</span>
                </CardTitle>
                <CardDescription>
                  Statystyki z ostatnich 24 godzin na podstawie logów aktywności
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Średni czas</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {health.performance.averageResponseTime}ms
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Średnia z {health.performance.totalRequests} żądań
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      <span>P95</span>
                    </div>
                    <div className={`text-2xl font-bold ${
                      health.performance.p95ResponseTime > 1000 ? "text-orange-600" : 
                      health.performance.p95ResponseTime > 2000 ? "text-red-600" : ""
                    }`}>
                      {health.performance.p95ResponseTime}ms
                    </div>
                    <div className="text-xs text-muted-foreground">
                      95% żądań poniżej
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      <span>P99</span>
                    </div>
                    <div className={`text-2xl font-bold ${
                      health.performance.p99ResponseTime > 2000 ? "text-red-600" : 
                      health.performance.p99ResponseTime > 1000 ? "text-orange-600" : ""
                    }`}>
                      {health.performance.p99ResponseTime}ms
                    </div>
                    <div className="text-xs text-muted-foreground">
                      99% żądań poniżej
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Activity className="h-4 w-4" />
                      <span>Łącznie</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {health.performance.totalRequests}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Żądań (24h)
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Zap className="h-4 w-4" />
                      <span>Ostatnia godzina</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {health.performance.requestsLastHour}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Żądań w ostatniej godzinie
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
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


