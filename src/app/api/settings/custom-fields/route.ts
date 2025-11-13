import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { checkFeature, FEATURE_KEYS } from "@/lib/feature-flags"
import crypto from "crypto"

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

    // TODO: Implement when CustomField model exists
    // For now, return empty array
    return NextResponse.json({ fields: [] })
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

    // TODO: Save to database when CustomField model exists
    // For now, return success
    return NextResponse.json({
      id: crypto.randomUUID(),
      name: name.trim(),
      type,
      required: required || false,
      options: type === "SELECT" ? options : undefined,
      createdAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Error creating custom field:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

