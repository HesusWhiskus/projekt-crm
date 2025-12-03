import { NextResponse } from "next/server"
import { rateLimiters, RateLimitResult } from "./rate-limit"
import { ActivityLogger } from "@/infrastructure/logging/ActivityLogger"

/**
 * Helper function to apply rate limiting to API routes
 * Returns NextResponse with 429 status if rate limit exceeded, null otherwise
 */
export async function applyRateLimit(
  request: Request,
  limiter: "auth" | "api" | "general" = "api"
): Promise<NextResponse | null> {
  const rateLimitResult = await rateLimiters[limiter](request)

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Zbyt wiele żądań. Spróbuj ponownie później." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": rateLimitResult.limit.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          "Retry-After": Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
        },
      }
    )
  }

  return null
}

/**
 * Helper function to extract request metadata for logging
 */
export function extractRequestMetadata(request: Request): {
  ipAddress: string | null
  userAgent: string | null
  method: string
  path: string
} {
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    null

  const userAgent = request.headers.get("user-agent") || null
  const method = request.method
  const path = new URL(request.url).pathname

  return { ipAddress, userAgent, method, path }
}

/**
 * Helper function to log API activity
 */
export async function logApiActivity(
  userId: string | null,
  action: string,
  entityType: string,
  entityId: string | null = null,
  details: Record<string, any> = {},
  request: Request,
  responseTime?: number
): Promise<void> {
  const logger = new ActivityLogger()
  const metadata = extractRequestMetadata(request)

  await logger.log({
    userId: userId || "anonymous",
    action,
    entityType,
    entityId,
    details: {
      ...details,
      method: metadata.method,
      path: metadata.path,
      ...(responseTime !== undefined && { responseTimeMs: responseTime }),
    },
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent,
  })
}


/**
 * SECURITY-FIX: [PAYLOAD-4] Dodano walidację limitów wielkości payloadu
 * Data: 2025-01-27
 * Sprawdza Content-Length i query string length przed przetworzeniem requestu
 */
export function validatePayloadLimits(request: Request): NextResponse | null {
  // Sprawdź Content-Length header
  const contentLength = request.headers.get('content-length')
  if (contentLength) {
    const size = parseInt(contentLength, 10)
    if (isNaN(size) || size > 10 * 1024 * 1024) { // 10MB
      return NextResponse.json(
        { error: 'Payload jest zbyt duży (max 10MB)' },
        { status: 413 }
      )
    }
  }
  
  // Sprawdź query string length
  try {
    const url = new URL(request.url)
    if (url.search.length > 2048) {
      return NextResponse.json(
        { error: 'Query string jest zbyt długi (max 2048 znaków)' },
        { status: 414 }
      )
    }
  } catch {
    // Jeśli nie można sparsować URL, zwróć null (middleware zwróci błąd)
    return null
  }
  
  return null
}

/**
 * SECURITY-FIX: [PAYLOAD-4] Dodano walidację głębokości JSON
 * Data: 2025-01-27
 * Sprawdza czy JSON nie jest zbyt głęboko zagnieżdżony (ochrona przed stack overflow)
 */
function getJSONDepth(obj: any, depth = 0, maxDepth = 10): number {
  if (depth > maxDepth) return depth // Max depth exceeded
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return depth
  }
  
  const depths = Object.values(obj).map(v => getJSONDepth(v, depth + 1, maxDepth))
  return depths.length > 0 ? Math.max(...depths) : depth
}

export function validateJSONDepth(data: any, maxDepth = 10): { valid: boolean; error?: string } {
  const depth = getJSONDepth(data, 0, maxDepth)
  if (depth > maxDepth) {
    return {
      valid: false,
      error: `JSON jest zbyt głęboko zagnieżdżony (max ${maxDepth} poziomów)`,
    }
  }
  return { valid: true }
}

/**
 * Helper function to sanitize string input
 */
export function sanitizeString(input: string): string {
  if (input == null || typeof input !== 'string') {
    return ''
  }
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
}

/**
 * Helper function to validate and sanitize request body
 */
export function sanitizeRequestBody<T extends Record<string, any>>(body: T): T {
  const sanitized = { ...body }
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === "string") {
      sanitized[key] = sanitizeString(sanitized[key]) as any
    } else if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      sanitized[key] = sanitizeRequestBody(sanitized[key]) as any
    }
  }
  
  return sanitized
}

