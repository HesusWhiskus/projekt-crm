import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { checkFeature, FEATURE_KEYS, PRO_FEATURES, getEnabledFeatures } from "@/lib/feature-flags"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, X, ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"

const featureLabels: Record<string, string> = {
  [FEATURE_KEYS.MULTI_TENANT]: "Multi-tenant (wiele organizacji)",
  [FEATURE_KEYS.ADVANCED_REPORTS]: "Zaawansowane raporty",
  [FEATURE_KEYS.EXTERNAL_INTEGRATIONS]: "Integracje zewnętrzne",
  [FEATURE_KEYS.API_KEYS]: "Klucze API",
  [FEATURE_KEYS.CUSTOM_FIELDS]: "Niestandardowe pola",
  [FEATURE_KEYS.INTEGRATION_TABS]: "Zakładki integracji",
  [FEATURE_KEYS.WEBHOOKS]: "Webhooks",
}

const featureDescriptions: Record<string, string> = {
  [FEATURE_KEYS.MULTI_TENANT]: "Umożliwia zarządzanie wieloma organizacjami w jednej instancji",
  [FEATURE_KEYS.ADVANCED_REPORTS]: "Dostęp do zaawansowanych raportów i analityki",
  [FEATURE_KEYS.EXTERNAL_INTEGRATIONS]: "Integracje z zewnętrznymi systemami",
  [FEATURE_KEYS.API_KEYS]: "Generowanie i zarządzanie kluczami API",
  [FEATURE_KEYS.CUSTOM_FIELDS]: "Dodawanie niestandardowych pól do klientów",
  [FEATURE_KEYS.INTEGRATION_TABS]: "Dynamiczne zakładki integracji w szczegółach klienta",
  [FEATURE_KEYS.WEBHOOKS]: "Webhooks dla zewnętrznych integracji",
}

const featureLinks: Record<string, string> = {
  [FEATURE_KEYS.ADVANCED_REPORTS]: "/dashboard/reports",
  [FEATURE_KEYS.API_KEYS]: "/dashboard/settings/api-keys",
  [FEATURE_KEYS.WEBHOOKS]: "/dashboard/settings/webhooks",
  [FEATURE_KEYS.CUSTOM_FIELDS]: "/dashboard/settings/custom-fields",
  [FEATURE_KEYS.EXTERNAL_INTEGRATIONS]: "/dashboard/integrations",
}

export default async function ProFeaturesPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/signin")
  }

  // Get user's organization
  const userWithOrg = await db.user.findUnique({
    where: { id: user.id },
    select: { organizationId: true },
  })

  const organizationId = userWithOrg?.organizationId || null

  // Get organization plan
  let organizationPlan: "BASIC" | "PRO" | null = null
  if (organizationId) {
    const organization = await db.organization.findUnique({
      where: { id: organizationId },
      select: { plan: true },
    })
    organizationPlan = organization?.plan || null
  }

  // Get enabled features
  const enabledFeatures = await getEnabledFeatures(organizationId)

  // Check each PRO feature
  const featureStatuses = await Promise.all(
    PRO_FEATURES.map(async (featureKey) => {
      const enabled = await checkFeature(user.id, featureKey)
      return {
        key: featureKey,
        enabled,
        label: featureLabels[featureKey],
        description: featureDescriptions[featureKey],
        link: featureLinks[featureKey],
      }
    })
  )

  const isPro = organizationPlan === "PRO"

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-8 w-8 text-purple-600" />
          <h1 className="text-3xl font-bold">Funkcje PRO</h1>
        </div>
        <p className="text-muted-foreground">
          Przegląd wszystkich funkcji dostępnych w planie PRO
        </p>
      </div>

      {/* Plan Status */}
      <Card>
        <CardHeader>
          <CardTitle>Twój plan</CardTitle>
          <CardDescription>
            {organizationPlan
              ? `Obecnie masz plan: ${organizationPlan === "PRO" ? "PRO" : "BASIC"}`
              : "Nie jesteś przypisany do żadnej organizacji"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPro ? (
            <div className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              <span className="font-semibold">Masz dostęp do wszystkich funkcji PRO</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-600">
              <X className="h-5 w-5" />
              <span className="font-semibold">
                {organizationPlan === "BASIC"
                  ? "Ulepsz plan do PRO, aby uzyskać dostęp do wszystkich funkcji"
                  : "Przypisz się do organizacji z planem PRO, aby uzyskać dostęp"}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Features List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Dostępne funkcje PRO</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {featureStatuses.map((feature) => (
            <Card key={feature.key} className={feature.enabled ? "border-green-200" : "opacity-60"}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{feature.label}</CardTitle>
                  {feature.enabled ? (
                    <span className="flex items-center gap-1 text-green-600 text-sm font-semibold">
                      <Check className="h-4 w-4" />
                      Aktywna
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-gray-400 text-sm">
                      <X className="h-4 w-4" />
                      Nieaktywna
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">{feature.description}</CardDescription>
                {feature.link && feature.enabled && (
                  <Link href={feature.link}>
                    <Button variant="outline" size="sm" className="w-full">
                      Przejdź do funkcji
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                )}
                {!feature.enabled && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Wymaga planu PRO i włączenia funkcji przez administratora
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

