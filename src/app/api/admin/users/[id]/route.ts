import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole } from "@prisma/client"
import { z } from "zod"
import { revalidateTag } from "next/cache"

const updateUserSchema = z.object({
  role: z.enum(["ADMIN", "USER"]).optional(),
  name: z.string().min(1).optional(),
  position: z.string().optional().nullable(),
  organizationId: z.string().optional().nullable(),
})

/**
 * @swagger
 * /api/admin/users/{id}:
 *   patch:
 *     summary: Aktualizuje użytkownika
 *     description: Aktualizuje dane użytkownika. Tylko ADMIN może aktualizować użytkowników. Wymaga autoryzacji.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: CUID identyfikator użytkownika
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [ADMIN, USER]
 *               name:
 *                 type: string
 *                 minLength: 1
 *               position:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Użytkownik został zaktualizowany
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Użytkownik został zaktualizowany"
 *                 user:
 *                   type: object
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
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    const updatedUser = await db.user.update({
      where: { id: params.id },
      data: validatedData,
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: "USER_UPDATED",
        entityType: "User",
        entityId: params.id,
        details: {
          updatedFields: Object.keys(validatedData),
          changes: validatedData,
        },
      },
    })

    // Invalidate users cache
    revalidateTag('users')

    return NextResponse.json({
      message: "Użytkownik został zaktualizowany",
      user: updatedUser,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("User update error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas aktualizacji użytkownika" },
      { status: 500 }
    )
  }
}

