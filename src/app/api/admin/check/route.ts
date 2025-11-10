import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// Force dynamic rendering - this route requires database access
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * @swagger
 * /api/admin/check:
 *   get:
 *     summary: Sprawdza czy istnieje administrator
 *     description: Sprawdza czy w systemie istnieje co najmniej jeden użytkownik z rolą ADMIN. Endpoint publiczny (nie wymaga autoryzacji).
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Status administratora
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exists:
 *                   type: boolean
 *                   description: Czy administrator istnieje
 *                 admin:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                   description: Dane administratora (jeśli istnieje)
 *                 message:
 *                   type: string
 *                   nullable: true
 *                   description: Komunikat (jeśli administrator nie istnieje)
 *       500:
 *         description: Błąd serwera
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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

