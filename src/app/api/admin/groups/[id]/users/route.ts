import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { revalidateTag } from "next/cache"

const addUserSchema = z.object({
  userId: z.string().min(1, "ID użytkownika jest wymagane"),
})

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = addUserSchema.parse(body)

    // Check if group exists
    const group = await db.group.findUnique({
      where: { id: params.id },
    })

    if (!group) {
      return NextResponse.json({ error: "Grupa nie znaleziona" }, { status: 404 })
    }

    // Check if user exists
    const targetUser = await db.user.findUnique({
      where: { id: validatedData.userId },
    })

    if (!targetUser) {
      return NextResponse.json({ error: "Użytkownik nie znaleziony" }, { status: 404 })
    }

    // Check if user is already in group
    const existing = await db.userGroup.findUnique({
      where: {
        userId_groupId: {
          userId: validatedData.userId,
          groupId: params.id,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Użytkownik już jest w tej grupie" },
        { status: 400 }
      )
    }

    // Add user to group
    await db.userGroup.create({
      data: {
        userId: validatedData.userId,
        groupId: params.id,
      },
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: "USER_ADDED_TO_GROUP",
        entityType: "Group",
        entityId: params.id,
        details: {
          groupName: group.name,
          userId: validatedData.userId,
          userEmail: targetUser.email,
        },
      },
    })

    // Invalidate groups cache (group membership changed)
    revalidateTag('groups')

    return NextResponse.json(
      { message: "Użytkownik został dodany do grupy" },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Add user to group error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas dodawania użytkownika do grupy" },
      { status: 500 }
    )
  }
}

