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
  request: Request
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
    },
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent,
  })
}

/**
 * Helper function to sanitize string input
 */
export function sanitizeString(input: string): string {
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

