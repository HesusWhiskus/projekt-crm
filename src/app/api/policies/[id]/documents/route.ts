import { NextResponse } from 'next/server'
import { requireAuth } from '@/presentation/api/middleware/auth'
import { UploadPolicyDocumentUseCase } from '@/application/policies/use-cases'
import { PrismaPolicyRepository } from '@/infrastructure/persistence/prisma'
import { applyRateLimit, logApiActivity } from '@/lib/api-security'
import { MAX_FILE_SIZE } from '@/lib/file-upload'
import { logError } from '@/lib/logger'

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

    // SECURITY-FIX: [UPLOAD-5] Walidacja rozmiaru pliku
    // Data: 2025-01-27
    if (size && size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Plik jest zbyt duży. Maksymalny rozmiar: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 413 }
      )
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
  } catch (error: unknown) {
    if (error instanceof Error && error.message?.includes('nie znaleziony')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    // SECURITY-FIX: [ERROR-LOG-2] Zastąpiono console.error przez logError z sanitizacją
    // Data: 2025-01-27
    logError('Upload policy document error', error)
    const errorMessage = error instanceof Error ? error.message : 'Wystąpił błąd podczas przesyłania dokumentu'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

