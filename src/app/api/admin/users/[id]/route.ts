import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole } from "@prisma/client"
import { z } from "zod"

const updateUserSchema = z.object({
  role: z.enum(["ADMIN", "USER"]).optional(),
  name: z.string().min(1).optional(),
  position: z.string().optional().nullable(),
})

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

