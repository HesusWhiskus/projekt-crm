import { NextResponse } from 'next/server'
import { requireAuth } from '../../middleware/auth'
import { GetDealUseCase, UpdateDealUseCase, DeleteDealUseCase, CloseDealUseCase } from '@/application/deals/use-cases'
import { PrismaDealRepository } from '@/infrastructure/persistence/prisma/PrismaDealRepository'
import { DealPipelineService } from '@/domain/deals/services'
import { UpdateDealDTO } from '@/application/deals/dto'
import { z } from 'zod'

// Initialize dependencies (in production, use DI container)
const dealRepository = new PrismaDealRepository()
const pipelineService = new DealPipelineService()
const getDealUseCase = new GetDealUseCase(dealRepository)
const updateDealUseCase = new UpdateDealUseCase(dealRepository, pipelineService)
const deleteDealUseCase = new DeleteDealUseCase(dealRepository)
const closeDealUseCase = new CloseDealUseCase(dealRepository, pipelineService)

export async function GET(
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

    // Execute use case
    const deal = await getDealUseCase.execute(dealId, user)

    return NextResponse.json({ deal })
  } catch (error: any) {
    console.error('Deal fetch error:', error)
    
    // Handle domain errors
    if (error.message === 'Deal nie znaleziony') {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    if (error.message === 'Brak uprawnień do tego deala') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania deala' },
      { status: 500 }
    )
  }
}

export async function PATCH(
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
    
    const updateDealSchema = z.object({
      value: z.union([z.number(), z.string()]).optional(),
      currency: z.string().max(3).optional(),
      probability: z.union([z.number(), z.string()]).optional(),
      stage: z.enum(['INITIAL_CONTACT', 'PROPOSAL', 'NEGOTIATION', 'CLOSING', 'WON', 'LOST']).optional(),
      expectedCloseDate: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
      sharedGroupIds: z.array(z.string()).optional(),
    })

    let validatedData: UpdateDealDTO
    try {
      validatedData = updateDealSchema.parse(body) as UpdateDealDTO
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
    const deal = await updateDealUseCase.execute(dealId, validatedData, user)

    return NextResponse.json({ deal })
  } catch (error: any) {
    console.error('Deal update error:', error)
    
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
      { error: 'Wystąpił błąd podczas aktualizacji deala' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Execute use case
    await deleteDealUseCase.execute(dealId, user)

    return NextResponse.json({ message: 'Deal został usunięty' })
  } catch (error: any) {
    console.error('Deal deletion error:', error)
    
    // Handle domain errors
    if (error.message === 'Deal nie znaleziony') {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    if (error.message === 'Brak uprawnień do tego deala') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    return NextResponse.json(
      { error: 'Wystąpił błąd podczas usuwania deala' },
      { status: 500 }
    )
  }
}

