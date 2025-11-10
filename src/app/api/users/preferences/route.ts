import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const updatePreferencesSchema = z.object({
  theme: z.enum(["light", "dark"]).optional(),
  language: z.enum(["pl", "en"]).optional(),
  timezone: z.string().optional(),
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

/**
 * @swagger
 * /api/users/preferences:
 *   get:
 *     summary: Pobiera preferencje użytkownika
 *     description: Pobiera preferencje zalogowanego użytkownika (motyw, język, strefa czasowa, kolory, powiadomienia). Wymaga autoryzacji.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Preferencje użytkownika
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 preferences:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     id:
 *                       type: string
 *                     userId:
 *                       type: string
 *                     theme:
 *                       type: string
 *                       enum: [light, dark]
 *                     language:
 *                       type: string
 *                       enum: [pl, en]
 *                     timezone:
 *                       type: string
 *                       nullable: true
 *                     primaryColor:
 *                       type: string
 *                       nullable: true
 *                     themeName:
 *                       type: string
 *                       enum: [blue, green, purple, red, custom, system]
 *                       nullable: true
 *                     emailTasks:
 *                       type: boolean
 *                     emailContacts:
 *                       type: boolean
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
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 })
    }

    let preferences = null
    try {
      preferences = await db.userPreferences.findUnique({
        where: { userId: user.id },
      })
    } catch (dbError: any) {
      // Table might not exist yet
      if (dbError?.code === "P2021" || dbError?.message?.includes("does not exist")) {
        console.log("UserPreferences table does not exist yet")
        return NextResponse.json({ preferences: null })
      }
      throw dbError
    }

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error("Get preferences error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas pobierania preferencji" },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/users/preferences:
 *   patch:
 *     summary: Aktualizuje preferencje użytkownika
 *     description: Aktualizuje preferencje zalogowanego użytkownika. Wszystkie pola są opcjonalne. Wymaga autoryzacji.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               theme:
 *                 type: string
 *                 enum: [light, dark]
 *               language:
 *                 type: string
 *                 enum: [pl, en]
 *               timezone:
 *                 type: string
 *                 description: IANA timezone (np. "Europe/Warsaw")
 *               colorScheme:
 *                 type: object
 *                 properties:
 *                   primaryColor:
 *                     type: string
 *                     pattern: '^#[0-9A-F]{6}$'
 *                     description: Hex color (np. "#3b82f6")
 *                   themeName:
 *                     type: string
 *                     enum: [blue, green, purple, red, custom, system]
 *               notifications:
 *                 type: object
 *                 properties:
 *                   emailTasks:
 *                     type: boolean
 *                   emailContacts:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Preferencje zostały zaktualizowane
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Preferencje zostały zaktualizowane"
 *                 preferences:
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
 *       503:
 *         description: Tabele ustawień nie zostały jeszcze utworzone
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
export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updatePreferencesSchema.parse(body)

    // Upsert preferences (with error handling for missing table)
    let preferences
    try {
      preferences = await db.userPreferences.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        theme: validatedData.theme,
        language: validatedData.language,
        timezone: validatedData.timezone,
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
        ...(validatedData.timezone !== undefined && {
          timezone: validatedData.timezone,
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
    } catch (dbError: any) {
      // Table might not exist yet
      if (dbError?.code === "P2021" || dbError?.message?.includes("does not exist")) {
        return NextResponse.json(
          { error: "Tabele ustawień nie zostały jeszcze utworzone. Proszę uruchomić migracje bazy danych." },
          { status: 503 }
        )
      }
      throw dbError
    }

    // Log activity (optional - don't fail if it fails)
    try {
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
    } catch (logError) {
      console.error("Failed to log activity:", logError)
      // Don't fail the request if logging fails
    }

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

