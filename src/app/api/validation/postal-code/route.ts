import { NextResponse } from 'next/server'
import { requireAuth } from '@/presentation/api/middleware/auth'
import { PostalCode } from '@/domain/calculations/value-objects'
import { applyRateLimit } from '@/lib/api-security'
import { z } from 'zod'

const validatePostalCodeSchema = z.object({
  postalCode: z.string().min(1, 'Kod pocztowy jest wymagany'),
})

export async function POST(request: Request) {
  try {
    const rateLimitResponse = await applyRateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse

    await requireAuth()

    const body = await request.json()
    const validatedData = validatePostalCodeSchema.parse(body)

    try {
      const postalCode = PostalCode.create(validatedData.postalCode)
      if (!postalCode) {
        return NextResponse.json({ valid: false, error: 'Kod pocztowy jest wymagany' }, { status: 400 })
      }
      return NextResponse.json({ valid: true, postalCode: postalCode.getValue() })
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

    console.error('Validate postal code error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas walidacji kodu pocztowego' },
      { status: 500 }
    )
  }
}

