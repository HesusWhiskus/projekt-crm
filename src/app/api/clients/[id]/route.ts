import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { ClientStatus } from "@prisma/client"
import { z } from "zod"
import { uuidSchema } from "@/lib/query-validator"
import { phoneSchema, websiteSchema, emailSchema, textFieldSchema, nameSchema, agencyNameSchema } from "@/lib/field-validators"

const updateClientSchema = z.object({
  firstName: nameSchema("Imię", 1, 50).optional(),
  lastName: nameSchema("Nazwisko", 1, 50).optional(),
  agencyName: agencyNameSchema.optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  website: websiteSchema.optional(),
  address: textFieldSchema(500, "Adres").optional(),
  source: textFieldSchema(100, "Źródło").optional(),
  status: z.nativeEnum(ClientStatus).optional(),
  assignedTo: z.string().optional(),
  sharedGroupIds: z.array(z.string()).optional(),
})

export async function GET(
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

    const client = await db.client.findUnique({
      where: { id: validatedId },
      include: {
        assignee: true,
        sharedGroups: {
          include: {
            users: true,
          },
        },
        contacts: {
          orderBy: { date: "desc" },
          include: {
            user: true,
            attachments: true,
          },
        },
        tasks: {
          orderBy: { dueDate: "asc" },
          include: {
            assignee: true,
          },
        },
        statusHistory: {
          orderBy: { changedAt: "desc" },
          include: {
            client: {
              select: {
                agencyName: true,
              },
            },
          },
        },
      },
    })

    if (!client) {
      return NextResponse.json({ error: "Klient nie znaleziony" }, { status: 404 })
    }

    // Check access
    if (
      user.role !== "ADMIN" &&
      client.assignedTo !== user.id &&
      !client.sharedGroups.some((g) =>
        g.users.some((ug) => ug.userId === user.id)
      )
    ) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 })
    }

    return NextResponse.json({ client })
  } catch (error) {
    console.error("Client fetch error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas pobierania klienta" },
      { status: 500 }
    )
  }
}

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

    const body = await request.json()
    const validatedData = updateClientSchema.parse(body)

    // Check if client exists and user has access
    const existingClient = await db.client.findUnique({
      where: { id: validatedId },
    })

    if (!existingClient) {
      return NextResponse.json({ error: "Klient nie znaleziony" }, { status: 404 })
    }

    // Check access
    if (
      user.role !== "ADMIN" &&
      existingClient.assignedTo !== user.id
    ) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 })
    }

    const updateData: any = {}
    if (validatedData.firstName !== undefined) updateData.firstName = validatedData.firstName
    if (validatedData.lastName !== undefined) updateData.lastName = validatedData.lastName
    if (validatedData.agencyName !== undefined) updateData.agencyName = validatedData.agencyName || null
    if (validatedData.email !== undefined) updateData.email = validatedData.email || null
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone || null
    if (validatedData.website !== undefined) updateData.website = validatedData.website || null
    if (validatedData.address !== undefined) updateData.address = validatedData.address || null
    if (validatedData.source !== undefined) updateData.source = validatedData.source || null
    if (validatedData.status !== undefined) updateData.status = validatedData.status
    if (validatedData.assignedTo !== undefined) updateData.assignedTo = validatedData.assignedTo || null

    // Handle shared groups
    if (validatedData.sharedGroupIds !== undefined) {
      updateData.sharedGroups = {
        set: validatedData.sharedGroupIds.map((id) => ({ id })),
      }
    }

    // Handle status change
    if (validatedData.status !== undefined && validatedData.status !== existingClient.status) {
      updateData.status = validatedData.status
      // Create status history entry
      await db.clientStatusHistory.create({
        data: {
          clientId: validatedId,
          status: validatedData.status,
          changedBy: user.id,
          notes: `Zmiana statusu z ${existingClient.status} na ${validatedData.status}`,
        },
      })
    }

    const updatedClient = await db.client.update({
      where: { id: validatedId },
      data: updateData,
      include: {
        assignee: true,
        sharedGroups: {
          include: {
            users: true,
          },
        },
      },
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: "CLIENT_UPDATED",
        entityType: "Client",
        entityId: validatedId,
        details: {
          updatedFields: Object.keys(updateData),
        },
      },
    })

    return NextResponse.json({ client: updatedClient })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Client update error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas aktualizacji klienta" },
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

    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 })
    }

    const client = await db.client.findUnique({
      where: { id: validatedId },
    })

    if (!client) {
      return NextResponse.json({ error: "Klient nie znaleziony" }, { status: 404 })
    }

    await db.client.delete({
      where: { id: validatedId },
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: "CLIENT_DELETED",
        entityType: "Client",
        entityId: validatedId,
        details: {
          agencyName: client.agencyName,
        },
      },
    })

    return NextResponse.json({ message: "Klient został usunięty" })
  } catch (error) {
    console.error("Client deletion error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas usuwania klienta" },
      { status: 500 }
    )
  }
}
