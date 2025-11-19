import { NextResponse } from 'next/server'
import { requireAuth } from '@/presentation/api/middleware/auth'
import { GetCalculationUseCase, UpdateCalculationUseCase } from '@/application/calculations/use-cases'
import { PrismaCalculationRepository } from '@/infrastructure/persistence/prisma'
import { UpdateCalculationDTO } from '@/application/calculations/dto'
import { applyRateLimit, logApiActivity } from '@/lib/api-security'
import { z } from 'zod'

const calculationRepository = new PrismaCalculationRepository()
const getCalculationUseCase = new GetCalculationUseCase(calculationRepository)
const updateCalculationUseCase = new UpdateCalculationUseCase(calculationRepository)

const updateCalculationSchema = z.object({
  pesel: z.string().optional().nullable(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  previousLastName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  street: z.string().optional().nullable(),
  houseNumber: z.string().optional().nullable(),
  apartmentNumber: z.string().optional().nullable(),
  correspondenceAddress: z.record(z.any()).optional().nullable(),
  hasDrivingLicense: z.boolean().optional().nullable(),
  drivingLicenseDate: z.string().datetime().optional().nullable(),
  occupation: z.string().optional().nullable(),
  maritalStatus: z.string().optional().nullable(),
  hasChildUnder26: z.boolean().optional().nullable(),
  clientId: z.string().optional().nullable(),
  vehicleId: z.string().optional().nullable(),
  agentId: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED']).optional(),
  value: z.number().optional().nullable(),
  validUntil: z.string().datetime().optional().nullable(),
  variant: z.enum(['MINIMAL', 'OPTIMAL', 'MAXIMAL']).optional().nullable(),
  scopes: z.array(z.enum(['OC', 'AC', 'NNW', 'ASS'])).optional(),
})

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const rateLimitResponse = await applyRateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse

    const authResult = await requireAuth()
    if ('response' in authResult) {
      await logApiActivity(null, 'API_UNAUTHORIZED_ATTEMPT', 'Calculation', params.id, {}, request)
      return authResult.response
    }
    const { user } = authResult

    if (!params.id || typeof params.id !== 'string' || params.id.trim().length === 0) {
      return NextResponse.json({ error: 'Nieprawidłowy format ID' }, { status: 400 })
    }

    const calculation = await getCalculationUseCase.execute(params.id.trim())

    return NextResponse.json({ calculation })
  } catch (error: any) {
    if (error.message?.includes('nie znaleziony')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    console.error('Get calculation error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania kalkulacji' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const rateLimitResponse = await applyRateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse

    const authResult = await requireAuth()
    if ('response' in authResult) {
      await logApiActivity(null, 'API_UNAUTHORIZED_ATTEMPT', 'Calculation', params.id, {}, request)
      return authResult.response
    }
    const { user } = authResult

    if (!params.id || typeof params.id !== 'string' || params.id.trim().length === 0) {
      return NextResponse.json({ error: 'Nieprawidłowy format ID' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = updateCalculationSchema.parse(body)

    const dto: UpdateCalculationDTO = {
      pesel: validatedData.pesel !== undefined ? validatedData.pesel || undefined : undefined,
      firstName: validatedData.firstName || undefined,
      lastName: validatedData.lastName || undefined,
      previousLastName: validatedData.previousLastName || undefined,
      phone: validatedData.phone || undefined,
      email: validatedData.email || undefined,
      postalCode: validatedData.postalCode !== undefined ? validatedData.postalCode || undefined : undefined,
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
      status: validatedData.status,
      value: validatedData.value ?? undefined,
      validUntil: validatedData.validUntil || undefined,
      variant: validatedData.variant || undefined,
      scopes: validatedData.scopes,
    }

    const calculation = await updateCalculationUseCase.execute(params.id.trim(), dto, user)

    await logApiActivity(user.id, 'CALCULATION_UPDATED', 'Calculation', calculation.id, {
      updatedFields: Object.keys(validatedData),
    }, request)

    return NextResponse.json({ calculation })
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

    console.error('Update calculation error:', error)
    return NextResponse.json(
      { error: error.message || 'Wystąpił błąd podczas aktualizacji kalkulacji' },
      { status: 500 }
    )
  }
}

