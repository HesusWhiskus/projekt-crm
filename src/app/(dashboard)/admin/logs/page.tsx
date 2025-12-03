import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { AdminLogsClient } from "./admin-logs-client"

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: { 
    page?: string
    limit?: string
    action?: string
    entityType?: string
    userId?: string
    dateFrom?: string
    dateTo?: string
  }
}) {
  const user = await getCurrentUser()
  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const page = parseInt(searchParams.page || "1")
  const limit = parseInt(searchParams.limit || "50")
  const skip = (page - 1) * limit

  // Build where clause for filtering
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}
  
  if (searchParams.action) {
    where.action = { contains: searchParams.action, mode: "insensitive" }
  }
  
  if (searchParams.entityType) {
    where.entityType = searchParams.entityType
  }
  
  if (searchParams.userId) {
    where.userId = searchParams.userId
  }
  
  if (searchParams.dateFrom || searchParams.dateTo) {
    where.createdAt = {}
    if (searchParams.dateFrom) {
      where.createdAt.gte = new Date(searchParams.dateFrom)
    }
    if (searchParams.dateTo) {
      const dateTo = new Date(searchParams.dateTo)
      dateTo.setHours(23, 59, 59, 999) // End of day
      where.createdAt.lte = dateTo
    }
  }

  // Fetch activity logs with pagination
  interface LogEntry {
    id: string
    timestamp: string
    userId: string
    email: string
    name: string | null
    action: string
    entityType: string | null
    entityId: string | null
    ip: string
    userAgent: string
    details: Record<string, unknown> | null
    responseTimeMs: number | null
    success: boolean
    error: string | null
    method: string | null
    path: string | null
    statusCode: number | null
  }
  
  let logs: LogEntry[] = []
  let total = 0
  
  try {
    const [activityLogs, totalCount] = await Promise.all([
      db.activityLog.findMany({
        where,
        take: limit,
        skip,
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
      }),
      db.activityLog.count({ where }),
    ])

    total = totalCount

    // Map to format expected by the frontend
    logs = activityLogs.map((log) => {
      const details = (log.details as Record<string, unknown>) || {}
      return {
        id: log.id,
        timestamp: log.createdAt.toISOString(),
        userId: log.userId,
        email: log.user.email || log.userId,
        name: log.user.name || null,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        ip: log.ipAddress || "-",
        userAgent: log.userAgent || "-",
        details: details,
        responseTimeMs: (details.responseTimeMs as number) || null,
        success: details.success !== false, // Default to true if not specified
        error: (details.error as string) || null,
        method: (details.method as string) || null,
        path: (details.path as string) || null,
        statusCode: (details.statusCode as number) || null,
      }
    })
  } catch (error: unknown) {
    console.error("[AdminLogsPage] Error fetching logs:", error)
  }

  // Get users for filter dropdown
  const users = await db.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
    },
    orderBy: {
      email: "asc",
    },
  })

  return (
    <AdminLogsClient 
      initialLogs={logs}
      total={total}
      page={page}
      limit={limit}
      users={users}
      filters={searchParams}
    />
  )
}
