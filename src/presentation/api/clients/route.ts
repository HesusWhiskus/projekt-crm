import { NextResponse } from 'next/server'
import { requireAuth } from '../middleware/auth'
import { CreateClientUseCase, ListClientsUseCase } from '@/application/clients/use-cases'
import { PrismaClientRepository } from '@/infrastructure/persistence/prisma'
import { ClientStatusChangeService } from '@/domain/clients/services'
import { CreateClientDTO, ClientFilterDTO } from '@/application/clients/dto'
import { validateQueryParams, clientQuerySchema } from '@/lib/query-validator'
import { z } from 'zod'

// Initialize dependencies (in production, use DI container)
const clientRepository = new PrismaClientRepository()
const statusChangeService = new ClientStatusChangeService()
const createClientUseCase = new CreateClientUseCase(clientRepository)
const listClientsUseCase = new ListClientsUseCase(clientRepository)

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
    const createClientSchema = z.object({
      firstName: z.string().min(1).max(50),
      lastName: z.string().min(1).max(50),
      agencyName: z.string().max(150).optional().nullable(),
      email: z.string().email().max(255).optional().nullable(),
      phone: z.string().max(30).optional().nullable(),
      website: z.string().max(2048).optional().nullable(),
      address: z.string().max(500).optional().nullable(),
      source: z.string().max(100).optional().nullable(),
      status: z.enum(['NEW_LEAD', 'IN_CONTACT', 'DEMO_SENT', 'NEGOTIATION', 'ACTIVE_CLIENT', 'LOST']).optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional().nullable(),
      nextFollowUpAt: z.string().optional().nullable(),
      assignedTo: z.string().optional().nullable(),
      sharedGroupIds: z.array(z.string()).optional(),
    })

    let validatedData: CreateClientDTO
    try {
      validatedData = createClientSchema.parse(body) as CreateClientDTO
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
    const client = await createClientUseCase.execute(validatedData, user)

    return NextResponse.json({ client }, { status: 201 })
  } catch (error: any) {
    console.error('Client creation error:', error)
    
    // Handle domain errors
    if (error.message) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Wystąpił błąd podczas tworzenia klienta' },
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
    
    let validatedParams: ClientFilterDTO
    try {
      validatedParams = validateQueryParams(clientQuerySchema, searchParams) as ClientFilterDTO
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
    const clients = await listClientsUseCase.execute(validatedParams, user)

    return NextResponse.json({ clients })
  } catch (error: any) {
    console.error('Clients fetch error:', error)
    
    // Handle domain errors
    if (error.message) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania klientów' },
      { status: 500 }
    )
  }
}

