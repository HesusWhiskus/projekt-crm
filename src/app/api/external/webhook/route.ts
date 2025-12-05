import { NextResponse } from 'next/server'
import { WebhookHandler } from '@/infrastructure/external'
import { applyRateLimit } from '@/lib/api-security'
import { logError } from '@/lib/logger'

const webhookHandler = new WebhookHandler()

export async function POST(request: Request) {
  try {
    // Webhook endpoints typically have different rate limiting
    const rateLimitResponse = await applyRateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    // TODO: Validate signature if needed
    // const signature = request.headers.get('x-signature') || undefined

    const result = await webhookHandler.processWebhook(body)

    return NextResponse.json({ success: true, result })
  } catch (error: unknown) {
    // SECURITY-FIX: [ERROR-LOG-2] Zastąpiono console.error przez logError z sanitizacją
    // Data: 2025-01-27
    logError('Webhook error', error)
    const errorMessage = error instanceof Error ? error.message : 'Wystąpił błąd podczas przetwarzania webhooka'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

