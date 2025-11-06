import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hash } from "bcryptjs"
import { z } from "zod"
import { rateLimiters } from "@/lib/rate-limit"

const registerSchema = z.object({
  name: z.string().min(2, "Imię musi mieć co najmniej 2 znaki"),
  email: z.string().email("Nieprawidłowy adres email"),
  password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
  position: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    // Rate limiting: 5 requests per 15 minutes per IP
    const rateLimitResult = await rateLimiters.auth(request)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: "Zbyt wiele prób rejestracji. Spróbuj ponownie później." 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          }
        }
      )
    }
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Użytkownik o podanym adresie email już istnieje" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(validatedData.password, 10)

    // Create user
    const user = await db.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        password: hashedPassword,
        position: validatedData.position,
        role: "USER",
      },
    })

    // Log activity (optional - don't fail registration if this fails)
    try {
      await db.activityLog.create({
        data: {
          userId: user.id,
          action: "USER_REGISTERED",
          entityType: "User",
          entityId: user.id,
          details: {
            email: user.email,
            name: user.name,
          },
        },
      })
    } catch (logError) {
      // Log error but don't fail registration
      console.error("Failed to create activity log:", logError)
    }

    return NextResponse.json(
      { message: "Konto zostało utworzone pomyślnie", userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas rejestracji" },
      { status: 500 }
    )
  }
}

