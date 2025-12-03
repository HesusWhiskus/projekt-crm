import { NextResponse } from 'next/server'
import { requireAuth } from '@/presentation/api/middleware/auth'
import { applyRateLimit } from '@/lib/api-security'
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
      return authResult.response
    }

    if (!params.id || typeof params.id !== 'string' || params.id.trim().length === 0) {
      return NextResponse.json({ error: 'Nieprawidłowy format ID' }, { status: 400 })
    }

    const history = await db.calculationHistory.findMany({
      where: { calculationId: params.id.trim() },
      orderBy: { changedAt: 'desc' },
    })

    return NextResponse.json({ history })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Get calculation history error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania historii kalkulacji' },
      { status: 500 }
    )
  }
}

