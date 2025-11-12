import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { applyRateLimit, logApiActivity } from "@/lib/api-security"
import { FEATURE_KEYS, FeatureKey } from "@/lib/feature-flags"

const featureFlagSchema = z.object({
  featureKey: z.string(),
  enabled: z.boolean(),
})

const updateFeatureFlagsSchema = z.object({
  featureFlags: z.array(featureFlagSchema),
})

/**
 * GET /api/admin/organizations/[id]/feature-flags
 * Pobiera feature flags dla organizacji (tylko ADMIN)
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
    if (!user || user.role !== "ADMIN") {
      await logApiActivity(null, "API_UNAUTHORIZED_ATTEMPT", "FeatureFlag", params.id, {}, request)
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 })
    }

    // Validate ID
    if (!params.id || typeof params.id !== "string" || params.id.trim().length === 0) {
      return NextResponse.json({ error: "Nieprawidłowy format ID" }, { status: 400 })
    }
    const organizationId = params.id.trim()

    const featureFlags = await db.featureFlag.findMany({
      where: { organizationId },
      orderBy: { featureKey: "asc" },
    })

    return NextResponse.json({ featureFlags })
  } catch (error) {
    console.error("Get feature flags error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas pobierania funkcji" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/organizations/[id]/feature-flags
 * Aktualizuje feature flags dla organizacji (tylko ADMIN)
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const rateLimitResponse = await applyRateLimit(request, "api")
    if (rateLimitResponse) return rateLimitResponse

    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      await logApiActivity(null, "API_UNAUTHORIZED_ATTEMPT", "FeatureFlag", params.id, {}, request)
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 })
    }

    // Validate ID
    if (!params.id || typeof params.id !== "string" || params.id.trim().length === 0) {
      return NextResponse.json({ error: "Nieprawidłowy format ID" }, { status: 400 })
    }
    const organizationId = params.id.trim()

    const body = await request.json()
    const validatedData = updateFeatureFlagsSchema.parse(body)

    // Update or create feature flags
    const updates = await Promise.all(
      validatedData.featureFlags.map(async (ff) => {
        // Validate feature key
        if (!Object.values(FEATURE_KEYS).includes(ff.featureKey as FeatureKey)) {
          throw new Error(`Nieprawidłowy klucz funkcji: ${ff.featureKey}`)
        }

        return db.featureFlag.upsert({
          where: {
            organizationId_featureKey: {
              organizationId,
              featureKey: ff.featureKey,
            },
          },
          create: {
            organizationId,
            featureKey: ff.featureKey,
            enabled: ff.enabled,
          },
          update: {
            enabled: ff.enabled,
          },
        })
      })
    )

    // Log API activity
    await logApiActivity(user.id, "FEATURE_FLAGS_UPDATED", "FeatureFlag", organizationId, {
      updatedCount: updates.length,
    }, request)

    return NextResponse.json({ featureFlags: updates })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Update feature flags error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas aktualizacji funkcji" },
      { status: 500 }
    )
  }
}

