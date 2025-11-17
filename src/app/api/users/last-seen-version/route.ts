import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { applyRateLimit } from "@/lib/api-security"

/**
 * GET /api/users/last-seen-version
 * Pobiera ostatnią zobaczoną wersję changelogu dla użytkownika
 */
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 })
    }

    const preferences = await db.userPreferences.findUnique({
      where: { userId: user.id },
      select: { lastSeenVersion: true },
    })

    return NextResponse.json({
      lastSeenVersion: preferences?.lastSeenVersion || null,
    })
  } catch (error) {
    console.error("Get last seen version error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas pobierania ostatniej zobaczonej wersji" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/users/last-seen-version
 * Zapisuje ostatnią zobaczoną wersję changelogu dla użytkownika
 */
export async function POST(request: Request) {
  try {
    // Rate limiting
    const rateLimitResponse = await applyRateLimit(request, "api")
    if (rateLimitResponse) return rateLimitResponse

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 })
    }

    const body = await request.json()
    const { version } = body

    if (!version || typeof version !== "string") {
      return NextResponse.json(
        { error: "Wersja jest wymagana" },
        { status: 400 }
      )
    }

    // Upsert preferences with lastSeenVersion
    await db.userPreferences.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        lastSeenVersion: version,
      },
      update: {
        lastSeenVersion: version,
      },
    })

    return NextResponse.json({
      message: "Ostatnia zobaczona wersja została zaktualizowana",
      lastSeenVersion: version,
    })
  } catch (error) {
    console.error("Update last seen version error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas aktualizacji ostatniej zobaczonej wersji" },
      { status: 500 }
    )
  }
}

