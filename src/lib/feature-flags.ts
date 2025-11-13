import { db } from "@/lib/db"
import { PlanType } from "@prisma/client"

/**
 * Feature keys available in the system
 */
export const FEATURE_KEYS = {
  MULTI_TENANT: "multi_tenant",
  ADVANCED_REPORTS: "advanced_reports",
  EXTERNAL_INTEGRATIONS: "external_integrations",
  API_KEYS: "api_keys",
  CUSTOM_FIELDS: "custom_fields",
  INTEGRATION_TABS: "integration_tabs",
  WEBHOOKS: "webhooks",
} as const

export type FeatureKey = typeof FEATURE_KEYS[keyof typeof FEATURE_KEYS]

/**
 * Check if a feature key is a PRO feature
 */
export function isProFeature(featureKey: FeatureKey): boolean {
  return PRO_FEATURES.includes(featureKey)
}

/**
 * Features available in BASIC plan
 */
export const BASIC_FEATURES: FeatureKey[] = [
  // All basic features are enabled by default
]

/**
 * Features available in PRO plan
 */
export const PRO_FEATURES: FeatureKey[] = [
  FEATURE_KEYS.MULTI_TENANT,
  FEATURE_KEYS.ADVANCED_REPORTS,
  FEATURE_KEYS.EXTERNAL_INTEGRATIONS,
  FEATURE_KEYS.API_KEYS,
  FEATURE_KEYS.CUSTOM_FIELDS,
  FEATURE_KEYS.INTEGRATION_TABS,
  FEATURE_KEYS.WEBHOOKS,
]

/**
 * Check if a feature is enabled for an organization
 * @param organizationId - Organization ID (null for global/system features)
 * @param featureKey - Feature key to check
 * @returns Promise<boolean> - true if feature is enabled
 */
export async function isFeatureEnabled(
  organizationId: string | null,
  featureKey: FeatureKey
): Promise<boolean> {
  // If organizationId is null, user has no organization
  // PRO features are never available without organization
  if (!organizationId) {
    // Only basic features (if any) are available without organization
    // PRO features require organization with PRO plan
    return BASIC_FEATURES.includes(featureKey)
  }

  // Get organization with its plan
  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    include: {
      featureFlags: true,
    },
  })

  if (!organization) {
    return false
  }

  // Check if feature is in PRO plan features
  const isProFeature = PRO_FEATURES.includes(featureKey)

  // If organization is BASIC and feature is PRO-only, return false
  if (organization.plan === PlanType.BASIC && isProFeature) {
    return false
  }

  // Check feature flag override
  const featureFlag = organization.featureFlags.find((ff) => ff.featureKey === featureKey)

  if (featureFlag) {
    // Feature flag exists - use its enabled value
    return featureFlag.enabled
  }

  // No feature flag override - check plan
  // PRO plan has all PRO features enabled by default
  if (organization.plan === PlanType.PRO && isProFeature) {
    return true
  }

  // BASIC plan - only basic features are enabled
  return BASIC_FEATURES.includes(featureKey)
}

/**
 * Get all enabled features for an organization
 * @param organizationId - Organization ID
 * @returns Promise<FeatureKey[]> - Array of enabled feature keys
 */
export async function getEnabledFeatures(organizationId: string | null): Promise<FeatureKey[]> {
  const enabledFeatures: FeatureKey[] = []

  for (const featureKey of Object.values(FEATURE_KEYS)) {
    if (await isFeatureEnabled(organizationId, featureKey)) {
      enabledFeatures.push(featureKey)
    }
  }

  return enabledFeatures
}

/**
 * Check if organization has PRO plan
 * @param organizationId - Organization ID
 * @returns Promise<boolean>
 */
export async function isProPlan(organizationId: string | null): Promise<boolean> {
  if (!organizationId) {
    return false
  }

  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    select: { plan: true },
  })

  return organization?.plan === PlanType.PRO
}

/**
 * Helper function to check if a feature is enabled for a user
 * @param userId - User ID
 * @param featureKey - Feature key to check
 * @returns Promise<boolean> - true if feature is enabled
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

