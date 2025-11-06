import { NextResponse } from "next/server"
import { db } from "@/lib/db"

/**
 * Endpoint do promocji użytkownika na ADMIN
 * Działa tylko jeśli nie ma jeszcze żadnego ADMIN w bazie
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: "Email jest wymagany" },
        { status: 400 }
      )
    }

    // Sprawdź czy jest już jakiś ADMIN
    const existingAdmin = await db.user.findFirst({
      where: { role: "ADMIN" },
    })

    if (existingAdmin) {
      return NextResponse.json(
        { error: "Administrator już istnieje. Tylko pierwszy użytkownik może zostać administratorem przez ten endpoint." },
        { status: 403 }
      )
    }

    // Znajdź użytkownika
    const user = await db.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Użytkownik nie został znaleziony" },
        { status: 404 }
      )
    }

    // Zaktualizuj rolę na ADMIN
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: { role: "ADMIN" },
    })

    return NextResponse.json({
      message: "Użytkownik został awansowany na administratora",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
      },
    })
  } catch (error) {
    console.error("Promote user error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas promocji użytkownika" },
      { status: 500 }
    )
  }
}

