import { NextResponse } from 'next/server'
import { requireAuth } from '@/presentation/api/middleware/auth'
import { applyRateLimit, logApiActivity } from '@/lib/api-security'
import { db } from '@/lib/db'
import { z } from 'zod'

const createConsentSchema = z.object({
  consentType: z.string().min(1),
  granted: z.boolean(),
  expiresAt: z.string().datetime().optional().nullable(),
})

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
    const { user } = authResult

    if (!params.id || typeof params.id !== 'string' || params.id.trim().length === 0) {
      return NextResponse.json({ error: 'Nieprawidłowy format ID' }, { status: 400 })
    }

    const consents = await db.dataConsent.findMany({
      where: { clientId: params.id.trim() },
      orderBy: { grantedAt: 'desc' },
    })

    return NextResponse.json({ consents })
  } catch (error: any) {
    console.error('Get consents error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania zgód' },
      { status: 500 }
    )
  }
}

export async function POST(
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
    const { user } = authResult

    if (!params.id || typeof params.id !== 'string' || params.id.trim().length === 0) {
      return NextResponse.json({ error: 'Nieprawidłowy format ID' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = createConsentSchema.parse(body)

    const consent = await db.dataConsent.create({
      data: {
        clientId: params.id.trim(),
        consentType: validatedData.consentType as any,
        granted: validatedData.granted,
        grantedAt: new Date(),
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
      },
    })

    await logApiActivity(user.id, 'DATA_CONSENT_CREATED', 'DataConsent', consent.id, {
      clientId: params.id,
      consentType: validatedData.consentType,
    }, request)

    return NextResponse.json({ consent }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Create consent error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas tworzenia zgody' },
      { status: 500 }
    )
  }
}

