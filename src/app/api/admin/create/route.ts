import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hash } from "bcryptjs"

/**
 * Endpoint do utworzenia konta administratora
 * Działa tylko jeśli nie ma jeszcze żadnego ADMIN w bazie
 */
export async function POST(request: Request) {
  try {
    // Sprawdź czy jest już jakiś ADMIN
    const existingAdmin = await db.user.findFirst({
      where: { role: "ADMIN" },
    })

    if (existingAdmin) {
      return NextResponse.json({
        exists: true,
        message: "Administrator już istnieje",
        admin: {
          email: existingAdmin.email,
          name: existingAdmin.name,
        },
      })
    }

    const body = await request.json()
    const email = body.email || "admin@example.com"
    const password = body.password || "Admin123!"
    const name = body.name || "Administrator"

    // Sprawdź czy użytkownik już istnieje
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    let admin

    if (existingUser) {
      // Aktualizuj istniejącego użytkownika na admina
      const hashedPassword = await hash(password, 10)
      admin = await db.user.update({
        where: { email },
        data: {
          name,
          password: hashedPassword,
          role: "ADMIN",
        },
      })
    } else {
      // Utwórz nowego administratora
      const hashedPassword = await hash(password, 10)
      admin = await db.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: "ADMIN",
          emailVerified: new Date(),
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: "Konto administratora zostało utworzone",
      admin: {
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
      credentials: {
        email: email,
        password: password,
      },
    })
  } catch (error) {
    console.error("Create admin error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas tworzenia administratora" },
      { status: 500 }
    )
  }
}

