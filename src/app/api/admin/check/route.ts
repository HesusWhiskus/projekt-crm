import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// Force dynamic rendering - this route requires database access
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Endpoint do sprawdzenia czy istnieje administrator
 */
export async function GET() {
  try {
    const admin = await db.user.findFirst({
      where: { role: "ADMIN" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })

    if (admin) {
      return NextResponse.json({
        exists: true,
        admin: {
          email: admin.email,
          name: admin.name,
        },
      })
    }

    return NextResponse.json({
      exists: false,
      message: "Brak administratora w bazie danych",
    })
  } catch (error) {
    console.error("Check admin error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas sprawdzania administratora" },
      { status: 500 }
    )
  }
}

