import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { validateFiles, generateSafeFilename, MAX_FILES_PER_UPLOAD } from "@/lib/file-upload"
import { textFieldSchema } from "@/lib/field-validators"
import { applyRateLimit, logApiActivity } from "@/lib/api-security"

const createNoteSchema = z.object({
  date: z.string().refine(
    (val) => {
      if (!val) return false
      const date = new Date(val)
      return !isNaN(date.getTime())
    },
    { message: "Nieprawidłowy format daty" }
  ),
  notes: z.string().min(1, "Notatka jest wymagana").max(10000, "Notatka jest zbyt długa (max 10000 znaków)").trim(),
  userId: z.string().refine((val) => val && val.length > 0, { message: "Użytkownik jest wymagany" }),
  clientId: z.string().refine((val) => val && val.length > 0, { message: "Klient jest wymagany" }),
  sharedGroupIds: z.array(z.string()).optional(),
})

/**
 * @swagger
 * /api/notes:
 *   post:
 *     summary: Tworzy nową notatkę
 *     description: Tworzy nową notatkę dla klienta. Wymaga autoryzacji. Notatki nie aktualizują daty ostatniego kontaktu.
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - notes
 *               - userId
 *               - clientId
 *             properties:
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: Data i godzina notatki (ISO string)
 *               notes:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 10000
 *                 description: Treść notatki
 *               userId:
 *                 type: string
 *                 description: CUID użytkownika tworzącego notatkę
 *               clientId:
 *                 type: string
 *                 description: CUID klienta
 *               sharedGroupIds:
 *                 type: string
 *                 description: JSON array string lub comma-separated string z ID grup
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Pliki do załączenia (opcjonalne, max 5 plików)
 *     responses:
 *       201:
 *         description: Notatka została utworzona
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contact:
 *                   $ref: '#/components/schemas/Contact'
 *       400:
 *         description: Błąd walidacji
 *       401:
 *         description: Nieautoryzowany
 *       403:
 *         description: Brak uprawnień do klienta
 *       404:
 *         description: Klient nie znaleziony
 *       500:
 *         description: Błąd serwera
 */
export async function POST(request: Request) {
  try {
    // Rate limiting
    const rateLimitResponse = await applyRateLimit(request, "api")
    if (rateLimitResponse) return rateLimitResponse

    const user = await getCurrentUser()
    if (!user) {
      await logApiActivity(null, "API_UNAUTHORIZED_ATTEMPT", "Note", null, {}, request)
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
    
    const userIdValue = formData.get("userId")
    const clientIdValue = formData.get("clientId")
    
    const parsedData = {
      date: formData.get("date"),
      notes: formData.get("notes"),
      userId: userIdValue ? String(userIdValue) : "",
      clientId: clientIdValue ? String(clientIdValue) : "",
      sharedGroupIds,
    }
    
    console.log("[DEBUG NOTES POST] Parsed formData:", JSON.stringify(parsedData, null, 2))
    console.log("[DEBUG NOTES POST] clientId:", parsedData.clientId, "type:", typeof parsedData.clientId, "length:", parsedData.clientId?.length)
    
    let validatedData
    try {
      validatedData = createNoteSchema.parse(parsedData)
      console.log("[DEBUG NOTES POST] Validated data:", JSON.stringify(validatedData, null, 2))
    } catch (error: any) {
      console.error("[DEBUG NOTES POST] Validation error:", error)
      if (error instanceof z.ZodError) {
        console.error("[DEBUG NOTES POST] Zod errors:", JSON.stringify(error.errors, null, 2))
        const firstError = error.errors[0]
        if (firstError.path.includes("clientId")) {
          return NextResponse.json({ error: "Klient jest wymagany. Proszę wybrać klienta." }, { status: 400 })
        }
        return NextResponse.json({ error: firstError.message || "Błąd walidacji danych" }, { status: 400 })
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

    // Create note (isNote=true, type=null)
    const note = await db.contact.create({
      data: {
        type: null, // Notes don't have a type
        date: new Date(validatedData.date),
        notes: validatedData.notes,
        isNote: true, // Always true for notes
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
      const validFiles = files.filter((f) => f.size > 0).slice(0, MAX_FILES_PER_UPLOAD)
      
      if (validFiles.length > 0) {
        const validationResult = validateFiles(validFiles)
        if (!validationResult.valid) {
          return NextResponse.json({ error: validationResult.error }, { status: 400 })
        }

        const uploadDir = join(process.cwd(), "public", "uploads", "contacts")
        await mkdir(uploadDir, { recursive: true })

        const attachments = []
        for (const file of validFiles) {
          const safeFilename = generateSafeFilename(file.name)
          const filePath = join(uploadDir, safeFilename)
          const bytes = await file.arrayBuffer()
          const buffer = Buffer.from(bytes)
          await writeFile(filePath, buffer)

          const attachment = await db.attachment.create({
            data: {
              filename: safeFilename,
              path: `/uploads/contacts/${safeFilename}`,
              size: file.size,
              mimeType: file.type || null,
              contactId: note.id,
            },
          })
          attachments.push(attachment)
        }
      }
    }

    // Fetch the created note with relations
    const noteWithRelations = await db.contact.findUnique({
      where: { id: note.id },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            type: true,
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
    })

    // Log API activity
    await logApiActivity(user.id, "NOTE_CREATED", "Note", note.id, { clientId: validatedData.clientId }, request)

    return NextResponse.json({ contact: noteWithRelations }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("[DEBUG NOTES POST] ZodError details:", JSON.stringify(error.errors, null, 2))
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Note creation error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas tworzenia notatki" },
      { status: 500 }
    )
  }
}

