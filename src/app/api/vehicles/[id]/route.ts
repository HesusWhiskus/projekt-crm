import { NextResponse } from 'next/server'
import { requireAuth } from '@/presentation/api/middleware/auth'
import { GetVehicleUseCase, UpdateVehicleUseCase } from '@/application/vehicles/use-cases'
import { PrismaVehicleRepository } from '@/infrastructure/persistence/prisma'
import { UpdateVehicleDTO } from '@/application/vehicles/dto'
import { applyRateLimit, logApiActivity } from '@/lib/api-security'
import { z } from 'zod'
import { logError } from '@/lib/logger'
import { db } from '@/lib/db'

// Initialize dependencies
const vehicleRepository = new PrismaVehicleRepository()
const getVehicleUseCase = new GetVehicleUseCase(vehicleRepository)
const updateVehicleUseCase = new UpdateVehicleUseCase(vehicleRepository)

const updateVehicleSchema = z.object({
  vin: z.string().optional().nullable(),
  registrationNumber: z.string().optional().nullable(),
  firstRegistrationDate: z.string().datetime().optional().nullable(),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  productionYear: z.number().int().min(1900).max(2100).optional().nullable(),
  infoEkspertId: z.string().optional().nullable(),
  eurotaxId: z.string().optional().nullable(),
  eurotaxData: z.record(z.any()).optional().nullable(),
  infoEkspertData: z.record(z.any()).optional().nullable(),
  importedFromAbroad: z.boolean().optional().nullable(),
  hasValidInspection: z.boolean().optional().nullable(),
  hasLpgInstallation: z.boolean().optional().nullable(),
  purchaseYear: z.number().int().min(1900).max(2100).optional().nullable(),
  currentMileage: z.number().int().min(0).optional().nullable(),
})

/**
 * @swagger
 * /api/vehicles/{id}:
 *   get:
 *     summary: Pobiera szczegóły pojazdu
 *     description: Pobiera szczegóły pojazdu. Wymaga autoryzacji.
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
 *         description: Szczegóły pojazdu
 *       401:
 *         description: Nieautoryzowany
 *       404:
 *         description: Pojazd nie znaleziony
 *       500:
 *         description: Błąd serwera
 */
export async function GET(
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

    const vehicleId = params.id.trim()
    
    // SECURITY-FIX: [IDOR-10] Sprawdzenie uprawnień przed zwróceniem pojazdu
    // Data: 2025-01-27
    // Get user with organizationId
    const userWithOrg = await db.user.findUnique({
      where: { id: user.id },
      select: { organizationId: true },
    })
    
    // Get vehicle to check access
    const vehicle = await getVehicleUseCase.execute(vehicleId)
    
    if (!vehicle) {
      return NextResponse.json({ error: 'Pojazd nie znaleziony' }, { status: 404 })
    }
    
    // Check authorization: ADMIN sees all vehicles in organization, USER sees only vehicles in their organization
    if (user.role !== 'ADMIN' && vehicle.organizationId !== userWithOrg?.organizationId) {
      await logApiActivity(user.id, 'API_UNAUTHORIZED_ACCESS_ATTEMPT', 'Vehicle', vehicleId, {}, request)
      return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })
    }

    return NextResponse.json({ vehicle })
  } catch (error: unknown) {
    // SECURITY-FIX: [ERROR-LOG-2] Zastąpiono console.error przez logError z sanitizacją
    // Data: 2025-01-27
    logError('Get vehicle error', error)
    
    if (error instanceof Error && error.message?.includes('nie znaleziony')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania pojazdu' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/vehicles/{id}:
 *   put:
 *     summary: Aktualizuje pojazd
 *     description: Aktualizuje dane pojazdu. Wszystkie pola są opcjonalne. Wymaga autoryzacji.
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
 *             properties:
 *               vin:
 *                 type: string
 *                 nullable: true
 *               registrationNumber:
 *                 type: string
 *                 nullable: true
 *               firstRegistrationDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               eurotaxData:
 *                 type: object
 *                 nullable: true
 *               infoEkspertData:
 *                 type: object
 *                 nullable: true
 *               importedFromAbroad:
 *                 type: boolean
 *                 nullable: true
 *               hasValidInspection:
 *                 type: boolean
 *                 nullable: true
 *               hasLpgInstallation:
 *                 type: boolean
 *                 nullable: true
 *               purchaseYear:
 *                 type: integer
 *                 nullable: true
 *               currentMileage:
 *                 type: integer
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Pojazd został zaktualizowany
 *       400:
 *         description: Błąd walidacji
 *       401:
 *         description: Nieautoryzowany
 *       404:
 *         description: Pojazd nie znaleziony
 *       500:
 *         description: Błąd serwera
 */
export async function PUT(
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
    const validatedData = updateVehicleSchema.parse(body)

    const dto: UpdateVehicleDTO = {
      vin: validatedData.vin !== undefined ? validatedData.vin || undefined : undefined,
      registrationNumber: validatedData.registrationNumber !== undefined ? validatedData.registrationNumber || undefined : undefined,
      firstRegistrationDate: validatedData.firstRegistrationDate || undefined,
      brand: validatedData.brand !== undefined ? validatedData.brand || undefined : undefined,
      model: validatedData.model !== undefined ? validatedData.model || undefined : undefined,
      productionYear: validatedData.productionYear ?? undefined,
      infoEkspertId: validatedData.infoEkspertId !== undefined ? validatedData.infoEkspertId || undefined : undefined,
      eurotaxId: validatedData.eurotaxId !== undefined ? validatedData.eurotaxId || undefined : undefined,
      eurotaxData: validatedData.eurotaxData || undefined,
      infoEkspertData: validatedData.infoEkspertData || undefined,
      importedFromAbroad: validatedData.importedFromAbroad ?? undefined,
      hasValidInspection: validatedData.hasValidInspection ?? undefined,
      hasLpgInstallation: validatedData.hasLpgInstallation ?? undefined,
      purchaseYear: validatedData.purchaseYear ?? undefined,
      currentMileage: validatedData.currentMileage ?? undefined,
    }

    const vehicle = await updateVehicleUseCase.execute(params.id.trim(), dto, user)

    await logApiActivity(user.id, 'VEHICLE_UPDATED', 'Vehicle', vehicle.id, {
      updatedFields: Object.keys(validatedData),
    }, request)

    return NextResponse.json({ vehicle })
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

    // SECURITY-FIX: [ERROR-LOG-2] Zastąpiono console.error przez logError z sanitizacją
    // Data: 2025-01-27
    logError('Update vehicle error', error)
    const errorMessage = error instanceof Error ? error.message : 'Wystąpił błąd podczas aktualizacji pojazdu'
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage.includes('już istnieje') ? 400 : 500 }
    )
  }
}

