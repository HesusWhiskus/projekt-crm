import { NextResponse } from 'next/server'
import { requireAuth } from '@/presentation/api/middleware/auth'
import { CreatePolicyUseCase, ListPoliciesUseCase } from '@/application/policies/use-cases'
import { PrismaPolicyRepository } from '@/infrastructure/persistence/prisma'
import { CreatePolicyDTO, PolicyFilterDTO } from '@/application/policies/dto'
import { applyRateLimit, logApiActivity } from '@/lib/api-security'
import { db } from '@/lib/db'
import { z } from 'zod'

const policyRepository = new PrismaPolicyRepository()
const createPolicyUseCase = new CreatePolicyUseCase(policyRepository)
const listPoliciesUseCase = new ListPoliciesUseCase(policyRepository)

const createPolicySchema = z.object({
  policyNumber: z.string().min(1, 'Numer polisy jest wymagany'),
  issueDate: z.string().datetime(),
  validFrom: z.string().datetime(),
  validTo: z.string().datetime(),
  status: z.enum(['ACTIVE', 'EXPIRED', 'CANCELLED', 'RENEWED']).optional(),
  calculationId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  vehicleId: z.string().optional().nullable(),
  insuranceCompanyId: z.string().min(1, 'ID Towarzystwa Ubezpieczeniowego jest wymagane'),
  agentId: z.string().optional().nullable(),
  organizationId: z.string().optional().nullable(),
  externalId: z.string().optional().nullable(),
  configurationType: z.enum(['STANDARD', 'LEASING', 'CREDIT']).optional().nullable(),
  leasingCompany: z.string().optional().nullable(),
  creditProvider: z.string().optional().nullable(),
  contractNumber: z.string().optional().nullable(),
})

export async function POST(request: Request) {
  try {
    const rateLimitResponse = await applyRateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse

    const authResult = await requireAuth()
    if ('response' in authResult) {
      await logApiActivity(null, 'API_UNAUTHORIZED_ATTEMPT', 'Policy', null, {}, request)
      return authResult.response
    }
    const { user } = authResult

    const body = await request.json()
    const validatedData = createPolicySchema.parse(body)

    const dto: CreatePolicyDTO = {
      policyNumber: validatedData.policyNumber,
      issueDate: validatedData.issueDate,
      validFrom: validatedData.validFrom,
      validTo: validatedData.validTo,
      status: validatedData.status,
      calculationId: validatedData.calculationId || undefined,
      clientId: validatedData.clientId || undefined,
      vehicleId: validatedData.vehicleId || undefined,
      insuranceCompanyId: validatedData.insuranceCompanyId,
      agentId: validatedData.agentId || undefined,
      organizationId: validatedData.organizationId || user.organizationId || undefined,
      externalId: validatedData.externalId || undefined,
      configurationType: validatedData.configurationType || undefined,
      leasingCompany: validatedData.leasingCompany || undefined,
      creditProvider: validatedData.creditProvider || undefined,
      contractNumber: validatedData.contractNumber || undefined,
    }

    const policy = await createPolicyUseCase.execute(dto, user)

    await logApiActivity(user.id, 'POLICY_CREATED', 'Policy', policy.id, {
      policyNumber: policy.policyNumber,
      status: policy.status,
    }, request)

    return NextResponse.json({ policy }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Create policy error:', error)
    return NextResponse.json(
      { error: error.message || 'Wystąpił błąd podczas tworzenia polisy' },
      { status: error.message?.includes('już istnieje') || error.message?.includes('Nieprawidłowy') ? 400 : 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const rateLimitResponse = await applyRateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse

    const authResult = await requireAuth()
    if ('response' in authResult) {
      await logApiActivity(null, 'API_UNAUTHORIZED_ATTEMPT', 'Policy', null, {}, request)
      return authResult.response
    }
    const { user } = authResult

    // Get user with organizationId from database
    const userWithOrg = await db.user.findUnique({
      where: { id: user.id },
      select: { organizationId: true },
    })

    const { searchParams } = new URL(request.url)
    
    // Parse pagination parameters
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')
    const page = pageParam ? parseInt(pageParam, 10) : undefined
    const limit = limitParam ? parseInt(limitParam, 10) : undefined

    const filter: PolicyFilterDTO = {
      status: searchParams.get('status') as any || undefined,
      clientId: searchParams.get('clientId') || undefined,
      vehicleId: searchParams.get('vehicleId') || undefined,
      insuranceCompanyId: searchParams.get('insuranceCompanyId') || undefined,
      agentId: searchParams.get('agentId') || undefined,
      organizationId: userWithOrg?.organizationId || undefined,
      policyNumber: searchParams.get('policyNumber') || undefined,
      search: searchParams.get('search') || undefined,
    }

    // Add pagination to filter if provided
    if (page !== undefined || limit !== undefined) {
      filter.pagination = { page, limit }
    }

    // Backward compatible: if no pagination params, log warning
    if (!filter.pagination) {
      console.warn('[API POLICIES] Pagination not used - returning all policies. Consider using ?page=1&limit=50')
    }

    const result = await listPoliciesUseCase.execute(filter)

    // Backward compatible response format
    if (Array.isArray(result)) {
      // Old format - array of policies
      return NextResponse.json({ policies: result })
    } else {
      // New format - paginated response
      return NextResponse.json(result)
    }
  } catch (error: any) {
    console.error('List policies error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania polis' },
      { status: 500 }
    )
  }
}

