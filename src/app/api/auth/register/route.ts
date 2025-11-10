import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hash } from "bcryptjs"
import { z } from "zod"
import { rateLimiters } from "@/lib/rate-limit"
import { validatePassword } from "@/lib/password-validator"

const registerSchema = z.object({
  name: z.string().min(2, "Imię musi mieć co najmniej 2 znaki"),
  email: z.string().email("Nieprawidłowy adres email"),
  password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
  position: z.string().optional(),
})

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Rejestruje nowego użytkownika
 *     description: Tworzy nowe konto użytkownika. Endpoint publiczny, ale podlega rate limiting (5 prób na 15 minut na IP). Hasło musi spełniać wymagania bezpieczeństwa.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 description: Imię i nazwisko użytkownika
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Adres email (unikalny)
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Hasło (min. 8 znaków, wielkie/małe litery, cyfry)
 *               position:
 *                 type: string
 *                 nullable: true
 *                 description: Stanowisko użytkownika
 *     responses:
 *       201:
 *         description: Konto zostało utworzone
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Konto zostało utworzone pomyślnie"
 *                 userId:
 *                   type: string
 *                   description: CUID nowo utworzonego użytkownika
 *       400:
 *         description: Błąd walidacji lub użytkownik już istnieje
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Zbyt wiele prób rejestracji (rate limit)
 *         headers:
 *           X-RateLimit-Limit:
 *             schema:
 *               type: integer
 *           X-RateLimit-Remaining:
 *             schema:
 *               type: integer
 *           X-RateLimit-Reset:
 *             schema:
 *               type: integer
 *           Retry-After:
 *             schema:
 *               type: integer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Błąd serwera
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

    // Validate password strength
    const passwordValidation = validatePassword(validatedData.password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      )
    }

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

