import { NextResponse } from 'next/server'
import { requireAuth } from '@/presentation/api/middleware/auth'
import { GetInsuranceAgentUseCase, UpdateInsuranceAgentUseCase } from '@/application/insurance-agents/use-cases'
import { PrismaInsuranceAgentRepository } from '@/infrastructure/persistence/prisma'
import { UpdateInsuranceAgentDTO } from '@/application/insurance-agents/dto'
import { applyRateLimit, logApiActivity } from '@/lib/api-security'
import { z } from 'zod'

const insuranceAgentRepository = new PrismaInsuranceAgentRepository()
const getInsuranceAgentUseCase = new GetInsuranceAgentUseCase(insuranceAgentRepository)
const updateInsuranceAgentUseCase = new UpdateInsuranceAgentUseCase(insuranceAgentRepository)

const updateInsuranceAgentSchema = z.object({
  licenseNumber: z.string().optional().nullable(),
  settings: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
  organizationId: z.string().optional().nullable(),
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
      await logApiActivity(null, 'API_UNAUTHORIZED_ATTEMPT', 'InsuranceAgent', params.id, {}, request)
      return authResult.response
    }
    const { user } = authResult

    if (!params.id || typeof params.id !== 'string' || params.id.trim().length === 0) {
      return NextResponse.json({ error: 'Nieprawidłowy format ID' }, { status: 400 })
    }

    const agent = await getInsuranceAgentUseCase.execute(params.id.trim())

    return NextResponse.json({ agent })
  } catch (error: any) {
    if (error.message?.includes('nie znaleziony')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    console.error('Get insurance agent error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania agenta' },
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
      await logApiActivity(null, 'API_UNAUTHORIZED_ATTEMPT', 'InsuranceAgent', params.id, {}, request)
      return authResult.response
    }
    const { user } = authResult

    // Only ADMIN can update insurance agents
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })
    }

    if (!params.id || typeof params.id !== 'string' || params.id.trim().length === 0) {
      return NextResponse.json({ error: 'Nieprawidłowy format ID' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = updateInsuranceAgentSchema.parse(body)

    const dto: UpdateInsuranceAgentDTO = {
      licenseNumber: validatedData.licenseNumber !== undefined ? validatedData.licenseNumber || undefined : undefined,
      settings: validatedData.settings as any,
      isActive: validatedData.isActive,
    }

    const agent = await updateInsuranceAgentUseCase.execute(params.id.trim(), dto, user)

    await logApiActivity(user.id, 'INSURANCE_AGENT_UPDATED', 'InsuranceAgent', agent.id, {
      updatedFields: Object.keys(validatedData),
    }, request)

    return NextResponse.json({ agent })
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

    console.error('Update insurance agent error:', error)
    return NextResponse.json(
      { error: error.message || 'Wystąpił błąd podczas aktualizacji agenta' },
      { status: 500 }
    )
  }
}

