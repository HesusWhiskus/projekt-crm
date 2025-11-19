import { NextResponse } from 'next/server'
import { requireAuth } from '@/presentation/api/middleware/auth'
import { applyRateLimit } from '@/lib/api-security'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const rateLimitResponse = await applyRateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse

    const authResult = await requireAuth()
    if ('response' in authResult) {
      return authResult.response
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const entityType = searchParams.get('entityType') || undefined
    const status = searchParams.get('status') || undefined

    const where: any = {}
    if (entityType) where.entityType = entityType
    if (status) where.status = status

    const syncs = await db.externalSync.findMany({
      where,
      orderBy: { syncedAt: 'desc' },
      take: limit,
      skip: offset,
    })

    return NextResponse.json({ syncs })
  } catch (error: any) {
    console.error('Get sync audit logs error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania logów synchronizacji' },
      { status: 500 }
    )
  }
}

