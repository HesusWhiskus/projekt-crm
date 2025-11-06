import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const updatePreferencesSchema = z.object({
  theme: z.enum(["light", "dark"]).optional(),
  language: z.enum(["pl", "en"]).optional(),
  colorScheme: z
    .object({
      primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
      themeName: z
        .enum(["blue", "green", "purple", "red", "custom", "system"])
        .optional(),
    })
    .optional(),
  notifications: z
    .object({
      emailTasks: z.boolean().optional(),
      emailContacts: z.boolean().optional(),
    })
    .optional(),
})

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 })
    }

    const preferences = await db.userPreferences.findUnique({
      where: { userId: user.id },
    })

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error("Get preferences error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas pobierania preferencji" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updatePreferencesSchema.parse(body)

    // Upsert preferences
    const preferences = await db.userPreferences.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        theme: validatedData.theme,
        language: validatedData.language,
        primaryColor: validatedData.colorScheme?.primaryColor,
        themeName: validatedData.colorScheme?.themeName,
        emailTasks: validatedData.notifications?.emailTasks ?? true,
        emailContacts: validatedData.notifications?.emailContacts ?? true,
      },
      update: {
        ...(validatedData.theme !== undefined && { theme: validatedData.theme }),
        ...(validatedData.language !== undefined && {
          language: validatedData.language,
        }),
        ...(validatedData.colorScheme?.primaryColor !== undefined && {
          primaryColor: validatedData.colorScheme.primaryColor,
        }),
        ...(validatedData.colorScheme?.themeName !== undefined && {
          themeName: validatedData.colorScheme.themeName,
        }),
        ...(validatedData.notifications?.emailTasks !== undefined && {
          emailTasks: validatedData.notifications.emailTasks,
        }),
        ...(validatedData.notifications?.emailContacts !== undefined && {
          emailContacts: validatedData.notifications.emailContacts,
        }),
      },
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: "PREFERENCES_UPDATED",
        entityType: "UserPreferences",
        entityId: preferences.id,
        details: {
          updatedFields: Object.keys(validatedData),
        },
      },
    })

    return NextResponse.json({
      message: "Preferencje zostały zaktualizowane",
      preferences,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Update preferences error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas aktualizacji preferencji" },
      { status: 500 }
    )
  }
}

