import { NextResponse } from 'next/server'
import { requireAuth } from '@/presentation/api/middleware/auth'
import { PrismaVehicleRepository } from '@/infrastructure/persistence/prisma'
import { applyRateLimit, logApiActivity } from '@/lib/api-security'
import { db } from '@/lib/db'
import { logError } from '@/lib/logger'

// Initialize dependencies
const vehicleRepository = new PrismaVehicleRepository()

/**
 * @swagger
 * /api/vehicles/{id}/owners/{clientId}:
 *   delete:
 *     summary: Usuwa właściciela z pojazdu
 *     description: Usuwa przypisanie klienta jako właściciela pojazdu. Wymaga autoryzacji.
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
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: CUID identyfikator klienta
 *     responses:
 *       200:
 *         description: Właściciel został usunięty
 *       400:
 *         description: Nieprawidłowy format ID
 *       401:
 *         description: Nieautoryzowany
 *       404:
 *         description: Pojazd lub przypisanie nie znalezione
 *       500:
 *         description: Błąd serwera
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; clientId: string } }
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
      return NextResponse.json({ error: 'Nieprawidłowy format ID pojazdu' }, { status: 400 })
    }

    if (!params.clientId || typeof params.clientId !== 'string' || params.clientId.trim().length === 0) {
      return NextResponse.json({ error: 'Nieprawidłowy format ID klienta' }, { status: 400 })
    }

    const vehicleId = params.id.trim()
    const clientId = params.clientId.trim()

    // Check if vehicle exists
    const vehicle = await vehicleRepository.findById(vehicleId)
    if (!vehicle) {
      return NextResponse.json({ error: 'Pojazd nie znaleziony' }, { status: 404 })
    }

    // Check if assignment exists
    const assignment = await db.vehicleOwner.findUnique({
      where: {
        vehicleId_clientId: {
          vehicleId,
          clientId,
        },
      },
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Przypisanie nie znalezione' }, { status: 404 })
    }

    // Delete assignment
    await db.vehicleOwner.delete({
      where: {
        vehicleId_clientId: {
          vehicleId,
          clientId,
        },
      },
    })

    await logApiActivity(user.id, 'VEHICLE_OWNER_REMOVED', 'Vehicle', vehicleId, {
      clientId,
    }, request)

    return NextResponse.json({ message: 'Właściciel został usunięty' })
  } catch (error: unknown) {
    // SECURITY-FIX: [ERROR-LOG-2] Zastąpiono console.error przez logError z sanitizacją
    // Data: 2025-01-27
    logError('Remove vehicle owner error', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas usuwania właściciela' },
      { status: 500 }
    )
  }
}

