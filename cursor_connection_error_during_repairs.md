# Connection error during repairs
_Exported on 11/20/2025 at 16:04:14 GMT+1 from Cursor (2.0.77)_

---

**User**

Znowu błąd connection error w trakcie napraw, historię masz w cursor_problem_z_zawieszeniem_podczas_n

---

**Cursor**


Sprawdzam historię problemu w pliku z historią.



Przeszukuję plik historii pod kątem "connection error" i sprawdzam ostatnie wpisy:



Czytam początek pliku historii, aby zrozumieć kontekst:



Szukam miejsc, gdzie wyświetlany jest błąd połączenia:



Sprawdzam komponenty frontendowe wyświetlające błędy połączenia, szczególnie w kontekście health check:



Sprawdzam pełny kod strony health, aby zobaczyć, jak obsługiwane są błędy:



Problem: brak timeoutu w `fetch` i brak szczegółowej obsługi błędów. Dodaję timeout do `fetch` i lepszą obsługę błędów:



Naprawiam problem z timeoutem: dodaję timeout do `fetch` w frontendzie i timeouty do zapytań do bazy danych w endpoincie health.


```typescriptreact
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
  let errorMessage: string | null = null
  
  try {
    const headersList = await headers()
    const host = headersList.get("host") || "localhost:3000"
    const cookie = headersList.get("cookie") || ""
    const baseUrl = process.env.NEXTAUTH_URL || (host.includes("localhost") 
      ? "http://localhost:3000" 
      : `https://${host}`)
    
    // Add timeout to prevent hanging (10 seconds)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    try {
      const response = await fetch(`${baseUrl}/api/admin/health`, {
        cache: "no-store",
        headers: {
          Cookie: cookie,
        },
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        health = await response.json()
      } else {
        errorMessage = `Błąd HTTP ${response.status}: ${response.statusText}`
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        errorMessage = "Timeout: Zapytanie przekroczyło limit czasu (10 sekund). Endpoint health check może być przeciążony."
      } else {
        errorMessage = `Błąd połączenia: ${fetchError.message || "Nie udało się połączyć z serwerem"}`
      }
      throw fetchError
    }
  } catch (error: any) {
    console.error("[AdminHealthPage] Error fetching health status:", error)
    if (!errorMessage) {
      errorMessage = `Błąd: ${error.message || "Nieznany błąd podczas pobierania statusu systemu"}`
    }
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



```

```typescriptreact
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
  let errorMessage: string | null = null
  
  try {
    const headersList = await headers()
    const host = headersList.get("host") || "localhost:3000"
    const cookie = headersList.get("cookie") || ""
    const baseUrl = process.env.NEXTAUTH_URL || (host.includes("localhost") 
      ? "http://localhost:3000" 
      : `https://${host}`)
    
    // Add timeout to prevent hanging (10 seconds)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    try {
      const response = await fetch(`${baseUrl}/api/admin/health`, {
        cache: "no-store",
        headers: {
          Cookie: cookie,
        },
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        health = await response.json()
      } else {
        errorMessage = `Błąd HTTP ${response.status}: ${response.statusText}`
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        errorMessage = "Timeout: Zapytanie przekroczyło limit czasu (10 sekund). Endpoint health check może być przeciążony."
      } else {
        errorMessage = `Błąd połączenia: ${fetchError.message || "Nie udało się połączyć z serwerem"}`
      }
      throw fetchError
    }
  } catch (error: any) {
    console.error("[AdminHealthPage] Error fetching health status:", error)
    if (!errorMessage) {
      errorMessage = `Błąd: ${error.message || "Nieznany błąd podczas pobierania statusu systemu"}`
    }
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
            <div className="space-y-2">
              <p className="text-destructive font-semibold">Nie udało się pobrać statusu systemu</p>
              {errorMessage && (
                <p className="text-sm text-muted-foreground">{errorMessage}</p>
              )}
              <p className="text-xs text-muted-foreground mt-4">
                Możliwe przyczyny: przeciążenie serwera, problemy z bazą danych lub timeout połączenia.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}



```


Dodaję timeouty do zapytań do bazy danych w endpoincie health:


```typescript
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { readFileSync } from "fs"
import { join } from "path"

export async function GET() {
  const user = await getCurrentUser()
  
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Read version - prefer environment variable, fallback to package.json
  let version = "unknown"
  try {
    // First try environment variable (set in Railway/deployment)
    version = process.env.APP_VERSION || process.env.npm_package_version || "unknown"
    
    // If not set, try reading from package.json (may not work in standalone build)
    if (version === "unknown") {
      try {
        const packageJsonPath = join(process.cwd(), "package.json")
        const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"))
        version = packageJson.version || "unknown"
      } catch (fileError) {
        // Silently fail - package.json may not be available in standalone build
        // This is expected in production deployments
      }
    }
  } catch (error) {
    // Silently fail - version is not critical for health check
    console.error("[Health Endpoint] Error reading version:", error)
  }

  const health: {
    status: string
    timestamp: string
    version: string
    checks: {
      database: { status: string; message: string }
      api: { status: string; message: string }
      googleCalendar?: { status: string; message: string }
    }
    performance?: {
      averageResponseTime: number
      p95ResponseTime: number
      p99ResponseTime: number
      totalRequests: number
      requestsLastHour: number
    }
  } = {
    status: "ok",
    timestamp: new Date().toISOString(),
    version,
    checks: {
      database: {
        status: "unknown",
        message: "",
      },
      api: {
        status: "ok",
        message: "API endpoint responding",
      },
    },
  }

  // Check database connection with timeout (5 seconds)
  try {
    const dbCheckPromise = db.$queryRaw`SELECT 1`
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Database query timeout (5s)")), 5000)
    )
    
    await Promise.race([dbCheckPromise, timeoutPromise])
    health.checks.database.status = "ok"
    health.checks.database.message = "Database connection successful"
  } catch (error: any) {
    health.checks.database.status = "error"
    health.checks.database.message = error?.message || "Database connection failed"
    health.status = "degraded"
  }

  // Check Google Calendar integration (if configured)
  const hasGoogleCalendar = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET
  if (hasGoogleCalendar) {
    health.checks.googleCalendar = {
      status: "configured",
      message: "Google Calendar credentials configured",
    }
  }

  // Calculate performance metrics from activity logs
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    // Get recent API activity logs
    const recentLogs = await db.activityLog.findMany({
      where: {
        createdAt: { gte: last24Hours },
      },
      select: {
        details: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 1000, // Limit to last 1000 requests for performance
    })

    if (recentLogs.length > 0) {
      // Filter logs that have responseTimeMs in details
      const logsWithResponseTime = recentLogs.filter((log) => {
        const details = log.details as any
        return details?.responseTimeMs && typeof details.responseTimeMs === 'number' && details.responseTimeMs > 0
      })

      if (logsWithResponseTime.length > 0) {
        const responseTimes = logsWithResponseTime
          .map((log) => {
            const details = log.details as any
            return details.responseTimeMs as number
          })
          .sort((a, b) => a - b)

        if (responseTimes.length > 0) {
          const total = responseTimes.reduce((sum, time) => sum + time, 0)
          const average = Math.round(total / responseTimes.length)
          const p95Index = Math.floor(responseTimes.length * 0.95)
          const p99Index = Math.floor(responseTimes.length * 0.99)
          
          const requestsLastHour = logsWithResponseTime.filter(
            (log) => log.createdAt >= oneHourAgo
          ).length

          health.performance = {
            averageResponseTime: average,
            p95ResponseTime: responseTimes[p95Index] || average,
            p99ResponseTime: responseTimes[p99Index] || average,
            totalRequests: logsWithResponseTime.length,
            requestsLastHour,
          }
        }
      }
    }
  } catch (error) {
    console.error("[Health Endpoint] Error calculating performance metrics:", error)
    // Don't fail health check if performance metrics fail
  }

  return NextResponse.json(health, { 
    status: health.status === "ok" ? 200 : 503 
  })
}


```

```typescript
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { readFileSync } from "fs"
import { join } from "path"

export async function GET() {
  const user = await getCurrentUser()
  
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Read version - prefer environment variable, fallback to package.json
  let version = "unknown"
  try {
    // First try environment variable (set in Railway/deployment)
    version = process.env.APP_VERSION || process.env.npm_package_version || "unknown"
    
    // If not set, try reading from package.json (may not work in standalone build)
    if (version === "unknown") {
      try {
        const packageJsonPath = join(process.cwd(), "package.json")
        const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"))
        version = packageJson.version || "unknown"
      } catch (fileError) {
        // Silently fail - package.json may not be available in standalone build
        // This is expected in production deployments
      }
    }
  } catch (error) {
    // Silently fail - version is not critical for health check
    console.error("[Health Endpoint] Error reading version:", error)
  }

  const health: {
    status: string
    timestamp: string
    version: string
    checks: {
      database: { status: string; message: string }
      api: { status: string; message: string }
      googleCalendar?: { status: string; message: string }
    }
    performance?: {
      averageResponseTime: number
      p95ResponseTime: number
      p99ResponseTime: number
      totalRequests: number
      requestsLastHour: number
    }
  } = {
    status: "ok",
    timestamp: new Date().toISOString(),
    version,
    checks: {
      database: {
        status: "unknown",
        message: "",
      },
      api: {
        status: "ok",
        message: "API endpoint responding",
      },
    },
  }

  // Check database connection with timeout (5 seconds)
  try {
    const dbCheckPromise = db.$queryRaw`SELECT 1`
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Database query timeout (5s)")), 5000)
    )
    
    await Promise.race([dbCheckPromise, timeoutPromise])
    health.checks.database.status = "ok"
    health.checks.database.message = "Database connection successful"
  } catch (error: any) {
    health.checks.database.status = "error"
    health.checks.database.message = error?.message || "Database connection failed"
    health.status = "degraded"
  }

  // Check Google Calendar integration (if configured)
  const hasGoogleCalendar = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET
  if (hasGoogleCalendar) {
    health.checks.googleCalendar = {
      status: "configured",
      message: "Google Calendar credentials configured",
    }
  }

  // Calculate performance metrics from activity logs with timeout (8 seconds)
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    // Get recent API activity logs with timeout
    const logsPromise = db.activityLog.findMany({
      where: {
        createdAt: { gte: last24Hours },
      },
      select: {
        details: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 500, // Reduced from 1000 to 500 for better performance
    })
    
    const timeoutPromise = new Promise<any[]>((_, reject) => 
      setTimeout(() => reject(new Error("Performance metrics query timeout (8s)")), 8000)
    )
    
    const recentLogs = await Promise.race([logsPromise, timeoutPromise])

    if (recentLogs.length > 0) {
      // Filter logs that have responseTimeMs in details
      const logsWithResponseTime = recentLogs.filter((log) => {
        const details = log.details as any
        return details?.responseTimeMs && typeof details.responseTimeMs === 'number' && details.responseTimeMs > 0
      })

      if (logsWithResponseTime.length > 0) {
        const responseTimes = logsWithResponseTime
          .map((log) => {
            const details = log.details as any
            return details.responseTimeMs as number
          })
          .sort((a, b) => a - b)

        if (responseTimes.length > 0) {
          const total = responseTimes.reduce((sum, time) => sum + time, 0)
          const average = Math.round(total / responseTimes.length)
          const p95Index = Math.floor(responseTimes.length * 0.95)
          const p99Index = Math.floor(responseTimes.length * 0.99)
          
          const requestsLastHour = logsWithResponseTime.filter(
            (log) => log.createdAt >= oneHourAgo
          ).length

          health.performance = {
            averageResponseTime: average,
            p95ResponseTime: responseTimes[p95Index] || average,
            p99ResponseTime: responseTimes[p99Index] || average,
            totalRequests: logsWithResponseTime.length,
            requestsLastHour,
          }
        }
      }
    }
  } catch (error) {
    console.error("[Health Endpoint] Error calculating performance metrics:", error)
    // Don't fail health check if performance metrics fail
  }

  return NextResponse.json(health, { 
    status: health.status === "ok" ? 200 : 503 
  })
}


```

---

**User**

Hej, moment! bład connection error był Ciebie, tj cursora... ja Ci podałem historię nad czym pracowałeś.

---

**Cursor**


Przepraszam za zamieszanie. Błąd był po mojej stronie (Cursor się zawiesił). Sprawdzam historię, aby kontynuować pracę:



Sprawdzam aktualny stan pliku i kontynuuję naprawę:



Sprawdzam, co było w trakcie pracy przed zawieszeniem:



Sprawdzam błędy składniowe i lintowania:



Uruchamiam build w PowerShell:



Build kompiluje się poprawnie. Zmiany związane z timeoutami zostały dodane, ale jeśli problem był tylko po stronie Cursora, mogę je cofnąć. Sprawdzam, czy w historii była konkretna praca do kontynuacji:



Sprawdzam, czy dodane timeouty mogą powodować problemy. Cofam je i przywracam kod do stanu sprzed zawieszenia:



Cofam dodane timeouty i przywracam kod do stanu sprzed zawieszenia. Timeouty mogą powodować problemy z deployem.


```typescript
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { readFileSync } from "fs"
import { join } from "path"

export async function GET() {
  const user = await getCurrentUser()
  
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Read version - prefer environment variable, fallback to package.json
  let version = "unknown"
  try {
    // First try environment variable (set in Railway/deployment)
    version = process.env.APP_VERSION || process.env.npm_package_version || "unknown"
    
    // If not set, try reading from package.json (may not work in standalone build)
    if (version === "unknown") {
      try {
        const packageJsonPath = join(process.cwd(), "package.json")
        const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"))
        version = packageJson.version || "unknown"
      } catch (fileError) {
        // Silently fail - package.json may not be available in standalone build
        // This is expected in production deployments
      }
    }
  } catch (error) {
    // Silently fail - version is not critical for health check
    console.error("[Health Endpoint] Error reading version:", error)
  }

  const health: {
    status: string
    timestamp: string
    version: string
    checks: {
      database: { status: string; message: string }
      api: { status: string; message: string }
      googleCalendar?: { status: string; message: string }
    }
    performance?: {
      averageResponseTime: number
      p95ResponseTime: number
      p99ResponseTime: number
      totalRequests: number
      requestsLastHour: number
    }
  } = {
    status: "ok",
    timestamp: new Date().toISOString(),
    version,
    checks: {
      database: {
        status: "unknown",
        message: "",
      },
      api: {
        status: "ok",
        message: "API endpoint responding",
      },
    },
  }

  // Check database connection
  try {
    await db.$queryRaw`SELECT 1`
    health.checks.database.status = "ok"
    health.checks.database.message = "Database connection successful"
  } catch (error: any) {
    health.checks.database.status = "error"
    health.checks.database.message = error?.message || "Database connection failed"
    health.status = "degraded"
  }

  // Check Google Calendar integration (if configured)
  const hasGoogleCalendar = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET
  if (hasGoogleCalendar) {
    health.checks.googleCalendar = {
      status: "configured",
      message: "Google Calendar credentials configured",
    }
  }

  // Calculate performance metrics from activity logs with timeout (8 seconds)
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    // Get recent API activity logs with timeout
    const logsPromise = db.activityLog.findMany({
      where: {
        createdAt: { gte: last24Hours },
      },
      select: {
        details: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 500, // Reduced from 1000 to 500 for better performance
    })
    
    const timeoutPromise = new Promise<any[]>((_, reject) => 
      setTimeout(() => reject(new Error("Performance metrics query timeout (8s)")), 8000)
    )
    
    const recentLogs = await Promise.race([logsPromise, timeoutPromise])

    if (recentLogs.length > 0) {
      // Filter logs that have responseTimeMs in details
      const logsWithResponseTime = recentLogs.filter((log) => {
        const details = log.details as any
        return details?.responseTimeMs && typeof details.responseTimeMs === 'number' && details.responseTimeMs > 0
      })

      if (logsWithResponseTime.length > 0) {
        const responseTimes = logsWithResponseTime
          .map((log) => {
            const details = log.details as any
            return details.responseTimeMs as number
          })
          .sort((a, b) => a - b)

        if (responseTimes.length > 0) {
          const total = responseTimes.reduce((sum, time) => sum + time, 0)
          const average = Math.round(total / responseTimes.length)
          const p95Index = Math.floor(responseTimes.length * 0.95)
          const p99Index = Math.floor(responseTimes.length * 0.99)
          
          const requestsLastHour = logsWithResponseTime.filter(
            (log) => log.createdAt >= oneHourAgo
          ).length

          health.performance = {
            averageResponseTime: average,
            p95ResponseTime: responseTimes[p95Index] || average,
            p99ResponseTime: responseTimes[p99Index] || average,
            totalRequests: logsWithResponseTime.length,
            requestsLastHour,
          }
        }
      }
    }
  } catch (error) {
    console.error("[Health Endpoint] Error calculating performance metrics:", error)
    // Don't fail health check if performance metrics fail
  }

  return NextResponse.json(health, { 
    status: health.status === "ok" ? 200 : 503 
  })
}


```

```typescript
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { readFileSync } from "fs"
import { join } from "path"

export async function GET() {
  const user = await getCurrentUser()
  
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Read version - prefer environment variable, fallback to package.json
  let version = "unknown"
  try {
    // First try environment variable (set in Railway/deployment)
    version = process.env.APP_VERSION || process.env.npm_package_version || "unknown"
    
    // If not set, try reading from package.json (may not work in standalone build)
    if (version === "unknown") {
      try {
        const packageJsonPath = join(process.cwd(), "package.json")
        const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"))
        version = packageJson.version || "unknown"
      } catch (fileError) {
        // Silently fail - package.json may not be available in standalone build
        // This is expected in production deployments
      }
    }
  } catch (error) {
    // Silently fail - version is not critical for health check
    console.error("[Health Endpoint] Error reading version:", error)
  }

  const health: {
    status: string
    timestamp: string
    version: string
    checks: {
      database: { status: string; message: string }
      api: { status: string; message: string }
      googleCalendar?: { status: string; message: string }
    }
    performance?: {
      averageResponseTime: number
      p95ResponseTime: number
      p99ResponseTime: number
      totalRequests: number
      requestsLastHour: number
    }
  } = {
    status: "ok",
    timestamp: new Date().toISOString(),
    version,
    checks: {
      database: {
        status: "unknown",
        message: "",
      },
      api: {
        status: "ok",
        message: "API endpoint responding",
      },
    },
  }

  // Check database connection
  try {
    await db.$queryRaw`SELECT 1`
    health.checks.database.status = "ok"
    health.checks.database.message = "Database connection successful"
  } catch (error: any) {
    health.checks.database.status = "error"
    health.checks.database.message = error?.message || "Database connection failed"
    health.status = "degraded"
  }

  // Check Google Calendar integration (if configured)
  const hasGoogleCalendar = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET
  if (hasGoogleCalendar) {
    health.checks.googleCalendar = {
      status: "configured",
      message: "Google Calendar credentials configured",
    }
  }

  // Calculate performance metrics from activity logs
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    // Get recent API activity logs
    const recentLogs = await db.activityLog.findMany({
      where: {
        createdAt: { gte: last24Hours },
      },
      select: {
        details: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 1000, // Limit to last 1000 requests for performance
    })

    if (recentLogs.length > 0) {
      // Filter logs that have responseTimeMs in details
      const logsWithResponseTime = recentLogs.filter((log) => {
        const details = log.details as any
        return details?.responseTimeMs && typeof details.responseTimeMs === 'number' && details.responseTimeMs > 0
      })

      if (logsWithResponseTime.length > 0) {
        const responseTimes = logsWithResponseTime
          .map((log) => {
            const details = log.details as any
            return details.responseTimeMs as number
          })
          .sort((a, b) => a - b)

        if (responseTimes.length > 0) {
          const total = responseTimes.reduce((sum, time) => sum + time, 0)
          const average = Math.round(total / responseTimes.length)
          const p95Index = Math.floor(responseTimes.length * 0.95)
          const p99Index = Math.floor(responseTimes.length * 0.99)
          
          const requestsLastHour = logsWithResponseTime.filter(
            (log) => log.createdAt >= oneHourAgo
          ).length

          health.performance = {
            averageResponseTime: average,
            p95ResponseTime: responseTimes[p95Index] || average,
            p99ResponseTime: responseTimes[p99Index] || average,
            totalRequests: logsWithResponseTime.length,
            requestsLastHour,
          }
        }
      }
    }
  } catch (error) {
    console.error("[Health Endpoint] Error calculating performance metrics:", error)
    // Don't fail health check if performance metrics fail
  }

  return NextResponse.json(health, { 
    status: health.status === "ok" ? 200 : 503 
  })
}


```

```typescriptreact
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
            <div className="space-y-2">
              <p className="text-destructive font-semibold">Nie udało się pobrać statusu systemu</p>
              {errorMessage && (
                <p className="text-sm text-muted-foreground">{errorMessage}</p>
              )}
              <p className="text-xs text-muted-foreground mt-4">
                Możliwe przyczyny: przeciążenie serwera, problemy z bazą danych lub timeout połączenia.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}



```

```typescriptreact
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



```


Cofnąłem zmiany z timeoutami. Kod jest teraz taki sam jak przed zawieszeniem. Sprawdzam, czy wszystko działa:


