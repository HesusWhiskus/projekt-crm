import { NextResponse } from "next/server"
import { db } from "@/lib/db"

/**
 * @swagger
 * /api/organizations:
 *   get:
 *     summary: Pobiera listę wszystkich organizacji
 *     description: Publiczny endpoint zwracający listę organizacji. Używany w formularzu rejestracji do wyboru organizacji.
 *     tags: [Organizations]
 *     responses:
 *       200:
 *         description: Lista organizacji
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 organizations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       plan:
 *                         type: string
 *                         enum: [BASIC, PRO]
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

    return NextResponse.json({
      organizations,
    })
  } catch (error) {
    console.error("Error fetching organizations:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas pobierania organizacji" },
      { status: 500 }
    )
  }
}

