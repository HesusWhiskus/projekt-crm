import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { checkFeature, FEATURE_KEYS } from "@/lib/feature-flags"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { PoliciesList } from "@/components/insurance/policies-list"

export default async function PoliciesPage({
  searchParams,
}: {
  searchParams: { page?: string; limit?: string; view?: string }
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

  // Pagination
  const page = parseInt(searchParams.page || '1')
  const limit = parseInt(searchParams.limit || '50')
  const skip = (page - 1) * limit

  // Fetch policies and total count in parallel
  const [policiesData, total] = await Promise.all([
    db.policy.findMany({
      where: {
        organizationId: userWithOrg?.organizationId || undefined,
        agentId: user.id,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
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
        insuranceCompany: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
      },
    }),
    db.policy.count({
      where: {
        organizationId: userWithOrg?.organizationId || undefined,
        agentId: user.id,
      },
    }),
  ])

  const totalPages = Math.ceil(total / limit)

  // Convert Date to string for policies
  const policiesWithConvertedDates = policiesData.map((policy) => ({
    ...policy,
    createdAt: policy.createdAt.toISOString(),
    validFrom: policy.validFrom.toISOString(),
    validTo: policy.validTo.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Polisy</h1>
          <p className="text-muted-foreground mt-2">
            Zarządzaj polisami ubezpieczeniowymi
          </p>
        </div>
        <Button asChild>
          <Link href="/insurance-agent/policies/new">
            <Plus className="h-4 w-4 mr-2" />
            Nowa polisa
          </Link>
        </Button>
      </div>

      <PoliciesList
        policies={policiesWithConvertedDates}
        total={total}
        page={page}
        limit={limit}
        totalPages={totalPages}
        view={searchParams.view || 'list'}
      />
    </div>
  )
}

