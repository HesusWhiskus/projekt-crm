import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { CalculationPipeline } from "@/components/insurance/calculation-pipeline"
import { checkFeature, FEATURE_KEYS } from "@/lib/feature-flags"

export default async function CalculationPipelinePage() {
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

  // Allow access for active agents or admins
  if (!insuranceAgent?.isActive && user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  // Get user with organizationId from database
  const userWithOrg = await db.user.findUnique({
    where: { id: user.id },
    select: { organizationId: true },
  })

  // For admin, show all calculations in organization; for agents, filter by agentId
  const where = user.role === "ADMIN"
    ? {
        organizationId: userWithOrg?.organizationId || undefined,
      }
    : {
        organizationId: userWithOrg?.organizationId || undefined,
        agentId: user.id, // agentId w Calculation to userId, nie insuranceAgent.id
      }

  const calculationsData = await db.calculation.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          companyName: true,
          type: true,
        },
      },
      vehicle: {
        select: {
          id: true,
          vin: true,
          registrationNumber: true,
        },
      },
    },
  })

  // Convert Decimal to number for component
  const calculations = calculationsData.map(calc => ({
    ...calc,
    value: calc.value ? Number(calc.value) : null,
  }))

  return (
    <CalculationPipeline calculations={calculations} />
  )
}

