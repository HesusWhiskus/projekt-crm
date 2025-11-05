import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { TaskStatus } from "@prisma/client"
import { z } from "zod"

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  assignedTo: z.string().optional(),
  clientId: z.string().optional(),
  sharedGroupIds: z.array(z.string()).optional(),
})

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 })
    }

    const task = await db.task.findUnique({
      where: { id: params.id },
      include: {
        assignee: true,
        client: true,
        sharedGroups: {
          include: {
            users: true,
          },
        },
      },
    })

    if (!task) {
      return NextResponse.json({ error: "Zadanie nie znalezione" }, { status: 404 })
    }

    // Check access
    if (
      user.role !== "ADMIN" &&
      task.assignedTo !== user.id &&
      !task.sharedGroups.some((g) =>
        g.users.some((ug) => ug.userId === user.id)
      )
    ) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 })
    }

    return NextResponse.json({ task })
  } catch (error) {
    console.error("Task fetch error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas pobierania zadania" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateTaskSchema.parse(body)

    // Check if task exists and user has access
    const existingTask = await db.task.findUnique({
      where: { id: params.id },
    })

    if (!existingTask) {
      return NextResponse.json({ error: "Zadanie nie znalezione" }, { status: 404 })
    }

    // Check access
    if (
      user.role !== "ADMIN" &&
      existingTask.assignedTo !== user.id
    ) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 })
    }

    const updateData: any = {}
    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (validatedData.description !== undefined) updateData.description = validatedData.description || null
    if (validatedData.dueDate !== undefined) updateData.dueDate = validatedData.dueDate ? new Date(validatedData.dueDate) : null
    if (validatedData.status !== undefined) updateData.status = validatedData.status
    if (validatedData.assignedTo !== undefined) updateData.assignedTo = validatedData.assignedTo || null
    if (validatedData.clientId !== undefined) updateData.clientId = validatedData.clientId || null

    // Handle shared groups
    if (validatedData.sharedGroupIds !== undefined) {
      updateData.sharedGroups = {
        set: validatedData.sharedGroupIds.map((id) => ({ id })),
      }
    }

    const updatedTask = await db.task.update({
      where: { id: params.id },
      data: updateData,
      include: {
        assignee: true,
        client: true,
      },
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: "TASK_UPDATED",
        entityType: "Task",
        entityId: params.id,
        details: {
          updatedFields: Object.keys(updateData),
        },
      },
    })

    return NextResponse.json({ task: updatedTask })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Task update error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas aktualizacji zadania" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 })
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 })
    }

    const task = await db.task.findUnique({
      where: { id: params.id },
    })

    if (!task) {
      return NextResponse.json({ error: "Zadanie nie znalezione" }, { status: 404 })
    }

    await db.task.delete({
      where: { id: params.id },
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: "TASK_DELETED",
        entityType: "Task",
        entityId: params.id,
        details: {
          title: task.title,
        },
      },
    })

    return NextResponse.json({ message: "Zadanie zostało usunięte" })
  } catch (error) {
    console.error("Task deletion error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas usuwania zadania" },
      { status: 500 }
    )
  }
}

