import { NextResponse } from 'next/server'
import { requireAuth } from '@/presentation/api/middleware/auth'
import { PESEL } from '@/domain/calculations/value-objects'
import { applyRateLimit } from '@/lib/api-security'
import { z } from 'zod'

const validatePeselSchema = z.object({
  pesel: z.string().min(1, 'PESEL jest wymagany'),
})

export async function POST(request: Request) {
  try {
    const rateLimitResponse = await applyRateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse

    await requireAuth()

    const body = await request.json()
    const validatedData = validatePeselSchema.parse(body)

    try {
      const pesel = PESEL.create(validatedData.pesel)
      if (!pesel) {
        return NextResponse.json({ valid: false, error: 'PESEL jest wymagany' }, { status: 400 })
      }
      return NextResponse.json({ valid: true, pesel: pesel.getValue() })
    } catch (error: any) {
      return NextResponse.json({ valid: false, error: error.message }, { status: 400 })
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Validate PESEL error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas walidacji PESEL' },
      { status: 500 }
    )
  }
}

