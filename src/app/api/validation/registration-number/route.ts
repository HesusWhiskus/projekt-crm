import { NextResponse } from 'next/server'
import { requireAuth } from '@/presentation/api/middleware/auth'
import { RegistrationNumber } from '@/domain/vehicles/value-objects'
import { applyRateLimit } from '@/lib/api-security'
import { z } from 'zod'

const validateRegistrationNumberSchema = z.object({
  registrationNumber: z.string().min(1, 'Numer rejestracyjny jest wymagany'),
})

export async function POST(request: Request) {
  try {
    const rateLimitResponse = await applyRateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse

    await requireAuth()

    const body = await request.json()
    const validatedData = validateRegistrationNumberSchema.parse(body)

    try {
      const registrationNumber = RegistrationNumber.create(validatedData.registrationNumber)
      if (!registrationNumber) {
        return NextResponse.json({ valid: false, error: 'Numer rejestracyjny jest wymagany' }, { status: 400 })
      }
      return NextResponse.json({ valid: true, registrationNumber: registrationNumber.getValue() })
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

    console.error('Validate registration number error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas walidacji numeru rejestracyjnego' },
      { status: 500 }
    )
  }
}

