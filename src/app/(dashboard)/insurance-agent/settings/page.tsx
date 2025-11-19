import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { AgentVisibilitySettings } from "@/components/insurance/agent-visibility-settings"
import { checkFeature, FEATURE_KEYS } from "@/lib/feature-flags"

export default async function InsuranceAgentSettingsPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/signin")
  }

  const hasInsuranceAgents = await checkFeature(user.id, FEATURE_KEYS.INSURANCE_AGENTS)
  if (!hasInsuranceAgents) {
    redirect("/dashboard")
  }

  const insuranceAgent = await db.insuranceAgent.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      settings: true,
      isActive: true,
    },
  })

  if (!insuranceAgent || !insuranceAgent.isActive) {
    redirect("/dashboard")
  }

  const settings = insuranceAgent.settings as any || {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ustawienia agenta</h1>
        <p className="text-muted-foreground mt-2">
          Konfiguruj widoczność elementów interfejsu
        </p>
      </div>

      <AgentVisibilitySettings
        agentId={insuranceAgent.id}
        initialSettings={{
          showVehicles: settings.showVehicles !== false,
          showCalculations: settings.showCalculations !== false,
          showPolicies: settings.showPolicies !== false,
          showClients: settings.showClients !== false,
          showDashboard: settings.showDashboard !== false,
          showReports: settings.showReports !== false,
        }}
      />
    </div>
  )
}

