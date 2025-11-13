import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { checkFeature, FEATURE_KEYS } from "@/lib/feature-flags"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const hasAccess = await checkFeature(user.id, FEATURE_KEYS.CUSTOM_FIELDS)
    if (!hasAccess) {
      return NextResponse.json({ error: "Feature not available" }, { status: 403 })
    }

    // Get user's organization
    const userWithOrg = await db.user.findUnique({
      where: { id: user.id },
      select: { organizationId: true },
    })

    const fields = await db.customField.findMany({
      where: { organizationId: userWithOrg?.organizationId || null },
      orderBy: { order: "asc" },
    })

    return NextResponse.json({ fields })
  } catch (error: any) {
    console.error("Error fetching custom fields:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const hasAccess = await checkFeature(user.id, FEATURE_KEYS.CUSTOM_FIELDS)
    if (!hasAccess) {
      return NextResponse.json({ error: "Feature not available" }, { status: 403 })
    }

    const body = await request.json()
    const { name, type, required, options } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    if (!["TEXT", "NUMBER", "DATE", "SELECT"].includes(type)) {
      return NextResponse.json({ error: "Invalid field type" }, { status: 400 })
    }

    if (type === "SELECT" && (!options || !Array.isArray(options) || options.length === 0)) {
      return NextResponse.json({ error: "Options are required for SELECT type" }, { status: 400 })
    }

    // Get user's organization
    const userWithOrg = await db.user.findUnique({
      where: { id: user.id },
      select: { organizationId: true },
    })

    if (!userWithOrg?.organizationId) {
      return NextResponse.json({ error: "User must be assigned to an organization" }, { status: 400 })
    }

    // Get max order for this organization
    const maxOrder = await db.customField.findFirst({
      where: { organizationId: userWithOrg.organizationId },
      orderBy: { order: "desc" },
      select: { order: true },
    })

    const field = await db.customField.create({
      data: {
        organizationId: userWithOrg.organizationId,
        name: name.trim(),
        type,
        required: required || false,
        options: type === "SELECT" ? options : null,
        order: (maxOrder?.order || 0) + 1,
      },
    })

    return NextResponse.json({
      id: field.id,
      name: field.name,
      type: field.type,
      required: field.required,
      options: field.options,
      createdAt: field.createdAt.toISOString(),
    })
  } catch (error: any) {
    console.error("Error creating custom field:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

