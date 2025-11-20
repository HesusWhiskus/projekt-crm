import { getCurrentUser } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import { CalculationDetail } from "@/components/insurance/calculation-detail"
import { checkFeature, FEATURE_KEYS } from "@/lib/feature-flags"

export default async function CalculationDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/signin")
  }

  const hasInsuranceAgents = await checkFeature(user.id, FEATURE_KEYS.INSURANCE_AGENTS)
  if (!hasInsuranceAgents && user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  // For non-admin users, check if they are active insurance agents
  if (user.role !== "ADMIN") {
    const insuranceAgent = await db.insuranceAgent.findUnique({
      where: { userId: user.id },
    })

    if (!insuranceAgent || !insuranceAgent.isActive) {
      redirect("/dashboard")
    }
  }

  // Get user with organizationId from database
  const userWithOrg = await db.user.findUnique({
    where: { id: user.id },
    select: { organizationId: true },
  })

  // Build where clause - ADMIN sees all calculations in organization, agents see only their own
  const where: any = {
    id: params.id,
    organizationId: userWithOrg?.organizationId || undefined,
  }
  
  // For non-admin agents, filter by agentId
  if (user.role !== "ADMIN") {
    where.agentId = user.id // agentId w Calculation to userId, nie insuranceAgent.id
  }

  const calculation = await db.calculation.findUnique({
    where,
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          companyName: true,
          type: true,
          email: true,
          phone: true,
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

  if (!calculation) {
    notFound()
  }

  return <CalculationDetail calculation={calculation} />
}


