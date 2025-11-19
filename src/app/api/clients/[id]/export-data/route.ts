import { NextResponse } from 'next/server'
import { requireAuth } from '@/presentation/api/middleware/auth'
import { applyRateLimit, logApiActivity } from '@/lib/api-security'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const rateLimitResponse = await applyRateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse

    const authResult = await requireAuth()
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
      include: {
        contacts: true,
        tasks: true,
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Klient nie znaleziony' }, { status: 404 })
    }

    // Check access
    if (user.role !== 'ADMIN' && client.assignedTo !== user.id) {
      return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })
    }

    await logApiActivity(user.id, 'CLIENT_DATA_EXPORTED', 'Client', client.id, {}, request)

    return NextResponse.json({ data: client })
  } catch (error: any) {
    console.error('Export client data error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas eksportu danych klienta' },
      { status: 500 }
    )
  }
}

