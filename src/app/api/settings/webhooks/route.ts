import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { checkFeature, FEATURE_KEYS } from "@/lib/feature-flags"
import crypto from "crypto"
import { logError } from "@/lib/logger"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const hasAccess = await checkFeature(user.id, FEATURE_KEYS.WEBHOOKS)
    if (!hasAccess) {
      return NextResponse.json({ error: "Feature not available" }, { status: 403 })
    }

    // TODO: Implement when Webhook model exists
    // For now, return empty array
    return NextResponse.json({ webhooks: [] })
  } catch (error: unknown) {
    // SECURITY-FIX: [ERROR-LOG-2] Zastąpiono console.error przez logError z sanitizacją
    // Data: 2025-01-27
    logError("Error fetching webhooks", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const hasAccess = await checkFeature(user.id, FEATURE_KEYS.WEBHOOKS)
    if (!hasAccess) {
      return NextResponse.json({ error: "Feature not available" }, { status: 403 })
    }

    const body = await request.json()
    const { url, events, secret } = body

    if (!url || !url.trim()) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: "At least one event is required" }, { status: 400 })
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    // TODO: Save to database when Webhook model exists
    // For now, return success
    return NextResponse.json({
      id: crypto.randomUUID(),
      url: url.trim(),
      events,
      secret: secret || null,
      enabled: true,
      createdAt: new Date().toISOString(),
    })
  } catch (error: unknown) {
    // SECURITY-FIX: [ERROR-LOG-2] Zastąpiono console.error przez logError z sanitizacją
    // Data: 2025-01-27
    logError("Error creating webhook", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

