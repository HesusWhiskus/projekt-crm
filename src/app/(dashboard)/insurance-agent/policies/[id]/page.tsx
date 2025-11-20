import { getCurrentUser } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import { PolicyDetail } from "@/components/insurance/policy-detail"
import { checkFeature, FEATURE_KEYS } from "@/lib/feature-flags"

export default async function PolicyDetailPage({
  params,
}: {
  params: { id: string }
}) {
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

  // Get user with organizationId from database
  const userWithOrg = await db.user.findUnique({
    where: { id: user.id },
    select: { organizationId: true },
  })

  const policy = await db.policy.findUnique({
    where: {
      id: params.id,
      organizationId: userWithOrg?.organizationId || undefined,
      agentId: user.id, // agentId w Policy to userId, nie insuranceAgent.id
    },
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
      insuranceCompany: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
        },
      },
      documents: {
        select: {
          id: true,
          filename: true,
          path: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      calculation: {
        select: {
          id: true,
          status: true,
          value: true,
        },
      },
    },
  })

  if (!policy) {
    notFound()
  }

  return <PolicyDetail policy={policy} />
}

