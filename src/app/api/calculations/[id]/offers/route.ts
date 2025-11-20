import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { checkFeature, FEATURE_KEYS } from "@/lib/feature-flags"

// GET /api/calculations/[id]/offers - Pobranie ofert dla kalkulacji
export async function GET(
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

  // Build where clause
  const where: any = {
    id: params.id,
    organizationId: userWithOrg?.organizationId || undefined,
  }

  if (user.role !== "ADMIN") {
    where.agentId = user.id
  }

  const calculation = await db.calculation.findUnique({
    where,
    include: {
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
      },
    },
  })

  if (!calculation) {
    return NextResponse.json({ error: "Calculation not found" }, { status: 404 })
  }

  return NextResponse.json({ offers: calculation.offers })
}

// POST /api/calculations/[id]/offers - Import ofert z iBooster
export async function POST(
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

  // Build where clause
  const where: any = {
    id: params.id,
    organizationId: userWithOrg?.organizationId || undefined,
  }

  if (user.role !== "ADMIN") {
    where.agentId = user.id
  }

  const calculation = await db.calculation.findUnique({ where })

  if (!calculation) {
    return NextResponse.json({ error: "Calculation not found" }, { status: 404 })
  }

  const body = await request.json()
  const { offers } = body

  if (!Array.isArray(offers)) {
    return NextResponse.json({ error: "Invalid offers data" }, { status: 400 })
  }

  // Import ofert
  const createdOffers = []
  for (const offerData of offers) {
    const offer = await db.offer.create({
      data: {
        calculationId: calculation.id,
        insuranceCompanyId: offerData.insuranceCompanyId,
        price: offerData.price,
        packageType: offerData.packageType || null,
        scopes: offerData.scopes || [],
        additionalOptions: offerData.additionalOptions || null,
        installments: offerData.installments || null,
        installmentAmount: offerData.installmentAmount || null,
        validUntil: offerData.validUntil ? new Date(offerData.validUntil) : null,
        status: offerData.status || "dostępna",
        isSelected: false,
        externalId: offerData.externalId || null,
        metadata: offerData.metadata || null,
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
    createdOffers.push(offer)
  }

  return NextResponse.json({ offers: createdOffers, count: createdOffers.length })
}

