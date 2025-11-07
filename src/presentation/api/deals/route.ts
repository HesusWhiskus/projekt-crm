import { NextResponse } from 'next/server'
import { requireAuth } from '../middleware/auth'
import { CreateDealUseCase, ListDealsUseCase } from '@/application/deals/use-cases'
import { PrismaDealRepository } from '@/infrastructure/persistence/prisma/PrismaDealRepository'
import { DealPipelineService } from '@/domain/deals/services'
import { CreateDealDTO, DealFilterDTO } from '@/application/deals/dto'
import { z } from 'zod'

// Initialize dependencies (in production, use DI container)
const dealRepository = new PrismaDealRepository()
const pipelineService = new DealPipelineService()
const createDealUseCase = new CreateDealUseCase(dealRepository)
const listDealsUseCase = new ListDealsUseCase(dealRepository)

export async function POST(request: Request) {
  try {
    // Authentication
    const authResult = await requireAuth()
    if ('response' in authResult) {
      return authResult.response
    }
    const { user } = authResult

    // Parse and validate request body
    const body = await request.json()
    
    // Basic validation (detailed validation in use case)
    const createDealSchema = z.object({
      clientId: z.string().min(1),
      value: z.union([z.number(), z.string()]),
      currency: z.string().max(3).optional(),
      probability: z.union([z.number(), z.string()]).optional(),
      stage: z.enum(['INITIAL_CONTACT', 'PROPOSAL', 'NEGOTIATION', 'CLOSING', 'WON', 'LOST']).optional(),
      expectedCloseDate: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
      sharedGroupIds: z.array(z.string()).optional(),
    })

    let validatedData: CreateDealDTO
    try {
      validatedData = createDealSchema.parse(body) as CreateDealDTO
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
    const deal = await createDealUseCase.execute(validatedData, user)

    return NextResponse.json({ deal }, { status: 201 })
  } catch (error: any) {
    console.error('Deal creation error:', error)
    
    // Handle domain errors
    if (error.message) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Wystąpił błąd podczas tworzenia deala' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    // Authentication
    const authResult = await requireAuth()
    if ('response' in authResult) {
      return authResult.response
    }
    const { user } = authResult

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    
    const dealQuerySchema = z.object({
      clientId: z.string().optional(),
      stage: z.enum(['INITIAL_CONTACT', 'PROPOSAL', 'NEGOTIATION', 'CLOSING', 'WON', 'LOST']).optional(),
      search: z.string().optional(),
    })

    let validatedParams: DealFilterDTO
    try {
      const params: any = {}
      if (searchParams.get('clientId')) params.clientId = searchParams.get('clientId')
      if (searchParams.get('stage')) params.stage = searchParams.get('stage')
      if (searchParams.get('search')) params.search = searchParams.get('search')
      
      validatedParams = dealQuerySchema.parse(params) as DealFilterDTO
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
    const deals = await listDealsUseCase.execute(validatedParams, user)

    return NextResponse.json({ deals })
  } catch (error: any) {
    console.error('Deals fetch error:', error)
    
    // Handle domain errors
    if (error.message) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania deali' },
      { status: 500 }
    )
  }
}

