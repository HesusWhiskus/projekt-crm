import { NextResponse } from 'next/server'
import { requireAuth } from '@/presentation/api/middleware/auth'
import { UploadPolicyDocumentUseCase } from '@/application/policies/use-cases'
import { PrismaPolicyRepository } from '@/infrastructure/persistence/prisma'
import { applyRateLimit, logApiActivity } from '@/lib/api-security'

const policyRepository = new PrismaPolicyRepository()
const uploadPolicyDocumentUseCase = new UploadPolicyDocumentUseCase(policyRepository)

export async function POST(
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
    const { filename, path, size, mimeType, externalId } = body

    if (!filename || !path) {
      return NextResponse.json({ error: 'Nazwa pliku i ścieżka są wymagane' }, { status: 400 })
    }

    const document = await uploadPolicyDocumentUseCase.execute(
      {
        policyId: params.id.trim(),
        filename,
        path,
        size,
        mimeType,
        externalId,
      },
      user
    )

    await logApiActivity(user.id, 'POLICY_DOCUMENT_UPLOADED', 'Policy', params.id, {
      documentId: document.id,
      filename,
    }, request)

    return NextResponse.json({ document }, { status: 201 })
  } catch (error: any) {
    if (error.message?.includes('nie znaleziony')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    console.error('Upload policy document error:', error)
    return NextResponse.json(
      { error: error.message || 'Wystąpił błąd podczas przesyłania dokumentu' },
      { status: 500 }
    )
  }
}

