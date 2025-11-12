import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { applyRateLimit, logApiActivity } from "@/lib/api-security"
import { PlanType } from "@prisma/client"

const createOrganizationSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana").max(200, "Nazwa jest zbyt długa"),
  plan: z.nativeEnum(PlanType).default(PlanType.BASIC),
})

/**
 * GET /api/admin/organizations
 * Pobiera listę wszystkich organizacji (tylko ADMIN)
 */
export async function GET() {
  try {
    // Rate limiting
    const rateLimitResponse = await applyRateLimit(new Request("http://localhost"), "api")
    if (rateLimitResponse) return rateLimitResponse

    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 })
    }

    const organizations = await db.organization.findMany({
      include: {
        _count: {
          select: {
            users: true,
            clients: true,
            featureFlags: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ organizations })
  } catch (error) {
    console.error("Get organizations error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas pobierania organizacji" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/organizations
 * Tworzy nową organizację (tylko ADMIN)
 */
export async function POST(request: Request) {
  try {
    // Rate limiting
    const rateLimitResponse = await applyRateLimit(request, "api")
    if (rateLimitResponse) return rateLimitResponse

    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      await logApiActivity(null, "API_UNAUTHORIZED_ATTEMPT", "Organization", null, {}, request)
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createOrganizationSchema.parse(body)

    const organization = await db.organization.create({
      data: {
        name: validatedData.name,
        plan: validatedData.plan,
      },
    })

    // Log API activity
    await logApiActivity(user.id, "ORGANIZATION_CREATED", "Organization", organization.id, {
      name: organization.name,
      plan: organization.plan,
    }, request)

    return NextResponse.json({ organization }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Create organization error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas tworzenia organizacji" },
      { status: 500 }
    )
  }
}

