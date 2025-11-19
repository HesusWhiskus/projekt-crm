import { NextResponse } from 'next/server'
import { requireAuth } from '@/presentation/api/middleware/auth'
import { VIN } from '@/domain/vehicles/value-objects'
import { applyRateLimit } from '@/lib/api-security'
import { z } from 'zod'

const validateVinSchema = z.object({
  vin: z.string().min(1, 'VIN jest wymagany'),
})

export async function POST(request: Request) {
  try {
    const rateLimitResponse = await applyRateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse

    await requireAuth()

    const body = await request.json()
    const validatedData = validateVinSchema.parse(body)

    try {
      const vin = VIN.create(validatedData.vin)
      if (!vin) {
        return NextResponse.json({ valid: false, error: 'VIN jest wymagany' }, { status: 400 })
      }
      return NextResponse.json({ valid: true, vin: vin.getValue() })
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

    console.error('Validate VIN error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas walidacji VIN' },
      { status: 500 }
    )
  }
}

