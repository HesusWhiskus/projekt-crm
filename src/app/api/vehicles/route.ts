import { NextResponse } from 'next/server'
import { requireAuth } from '@/presentation/api/middleware/auth'
import { CreateVehicleUseCase, ListVehiclesUseCase } from '@/application/vehicles/use-cases'
import { PrismaVehicleRepository } from '@/infrastructure/persistence/prisma'
import { CreateVehicleDTO, VehicleFilterDTO } from '@/application/vehicles/dto'
import { applyRateLimit, logApiActivity } from '@/lib/api-security'
import { db } from '@/lib/db'
import { z } from 'zod'
import { logError } from '@/lib/logger'

// Initialize dependencies
const vehicleRepository = new PrismaVehicleRepository()
const createVehicleUseCase = new CreateVehicleUseCase(vehicleRepository)
const listVehiclesUseCase = new ListVehiclesUseCase(vehicleRepository)

const createVehicleSchema = z.object({
  // SECURITY-FIX: [VALIDATION-20] Dodano max length dla wszystkich pól string
  // Data: 2025-01-27
  vin: z.string().max(17, 'VIN może mieć maksymalnie 17 znaków').optional().nullable(),
  registrationNumber: z.string().max(20, 'Numer rejestracyjny może mieć maksymalnie 20 znaków').optional().nullable(),
  firstRegistrationDate: z.string().datetime().optional().nullable(),
  brand: z.string().max(100, 'Marka może mieć maksymalnie 100 znaków').optional().nullable(),
  model: z.string().max(100, 'Model może mieć maksymalnie 100 znaków').optional().nullable(),
  productionYear: z.number().int().min(1900).max(2100).optional().nullable(),
  infoEkspertId: z.string().max(100, 'Info-Ekspert ID może mieć maksymalnie 100 znaków').optional().nullable(),
  eurotaxId: z.string().max(100, 'Eurotax ID może mieć maksymalnie 100 znaków').optional().nullable(),
  eurotaxData: z.record(z.any()).optional().nullable(),
  infoEkspertData: z.record(z.any()).optional().nullable(),
  importedFromAbroad: z.boolean().optional().nullable(),
  hasValidInspection: z.boolean().optional().nullable(),
  hasLpgInstallation: z.boolean().optional().nullable(),
  purchaseYear: z.number().int().min(1900).max(2100).optional().nullable(),
  currentMileage: z.number().int().min(0).optional().nullable(),
  clientIds: z.array(z.string()).optional().default([]),
})

/**
 * @swagger
 * /api/vehicles:
 *   post:
 *     summary: Tworzy nowy pojazd
 *     description: Tworzy nowy pojazd w systemie. Wymaga autoryzacji. Wymagany jest VIN lub numer rejestracyjny.
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
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
 *                 description: Numer VIN pojazdu
 *               registrationNumber:
 *                 type: string
 *                 nullable: true
 *                 description: Numer rejestracyjny pojazdu
 *               firstRegistrationDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 description: Data pierwszej rejestracji
 *               eurotaxData:
 *                 type: object
 *                 nullable: true
 *                 description: Dane z Eurotax (JSON)
 *               infoEkspertData:
 *                 type: object
 *                 nullable: true
 *                 description: Dane z Info-Ekspert (JSON)
 *               importedFromAbroad:
 *                 type: boolean
 *                 nullable: true
 *                 description: Czy pojazd został sprowadzony z zagranicy
 *               hasValidInspection:
 *                 type: boolean
 *                 nullable: true
 *                 description: Czy pojazd ma ważne badanie techniczne
 *               hasLpgInstallation:
 *                 type: boolean
 *                 nullable: true
 *                 description: Czy pojazd posiada instalację gazową
 *               purchaseYear:
 *                 type: integer
 *                 nullable: true
 *                 min: 1900
 *                 max: 2100
 *                 description: Rok nabycia pojazdu
 *               currentMileage:
 *                 type: integer
 *                 nullable: true
 *                 min: 0
 *                 description: Aktualny przebieg pojazdu
 *               clientIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Lista ID klientów (właścicieli pojazdu)
 *     responses:
 *       201:
 *         description: Pojazd został utworzony
 *       400:
 *         description: Błąd walidacji
 *       401:
 *         description: Nieautoryzowany
 *       500:
 *         description: Błąd serwera
 */
export async function POST(request: Request) {
  try {
    const rateLimitResponse = await applyRateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse

    const authResult = await requireAuth()
    if ('response' in authResult) {
      await logApiActivity(null, 'API_UNAUTHORIZED_ATTEMPT', 'Vehicle', null, {}, request)
      return authResult.response
    }
    const { user } = authResult

    // Get user with organizationId from database
    const userWithOrg = await db.user.findUnique({
      where: { id: user.id },
      select: { organizationId: true },
    })

    const body = await request.json()
    const validatedData = createVehicleSchema.parse(body)

    const dto: CreateVehicleDTO = {
      vin: validatedData.vin || undefined,
      registrationNumber: validatedData.registrationNumber || undefined,
      firstRegistrationDate: validatedData.firstRegistrationDate || undefined,
      brand: validatedData.brand || undefined,
      model: validatedData.model || undefined,
      productionYear: validatedData.productionYear ?? undefined,
      infoEkspertId: validatedData.infoEkspertId || undefined,
      eurotaxId: validatedData.eurotaxId || undefined,
      eurotaxData: validatedData.eurotaxData || undefined,
      infoEkspertData: validatedData.infoEkspertData || undefined,
      importedFromAbroad: validatedData.importedFromAbroad ?? undefined,
      hasValidInspection: validatedData.hasValidInspection ?? undefined,
      hasLpgInstallation: validatedData.hasLpgInstallation ?? undefined,
      purchaseYear: validatedData.purchaseYear ?? undefined,
      currentMileage: validatedData.currentMileage ?? undefined,
      organizationId: userWithOrg?.organizationId || undefined,
    }

    const vehicle = await createVehicleUseCase.execute(dto, user)

    await logApiActivity(user.id, 'VEHICLE_CREATED', 'Vehicle', vehicle.id, {
      vin: vehicle.vin,
      registrationNumber: vehicle.registrationNumber,
    }, request)

    return NextResponse.json({ vehicle }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    // SECURITY-FIX: [ERROR-LOG-2] Zastąpiono console.error przez logError z sanitizacją
    // Data: 2025-01-27
    logError('Create vehicle error', error)
    const errorMessage = error instanceof Error ? error.message : 'Wystąpił błąd podczas tworzenia pojazdu'
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage.includes('już istnieje') ? 400 : 500 }
    )
  }
}

/**
 * @swagger
 * /api/vehicles:
 *   get:
 *     summary: Pobiera listę pojazdów
 *     description: Pobiera listę pojazdów z możliwością filtrowania. Wymaga autoryzacji.
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: vin
 *         schema:
 *           type: string
 *         description: Filtr po numerze VIN
 *       - in: query
 *         name: registrationNumber
 *         schema:
 *           type: string
 *         description: Filtr po numerze rejestracyjnym
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *         description: Filtr po ID klienta (właściciela)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Limit wyników
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset dla paginacji
 *     responses:
 *       200:
 *         description: Lista pojazdów
 *       401:
 *         description: Nieautoryzowany
 *       500:
 *         description: Błąd serwera
 */
export async function GET(request: Request) {
  try {
    const rateLimitResponse = await applyRateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse

    const authResult = await requireAuth()
    if ('response' in authResult) {
      await logApiActivity(null, 'API_UNAUTHORIZED_ATTEMPT', 'Vehicle', null, {}, request)
      return authResult.response
    }
    const { user } = authResult

    // Get user with organizationId from database
    const userWithOrg = await db.user.findUnique({
      where: { id: user.id },
      select: { organizationId: true },
    })

    const { searchParams } = new URL(request.url)
    const filter: VehicleFilterDTO = {
      vin: searchParams.get('vin') || undefined,
      registrationNumber: searchParams.get('registrationNumber') || undefined,
      clientId: searchParams.get('clientId') || undefined,
      organizationId: userWithOrg?.organizationId || undefined,
    }

    const result = await listVehiclesUseCase.execute(filter)

    return NextResponse.json(result)
  } catch (error: unknown) {
    // SECURITY-FIX: [ERROR-LOG-2] Zastąpiono console.error przez logError z sanitizacją
    // Data: 2025-01-27
    logError('List vehicles error', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania pojazdów' },
      { status: 500 }
    )
  }
}

