import { NextResponse } from 'next/server'
import { WebhookHandler } from '@/infrastructure/external'
import { applyRateLimit } from '@/lib/api-security'

const webhookHandler = new WebhookHandler()

export async function POST(request: Request) {
  try {
    // Webhook endpoints typically have different rate limiting
    const rateLimitResponse = await applyRateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const signature = request.headers.get('x-signature') || undefined

    // TODO: Validate signature if needed
    const result = await webhookHandler.processWebhook(body)

    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Wystąpił błąd podczas przetwarzania webhooka' },
      { status: 500 }
    )
  }
}

