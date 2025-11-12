import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { applyRateLimit, logApiActivity } from "@/lib/api-security"
import { PlanType } from "@prisma/client"

const updateOrganizationSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana").max(200, "Nazwa jest zbyt długa").optional(),
  plan: z.nativeEnum(PlanType).optional(),
})

/**
 * PATCH /api/admin/organizations/[id]
 * Aktualizuje organizację (tylko ADMIN)
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const rateLimitResponse = await applyRateLimit(request, "api")
    if (rateLimitResponse) return rateLimitResponse

    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      await logApiActivity(null, "API_UNAUTHORIZED_ATTEMPT", "Organization", params.id, {}, request)
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 })
    }

    // Validate ID
    if (!params.id || typeof params.id !== "string" || params.id.trim().length === 0) {
      return NextResponse.json({ error: "Nieprawidłowy format ID" }, { status: 400 })
    }
    const organizationId = params.id.trim()

    const body = await request.json()
    const validatedData = updateOrganizationSchema.parse(body)

    const organization = await db.organization.update({
      where: { id: organizationId },
      data: validatedData,
    })

    // Log API activity
    await logApiActivity(user.id, "ORGANIZATION_UPDATED", "Organization", organizationId, {
      updatedFields: Object.keys(validatedData),
    }, request)

    return NextResponse.json({ organization })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Update organization error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas aktualizacji organizacji" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/organizations/[id]
 * Usuwa organizację (tylko ADMIN)
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const rateLimitResponse = await applyRateLimit(request, "api")
    if (rateLimitResponse) return rateLimitResponse

    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      await logApiActivity(null, "API_UNAUTHORIZED_ATTEMPT", "Organization", params.id, {}, request)
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 })
    }

    // Validate ID
    if (!params.id || typeof params.id !== "string" || params.id.trim().length === 0) {
      return NextResponse.json({ error: "Nieprawidłowy format ID" }, { status: 400 })
    }
    const organizationId = params.id.trim()

    // Check if organization has users or clients
    const organization = await db.organization.findUnique({
      where: { id: organizationId },
      include: {
        _count: {
          select: {
            users: true,
            clients: true,
          },
        },
      },
    })

    if (!organization) {
      return NextResponse.json({ error: "Organizacja nie znaleziona" }, { status: 404 })
    }

    if (organization._count.users > 0 || organization._count.clients > 0) {
      return NextResponse.json(
        { error: "Nie można usunąć organizacji z przypisanymi użytkownikami lub klientami" },
        { status: 400 }
      )
    }

    await db.organization.delete({
      where: { id: organizationId },
    })

    // Log API activity
    await logApiActivity(user.id, "ORGANIZATION_DELETED", "Organization", organizationId, {}, request)

    return NextResponse.json({ message: "Organizacja została usunięta" })
  } catch (error) {
    console.error("Delete organization error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas usuwania organizacji" },
      { status: 500 }
    )
  }
}

