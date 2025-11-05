import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const createGroupSchema = z.object({
  name: z.string().min(2, "Nazwa grupy musi mieć co najmniej 2 znaki"),
  description: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createGroupSchema.parse(body)

    // Check if group with this name already exists
    const existingGroup = await db.group.findUnique({
      where: { name: validatedData.name },
    })

    if (existingGroup) {
      return NextResponse.json(
        { error: "Grupa o tej nazwie już istnieje" },
        { status: 400 }
      )
    }

    const group = await db.group.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
      },
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: "GROUP_CREATED",
        entityType: "Group",
        entityId: group.id,
        details: {
          name: group.name,
        },
      },
    })

    return NextResponse.json(
      { message: "Grupa została utworzona", group },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Group creation error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas tworzenia grupy" },
      { status: 500 }
    )
  }
}

