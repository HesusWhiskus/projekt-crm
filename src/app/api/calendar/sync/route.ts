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
    
    // Provide more specific error messages
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    
    if (errorMessage.includes("access token not found") || errorMessage.includes("sign in with Google")) {
      return NextResponse.json(
        { 
          error: "Brak dostępu do Google Calendar. Zaloguj się przez Google, aby włączyć synchronizację kalendarza.",
          requiresGoogleAuth: true
        },
        { status: 401 }
      )
    }
    
    if (errorMessage.includes("refresh") || errorMessage.includes("expired")) {
      return NextResponse.json(
        { 
          error: "Sesja Google wygasła. Zaloguj się ponownie przez Google.",
          requiresReauth: true
        },
        { status: 401 }
      )
    }
    
    if (errorMessage.includes("insufficient") || errorMessage.includes("permission") || errorMessage.includes("scope")) {
      return NextResponse.json(
        { 
          error: "Brak uprawnień do Google Calendar. Sprawdź ustawienia aplikacji w Google Cloud Console.",
          requiresScope: true
        },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { 
        error: "Wystąpił błąd podczas synchronizacji z kalendarzem",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}

