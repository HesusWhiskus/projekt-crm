import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { ContactType } from "@prisma/client"
import { z } from "zod"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { validateFiles, generateSafeFilename, MAX_FILES_PER_UPLOAD } from "@/lib/file-upload"
import { validateQueryParams, contactQuerySchema } from "@/lib/query-validator"
import { textFieldSchema } from "@/lib/field-validators"

const createContactSchema = z.object({
  type: z.nativeEnum(ContactType).optional(), // Optional for notes (isNote=true)
  date: z.string().refine(
    (val) => {
      if (!val) return false
      const date = new Date(val)
      return !isNaN(date.getTime())
    },
    { message: "Nieprawidłowy format daty" }
  ),
  notes: z.string().min(1, "Notatka jest wymagana").max(10000, "Notatka jest zbyt długa (max 10000 znaków)").trim(),
  isNote: z.boolean().default(false), // Flag to distinguish notes from contacts
  userId: z.string().refine((val) => val && val.length > 0, { message: "Użytkownik jest wymagany" }),
  clientId: z.string().refine((val) => val && val.length > 0, { message: "Klient jest wymagany" }),
  sharedGroupIds: z.array(z.string()).optional(),
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
    
    // Convert empty strings to empty string (schema will validate with refine)
    const userIdValue = formData.get("userId")
    const clientIdValue = formData.get("clientId")
    
    // Parse isNote (checkbox - "true" or null)
    const isNoteValue = formData.get("isNote")
    const isNote = isNoteValue === "true" || String(isNoteValue) === "true"
    
    const parsedData = {
      type: formData.get("type") || undefined, // Optional for notes
      date: formData.get("date"),
      notes: formData.get("notes"),
      isNote: isNote,
      userId: userIdValue ? String(userIdValue) : "",
      clientId: clientIdValue ? String(clientIdValue) : "",
      sharedGroupIds,
    }
    console.log("[DEBUG CONTACTS POST] Parsed formData:", JSON.stringify(parsedData, null, 2))
    console.log("[DEBUG CONTACTS POST] userId:", parsedData.userId, "type:", typeof parsedData.userId)
    console.log("[DEBUG CONTACTS POST] clientId:", parsedData.clientId, "type:", typeof parsedData.clientId)
    console.log("[DEBUG CONTACTS POST] sharedGroupIds:", parsedData.sharedGroupIds, "type:", typeof parsedData.sharedGroupIds, "isArray:", Array.isArray(parsedData.sharedGroupIds))
    let validatedData
    try {
      validatedData = createContactSchema.parse(parsedData)
      console.log("[DEBUG CONTACTS POST] Validated data:", JSON.stringify(validatedData, null, 2))
    } catch (error: any) {
      console.error("[DEBUG CONTACTS POST] Validation error:", error)
      if (error instanceof z.ZodError) {
        console.error("[DEBUG CONTACTS POST] Zod errors:", JSON.stringify(error.errors, null, 2))
      }
      throw error
    }

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

    // Create contact and update lastContactAt in a transaction
    const contact = await db.$transaction(async (tx) => {
      // Create contact
      const newContact = await tx.contact.create({
        data: {
          type: validatedData.type || null, // null for notes
          date: new Date(validatedData.date),
          notes: validatedData.notes,
          isNote: validatedData.isNote,
          userId: validatedData.userId,
          clientId: validatedData.clientId,
          sharedGroups: validatedData.sharedGroupIds
            ? {
                connect: validatedData.sharedGroupIds.map((id) => ({ id })),
              }
            : undefined,
        },
      })

      // Update lastContactAt if this is a contact (not a note)
      if (!validatedData.isNote) {
        await tx.client.update({
          where: { id: validatedData.clientId },
          data: { lastContactAt: new Date(validatedData.date) },
        })
      }

      return newContact
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
      console.error("[DEBUG CONTACTS POST] ZodError details:", JSON.stringify(error.errors, null, 2))
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
