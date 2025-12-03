import { NextResponse } from 'next/server'
import { requireAuth } from '@/presentation/api/middleware/auth'
import { EnrichVehicleDataUseCase } from '@/application/vehicles/use-cases'
import { PrismaVehicleRepository } from '@/infrastructure/persistence/prisma'
import { applyRateLimit, logApiActivity } from '@/lib/api-security'
import { logError } from '@/lib/logger'

// Initialize dependencies
const vehicleRepository = new PrismaVehicleRepository()
const enrichVehicleDataUseCase = new EnrichVehicleDataUseCase(vehicleRepository)

/**
 * @swagger
 * /api/vehicles/{id}/enrich:
 *   post:
 *     summary: Wzbogaca dane pojazdu
 *     description: Pobiera dane pojazdu z zewnętrznych źródeł (Eurotax, Info-Ekspert) i aktualizuje pojazd. Wymaga autoryzacji.
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
 *     responses:
 *       200:
 *         description: Dane pojazdu zostały wzbogacone
 *       401:
 *         description: Nieautoryzowany
 *       404:
 *         description: Pojazd nie znaleziony
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

    const vehicle = await enrichVehicleDataUseCase.execute(params.id.trim(), user)

    await logApiActivity(user.id, 'VEHICLE_DATA_ENRICHED', 'Vehicle', vehicle.id, {}, request)

    return NextResponse.json({ vehicle })
  } catch (error: unknown) {
    // SECURITY-FIX: [ERROR-LOG-2] Zastąpiono console.error przez logError z sanitizacją
    // Data: 2025-01-27
    logError('Enrich vehicle data error', error)
    const errorMessage = error instanceof Error ? error.message : 'Wystąpił błąd podczas wzbogacania danych pojazdu'

    if (error instanceof Error && error.message?.includes('nie znaleziony')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

