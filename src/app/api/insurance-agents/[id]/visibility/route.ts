import { NextResponse } from 'next/server'
import { requireAuth } from '@/presentation/api/middleware/auth'
import { UpdateAgentVisibilitySettingsUseCase } from '@/application/insurance-agents/use-cases'
import { PrismaInsuranceAgentRepository } from '@/infrastructure/persistence/prisma'
import { UpdateVisibilitySettingsDTO } from '@/application/insurance-agents/dto'
import { applyRateLimit, logApiActivity } from '@/lib/api-security'
import { z } from 'zod'

const insuranceAgentRepository = new PrismaInsuranceAgentRepository()
const updateAgentVisibilitySettingsUseCase = new UpdateAgentVisibilitySettingsUseCase(insuranceAgentRepository)

const updateVisibilitySettingsSchema = z.object({
  settings: z.record(z.any()),
})

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

    if (!params.id || typeof params.id !== 'string' || params.id.trim().length === 0) {
      return NextResponse.json({ error: 'Nieprawidłowy format ID' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = updateVisibilitySettingsSchema.parse(body)

    const dto: UpdateVisibilitySettingsDTO = {
      settings: validatedData.settings as any,
    }

    await updateAgentVisibilitySettingsUseCase.execute(params.id.trim(), dto, user)

    await logApiActivity(user.id, 'INSURANCE_AGENT_VISIBILITY_UPDATED', 'InsuranceAgent', params.id.trim(), {}, request)

    // Get updated agent
    const { GetInsuranceAgentUseCase } = await import('@/application/insurance-agents/use-cases')
    const { PrismaInsuranceAgentRepository } = await import('@/infrastructure/persistence/prisma')
    const agentRepository = new PrismaInsuranceAgentRepository()
    const getInsuranceAgentUseCase = new GetInsuranceAgentUseCase(agentRepository)
    const agent = await getInsuranceAgentUseCase.execute(params.id.trim())

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

    console.error('Update visibility settings error:', error)
    return NextResponse.json(
      { error: error.message || 'Wystąpił błąd podczas aktualizacji ustawień widoczności' },
      { status: 500 }
    )
  }
}

