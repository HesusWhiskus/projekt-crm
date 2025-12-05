import { NextResponse } from 'next/server'
import { requireAuth } from '@/presentation/api/middleware/auth'
import { GetSyncStatusUseCase } from '@/application/external-integration/use-cases'
import { PrismaExternalSyncRepository } from '@/infrastructure/persistence/prisma'
import { applyRateLimit, logApiActivity } from '@/lib/api-security'
import { logError } from '@/lib/logger'

const externalSyncRepository = new PrismaExternalSyncRepository()
const getSyncStatusUseCase = new GetSyncStatusUseCase(externalSyncRepository)

export async function GET(request: Request) {
  try {
    const rateLimitResponse = await applyRateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse

    const authResult = await requireAuth()
    if ('response' in authResult) {
      await logApiActivity(null, 'API_UNAUTHORIZED_ATTEMPT', 'ExternalSync', null, {}, request)
      return authResult.response
    }
    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')
    const direction = searchParams.get('direction') as 'IN' | 'OUT' | undefined

    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'entityType i entityId są wymagane' }, { status: 400 })
    }

    const status = await getSyncStatusUseCase.execute(entityType, entityId, direction)

    return NextResponse.json({ status })
  } catch (error: unknown) {
    // SECURITY-FIX: [ERROR-LOG-2] Zastąpiono console.error przez logError z sanitizacją
    // Data: 2025-01-27
    logError('Get sync status error', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania statusu synchronizacji' },
      { status: 500 }
    )
  }
}

