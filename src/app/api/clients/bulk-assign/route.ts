import { NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/presentation/api/middleware/auth'
import { applyRateLimit, logApiActivity } from '@/lib/api-security'
import { z } from 'zod'
import { db } from '@/lib/db'

/**
 * @swagger
 * /api/clients/bulk-assign:
 *   post:
 *     summary: Masowo przydziela klientów do użytkownika
 *     description: Masowo aktualizuje przypisanie klientów do użytkownika. Wymaga autoryzacji ADMIN lub właściciela klientów.
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clientIds
 *               - assignedTo
 *             properties:
 *               clientIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array ID klientów do przypisania
 *               assignedTo:
 *                 type: string
 *                 description: ID użytkownika do przypisania (może być null aby usunąć przypisanie)
 *     responses:
 *       200:
 *         description: Klienci zostali przypisani
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 updated:
 *                   type: number
 *       400:
 *         description: Błąd walidacji
 *       401:
 *         description: Nieautoryzowany
 *       403:
 *         description: Brak uprawnień
 *       500:
 *         description: Błąd serwera
 */
export async function POST(request: Request) {
  try {
    // Rate limiting
    const rateLimitResponse = await applyRateLimit(request, "api")
    if (rateLimitResponse) return rateLimitResponse

    // Authentication
    const authResult = await requireAuth()
    if ('response' in authResult) {
      await logApiActivity(null, "API_UNAUTHORIZED_ATTEMPT", "Client", null, {}, request)
      return authResult.response
    }
    const { user } = authResult

    // Parse and validate request body
    const body = await request.json()
    
    const bulkAssignSchema = z.object({
      clientIds: z.array(z.string()).min(1, "Musisz wybrać przynajmniej jednego klienta"),
      assignedTo: z.string().nullable().optional(),
    })

    let validatedData
    try {
      validatedData = bulkAssignSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: error.errors[0].message },
          { status: 400 }
        )
      }
      throw error
    }

    const { clientIds, assignedTo } = validatedData

    // Check permissions - ADMIN can assign any clients, USER can only assign their own clients
    if (user.role !== 'ADMIN') {
      // Check if user owns all the clients
      const clients = await db.client.findMany({
        where: {
          id: { in: clientIds },
          assignedTo: user.id,
        },
        select: { id: true },
      })

      if (clients.length !== clientIds.length) {
        return NextResponse.json(
          { error: 'Nie masz uprawnień do przypisania wszystkich wybranych klientów' },
          { status: 403 }
        )
      }
    }

    // Validate assignedTo user exists if provided
    if (assignedTo) {
      const targetUser = await db.user.findUnique({
        where: { id: assignedTo },
        select: { id: true },
      })

      if (!targetUser) {
        return NextResponse.json(
          { error: 'Użytkownik nie istnieje' },
          { status: 400 }
        )
      }
    }

    // Perform bulk update in transaction
    const result = await db.$transaction(async (tx) => {
      const updateResult = await tx.client.updateMany({
        where: {
          id: { in: clientIds },
        },
        data: {
          assignedTo: assignedTo || null,
        },
      })

      return updateResult
    })

    // Log activity
    await logApiActivity(
      user.id,
      "BULK_ASSIGN_CLIENTS",
      "Client",
      null,
      { clientIds, assignedTo, count: result.count },
      request
    )

    return NextResponse.json({
      success: true,
      updated: result.count,
    })
  } catch (error: any) {
    console.error('Bulk assign error:', error)
    
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas masowego przypisywania klientów' },
      { status: 500 }
    )
  }
}

