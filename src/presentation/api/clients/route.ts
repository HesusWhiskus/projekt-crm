import { NextResponse } from 'next/server'
import { requireAuth } from '../middleware/auth'
import { CreateClientUseCase, ListClientsUseCase } from '@/application/clients/use-cases'
import { PrismaClientRepository } from '@/infrastructure/persistence/prisma'
import { ClientStatusChangeService } from '@/domain/clients/services'
import { CreateClientDTO, ClientFilterDTO } from '@/application/clients/dto'
import { validateQueryParams, clientQuerySchema } from '@/lib/query-validator'
import { z } from 'zod'
import { applyRateLimit, logApiActivity } from '@/lib/api-security'

// Initialize dependencies (in production, use DI container)
const clientRepository = new PrismaClientRepository()
const statusChangeService = new ClientStatusChangeService()
const createClientUseCase = new CreateClientUseCase(clientRepository)
const listClientsUseCase = new ListClientsUseCase(clientRepository)

/**
 * @swagger
 * /api/clients:
 *   post:
 *     summary: Tworzy nowego klienta
 *     description: Tworzy nowego klienta w systemie. Wymaga autoryzacji.
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *                 description: Imię klienta
 *               lastName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *                 description: Nazwisko klienta
 *               agencyName:
 *                 type: string
 *                 nullable: true
 *                 maxLength: 150
 *                 description: Nazwa agencji
 *               email:
 *                 type: string
 *                 format: email
 *                 nullable: true
 *                 maxLength: 255
 *               phone:
 *                 type: string
 *                 nullable: true
 *                 maxLength: 30
 *               website:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *                 maxLength: 2048
 *               address:
 *                 type: string
 *                 nullable: true
 *                 maxLength: 500
 *               source:
 *                 type: string
 *                 nullable: true
 *                 maxLength: 100
 *               status:
 *                 type: string
 *                 enum: [NEW_LEAD, IN_CONTACT, DEMO_SENT, NEGOTIATION, ACTIVE_CLIENT, LOST]
 *                 default: NEW_LEAD
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *                 nullable: true
 *               nextFollowUpAt:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               assignedTo:
 *                 type: string
 *                 nullable: true
 *                 description: CUID użytkownika przypisanego
 *               sharedGroupIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array ID grup do udostępnienia
 *     responses:
 *       201:
 *         description: Klient został utworzony
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 client:
 *                   $ref: '#/components/schemas/Client'
 *       400:
 *         description: Błąd walidacji
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Nieautoryzowany
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Błąd serwera
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(request: Request) {
  try {
    // Rate limiting
    const rateLimitResponse = await applyRateLimit(request, "api")
    if (rateLimitResponse) return rateLimitResponse

    // Authentication
    const authResult = await requireAuth()
    if ('response' in authResult) {
      await logApiActivity(null, "API_UNAUTHORIZED_ATTEMPT", "Client", null, {}, request)
      return authResult.response
    }
    const { user } = authResult

    // Parse and validate request body
    const body = await request.json()
    
    // Basic validation (detailed validation in use case)
    const createClientSchema = z.object({
      type: z.enum(['PERSON', 'COMPANY']).optional(),
      firstName: z.string().min(1).max(50).optional(),
      lastName: z.string().min(1).max(50).optional(),
      companyName: z.string().max(150).optional().nullable(),
      taxId: z.string().max(50).optional().nullable(),
      agencyName: z.string().max(150).optional().nullable(), // Deprecated
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
    }).refine((data) => {
      // Validate type-specific required fields
      if (data.type === 'PERSON') {
        return data.firstName && data.lastName
      } else if (data.type === 'COMPANY') {
        return data.companyName
      }
      // If type not specified, require firstName and lastName (backward compatibility)
      return data.firstName && data.lastName
    }, {
      message: "Dla typu PERSON wymagane są firstName i lastName. Dla typu COMPANY wymagane jest companyName."
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

/**
 * @swagger
 * /api/clients:
 *   get:
 *     summary: Pobiera listę klientów
 *     description: Pobiera listę klientów z możliwością filtrowania. Wymaga autoryzacji. Użytkownicy widzą tylko swoich klientów lub udostępnionych przez grupy.
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [NEW_LEAD, IN_CONTACT, DEMO_SENT, NEGOTIATION, ACTIVE_CLIENT, LOST]
 *         description: Filtr statusu klienta
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Wyszukiwanie po nazwie, emailu
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: string
 *         description: ID użytkownika przypisanego (CUID format)
 *       - in: query
 *         name: noContactDays
 *         schema:
 *           type: string
 *         description: Liczba dni jako string. Filtruje klientów bez kontaktu przez X dni
 *       - in: query
 *         name: followUpToday
 *         schema:
 *           type: string
 *           enum: ["true"]
 *         description: 'true jako string. Filtruje klientów z follow-up dzisiaj'
 *     responses:
 *       200:
 *         description: Lista klientów
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clients:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Client'
 *       400:
 *         description: Błąd walidacji
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Nieautoryzowany
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Błąd serwera
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(request: Request) {
  try {
    // Rate limiting
    const rateLimitResponse = await applyRateLimit(request, "api")
    if (rateLimitResponse) return rateLimitResponse

    // Authentication
    const authResult = await requireAuth()
    if ('response' in authResult) {
      await logApiActivity(null, "API_UNAUTHORIZED_ATTEMPT", "Client", null, {}, request)
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

