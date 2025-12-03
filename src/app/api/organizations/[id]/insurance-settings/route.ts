import { NextResponse } from 'next/server'
import { requireAuth } from '@/presentation/api/middleware/auth'
import { requireRole } from '@/presentation/api/middleware/auth'
import { applyRateLimit, logApiActivity } from '@/lib/api-security'
import { db } from '@/lib/db'
import { z } from 'zod'
import { logError } from '@/lib/logger'

const updateInsuranceSettingsSchema = z.object({
  validationLevel: z.enum(['STRICT', 'RELAXED']).optional(),
  encryptionEnabled: z.boolean().optional(),
  auditRetentionDays: z.number().int().min(1).optional(),
  gdprEnabled: z.boolean().optional(),
  dataRetentionDays: z.number().int().min(1).optional(),
  cacheEnabled: z.boolean().optional(),
  cacheTTL: z.number().int().min(1).optional(),
})

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const rateLimitResponse = await applyRateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse

    const authResult = await requireRole('ADMIN')
    if ('response' in authResult) {
      return authResult.response
    }

    if (!params.id || typeof params.id !== 'string' || params.id.trim().length === 0) {
      return NextResponse.json({ error: 'Nieprawidłowy format ID' }, { status: 400 })
    }

    const settings = await db.organizationInsuranceSettings.findUnique({
      where: { organizationId: params.id.trim() },
    })

    return NextResponse.json({ settings })
  } catch (error: unknown) {
    // SECURITY-FIX: [ERROR-LOG-2] Zastąpiono console.error przez logError z sanitizacją
    // Data: 2025-01-27
    logError('Get insurance settings error', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania ustawień' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const rateLimitResponse = await applyRateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse

    const authResult = await requireRole('ADMIN')
    if ('response' in authResult) {
      return authResult.response
    }
    const { user } = authResult

    if (!params.id || typeof params.id !== 'string' || params.id.trim().length === 0) {
      return NextResponse.json({ error: 'Nieprawidłowy format ID' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = updateInsuranceSettingsSchema.parse(body)

    const settings = await db.organizationInsuranceSettings.upsert({
      where: { organizationId: params.id.trim() },
      update: validatedData,
      create: {
        organizationId: params.id.trim(),
        ...validatedData,
      },
    })

    await logApiActivity(user.id, 'INSURANCE_SETTINGS_UPDATED', 'OrganizationInsuranceSettings', settings.id, {
      organizationId: params.id,
      updatedFields: Object.keys(validatedData),
    }, request)

    return NextResponse.json({ settings })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    // SECURITY-FIX: [ERROR-LOG-2] Zastąpiono console.error przez logError z sanitizacją
    // Data: 2025-01-27
    logError('Update insurance settings error', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas aktualizacji ustawień' },
      { status: 500 }
    )
  }
}

