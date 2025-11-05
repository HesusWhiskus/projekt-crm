import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 })
    }

    // Check if group exists
    const group = await db.group.findUnique({
      where: { id: params.id },
    })

    if (!group) {
      return NextResponse.json({ error: "Grupa nie znaleziona" }, { status: 404 })
    }

    // Check if user exists
    const targetUser = await db.user.findUnique({
      where: { id: params.userId },
    })

    if (!targetUser) {
      return NextResponse.json({ error: "Użytkownik nie znaleziony" }, { status: 404 })
    }

    // Remove user from group
    await db.userGroup.delete({
      where: {
        userId_groupId: {
          userId: params.userId,
          groupId: params.id,
        },
      },
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: "USER_REMOVED_FROM_GROUP",
        entityType: "Group",
        entityId: params.id,
        details: {
          groupName: group.name,
          userId: params.userId,
          userEmail: targetUser.email,
        },
      },
    })

    return NextResponse.json({ message: "Użytkownik został usunięty z grupy" })
  } catch (error) {
    console.error("Remove user from group error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas usuwania użytkownika z grupy" },
      { status: 500 }
    )
  }
}

