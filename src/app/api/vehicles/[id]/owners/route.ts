import { NextResponse } from 'next/server'
import { requireAuth } from '@/presentation/api/middleware/auth'
import { AssignVehicleToClientUseCase } from '@/application/vehicles/use-cases'
import { PrismaVehicleRepository } from '@/infrastructure/persistence/prisma'
import { applyRateLimit, logApiActivity } from '@/lib/api-security'
import { z } from 'zod'
import { db } from '@/lib/db'

// Initialize dependencies
const vehicleRepository = new PrismaVehicleRepository()
const assignVehicleToClientUseCase = new AssignVehicleToClientUseCase(vehicleRepository)

const assignOwnerSchema = z.object({
  clientId: z.string().min(1, 'ID klienta jest wymagane'),
  isPrimary: z.boolean().optional().default(true),
})

/**
 * @swagger
 * /api/vehicles/{id}/owners:
 *   post:
 *     summary: Przypisuje właściciela do pojazdu
 *     description: Przypisuje klienta jako właściciela pojazdu. Wymaga autoryzacji.
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: CUID identyfikator pojazdu
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clientId
 *             properties:
 *               clientId:
 *                 type: string
 *                 description: CUID identyfikator klienta
 *     responses:
 *       200:
 *         description: Właściciel został przypisany
 *       400:
 *         description: Błąd walidacji
 *       401:
 *         description: Nieautoryzowany
 *       404:
 *         description: Pojazd lub klient nie znaleziony
 *       500:
 *         description: Błąd serwera
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const rateLimitResponse = await applyRateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse

    const authResult = await requireAuth()
    if ('response' in authResult) {
      await logApiActivity(null, 'API_UNAUTHORIZED_ATTEMPT', 'Vehicle', params.id, {}, request)
      return authResult.response
    }
    const { user } = authResult

    if (!params.id || typeof params.id !== 'string' || params.id.trim().length === 0) {
      return NextResponse.json({ error: 'Nieprawidłowy format ID' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = assignOwnerSchema.parse(body)

    // Check if client exists
    const client = await db.client.findUnique({
      where: { id: validatedData.clientId },
    })

    if (!client) {
      return NextResponse.json({ error: 'Klient nie znaleziony' }, { status: 404 })
    }

    // Check access to client
    if (user.role !== 'ADMIN' && client.assignedTo !== user.id) {
      return NextResponse.json({ error: 'Brak uprawnień do klienta' }, { status: 403 })
    }

    await assignVehicleToClientUseCase.execute(
      params.id.trim(),
      validatedData.clientId,
      validatedData.isPrimary ?? true,
      user
    )

    await logApiActivity(user.id, 'VEHICLE_OWNER_ASSIGNED', 'Vehicle', params.id, {
      clientId: validatedData.clientId,
    }, request)

    return NextResponse.json({ message: 'Właściciel został przypisany' })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    if (error.message?.includes('nie znaleziony')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    console.error('Assign vehicle owner error:', error)
    return NextResponse.json(
      { error: error.message || 'Wystąpił błąd podczas przypisywania właściciela' },
      { status: 500 }
    )
  }
}

