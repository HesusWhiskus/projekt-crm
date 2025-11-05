import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { syncTaskToCalendar } from "@/lib/google-calendar"
import { z } from "zod"

const syncSchema = z.object({
  taskId: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = syncSchema.parse(body)

    const event = await syncTaskToCalendar(user.id, validatedData.taskId)

    return NextResponse.json({
      message: "Zadanie zostało zsynchronizowane z kalendarzem Google",
      eventId: event.id,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Calendar sync error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas synchronizacji z kalendarzem" },
      { status: 500 }
    )
  }
}

