import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: Request) {
  // Check admin permissions
  const user = await getCurrentUser()
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get("limit") || "100")
  const offset = parseInt(searchParams.get("offset") || "0")

  try {
    // Get activity logs from database
    const activityLogs = await db.activityLog.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    // Map to format expected by the frontend
    const logs = activityLogs.map((log) => ({
      id: log.id,
      timestamp: log.createdAt.toISOString(),
      userId: log.userId,
      email: log.user.email || log.userId,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      ip: log.ipAddress || "-",
      userAgent: log.userAgent || "-",
      details: log.details,
      success: true, // Activity logs are always successful (failed actions might not be logged)
    }))

    return NextResponse.json({ logs }, { status: 200 })
  } catch (error: unknown) {
    // SECURITY-FIX: [ERROR-LOG-2] Zastąpiono console.error przez logError z sanitizacją
    // Data: 2025-01-27
    const { logError } = await import('@/lib/logger')
    logError("[Auth Logs API] Error fetching logs", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch logs"
    return NextResponse.json(
      { error: "Failed to fetch logs", details: errorMessage },
      { status: 500 }
    )
  }
}
