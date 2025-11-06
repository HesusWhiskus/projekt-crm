import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { ClientStatus } from "@prisma/client"
import { z } from "zod"
import { validateQueryParams, clientQuerySchema } from "@/lib/query-validator"
import { phoneSchema, websiteSchema, emailSchema, textFieldSchema, nameSchema, agencyNameSchema } from "@/lib/field-validators"

const createClientSchema = z.object({
  firstName: nameSchema("Imię", 1, 50),
  lastName: nameSchema("Nazwisko", 1, 50),
  agencyName: agencyNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  website: websiteSchema,
  address: textFieldSchema(500, "Adres"),
  source: textFieldSchema(100, "Źródło"),
  status: z.nativeEnum(ClientStatus).default(ClientStatus.NEW_LEAD),
  assignedTo: z.string().optional(),
  sharedGroupIds: z.array(z.string()).optional(),
})

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 })
    }

    const body = await request.json()
    console.log("[DEBUG CLIENTS POST] Received body:", JSON.stringify(body, null, 2))
    console.log("[DEBUG CLIENTS POST] assignedTo:", body.assignedTo, "type:", typeof body.assignedTo)
    const validatedData = createClientSchema.parse(body)
    console.log("[DEBUG CLIENTS POST] Validated data:", JSON.stringify(validatedData, null, 2))

    const client = await db.client.create({
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        agencyName: validatedData.agencyName || null,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        website: validatedData.website || null,
        address: validatedData.address || null,
        source: validatedData.source || null,
        status: validatedData.status,
        assignedTo: validatedData.assignedTo || null,
        sharedGroups: validatedData.sharedGroupIds
          ? {
              connect: validatedData.sharedGroupIds.map((id) => ({ id })),
            }
          : undefined,
      },
    })

    // Create status history entry
    await db.clientStatusHistory.create({
      data: {
        clientId: client.id,
        status: client.status,
        changedBy: user.id,
        notes: "Utworzenie klienta",
      },
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: "CLIENT_CREATED",
        entityType: "Client",
        entityId: client.id,
        details: {
          agencyName: client.agencyName,
          status: client.status,
        },
      },
    })

    return NextResponse.json({ client }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Client creation error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas tworzenia klienta" },
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
      validatedParams = validateQueryParams(clientQuerySchema, searchParams)
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
        { assignedTo: user.id },
        { sharedGroups: { some: { users: { some: { userId: user.id } } } } },
      ]
    }

    if (validatedParams.status) {
      where.status = validatedParams.status as ClientStatus
    }

    if (validatedParams.search) {
      where.OR = [
        ...(where.OR || []),
        { agencyName: { contains: validatedParams.search, mode: "insensitive" } },
        { firstName: { contains: validatedParams.search, mode: "insensitive" } },
        { lastName: { contains: validatedParams.search, mode: "insensitive" } },
        { email: { contains: validatedParams.search, mode: "insensitive" } },
      ]
    }

    if (validatedParams.assignedTo) {
      where.assignedTo = validatedParams.assignedTo
    }

    const clients = await db.client.findMany({
      where,
      include: {
        assignee: true,
        sharedGroups: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    return NextResponse.json({ clients })
  } catch (error) {
    console.error("Clients fetch error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas pobierania klientów" },
      { status: 500 }
    )
  }
}
