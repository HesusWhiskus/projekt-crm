import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { hash, compare } from "bcryptjs"
import { z } from "zod"
import { nameSchema, textFieldSchema } from "@/lib/field-validators"
import { validatePassword } from "@/lib/password-validator"

const updateProfileSchema = z.object({
  name: nameSchema("Imię", 2, 100).optional(),
  position: textFieldSchema(100, "Stanowisko").optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków").optional(),
})

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    // If changing password, verify current password
    if (validatedData.newPassword) {
      if (!validatedData.currentPassword) {
        return NextResponse.json(
          { error: "Obecne hasło jest wymagane do zmiany hasła" },
          { status: 400 }
        )
      }

      const dbUser = await db.user.findUnique({
        where: { id: user.id },
        select: { password: true },
      })

      if (!dbUser?.password) {
        return NextResponse.json(
          { error: "Nie można zmienić hasła dla konta OAuth" },
          { status: 400 }
        )
      }

      const isPasswordValid = await compare(
        validatedData.currentPassword,
        dbUser.password
      )

      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Nieprawidłowe obecne hasło" },
          { status: 400 }
        )
      }

      // Validate new password strength
      const passwordValidation = validatePassword(validatedData.newPassword)
      if (!passwordValidation.valid) {
        return NextResponse.json(
          { error: passwordValidation.error },
          { status: 400 }
        )
      }
    }

    // Update user
    const updateData: any = {}
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.position !== undefined) updateData.position = validatedData.position
    if (validatedData.newPassword) {
      updateData.password = await hash(validatedData.newPassword, 10)
    }

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: updateData,
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: "PROFILE_UPDATED",
        entityType: "User",
        entityId: user.id,
        details: {
          updatedFields: Object.keys(updateData),
        },
      },
    })

    return NextResponse.json({
      message: "Profil został zaktualizowany",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        position: updatedUser.position,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Profile update error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas aktualizacji profilu" },
      { status: 500 }
    )
  }
}

