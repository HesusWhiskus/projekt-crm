import { NextResponse } from 'next/server'
import { requireAuth } from '@/presentation/api/middleware/auth'
import { GetPolicyUseCase, UpdatePolicyUseCase } from '@/application/policies/use-cases'
import { PrismaPolicyRepository } from '@/infrastructure/persistence/prisma'
import { UpdatePolicyDTO } from '@/application/policies/dto'
import { applyRateLimit, logApiActivity } from '@/lib/api-security'
import { z } from 'zod'
import { logError } from '@/lib/logger'
import { db } from '@/lib/db'

const policyRepository = new PrismaPolicyRepository()
const getPolicyUseCase = new GetPolicyUseCase(policyRepository)
const updatePolicyUseCase = new UpdatePolicyUseCase(policyRepository)

const updatePolicySchema = z.object({
  policyNumber: z.string().optional(),
  issueDate: z.string().datetime().optional(),
  validFrom: z.string().datetime().optional(),
  validTo: z.string().datetime().optional(),
  status: z.enum(['ACTIVE', 'EXPIRED', 'CANCELLED', 'RENEWED']).optional(),
  calculationId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  vehicleId: z.string().optional().nullable(),
  insuranceCompanyId: z.string().optional(),
  agentId: z.string().optional().nullable(),
  externalId: z.string().optional().nullable(),
})

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const rateLimitResponse = await applyRateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse

    const authResult = await requireAuth()
    if ('response' in authResult) {
      await logApiActivity(null, 'API_UNAUTHORIZED_ATTEMPT', 'Policy', params.id, {}, request)
      return authResult.response
    }
    const { user } = authResult

    if (!params.id || typeof params.id !== 'string' || params.id.trim().length === 0) {
      return NextResponse.json({ error: 'Nieprawidłowy format ID' }, { status: 400 })
    }

    const policyId = params.id.trim()
    
    // SECURITY-FIX: [IDOR-10] Sprawdzenie uprawnień przed zwróceniem polisy
    // Data: 2025-01-27
    // Get user with organizationId
    const userWithOrg = await db.user.findUnique({
      where: { id: user.id },
      select: { organizationId: true },
    })
    
    // Get policy to check access
    const policy = await getPolicyUseCase.execute(policyId)
    
    if (!policy) {
      return NextResponse.json({ error: 'Polisa nie znaleziona' }, { status: 404 })
    }
    
    // Check authorization: ADMIN sees all policies in organization, USER sees only their own policies
    if (user.role !== 'ADMIN') {
      if (policy.organizationId !== userWithOrg?.organizationId || policy.agentId !== user.id) {
        await logApiActivity(user.id, 'API_UNAUTHORIZED_ACCESS_ATTEMPT', 'Policy', policyId, {}, request)
        return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })
      }
    } else {
      // ADMIN can see all policies in their organization
      if (policy.organizationId !== userWithOrg?.organizationId) {
        await logApiActivity(user.id, 'API_UNAUTHORIZED_ACCESS_ATTEMPT', 'Policy', policyId, {}, request)
        return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })
      }
    }

    return NextResponse.json({ policy })
  } catch (error: unknown) {
    // SECURITY-FIX: [ERROR-LOG-2] Zastąpiono console.error przez logError z sanitizacją
    // Data: 2025-01-27
    logError('Get policy error', error)
    
    if (error instanceof Error && error.message?.includes('nie znaleziony')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania polisy' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const rateLimitResponse = await applyRateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse

    const authResult = await requireAuth()
    if ('response' in authResult) {
      await logApiActivity(null, 'API_UNAUTHORIZED_ATTEMPT', 'Policy', params.id, {}, request)
      return authResult.response
    }
    const { user } = authResult

    if (!params.id || typeof params.id !== 'string' || params.id.trim().length === 0) {
      return NextResponse.json({ error: 'Nieprawidłowy format ID' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = updatePolicySchema.parse(body)

    const dto: UpdatePolicyDTO = {
      policyNumber: validatedData.policyNumber,
      issueDate: validatedData.issueDate,
      validFrom: validatedData.validFrom,
      validTo: validatedData.validTo,
      status: validatedData.status,
      calculationId: validatedData.calculationId !== undefined ? validatedData.calculationId || undefined : undefined,
      clientId: validatedData.clientId !== undefined ? validatedData.clientId || undefined : undefined,
      vehicleId: validatedData.vehicleId !== undefined ? validatedData.vehicleId || undefined : undefined,
      insuranceCompanyId: validatedData.insuranceCompanyId,
      agentId: validatedData.agentId !== undefined ? validatedData.agentId || undefined : undefined,
    }

    const policy = await updatePolicyUseCase.execute(params.id.trim(), dto, user)

    await logApiActivity(user.id, 'POLICY_UPDATED', 'Policy', policy.id, {
      updatedFields: Object.keys(validatedData),
    }, request)

    return NextResponse.json({ policy })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    if (error.message?.includes('nie znaleziony')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    // SECURITY-FIX: [ERROR-LOG-2] Zastąpiono console.error przez logError z sanitizacją
    // Data: 2025-01-27
    logError('Update policy error', error)
    const errorMessage = error instanceof Error ? error.message : 'Wystąpił błąd podczas aktualizacji polisy'
    const isBadRequest = errorMessage.includes('już istnieje') || errorMessage.includes('Nieprawidłowy')
    return NextResponse.json(
      { error: errorMessage },
      { status: isBadRequest ? 400 : 500 }
    )
  }
}

