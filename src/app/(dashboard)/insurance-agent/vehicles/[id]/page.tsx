import { getCurrentUser } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import { VehicleDetail } from "@/components/insurance/vehicle-detail"
import { checkFeature, FEATURE_KEYS } from "@/lib/feature-flags"

export default async function VehicleDetailPage({
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

  // Build where clause - ADMIN sees all vehicles in organization
  // For non-admin agents, we need to check if vehicle is accessible through their clients
  const where: any = {
    id: params.id,
    organizationId: userWithOrg?.organizationId || undefined,
  }

  const vehicle = await db.vehicle.findUnique({
    where,
    include: {
      owners: {
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
        },
      },
    },
  })

  if (!vehicle) {
    notFound()
  }

  return <VehicleDetail vehicle={vehicle} />
}


