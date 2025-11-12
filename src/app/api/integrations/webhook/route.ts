import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { applyRateLimit, logApiActivity } from "@/lib/api-security"
import { checkFeature, FEATURE_KEYS } from "@/lib/feature-flags"

const webhookSchema = z.object({
  clientId: z.string().min(1, "ID klienta jest wymagane"),
  title: z.string().min(1, "Tytuł jest wymagany").max(200, "Tytuł jest zbyt długi"),
  content: z.record(z.any()), // JSON object
  order: z.number().int().min(0).optional().default(0),
})

/**
 * POST /api/integrations/webhook
 * Webhook endpoint dla zewnętrznych integracji (Pro feature)
 * Tworzy dynamiczną zakładkę integracji dla klienta
 */
export async function POST(request: Request) {
  try {
    // Rate limiting
    const rateLimitResponse = await applyRateLimit(request, "api")
    if (rateLimitResponse) return rateLimitResponse

    const user = await getCurrentUser()
    if (!user) {
      await logApiActivity(null, "API_UNAUTHORIZED_ATTEMPT", "Integration", null, {}, request)
      return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 })
    }

    // Check if integration tabs feature is enabled
    const hasFeature = await checkFeature(user.id, FEATURE_KEYS.INTEGRATION_TABS)
    if (!hasFeature) {
      return NextResponse.json(
        { error: "Funkcja integracji nie jest dostępna w Twoim planie" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = webhookSchema.parse(body)

    // Verify client exists and user has access
    const client = await db.client.findUnique({
      where: { id: validatedData.clientId },
      select: {
        id: true,
        assignedTo: true,
        organizationId: true,
      },
    })

    if (!client) {
      return NextResponse.json({ error: "Klient nie znaleziony" }, { status: 404 })
    }

    // Check access
    if (user.role !== "ADMIN" && client.assignedTo !== user.id) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 })
    }

    // Create integration tab
    const integrationTab = await db.integrationTab.create({
      data: {
        clientId: validatedData.clientId,
        title: validatedData.title,
        content: validatedData.content,
        order: validatedData.order,
      },
    })

    // Log API activity
    await logApiActivity(user.id, "INTEGRATION_TAB_CREATED", "Integration", integrationTab.id, {
      clientId: validatedData.clientId,
      title: validatedData.title,
    }, request)

    return NextResponse.json({ integrationTab }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Webhook integration error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas tworzenia zakładki integracji" },
      { status: 500 }
    )
  }
}

