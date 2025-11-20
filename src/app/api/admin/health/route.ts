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
  // Always include performance section, even if empty (for UI display)
  health.performance = {
    averageResponseTime: 0,
    p95ResponseTime: 0,
    p99ResponseTime: 0,
    totalRequests: 0,
    requestsLastHour: 0,
  }

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
    // Don't fail health check if performance metrics fail - keep default empty values
  }

  return NextResponse.json(health, { 
    status: health.status === "ok" ? 200 : 503 
  })
}

