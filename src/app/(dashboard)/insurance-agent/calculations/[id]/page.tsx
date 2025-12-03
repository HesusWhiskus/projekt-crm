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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          price: 'asc', // Sortuj od najtańszej
        },
      },
    },
  })

  if (!calculation) {
    notFound()
  }

  // Convert Decimal to number and ensure proper types for offers
  const calculationWithConvertedOffers = {
    ...calculation,
    offers: calculation.offers.map((offer) => ({
      ...offer,
      price: typeof offer.price === 'object' && 'toNumber' in offer.price 
        ? offer.price.toNumber() 
        : typeof offer.price === 'string' 
        ? parseFloat(offer.price) 
        : offer.price,
      installmentAmount: offer.installmentAmount 
        ? (typeof offer.installmentAmount === 'object' && 'toNumber' in offer.installmentAmount
          ? offer.installmentAmount.toNumber()
          : typeof offer.installmentAmount === 'string'
          ? parseFloat(offer.installmentAmount)
          : offer.installmentAmount)
        : null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      scopes: offer.scopes as any, // scopes is already InsuranceScope[] from Prisma
    })),
  }

  return <CalculationDetail calculation={calculationWithConvertedOffers} />
}


