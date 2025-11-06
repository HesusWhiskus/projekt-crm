import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { ContactType } from "@prisma/client"
import { z } from "zod"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { validateFiles, generateSafeFilename, MAX_FILES_PER_UPLOAD } from "@/lib/file-upload"
import { validateQueryParams, contactQuerySchema, uuidSchema } from "@/lib/query-validator"
import { textFieldSchema } from "@/lib/field-validators"

const createContactSchema = z.object({
  type: z.nativeEnum(ContactType),
  date: z.string().refine(
    (val) => {
      if (!val) return false
      const date = new Date(val)
      return !isNaN(date.getTime())
    },
    { message: "Nieprawidłowy format daty" }
  ),
  notes: z.string().min(1, "Notatka jest wymagana").max(5000, "Notatka jest zbyt długa (max 5000 znaków)").trim(),
  userId: uuidSchema,
  clientId: uuidSchema,
  sharedGroupIds: z.array(uuidSchema).optional(),
})

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 })
    }

    const formData = await request.formData()
    
    // Parse sharedGroupIds if provided
    const sharedGroupIdsStr = formData.get("sharedGroupIds")
    let sharedGroupIds: string[] | undefined
    if (sharedGroupIdsStr) {
      try {
        sharedGroupIds = JSON.parse(sharedGroupIdsStr as string)
      } catch {
        // If not JSON, try as comma-separated string
        const ids = (sharedGroupIdsStr as string).split(",").filter(Boolean)
        if (ids.length > 0) sharedGroupIds = ids
      }
    }
    
    const validatedData = createContactSchema.parse({
      type: formData.get("type"),
      date: formData.get("date"),
      notes: formData.get("notes"),
      userId: formData.get("userId"),
      clientId: formData.get("clientId"),
      sharedGroupIds,
    })

    // Check if client exists and user has access
    const client = await db.client.findUnique({
      where: { id: validatedData.clientId },
    })

    if (!client) {
      return NextResponse.json({ error: "Klient nie znaleziony" }, { status: 404 })
    }

    // Check access
    if (
      user.role !== "ADMIN" &&
      client.assignedTo !== user.id
    ) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 })
    }

    // Create contact
    const contact = await db.contact.create({
      data: {
        type: validatedData.type,
        date: new Date(validatedData.date),
        notes: validatedData.notes,
        userId: validatedData.userId,
        clientId: validatedData.clientId,
        sharedGroups: validatedData.sharedGroupIds
          ? {
              connect: validatedData.sharedGroupIds.map((id) => ({ id })),
            }
          : undefined,
      },
    })

    // Handle file uploads
    const files = formData.getAll("files") as File[]
    if (files.length > 0 && files[0].size > 0) {
      // Validate files
      const filesValidation = validateFiles(files)
      if (!filesValidation.valid) {
        return NextResponse.json(
          { error: filesValidation.error },
          { status: 400 }
        )
      }

      const uploadsDir = join(process.cwd(), "public", "uploads", "contacts", contact.id)
      await mkdir(uploadsDir, { recursive: true })

      for (const file of files) {
        if (file.size === 0) continue

        // Generate safe filename to prevent path traversal
        const safeFilename = generateSafeFilename(file.name)
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const filepath = join(uploadsDir, safeFilename)

        // Additional safety check: ensure filepath is within uploadsDir
        const resolvedPath = join(uploadsDir, safeFilename)
        if (!resolvedPath.startsWith(uploadsDir)) {
          return NextResponse.json(
            { error: "Nieprawidłowa ścieżka pliku" },
            { status: 400 }
          )
        }

        await writeFile(filepath, buffer)

        await db.attachment.create({
          data: {
            contactId: contact.id,
            filename: file.name, // Store original filename
            path: `/uploads/contacts/${contact.id}/${safeFilename}`, // Use safe filename in path
            size: file.size,
            mimeType: file.type || null,
          },
        })
      }
    }

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: "CONTACT_CREATED",
        entityType: "Contact",
        entityId: contact.id,
        details: {
          clientId: validatedData.clientId,
          type: validatedData.type,
        },
      },
    })

    return NextResponse.json({ contact }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Contact creation error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas tworzenia kontaktu" },
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
      validatedParams = validateQueryParams(contactQuerySchema, searchParams)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: error.errors[0].message },
          { status: 400 }
        )
      }
      throw error
    }

    const where: any = {}

    if (user.role !== "ADMIN") {
      where.OR = [
        {
          client: {
            OR: [
              { assignedTo: user.id },
              { sharedGroups: { some: { users: { some: { userId: user.id } } } } },
            ],
          },
        },
        {
          sharedGroups: {
            some: {
              users: {
                some: {
                  userId: user.id,
                },
              },
            },
          },
        },
      ]
    }

    if (validatedParams.clientId) {
      where.clientId = validatedParams.clientId
    }

    if (validatedParams.type) {
      where.type = validatedParams.type as ContactType
    }

    if (validatedParams.userId) {
      where.userId = validatedParams.userId
    }

    const contacts = await db.contact.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            agencyName: true,
            firstName: true,
            lastName: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        attachments: true,
        sharedGroups: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    })

    return NextResponse.json({ contacts })
  } catch (error) {
    console.error("Contacts fetch error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas pobierania kontaktów" },
      { status: 500 }
    )
  }
}

