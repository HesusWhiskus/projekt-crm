import { NextResponse } from 'next/server'
import { requireRole } from '@/presentation/api/middleware/auth'
import { applyRateLimit } from '@/lib/api-security'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const rateLimitResponse = await applyRateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse

    const authResult = await requireRole('ADMIN')
    if ('response' in authResult) {
      return authResult.response
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const logs = await db.auditLog.findMany({
      where: {
        dataType: 'PERSONAL_DATA',
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ logs })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Get personal data audit logs error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania logów audytu' },
      { status: 500 }
    )
  }
}

