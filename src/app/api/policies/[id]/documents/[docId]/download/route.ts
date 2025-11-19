import { NextResponse } from 'next/server'
import { requireAuth } from '@/presentation/api/middleware/auth'
import { DownloadPolicyDocumentUseCase } from '@/application/policies/use-cases'
import { applyRateLimit, logApiActivity } from '@/lib/api-security'

const downloadPolicyDocumentUseCase = new DownloadPolicyDocumentUseCase()

export async function GET(
  request: Request,
  { params }: { params: { id: string; docId: string } }
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
      return NextResponse.json({ error: 'Nieprawidłowy format ID polisy' }, { status: 400 })
    }

    if (!params.docId || typeof params.docId !== 'string' || params.docId.trim().length === 0) {
      return NextResponse.json({ error: 'Nieprawidłowy format ID dokumentu' }, { status: 400 })
    }

    const document = await downloadPolicyDocumentUseCase.execute(
      params.docId.trim(),
      user
    )

    if (!document) {
      return NextResponse.json({ error: 'Dokument nie znaleziony' }, { status: 404 })
    }

    await logApiActivity(user.id, 'POLICY_DOCUMENT_DOWNLOADED', 'Policy', params.id, {
      documentId: params.docId,
    }, request)

    // Return document info with path (client should fetch from path)
    return NextResponse.json({ document })
  } catch (error: any) {
    if (error.message?.includes('nie znaleziony')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    console.error('Download policy document error:', error)
    return NextResponse.json(
      { error: error.message || 'Wystąpił błąd podczas pobierania dokumentu' },
      { status: 500 }
    )
  }
}

