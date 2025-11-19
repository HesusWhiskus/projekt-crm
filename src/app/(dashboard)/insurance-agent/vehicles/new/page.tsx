import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { VehicleFormWrapper } from "@/components/insurance/vehicle-form-wrapper"
import { checkFeature, FEATURE_KEYS } from "@/lib/feature-flags"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function NewVehiclePage() {
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
  })

  if (!insuranceAgent || !insuranceAgent.isActive) {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nowy pojazd</h1>
        <p className="text-muted-foreground mt-2">
          Dodaj nowy pojazd do systemu
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dane pojazdu</CardTitle>
        </CardHeader>
        <CardContent>
          <VehicleFormWrapper />
        </CardContent>
      </Card>
    </div>
  )
}
