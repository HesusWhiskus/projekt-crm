import { NextResponse } from 'next/server'
import { requireAuth } from '@/presentation/api/middleware/auth'
import { ChangeCalculationStatusUseCase } from '@/application/calculations/use-cases'
import { PrismaCalculationRepository } from '@/infrastructure/persistence/prisma'
import { applyRateLimit, logApiActivity } from '@/lib/api-security'
import { z } from 'zod'

const calculationRepository = new PrismaCalculationRepository()
const changeCalculationStatusUseCase = new ChangeCalculationStatusUseCase(calculationRepository)

const changeStatusSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED']),
})

export async function POST(
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
    const validatedData = changeStatusSchema.parse(body)

    await changeCalculationStatusUseCase.execute(
      params.id.trim(),
      validatedData.status,
      undefined, // reason
      user
    )

    // Get updated calculation
    const { GetCalculationUseCase } = await import('@/application/calculations/use-cases')
    const getCalculationUseCase = new GetCalculationUseCase(calculationRepository)
    const calculation = await getCalculationUseCase.execute(params.id.trim())

    if (!calculation) {
      return NextResponse.json({ error: 'Kalkulacja nie znaleziona' }, { status: 404 })
    }

    await logApiActivity(user.id, 'CALCULATION_STATUS_CHANGED', 'Calculation', calculation.id, {
      newStatus: validatedData.status,
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

    console.error('Change calculation status error:', error)
    return NextResponse.json(
      { error: error.message || 'Wystąpił błąd podczas zmiany statusu kalkulacji' },
      { status: 500 }
    )
  }
}

