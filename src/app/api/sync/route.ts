import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { applyRateLimit, logApiActivity } from "@/lib/api-security"

const syncRequestSchema = z.object({
  entityType: z.enum(["clients", "contacts", "tasks"]),
  lastSyncTimestamp: z.number().optional(),
  changes: z.array(
    z.object({
      id: z.string(),
      action: z.enum(["create", "update", "delete"]),
      data: z.record(z.any()).optional(),
      timestamp: z.number(),
    })
  ).optional(),
})

/**
 * POST /api/sync
 * Synchronizacja danych między klientem a serwerem
 * Wysyła zmiany z klienta i pobiera najnowsze dane z serwera
 */
export async function POST(request: Request) {
  try {
    // Rate limiting
    const rateLimitResponse = await applyRateLimit(request, "api")
    if (rateLimitResponse) return rateLimitResponse

    const user = await getCurrentUser()
    if (!user) {
      await logApiActivity(null, "API_UNAUTHORIZED_ATTEMPT", "Sync", null, {}, request)
      return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = syncRequestSchema.parse(body)

    const results: any = {
      synced: [],
      conflicts: [],
      errors: [],
    }

    // Process client changes
    if (validatedData.changes && validatedData.changes.length > 0) {
      for (const change of validatedData.changes) {
        try {
          if (change.action === "create") {
            // Create new entity
            if (validatedData.entityType === "clients") {
              const client = await db.client.create({
                data: {
                  ...(change.data || {}),
                  assignedTo: change.data?.assignedTo || user.id,
                },
              })
              results.synced.push({ id: change.id, serverId: client.id, action: "create" })
            } else if (validatedData.entityType === "contacts") {
              const contact = await db.contact.create({
                data: {
                  ...(change.data || {}),
                  userId: user.id,
                },
              })
              results.synced.push({ id: change.id, serverId: contact.id, action: "create" })
            } else if (validatedData.entityType === "tasks") {
              const task = await db.task.create({
                data: {
                  ...(change.data || {}),
                  assignedTo: change.data?.assignedTo || user.id,
                },
              })
              results.synced.push({ id: change.id, serverId: task.id, action: "create" })
            }
          } else if (change.action === "update") {
            // Update existing entity
            if (validatedData.entityType === "clients") {
              await db.client.update({
                where: { id: change.id },
                data: change.data || {},
              })
              results.synced.push({ id: change.id, action: "update" })
            } else if (validatedData.entityType === "contacts") {
              await db.contact.update({
                where: { id: change.id },
                data: change.data || {},
              })
              results.synced.push({ id: change.id, action: "update" })
            } else if (validatedData.entityType === "tasks") {
              await db.task.update({
                where: { id: change.id },
                data: change.data || {},
              })
              results.synced.push({ id: change.id, action: "update" })
            }
          } else if (change.action === "delete") {
            // Delete entity
            if (validatedData.entityType === "clients") {
              await db.client.delete({ where: { id: change.id } })
              results.synced.push({ id: change.id, action: "delete" })
            } else if (validatedData.entityType === "contacts") {
              await db.contact.delete({ where: { id: change.id } })
              results.synced.push({ id: change.id, action: "delete" })
            } else if (validatedData.entityType === "tasks") {
              await db.task.delete({ where: { id: change.id } })
              results.synced.push({ id: change.id, action: "delete" })
            }
          }
        } catch (error: any) {
          results.errors.push({
            id: change.id,
            error: error.message || "Wystąpił błąd",
          })
        }
      }
    }

    // Get latest data from server
    const lastSync = validatedData.lastSyncTimestamp || 0
    const serverData: any = {
      clients: [],
      contacts: [],
      tasks: [],
    }

    // Get clients
    if (validatedData.entityType === "clients") {
      const clients = await db.client.findMany({
        where: {
          OR: [
            { assignedTo: user.id },
            { sharedGroups: { some: { users: { some: { userId: user.id } } } } },
          ],
          updatedAt: {
            gte: new Date(lastSync),
          },
        },
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })
      serverData.clients = clients
    }

    // Get contacts
    if (validatedData.entityType === "contacts") {
      const contacts = await db.contact.findMany({
        where: {
          client: {
            OR: [
              { assignedTo: user.id },
              { sharedGroups: { some: { users: { some: { userId: user.id } } } } },
            ],
          },
          updatedAt: {
            gte: new Date(lastSync),
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })
      serverData.contacts = contacts
    }

    // Get tasks
    if (validatedData.entityType === "tasks") {
      const tasks = await db.task.findMany({
        where: {
          OR: [
            { assignedTo: user.id },
            { sharedGroups: { some: { users: { some: { userId: user.id } } } } },
          ],
          updatedAt: {
            gte: new Date(lastSync),
          },
        },
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })
      serverData.tasks = tasks
    }

    // Log API activity
    await logApiActivity(user.id, "SYNC_PERFORMED", "Sync", null, {
      entityType: validatedData.entityType,
      changesCount: validatedData.changes?.length || 0,
    }, request)

    return NextResponse.json({
      success: true,
      results,
      data: serverData[validatedData.entityType],
      timestamp: Date.now(),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Sync error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas synchronizacji" },
      { status: 500 }
    )
  }
}

