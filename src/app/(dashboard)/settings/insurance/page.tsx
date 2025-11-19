import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { InsuranceSettingsPanel } from "@/components/insurance/insurance-settings-panel"
import { checkFeature, FEATURE_KEYS } from "@/lib/feature-flags"

export default async function InsuranceSettingsPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/signin")
  }

  const hasInsuranceAgents = await checkFeature(user.id, FEATURE_KEYS.INSURANCE_AGENTS)
  if (!hasInsuranceAgents) {
    redirect("/settings")
  }

  // Get user with organizationId from database
  const userWithOrg = await db.user.findUnique({
    where: { id: user.id },
    select: { organizationId: true },
  })

  if (!userWithOrg?.organizationId) {
    redirect("/settings")
  }

  const insuranceSettings = await db.organizationInsuranceSettings.findUnique({
    where: { organizationId: userWithOrg.organizationId },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ustawienia ubezpieczeń</h1>
        <p className="text-muted-foreground mt-2">
          Konfiguracja integracji z systemem zewnętrznym i funkcji ubezpieczeniowych
        </p>
      </div>

      <InsuranceSettingsPanel
        organizationId={userWithOrg.organizationId}
        initialSettings={{
          externalSystemUrl: null,
          externalSystemApiKey: null,
          enableBidirectionalSync: true,
          enableDataValidation: insuranceSettings?.validationLevel === 'STRICT',
          enableAuditLogging: insuranceSettings?.auditRetentionDays !== null,
          syncInterval: null,
        }}
      />
    </div>
  )
}

