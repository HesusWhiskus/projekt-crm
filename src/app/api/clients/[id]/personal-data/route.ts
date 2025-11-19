import { NextResponse } from 'next/server'
import { requireAuth } from '@/presentation/api/middleware/auth'
import { requireRole } from '@/presentation/api/middleware/auth'
import { applyRateLimit, logApiActivity } from '@/lib/api-security'
import { db } from '@/lib/db'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const rateLimitResponse = await applyRateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse

    const authResult = await requireRole('ADMIN')
    if ('response' in authResult) {
      await logApiActivity(null, 'API_UNAUTHORIZED_ATTEMPT', 'Client', params.id, {}, request)
      return authResult.response
    }
    const { user } = authResult

    if (!params.id || typeof params.id !== 'string' || params.id.trim().length === 0) {
      return NextResponse.json({ error: 'Nieprawidłowy format ID' }, { status: 400 })
    }

    const client = await db.client.findUnique({
      where: { id: params.id.trim() },
    })

    if (!client) {
      return NextResponse.json({ error: 'Klient nie znaleziony' }, { status: 404 })
    }

    // Anonymize personal data (GDPR Right to be Forgotten)
    await db.client.update({
      where: { id: params.id.trim() },
      data: {
        firstName: '[USUNIĘTE]',
        lastName: '[USUNIĘTE]',
        email: null,
        phone: null,
        address: null,
      },
    })

    await logApiActivity(user.id, 'CLIENT_PERSONAL_DATA_DELETED', 'Client', client.id, {}, request)

    return NextResponse.json({ message: 'Dane osobowe zostały usunięte' })
  } catch (error: any) {
    console.error('Delete personal data error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas usuwania danych osobowych' },
      { status: 500 }
    )
  }
}

