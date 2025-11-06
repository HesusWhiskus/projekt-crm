import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { TaskStatus } from "@prisma/client"
import { z } from "zod"
import { validateQueryParams, taskQuerySchema, uuidSchema } from "@/lib/query-validator"
import { textFieldSchema } from "@/lib/field-validators"

const createTaskSchema = z.object({
  title: z.string().min(1, "Tytuł jest wymagany").max(150, "Tytuł jest zbyt długi (max 150 znaków)").trim(),
  description: textFieldSchema(5000, "Opis"),
  dueDate: z.string().refine(
    (val) => {
      if (!val || val === "") return true // Optional
      const date = new Date(val)
      return !isNaN(date.getTime())
    },
    { message: "Nieprawidłowy format daty" }
  ).optional().or(z.literal("")),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  assignedTo: z.string().optional(),
  clientId: z.string().optional(),
  sharedGroupIds: z.array(z.string()).optional(),
})

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 })
    }

    const body = await request.json()
    console.log("[DEBUG TASKS POST] Received body:", JSON.stringify(body, null, 2))
    console.log("[DEBUG TASKS POST] assignedTo:", body.assignedTo, "type:", typeof body.assignedTo)
    console.log("[DEBUG TASKS POST] clientId:", body.clientId, "type:", typeof body.clientId)
    const validatedData = createTaskSchema.parse(body)
    console.log("[DEBUG TASKS POST] Validated data:", JSON.stringify(validatedData, null, 2))

    // If clientId is provided, check access
    if (validatedData.clientId) {
      const client = await db.client.findUnique({
        where: { id: validatedData.clientId },
      })

      if (!client) {
        return NextResponse.json({ error: "Klient nie znaleziony" }, { status: 404 })
      }

      if (
        user.role !== "ADMIN" &&
        client.assignedTo !== user.id
      ) {
        return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 })
      }
    }

    const task = await db.task.create({
      data: {
        title: validatedData.title,
        description: validatedData.description || null,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        status: validatedData.status,
        assignedTo: validatedData.assignedTo || null,
        clientId: validatedData.clientId || null,
        sharedGroups: validatedData.sharedGroupIds
          ? {
              connect: validatedData.sharedGroupIds.map((id) => ({ id })),
            }
          : undefined,
      },
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: "TASK_CREATED",
        entityType: "Task",
        entityId: task.id,
        details: {
          title: task.title,
          clientId: validatedData.clientId,
        },
      },
    })

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Task creation error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas tworzenia zadania" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    // Validate query parameters
    let validatedParams
    try {
      validatedParams = validateQueryParams(taskQuerySchema, searchParams)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: error.errors[0].message },
          { status: 400 }
        )
      }
      throw error
    }
    
    // Validate clientId separately if provided
    const clientId = searchParams.get("clientId")
    let validatedClientId: string | undefined
    if (clientId) {
      try {
        validatedClientId = uuidSchema.parse(clientId)
      } catch {
        return NextResponse.json(
          { error: "Nieprawidłowy format ID klienta" },
          { status: 400 }
        )
      }
    }

    const where: any = {}

    if (user.role !== "ADMIN") {
      where.OR = [
        { assignedTo: user.id },
        { sharedGroups: { some: { users: { some: { userId: user.id } } } } },
      ]
    }

    if (validatedParams.status) {
      where.status = validatedParams.status as TaskStatus
    }

    if (validatedParams.assignedTo) {
      where.assignedTo = validatedParams.assignedTo
    }

    if (validatedClientId) {
      where.clientId = validatedClientId
    }

    const tasks = await db.task.findMany({
      where,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        client: {
          select: {
            id: true,
            agencyName: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error("Tasks fetch error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas pobierania zadań" },
      { status: 500 }
    )
  }
}
