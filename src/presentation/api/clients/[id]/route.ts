import { NextResponse } from 'next/server'
import { requireAuth, requireRole } from '../../middleware/auth'
import { GetClientUseCase, UpdateClientUseCase, DeleteClientUseCase } from '@/application/clients/use-cases'
import { PrismaClientRepository } from '@/infrastructure/persistence/prisma'
import { ClientStatusChangeService } from '@/domain/clients/services'
import { UpdateClientDTO } from '@/application/clients/dto'
import { z } from 'zod'

// Initialize dependencies (in production, use DI container)
const clientRepository = new PrismaClientRepository()
const statusChangeService = new ClientStatusChangeService()
const getClientUseCase = new GetClientUseCase(clientRepository)
const updateClientUseCase = new UpdateClientUseCase(clientRepository, statusChangeService)
const deleteClientUseCase = new DeleteClientUseCase(clientRepository)

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Validate ID
    if (!params.id || typeof params.id !== 'string' || params.id.trim().length === 0) {
      return NextResponse.json({ error: 'Nieprawidłowy format ID' }, { status: 400 })
    }
    const clientId = params.id.trim()

    // Authentication
    const authResult = await requireAuth()
    if ('response' in authResult) {
      return authResult.response
    }
    const { user } = authResult

    // Execute use case
    const client = await getClientUseCase.execute(clientId, user)

    return NextResponse.json({ client })
  } catch (error: any) {
    console.error('Client fetch error:', error)
    
    // Handle domain errors
    if (error.message === 'Klient nie znaleziony') {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    if (error.message === 'Brak uprawnień') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania klienta' },
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
    const clientId = params.id.trim()

    // Authentication
    const authResult = await requireAuth()
    if ('response' in authResult) {
      return authResult.response
    }
    const { user } = authResult

    // Parse and validate request body
    const body = await request.json()
    
    const updateClientSchema = z.object({
      firstName: z.string().min(1).max(50).optional(),
      lastName: z.string().min(1).max(50).optional(),
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

    let validatedData: UpdateClientDTO
    try {
      validatedData = updateClientSchema.parse(body) as UpdateClientDTO
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
    const client = await updateClientUseCase.execute(clientId, validatedData, user)

    return NextResponse.json({ client })
  } catch (error: any) {
    console.error('Client update error:', error)
    
    // Handle domain errors
    if (error.message === 'Klient nie znaleziony') {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    if (error.message === 'Brak uprawnień') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    if (error.message) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Wystąpił błąd podczas aktualizacji klienta' },
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
    const clientId = params.id.trim()

    // Authentication - only ADMIN can delete
    const authResult = await requireRole('ADMIN')
    if ('response' in authResult) {
      return authResult.response
    }
    const { user } = authResult

    // Execute use case
    await deleteClientUseCase.execute(clientId, user)

    return NextResponse.json({ message: 'Klient został usunięty' })
  } catch (error: any) {
    console.error('Client deletion error:', error)
    
    // Handle domain errors
    if (error.message === 'Klient nie znaleziony') {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    if (error.message === 'Brak uprawnień') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    return NextResponse.json(
      { error: 'Wystąpił błąd podczas usuwania klienta' },
      { status: 500 }
    )
  }
}

