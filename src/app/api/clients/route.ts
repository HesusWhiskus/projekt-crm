import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { ClientStatus } from "@prisma/client"
import { z } from "zod"

const createClientSchema = z.object({
  firstName: z.string().min(1, "Imię jest wymagane"),
  lastName: z.string().min(1, "Nazwisko jest wymagane"),
  agencyName: z.string().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  address: z.string().optional(),
  source: z.string().optional(),
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
    const validatedData = createClientSchema.parse(body)

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
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const assignedTo = searchParams.get("assignedTo")

    const where: any = {}

    if (user.role !== "ADMIN") {
      where.OR = [
        { assignedTo: user.id },
        { sharedGroups: { some: { users: { some: { userId: user.id } } } } },
      ]
    }

    if (status) {
      where.status = status as ClientStatus
    }

    if (search) {
      where.OR = [
        ...(where.OR || []),
        { agencyName: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ]
    }

    if (assignedTo) {
      where.assignedTo = assignedTo
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

