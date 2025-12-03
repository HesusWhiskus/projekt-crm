import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { checkFeature, FEATURE_KEYS } from "@/lib/feature-flags"
import crypto from "crypto"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const hasAccess = await checkFeature(user.id, FEATURE_KEYS.API_KEYS)
    if (!hasAccess) {
      return NextResponse.json({ error: "Feature not available" }, { status: 403 })
    }

    // TODO: Implement when ApiKey model exists
    // For now, return empty array
    return NextResponse.json({ apiKeys: [] })
  } catch (error: unknown) {
    // SECURITY-FIX: [ERROR-LOG-2] Zastąpiono console.error przez logError z sanitizacją
    // Data: 2025-01-27
    const { logError } = await import('@/lib/logger')
    logError("Error fetching API keys", error)
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

    const hasAccess = await checkFeature(user.id, FEATURE_KEYS.API_KEYS)
    if (!hasAccess) {
      return NextResponse.json({ error: "Feature not available" }, { status: 403 })
    }

    const body = await request.json()
    const { name } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Generate API key
    const apiKey = `vib_${crypto.randomBytes(32).toString("hex")}`
    // TODO: Hash and save to database when ApiKey model exists
    // const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex")

    // TODO: Save to database when ApiKey model exists
    // For now, return the key (in production, this should be saved to DB)
    return NextResponse.json({
      id: crypto.randomUUID(),
      name: name.trim(),
      apiKey, // Only shown once
      createdAt: new Date().toISOString(),
    })
  } catch (error: unknown) {
    // SECURITY-FIX: [ERROR-LOG-2] Zastąpiono console.error przez logError z sanitizacją
    // Data: 2025-01-27
    const { logError } = await import('@/lib/logger')
    logError("Error creating API key", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

