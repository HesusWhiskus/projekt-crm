import { NextResponse } from 'next/server'
import { requireAuth } from '@/presentation/api/middleware/auth'
import { CreateCalculationUseCase, ListCalculationsUseCase } from '@/application/calculations/use-cases'
import { PrismaCalculationRepository } from '@/infrastructure/persistence/prisma'
import { CreateCalculationDTO, CalculationFilterDTO } from '@/application/calculations/dto'
import { applyRateLimit, logApiActivity } from '@/lib/api-security'
import { z } from 'zod'
import { logError } from '@/lib/logger'

// Initialize dependencies
const calculationRepository = new PrismaCalculationRepository()
const createCalculationUseCase = new CreateCalculationUseCase(calculationRepository)
const listCalculationsUseCase = new ListCalculationsUseCase(calculationRepository)

const createCalculationSchema = z.object({
  // SECURITY-FIX: [VALIDATION-20] Dodano max length dla wszystkich pól string
  // Data: 2025-01-27
  pesel: z.string().max(11, 'PESEL może mieć maksymalnie 11 znaków').optional().nullable(),
  firstName: z.string().max(50, 'Imię może mieć maksymalnie 50 znaków').optional().nullable(),
  lastName: z.string().max(50, 'Nazwisko może mieć maksymalnie 50 znaków').optional().nullable(),
  previousLastName: z.string().max(50, 'Poprzednie nazwisko może mieć maksymalnie 50 znaków').optional().nullable(),
  phone: z.string().max(30, 'Telefon może mieć maksymalnie 30 znaków').optional().nullable(),
  email: z.string().email('Nieprawidłowy format email').max(255, 'Email może mieć maksymalnie 255 znaków').optional().nullable(),
  postalCode: z.string().max(10, 'Kod pocztowy może mieć maksymalnie 10 znaków').optional().nullable(),
  city: z.string().max(100, 'Miasto może mieć maksymalnie 100 znaków').optional().nullable(),
  street: z.string().max(200, 'Ulica może mieć maksymalnie 200 znaków').optional().nullable(),
  houseNumber: z.string().max(20, 'Numer domu może mieć maksymalnie 20 znaków').optional().nullable(),
  apartmentNumber: z.string().max(20, 'Numer mieszkania może mieć maksymalnie 20 znaków').optional().nullable(),
  correspondenceAddress: z.record(z.any()).optional().nullable(),
  hasDrivingLicense: z.boolean().optional().nullable(),
  drivingLicenseDate: z.string().datetime().optional().nullable(),
  occupation: z.string().max(100, 'Zawód może mieć maksymalnie 100 znaków').optional().nullable(),
  maritalStatus: z.string().max(50, 'Status cywilny może mieć maksymalnie 50 znaków').optional().nullable(),
  hasChildUnder26: z.boolean().optional().nullable(),
  clientId: z.string().optional().nullable(),
  vehicleId: z.string().optional().nullable(),
  agentId: z.string().optional().nullable(),
  organizationId: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED']).optional(),
  value: z.number().optional().nullable(),
  validUntil: z.string().datetime().optional().nullable(),
  variant: z.enum(['MINIMAL', 'OPTIMAL', 'MAXIMAL']).optional().nullable(),
  scopes: z.array(z.enum(['OC', 'AC', 'NNW', 'ASS'])).optional(),
})

/**
 * @swagger
 * /api/calculations:
 *   post:
 *     summary: Tworzy nową kalkulację
 *     description: Tworzy nową kalkulację ubezpieczeniową. Wymaga autoryzacji.
 *     tags: [Calculations]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 */
export async function POST(request: Request) {
  try {
    const rateLimitResponse = await applyRateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse

    const authResult = await requireAuth()
    if ('response' in authResult) {
      await logApiActivity(null, 'API_UNAUTHORIZED_ATTEMPT', 'Calculation', null, {}, request)
      return authResult.response
    }
    const { user } = authResult

    const body = await request.json()
    const validatedData = createCalculationSchema.parse(body)

    const dto: CreateCalculationDTO = {
      pesel: validatedData.pesel || undefined,
      firstName: validatedData.firstName || undefined,
      lastName: validatedData.lastName || undefined,
      previousLastName: validatedData.previousLastName || undefined,
      phone: validatedData.phone || undefined,
      email: validatedData.email || undefined,
      postalCode: validatedData.postalCode || undefined,
      city: validatedData.city || undefined,
      street: validatedData.street || undefined,
      houseNumber: validatedData.houseNumber || undefined,
      apartmentNumber: validatedData.apartmentNumber || undefined,
      correspondenceAddress: validatedData.correspondenceAddress || undefined,
      hasDrivingLicense: validatedData.hasDrivingLicense ?? undefined,
      drivingLicenseDate: validatedData.drivingLicenseDate || undefined,
      occupation: validatedData.occupation || undefined,
      maritalStatus: validatedData.maritalStatus || undefined,
      hasChildUnder26: validatedData.hasChildUnder26 ?? undefined,
      clientId: validatedData.clientId || undefined,
      vehicleId: validatedData.vehicleId || undefined,
      agentId: validatedData.agentId || undefined,
      organizationId: validatedData.organizationId || user.organizationId || undefined,
      status: validatedData.status,
      value: validatedData.value ?? undefined,
      validUntil: validatedData.validUntil || undefined,
      variant: validatedData.variant || undefined,
      scopes: validatedData.scopes,
    }

    const calculation = await createCalculationUseCase.execute(dto, user)

    await logApiActivity(user.id, 'CALCULATION_CREATED', 'Calculation', calculation.id, {
      status: calculation.status,
    }, request)

    return NextResponse.json({ calculation }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    // SECURITY-FIX: [ERROR-LOG-2] Zastąpiono console.error przez logError z sanitizacją
    // Data: 2025-01-27
    logError('Create calculation error', error)
    const errorMessage = error instanceof Error ? error.message : 'Wystąpił błąd podczas tworzenia kalkulacji'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/calculations:
 *   get:
 *     summary: Pobiera listę kalkulacji
 *     description: Pobiera listę kalkulacji z możliwością filtrowania. Wymaga autoryzacji.
 *     tags: [Calculations]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 */
export async function GET(request: Request) {
  try {
    const rateLimitResponse = await applyRateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse

    const authResult = await requireAuth()
    if ('response' in authResult) {
      await logApiActivity(null, 'API_UNAUTHORIZED_ATTEMPT', 'Calculation', null, {}, request)
      return authResult.response
    }
    const { user } = authResult

    const { searchParams } = new URL(request.url)
    
    // Parse pagination parameters
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')
    const page = pageParam ? parseInt(pageParam, 10) : undefined
    const limit = limitParam ? parseInt(limitParam, 10) : undefined

    const filter: CalculationFilterDTO = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      status: searchParams.get('status') as any || undefined,
      clientId: searchParams.get('clientId') || undefined,
      vehicleId: searchParams.get('vehicleId') || undefined,
      agentId: searchParams.get('agentId') || undefined,
      organizationId: user.organizationId || undefined,
      search: searchParams.get('search') || undefined,
    }

    // Add pagination to filter if provided
    if (page !== undefined || limit !== undefined) {
      filter.pagination = { page, limit }
    }

    // Backward compatible: if no pagination params, log warning
    if (!filter.pagination) {
      console.warn('[API CALCULATIONS] Pagination not used - returning all calculations. Consider using ?page=1&limit=50')
    }

    const result = await listCalculationsUseCase.execute(filter)

    // Backward compatible response format
    if (Array.isArray(result)) {
      // Old format - array of calculations
      return NextResponse.json({ calculations: result })
    } else {
      // New format - paginated response
      return NextResponse.json(result)
    }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('List calculations error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania kalkulacji' },
      { status: 500 }
    )
  }
}

