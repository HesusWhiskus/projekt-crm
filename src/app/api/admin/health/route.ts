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

  // Read version from package.json
  let version = "unknown"
  try {
    const packageJsonPath = join(process.cwd(), "package.json")
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"))
    version = packageJson.version || "unknown"
  } catch (error) {
    console.error("[Health Endpoint] Error reading package.json:", error)
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

  return NextResponse.json(health, { 
    status: health.status === "ok" ? 200 : 503 
  })
}

