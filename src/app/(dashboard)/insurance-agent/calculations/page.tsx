import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { checkFeature, FEATURE_KEYS } from "@/lib/feature-flags"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { CalculationsList } from "@/components/insurance/calculations-list"

export default async function CalculationsPage({
  searchParams,
}: {
  searchParams: { page?: string; limit?: string; view?: string; search?: string }
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

  // Build where clause with search filter
  const where: any = {
    organizationId: userWithOrg?.organizationId || undefined,
    agentId: user.id,
  }

  if (searchParams.search) {
    where.OR = [
      { firstName: { contains: searchParams.search, mode: 'insensitive' } },
      { lastName: { contains: searchParams.search, mode: 'insensitive' } },
      { pesel: { contains: searchParams.search } },
      { email: { contains: searchParams.search, mode: 'insensitive' } },
      {
        vehicle: {
          OR: [
            { registrationNumber: { contains: searchParams.search, mode: 'insensitive' } },
            { vin: { contains: searchParams.search, mode: 'insensitive' } },
          ]
        }
      },
    ]
  }

  // Fetch calculations and total count in parallel
  const [calculationsData, total] = await Promise.all([
    db.calculation.findMany({
      where,
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
        offers: {
          include: {
            insuranceCompany: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
              },
            },
          },
          orderBy: {
            price: 'asc',
          },
          take: 1,
        },
      },
    }),
    db.calculation.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)

  // Convert Decimal to number and Date to string for calculations
  const calculationsWithConvertedValues = calculationsData.map((calculation) => ({
    ...calculation,
    value: calculation.value 
      ? (typeof calculation.value === 'object' && 'toNumber' in calculation.value
        ? calculation.value.toNumber()
        : typeof calculation.value === 'string'
        ? parseFloat(calculation.value)
        : calculation.value)
      : null,
    createdAt: calculation.createdAt.toISOString(),
    offers: calculation.offers.map((offer) => ({
      ...offer,
      price: typeof offer.price === 'object' && 'toNumber' in offer.price 
        ? offer.price.toNumber() 
        : typeof offer.price === 'string' 
        ? parseFloat(offer.price) 
        : offer.price,
    })),
  }))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Kalkulacje</h1>
          <p className="text-muted-foreground mt-2">
            Zarządzaj kalkulacjami ubezpieczeniowymi
          </p>
        </div>
        <Button asChild>
          <Link href="/insurance-agent/calculations/new">
            <Plus className="h-4 w-4 mr-2" />
            Nowa kalkulacja
          </Link>
        </Button>
      </div>

      <CalculationsList
        calculations={calculationsWithConvertedValues}
        total={total}
        page={page}
        limit={limit}
        totalPages={totalPages}
        view={searchParams.view || 'list'}
      />
    </div>
  )
}

