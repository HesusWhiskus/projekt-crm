import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { applyRateLimit, logApiActivity } from "@/lib/api-security"
import { checkFeature, FEATURE_KEYS } from "@/lib/feature-flags"

/**
 * GET /api/clients/[id]/integration-tabs
 * Pobiera zakładki integracji dla klienta (Pro feature)
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const rateLimitResponse = await applyRateLimit(request, "api")
    if (rateLimitResponse) return rateLimitResponse

    const user = await getCurrentUser()
    if (!user) {
      await logApiActivity(null, "API_UNAUTHORIZED_ATTEMPT", "Integration", params.id, {}, request)
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

    // Validate ID
    if (!params.id || typeof params.id !== "string" || params.id.trim().length === 0) {
      return NextResponse.json({ error: "Nieprawidłowy format ID" }, { status: 400 })
    }
    const clientId = params.id.trim()

    // Verify client exists and user has access
    const client = await db.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        assignedTo: true,
      },
    })

    if (!client) {
      return NextResponse.json({ error: "Klient nie znaleziony" }, { status: 404 })
    }

    // Check access
    if (user.role !== "ADMIN" && client.assignedTo !== user.id) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 })
    }

    // Get integration tabs
    const tabs = await db.integrationTab.findMany({
      where: { clientId },
      orderBy: { order: "asc" },
      select: {
        id: true,
        title: true,
        content: true,
        order: true,
      },
    })

    return NextResponse.json({ tabs })
  } catch (error) {
    console.error("Integration tabs fetch error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas pobierania zakładek integracji" },
      { status: 500 }
    )
  }
}

