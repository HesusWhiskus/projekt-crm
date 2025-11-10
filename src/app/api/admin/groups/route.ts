import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { textFieldSchema } from "@/lib/field-validators"
import { revalidateTag } from "next/cache"

const createGroupSchema = z.object({
  name: z.string().min(2, "Nazwa grupy musi mieć co najmniej 2 znaki").max(100, "Nazwa grupy jest zbyt długa (max 100 znaków)").trim(),
  description: textFieldSchema(500, "Opis"),
})

/**
 * @swagger
 * /api/admin/groups:
 *   post:
 *     summary: Tworzy nową grupę
 *     description: Tworzy nową grupę użytkowników. Tylko ADMIN może tworzyć grupy. Wymaga autoryzacji.
 *     tags: [Admin]
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
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Nazwa grupy (unikalna)
 *               description:
 *                 type: string
 *                 nullable: true
 *                 maxLength: 500
 *     responses:
 *       201:
 *         description: Grupa została utworzona
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Grupa została utworzona"
 *                 group:
 *                   type: object
 *       400:
 *         description: Błąd walidacji lub grupa o tej nazwie już istnieje
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
 *         description: Brak uprawnień (tylko ADMIN)
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
    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createGroupSchema.parse(body)

    // Check if group with this name already exists
    const existingGroup = await db.group.findUnique({
      where: { name: validatedData.name },
    })

    if (existingGroup) {
      return NextResponse.json(
        { error: "Grupa o tej nazwie już istnieje" },
        { status: 400 }
      )
    }

    const group = await db.group.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
      },
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: "GROUP_CREATED",
        entityType: "Group",
        entityId: group.id,
        details: {
          name: group.name,
        },
      },
    })

    // Invalidate groups cache
    revalidateTag('groups')

    return NextResponse.json(
      { message: "Grupa została utworzona", group },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Group creation error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas tworzenia grupy" },
      { status: 500 }
    )
  }
}

