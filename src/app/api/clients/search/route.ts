import { NextResponse } from 'next/server'
import { requireAuth } from '@/presentation/api/middleware/auth'
import { applyRateLimit, logApiActivity } from '@/lib/api-security'
import { db } from '@/lib/db'
import { logError } from '@/lib/logger'

// Force dynamic rendering - this route uses request headers and requires database connection
export const dynamic = 'force-dynamic'

/**
 * @swagger
 * /api/clients/search:
 *   get:
 *     summary: Wyszukuje klientów
 *     description: Wyszukuje klientów po nazwie, emailu lub telefonie. Zwraca maksymalnie 50 wyników. Wymaga autoryzacji.
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Fraza wyszukiwania (minimum 2 znaki)
 *     responses:
 *       200:
 *         description: Lista znalezionych klientów
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clients:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                       companyName:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [PERSON, COMPANY]
 *                       email:
 *                         type: string
 *       400:
 *         description: Błąd walidacji
 *       401:
 *         description: Nieautoryzowany
 *       500:
 *         description: Błąd serwera
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
    const query = searchParams.get('q') || ''

    // Validate query - minimum 2 characters
    if (query.length < 2) {
      return NextResponse.json(
        { error: 'Fraza wyszukiwania musi mieć minimum 2 znaki' },
        { status: 400 }
      )
    }

    // Build where clause with access control
    const where: {
      OR: Array<{
        companyName?: { contains: string; mode: 'insensitive' }
        firstName?: { contains: string; mode: 'insensitive' }
        lastName?: { contains: string; mode: 'insensitive' }
        email?: { contains: string; mode: 'insensitive' }
        phone?: { contains: string; mode: 'insensitive' }
      }>
      AND?: Array<{
        OR: Array<{
          assignedTo?: string
          sharedGroups?: { some: { users: { some: { userId: string } } } }
        }>
      }>
    } = {
      OR: [
        { companyName: { contains: query, mode: 'insensitive' } },
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } },
      ],
    }

    // Access control - users see only their clients or shared through groups
    if (user.role !== 'ADMIN') {
      where.AND = [
        {
          OR: [
            { assignedTo: user.id },
            { sharedGroups: { some: { users: { some: { userId: user.id } } } } },
          ],
        },
      ]
    }

    // Fetch clients with limit
    const clients = await db.client.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        companyName: true,
        type: true,
        email: true,
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' },
        { companyName: 'asc' },
      ],
      take: 50, // Limit to 50 results
    })

    return NextResponse.json({ clients })
  } catch (error: unknown) {
    // SECURITY-FIX: [ERROR-LOG-2] Zastąpiono console.error przez logError z sanitizacją
    // Data: 2025-01-27
    logError('Client search error', error)
    
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas wyszukiwania klientów' },
      { status: 500 }
    )
  }
}

