import { NextResponse } from 'next/server'
import { requireAuth } from '../../../middleware/auth'
import { CloseDealUseCase } from '@/application/deals/use-cases'
import { PrismaDealRepository } from '@/infrastructure/persistence/prisma/PrismaDealRepository'
import { DealPipelineService } from '@/domain/deals/services'
import { z } from 'zod'

// Initialize dependencies (in production, use DI container)
const dealRepository = new PrismaDealRepository()
const pipelineService = new DealPipelineService()
const closeDealUseCase = new CloseDealUseCase(dealRepository, pipelineService)

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Validate ID
    if (!params.id || typeof params.id !== 'string' || params.id.trim().length === 0) {
      return NextResponse.json({ error: 'Nieprawidłowy format ID' }, { status: 400 })
    }
    const dealId = params.id.trim()

    // Authentication
    const authResult = await requireAuth()
    if ('response' in authResult) {
      return authResult.response
    }
    const { user } = authResult

    // Parse and validate request body
    const body = await request.json()
    
    const closeDealSchema = z.object({
      won: z.boolean(),
    })

    let validatedData
    try {
      validatedData = closeDealSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: error.errors[0].message },
          { status: 400 }
        )
      }
      throw error
    }

    // Execute use case
    const deal = await closeDealUseCase.execute(dealId, validatedData.won, user)

    return NextResponse.json({ deal })
  } catch (error: any) {
    console.error('Deal close error:', error)
    
    // Handle domain errors
    if (error.message === 'Deal nie znaleziony') {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    if (error.message === 'Brak uprawnień do tego deala') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    if (error.message) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Wystąpił błąd podczas zamykania deala' },
      { status: 500 }
    )
  }
}

