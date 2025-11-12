import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { TaskStatus } from "@prisma/client"
import { z } from "zod"
import { validateQueryParams, taskQuerySchema } from "@/lib/query-validator"
import { textFieldSchema } from "@/lib/field-validators"
import { applyRateLimit, logApiActivity } from "@/lib/api-security"

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

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Tworzy nowe zadanie
 *     description: Tworzy nowe zadanie w systemie. Wymaga autoryzacji. Jeśli clientId jest podany, wymaga dostępu do klienta.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 150
 *                 description: Tytuł zadania
 *               description:
 *                 type: string
 *                 nullable: true
 *                 maxLength: 5000
 *                 description: Opis zadania
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 description: Termin wykonania (ISO datetime)
 *               status:
 *                 type: string
 *                 enum: [TODO, IN_PROGRESS, COMPLETED]
 *                 default: TODO
 *               assignedTo:
 *                 type: string
 *                 nullable: true
 *                 description: CUID użytkownika przypisanego
 *               clientId:
 *                 type: string
 *                 nullable: true
 *                 description: CUID klienta (opcjonalne)
 *               sharedGroupIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array ID grup do udostępnienia
 *     responses:
 *       201:
 *         description: Zadanie zostało utworzone
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 task:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Błąd walidacji
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Nieautoryzowany
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Brak uprawnień do klienta
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Klient nie znaleziony
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Błąd serwera
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(request: Request) {
  try {
    // Rate limiting
    const rateLimitResponse = await applyRateLimit(request, "api")
    if (rateLimitResponse) return rateLimitResponse

    const user = await getCurrentUser()
    if (!user) {
      await logApiActivity(null, "API_UNAUTHORIZED_ATTEMPT", "Task", null, {}, request)
      return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 })
    }

    const body = await request.json()
    console.log("[DEBUG TASKS POST] Received body:", JSON.stringify(body, null, 2))
    console.log("[DEBUG TASKS POST] assignedTo:", body.assignedTo, "type:", typeof body.assignedTo)
    console.log("[DEBUG TASKS POST] clientId:", body.clientId, "type:", typeof body.clientId)
    console.log("[DEBUG TASKS POST] sharedGroupIds:", body.sharedGroupIds, "type:", typeof body.sharedGroupIds, "isArray:", Array.isArray(body.sharedGroupIds))
    let validatedData
    try {
      validatedData = createTaskSchema.parse(body)
      console.log("[DEBUG TASKS POST] Validated data:", JSON.stringify(validatedData, null, 2))
    } catch (error: any) {
      console.error("[DEBUG TASKS POST] Validation error:", error)
      if (error instanceof z.ZodError) {
        console.error("[DEBUG TASKS POST] Zod errors:", JSON.stringify(error.errors, null, 2))
      }
      throw error
    }

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

    // Log API activity
    await logApiActivity(user.id, "TASK_CREATED", "Task", task.id, { 
      title: task.title,
      status: task.status,
      clientId: validatedData.clientId 
    }, request)

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("[DEBUG TASKS POST] ZodError details:", JSON.stringify(error.errors, null, 2))
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

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Pobiera listę zadań
 *     description: Pobiera listę zadań z możliwością filtrowania. Wymaga autoryzacji. Użytkownicy widzą tylko swoje zadania lub udostępnione przez grupy.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [TODO, IN_PROGRESS, COMPLETED]
 *         description: Filtr statusu zadania
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: string
 *         description: CUID użytkownika przypisanego
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *         description: CUID klienta
 *     responses:
 *       200:
 *         description: Lista zadań
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tasks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *       400:
 *         description: Błąd walidacji
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Nieautoryzowany
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Błąd serwera
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(request: Request) {
  try {
    // Rate limiting
    const rateLimitResponse = await applyRateLimit(request, "api")
    if (rateLimitResponse) return rateLimitResponse

    const user = await getCurrentUser()
    if (!user) {
      await logApiActivity(null, "API_UNAUTHORIZED_ATTEMPT", "Task", null, {}, request)
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
    
    // Validate clientId separately if provided (CUID format)
    const clientId = searchParams.get("clientId")
    const validatedClientId = clientId && clientId.trim().length > 0 ? clientId.trim() : undefined

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
            firstName: true,
            lastName: true,
            type: true,
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
