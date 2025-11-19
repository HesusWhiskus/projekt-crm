import { NextResponse } from 'next/server'
import { requireAuth } from '@/presentation/api/middleware/auth'
import { CreateInsuranceAgentUseCase } from '@/application/insurance-agents/use-cases'
import { PrismaInsuranceAgentRepository } from '@/infrastructure/persistence/prisma'
import { CreateInsuranceAgentDTO } from '@/application/insurance-agents/dto'
import { applyRateLimit, logApiActivity } from '@/lib/api-security'
import { z } from 'zod'

const insuranceAgentRepository = new PrismaInsuranceAgentRepository()
const createInsuranceAgentUseCase = new CreateInsuranceAgentUseCase(insuranceAgentRepository)

const createInsuranceAgentSchema = z.object({
  userId: z.string().min(1, 'ID użytkownika jest wymagane'),
  licenseNumber: z.string().optional().nullable(),
  settings: z.record(z.any()).optional(),
  isActive: z.boolean().optional().default(true),
  organizationId: z.string().optional().nullable(),
})

export async function POST(request: Request) {
  try {
    const rateLimitResponse = await applyRateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse

    const authResult = await requireAuth()
    if ('response' in authResult) {
      await logApiActivity(null, 'API_UNAUTHORIZED_ATTEMPT', 'InsuranceAgent', null, {}, request)
      return authResult.response
    }
    const { user } = authResult

    // Only ADMIN can create insurance agents
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createInsuranceAgentSchema.parse(body)

    const dto: CreateInsuranceAgentDTO = {
      userId: validatedData.userId,
      licenseNumber: validatedData.licenseNumber || undefined,
      settings: validatedData.settings as any,
      isActive: validatedData.isActive,
      organizationId: validatedData.organizationId || user.organizationId || undefined,
    }

    const agent = await createInsuranceAgentUseCase.execute(dto, user)

    await logApiActivity(user.id, 'INSURANCE_AGENT_CREATED', 'InsuranceAgent', agent.id, {
      userId: agent.userId,
      licenseNumber: agent.licenseNumber,
    }, request)

    return NextResponse.json({ agent }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Create insurance agent error:', error)
    return NextResponse.json(
      { error: error.message || 'Wystąpił błąd podczas tworzenia agenta' },
      { status: error.message?.includes('już istnieje') ? 400 : 500 }
    )
  }
}

