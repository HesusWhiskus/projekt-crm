import { NextResponse } from 'next/server'
import { requireAuth } from '@/presentation/api/middleware/auth'
import { SendCalculationToExternalUseCase } from '@/application/calculations/use-cases'
import { PrismaCalculationRepository, PrismaExternalSyncRepository } from '@/infrastructure/persistence/prisma'
import { ExternalSystemClient } from '@/infrastructure/external/ExternalSystemClient'
import { applyRateLimit, logApiActivity } from '@/lib/api-security'

const calculationRepository = new PrismaCalculationRepository()
const externalClient = new ExternalSystemClient({
  baseUrl: process.env.EXTERNAL_SYSTEM_URL || '',
  apiKey: process.env.EXTERNAL_SYSTEM_API_KEY || '',
})
const syncRepository = new PrismaExternalSyncRepository()
const sendCalculationToExternalUseCase = new SendCalculationToExternalUseCase(
  calculationRepository,
  externalClient,
  syncRepository
)

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

    const syncResult = await sendCalculationToExternalUseCase.execute(params.id.trim(), user)

    await logApiActivity(user.id, 'CALCULATION_SYNCED', 'Calculation', params.id, {
      externalId: syncResult.externalId,
    }, request)

    return NextResponse.json({ syncResult })
  } catch (error: any) {
    if (error.message?.includes('nie znaleziony')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    console.error('Sync calculation error:', error)
    return NextResponse.json(
      { error: error.message || 'Wystąpił błąd podczas synchronizacji kalkulacji' },
      { status: 500 }
    )
  }
}

