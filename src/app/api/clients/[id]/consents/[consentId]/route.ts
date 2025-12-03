import { NextResponse } from 'next/server'
import { requireAuth } from '@/presentation/api/middleware/auth'
import { applyRateLimit, logApiActivity } from '@/lib/api-security'
import { db } from '@/lib/db'
import { logError } from '@/lib/logger'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; consentId: string } }
) {
  try {
    const rateLimitResponse = await applyRateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse

    const authResult = await requireAuth()
    if ('response' in authResult) {
      return authResult.response
    }
    const { user } = authResult

    if (!params.consentId || typeof params.consentId !== 'string' || params.consentId.trim().length === 0) {
      return NextResponse.json({ error: 'Nieprawidłowy format ID zgody' }, { status: 400 })
    }

    const consent = await db.dataConsent.findUnique({
      where: { id: params.consentId.trim() },
    })

    if (!consent) {
      return NextResponse.json({ error: 'Zgoda nie znaleziona' }, { status: 404 })
    }

    await db.dataConsent.update({
      where: { id: params.consentId.trim() },
      data: {
        revokedAt: new Date(),
      },
    })

    await logApiActivity(user.id, 'DATA_CONSENT_REVOKED', 'DataConsent', consent.id, {
      clientId: params.id,
    }, request)

    return NextResponse.json({ message: 'Zgoda została cofnięta' })
  } catch (error: unknown) {
    // SECURITY-FIX: [ERROR-LOG-2] Zastąpiono console.error przez logError z sanitizacją
    // Data: 2025-01-27
    logError('Revoke consent error', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas cofania zgody' },
      { status: 500 }
    )
  }
}

