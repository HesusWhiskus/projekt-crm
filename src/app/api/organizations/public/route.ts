import { NextResponse } from "next/server"
import { db } from "@/lib/db"

/**
 * GET /api/organizations/public
 * Publiczny endpoint do pobierania listy organizacji (dla rejestracji)
 */
export async function GET() {
  try {
    const organizations = await db.organization.findMany({
      select: {
        id: true,
        name: true,
        plan: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json({ organizations })
  } catch (error) {
    console.error("Get public organizations error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas pobierania organizacji" },
      { status: 500 }
    )
  }
}

