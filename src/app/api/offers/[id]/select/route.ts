import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { checkFeature, FEATURE_KEYS } from "@/lib/feature-flags"

// PUT /api/offers/[id]/select - Wybór oferty
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const hasInsuranceAgents = await checkFeature(user.id, FEATURE_KEYS.INSURANCE_AGENTS)
  if (!hasInsuranceAgents && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Get user with organizationId
  const userWithOrg = await db.user.findUnique({
    where: { id: user.id },
    select: { organizationId: true },
  })

  // Find offer with calculation
  const offer = await db.offer.findUnique({
    where: { id: params.id },
    include: {
      calculation: {
        select: {
          id: true,
          organizationId: true,
          agentId: true,
        },
      },
    },
  })

  if (!offer) {
    return NextResponse.json({ error: "Offer not found" }, { status: 404 })
  }

  // Check permissions
  if (offer.calculation.organizationId !== userWithOrg?.organizationId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (user.role !== "ADMIN" && offer.calculation.agentId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Odznacz wszystkie inne oferty dla tej kalkulacji
  await db.offer.updateMany({
    where: {
      calculationId: offer.calculationId,
      id: { not: offer.id },
    },
    data: {
      isSelected: false,
    },
  })

  // Zaznacz wybraną ofertę
  const updatedOffer = await db.offer.update({
    where: { id: params.id },
    data: {
      isSelected: true,
      status: "wybrana",
    },
    include: {
      insuranceCompany: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
        },
      },
    },
  })

  return NextResponse.json({ offer: updatedOffer })
}

