import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

const updateSettingsSchema = z.object({
  systemName: z.string().min(1).optional(),
  defaultColorScheme: z
    .object({
      primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
      themeName: z
        .enum(["blue", "green", "purple", "red", "custom"])
        .optional(),
    })
    .optional(),
})

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 })
    }

    const [systemName, systemLogo, defaultColorScheme] = await Promise.all([
      db.systemSettings.findUnique({ where: { key: "system_name" } }),
      db.systemSettings.findUnique({ where: { key: "system_logo" } }),
      db.systemSettings.findUnique({ where: { key: "default_color_scheme" } }),
    ])

    let parsedColorScheme = null
    if (defaultColorScheme) {
      try {
        parsedColorScheme = JSON.parse(defaultColorScheme.value)
      } catch {
        // Invalid JSON, ignore
      }
    }

    return NextResponse.json({
      systemName: systemName?.value || "Internal CRM",
      systemLogo: systemLogo?.value || null,
      defaultColorScheme: parsedColorScheme,
    })
  } catch (error) {
    console.error("Get admin settings error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas pobierania ustawień" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 })
    }

    const contentType = request.headers.get("content-type") || ""

    // Handle FormData (for logo upload)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      const systemName = formData.get("systemName") as string | null
      const logo = formData.get("logo") as File | null
      const removeLogo = formData.get("removeLogo") === "true"

      // Update system name
      if (systemName) {
        await db.systemSettings.upsert({
          where: { key: "system_name" },
          create: { key: "system_name", value: systemName },
          update: { value: systemName },
        })
      }

      // Handle logo
      if (removeLogo) {
        // Remove logo
        await db.systemSettings.deleteMany({
          where: { key: "system_logo" },
        })
      } else if (logo && logo.size > 0) {
        // Validate file type
        if (!logo.type.match(/^image\/(png|jpeg|jpg|svg)$/)) {
          return NextResponse.json(
            { error: "Nieprawidłowy format pliku. Dozwolone: PNG, JPG, SVG" },
            { status: 400 }
          )
        }

        // Validate file size (max 2MB)
        if (logo.size > 2 * 1024 * 1024) {
          return NextResponse.json(
            { error: "Plik jest zbyt duży. Maksymalny rozmiar: 2MB" },
            { status: 400 }
          )
        }

        // Save logo to public/uploads/logo
        const uploadsDir = join(process.cwd(), "public", "uploads", "logo")
        if (!existsSync(uploadsDir)) {
          await mkdir(uploadsDir, { recursive: true })
        }

        const bytes = await logo.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const filename = `logo-${Date.now()}.${logo.name.split(".").pop()}`
        const filepath = join(uploadsDir, filename)

        await writeFile(filepath, buffer)
        const logoUrl = `/uploads/logo/${filename}`

        await db.systemSettings.upsert({
          where: { key: "system_logo" },
          create: { key: "system_logo", value: logoUrl },
          update: { value: logoUrl },
        })
      }

      // Log activity
      await db.activityLog.create({
        data: {
          userId: user.id,
          action: "SYSTEM_SETTINGS_UPDATED",
          entityType: "SystemSettings",
          details: {
            updatedFields: [
              ...(systemName ? ["systemName"] : []),
              ...(logo || removeLogo ? ["logo"] : []),
            ],
          },
        },
      })

      return NextResponse.json({
        message: "Ustawienia zostały zaktualizowane",
      })
    }

    // Handle JSON (for color scheme)
    const body = await request.json()
    const validatedData = updateSettingsSchema.parse(body)

    // Update default color scheme
    if (validatedData.defaultColorScheme) {
      const colorSchemeValue = JSON.stringify(validatedData.defaultColorScheme)
      await db.systemSettings.upsert({
        where: { key: "default_color_scheme" },
        create: { key: "default_color_scheme", value: colorSchemeValue },
        update: { value: colorSchemeValue },
      })
    }

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: "SYSTEM_SETTINGS_UPDATED",
        entityType: "SystemSettings",
        details: {
          updatedFields: Object.keys(validatedData),
        },
      },
    })

    return NextResponse.json({
      message: "Ustawienia zostały zaktualizowane",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Update admin settings error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas aktualizacji ustawień" },
      { status: 500 }
    )
  }
}

