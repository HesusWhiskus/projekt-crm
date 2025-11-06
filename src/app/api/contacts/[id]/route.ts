import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { ContactType } from "@prisma/client"
import { z } from "zod"
import { uuidSchema } from "@/lib/query-validator"
import { textFieldSchema } from "@/lib/field-validators"

const updateContactSchema = z.object({
  type: z.nativeEnum(ContactType).optional(),
  date: z.string().refine(
    (val) => {
      if (!val || val === "") return true // Optional
      const date = new Date(val)
      return !isNaN(date.getTime())
    },
    { message: "Nieprawidłowy format daty" }
  ).optional(),
  notes: z.string().min(1, "Notatka jest wymagana").max(10000, "Notatka jest zbyt długa (max 10000 znaków)").trim().optional(),
  userId: z.string().optional(),
  clientId: z.string().optional(),
  sharedGroupIds: z.array(z.string()).optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Validate UUID
    let validatedId: string
    try {
      validatedId = uuidSchema.parse(params.id)
    } catch {
      return NextResponse.json({ error: "Nieprawidłowy format ID" }, { status: 400 })
    }
    
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

    const parsedData = {
      type: formData.get("type") || undefined,
      date: formData.get("date") || undefined,
      notes: formData.get("notes") || undefined,
      userId: formData.get("userId") || undefined,
      clientId: formData.get("clientId") || undefined,
      sharedGroupIds,
    }
    console.log("[DEBUG CONTACTS PATCH] Parsed formData:", JSON.stringify(parsedData, null, 2))
    console.log("[DEBUG CONTACTS PATCH] userId:", parsedData.userId, "type:", typeof parsedData.userId)
    console.log("[DEBUG CONTACTS PATCH] clientId:", parsedData.clientId, "type:", typeof parsedData.clientId)
    console.log("[DEBUG CONTACTS PATCH] sharedGroupIds:", parsedData.sharedGroupIds, "type:", typeof parsedData.sharedGroupIds, "isArray:", Array.isArray(parsedData.sharedGroupIds))
    let validatedData
    try {
      validatedData = updateContactSchema.parse(parsedData)
      console.log("[DEBUG CONTACTS PATCH] Validated data:", JSON.stringify(validatedData, null, 2))
    } catch (error: any) {
      console.error("[DEBUG CONTACTS PATCH] Validation error:", error)
      if (error instanceof z.ZodError) {
        console.error("[DEBUG CONTACTS PATCH] Zod errors:", JSON.stringify(error.errors, null, 2))
      }
      throw error
    }

    // Check if contact exists
    const existingContact = await db.contact.findUnique({
      where: { id: validatedId },
      include: {
        client: true,
        sharedGroups: {
          include: {
            users: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    })

    if (!existingContact) {
      return NextResponse.json({ error: "Kontakt nie znaleziony" }, { status: 404 })
    }

    // Check access
    const hasAccess =
      user.role === "ADMIN" ||
      existingContact.userId === user.id ||
      existingContact.client.assignedTo === user.id ||
      existingContact.sharedGroups.some((g: any) =>
        g.users.some((ug: any) => ug.userId === user.id)
      )

    if (!hasAccess) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 })
    }

    // Prepare update data
    const updateData: any = {}
    if (validatedData.type !== undefined) updateData.type = validatedData.type
    if (validatedData.date !== undefined) updateData.date = new Date(validatedData.date)
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes
    if (validatedData.userId !== undefined) updateData.userId = validatedData.userId
    if (validatedData.clientId !== undefined) updateData.clientId = validatedData.clientId

    // Handle shared groups
    if (validatedData.sharedGroupIds !== undefined) {
      updateData.sharedGroups = {
        set: validatedData.sharedGroupIds.map((id) => ({ id })),
      }
    }

    const contact = await db.contact.update({
      where: { id: validatedId },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            agencyName: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        sharedGroups: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: "CONTACT_UPDATED",
        entityType: "Contact",
        entityId: validatedId,
        details: {
          updatedFields: Object.keys(validatedData),
        },
      },
    })

    return NextResponse.json({ contact })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("[DEBUG CONTACTS PATCH] ZodError details:", JSON.stringify(error.errors, null, 2))
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Contact update error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas aktualizacji kontaktu" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Validate UUID
    let validatedId: string
    try {
      validatedId = uuidSchema.parse(params.id)
    } catch {
      return NextResponse.json({ error: "Nieprawidłowy format ID" }, { status: 400 })
    }
    
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 })
    }

    const contact = await db.contact.findUnique({
      where: { id: validatedId },
      include: {
        client: true,
      },
    })

    if (!contact) {
      return NextResponse.json({ error: "Kontakt nie znaleziony" }, { status: 404 })
    }

    // Check access
    const hasAccess =
      user.role === "ADMIN" ||
      contact.userId === user.id ||
      contact.client.assignedTo === user.id

    if (!hasAccess) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 })
    }

    await db.contact.delete({
      where: { id: validatedId },
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: "CONTACT_DELETED",
        entityType: "Contact",
        entityId: validatedId,
      },
    })

    return NextResponse.json({ message: "Kontakt został usunięty" })
  } catch (error) {
    console.error("Contact deletion error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas usuwania kontaktu" },
      { status: 500 }
    )
  }
}
