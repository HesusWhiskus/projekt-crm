import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { isFeatureEnabled, FeatureKey } from "@/lib/feature-flags"
import { db } from "@/lib/db"

/**
 * Middleware to require a specific feature for an endpoint
 * Returns NextResponse with 403 if feature is not enabled
 * @param featureKey - Feature key to check
 * @returns Middleware function
 */
export function requireFeature(featureKey: FeatureKey) {
  return async (request: Request): Promise<NextResponse | null> => {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 })
    }

    // Get user's organization
    const userWithOrg = await db.user.findUnique({
      where: { id: user.id },
      select: { organizationId: true },
    })

    const organizationId = userWithOrg?.organizationId || null

    // Check if feature is enabled
    const enabled = await isFeatureEnabled(organizationId, featureKey)

    if (!enabled) {
      return NextResponse.json(
        {
          error: `Funkcja "${featureKey}" nie jest dostępna w Twoim planie. Ulepsz do planu PRO, aby uzyskać dostęp.`,
        },
        { status: 403 }
      )
    }

    return null
  }
}

/**
 * Helper to check feature without returning response
 * Useful for conditional logic in endpoints
 */
export async function checkFeature(
  userId: string,
  featureKey: FeatureKey
): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  })

  const organizationId = user?.organizationId || null
  return await isFeatureEnabled(organizationId, featureKey)
}

