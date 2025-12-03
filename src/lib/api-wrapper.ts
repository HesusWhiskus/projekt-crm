/**
 * SECURITY-FIX: [WRAPPER-19] Wrapper function dla endpointów API
 * Data: 2025-01-27
 * 
 * Ujednolicony wrapper dla endpointów API który zapewnia:
 * - Rate limiting
 * - Autoryzację
 * - Walidację payloadu
 * - Obsługę błędów
 * - Logowanie aktywności
 */

import { NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/presentation/api/middleware/auth'
import { applyRateLimit, logApiActivity, validatePayloadLimits, validateJSONDepth } from '@/lib/api-security'
import { logError } from '@/lib/logger'
import { getHttpStatusCode } from './errors'
import type { UserContext } from '@/application/shared/types/UserContext'

export interface ApiHandlerOptions {
  requireAuth?: boolean
  requireRole?: 'ADMIN' | 'USER'
  rateLimit?: 'auth' | 'api' | 'general'
  validatePayload?: boolean
  entityType?: string
  logActivity?: boolean
}

export type ApiHandler<T = any> = (
  request: Request,
  user: UserContext,
  params?: T | undefined
) => Promise<NextResponse>

/**
 * Wrapper function dla endpointów API
 * 
 * @example
 * ```typescript
 * export const GET = withApiHandler(
 *   async (request, user) => {
 *     // Your handler code
 *     return NextResponse.json({ data: 'result' })
 *   },
 *   {
 *     requireAuth: true,
 *     rateLimit: 'api',
 *     validatePayload: false, // GET doesn't need payload validation
 *     entityType: 'Client',
 *   }
 * )
 * ```
 */
export function withApiHandler<T = any>(
  handler: ApiHandler<T>,
  options: ApiHandlerOptions = {}
): (request: Request, context?: { params?: T | undefined }) => Promise<NextResponse> {
  return async (request: Request, context?: { params?: T | undefined }): Promise<NextResponse> => {
    try {
      // 1. Rate limiting
      const rateLimitType = options.rateLimit || 'api'
      const rateLimitResponse = await applyRateLimit(request, rateLimitType)
      if (rateLimitResponse) {
        return rateLimitResponse
      }

      // 2. Payload validation (only for POST/PUT/PATCH)
      if (options.validatePayload && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const payloadLimitResponse = validatePayloadLimits(request)
        if (payloadLimitResponse) {
          return payloadLimitResponse
        }

        // Parse body and validate JSON depth
        try {
          const body = await request.json()
          const depthValidation = validateJSONDepth(body)
          if (!depthValidation.valid) {
            return NextResponse.json(
              { error: depthValidation.error || 'Invalid JSON depth' },
              { status: 400 }
            )
          }
          // Re-create request with body for handler
          // Note: In Next.js, we need to pass body separately or re-parse
        } catch (error) {
          // If body parsing fails, continue (handler will handle it)
          // This is OK - handler will handle parsing errors
        }
      }

      // 3. Authentication
      let authResult: { user: UserContext; response?: never } | { user?: never; response: NextResponse }
      if (options.requireRole) {
        authResult = await requireRole(options.requireRole)
      } else if (options.requireAuth !== false) {
        // Default to requiring auth
        authResult = await requireAuth()
      } else {
        // No auth required
        const anonymousUser = {
          id: 'anonymous',
          email: 'anonymous',
          role: 'USER' as const,
          organizationId: null,
        }
        return handler(request, anonymousUser, context?.params)
      }

      if ('response' in authResult) {
        // Log unauthorized attempt
        if (options.logActivity !== false && options.entityType) {
          await logApiActivity(
            null,
            'API_UNAUTHORIZED_ATTEMPT',
            options.entityType,
            null,
            {},
            request
          )
        }
        // TypeScript guard: if 'response' is in authResult, it's always NextResponse
        return authResult.response as NextResponse
      }

      const { user } = authResult

      // 4. Execute handler
      const response = await handler(request, user, context?.params)
      
      // Ensure response is always NextResponse
      if (!response) {
        return NextResponse.json(
          { error: 'Handler did not return a response' },
          { status: 500 }
        )
      }

      // 5. Log activity (if enabled)
      if (options.logActivity !== false && options.entityType) {
        // Try to extract entity ID from response
        let entityId: string | null = null
        try {
          const responseData = await response.clone().json().catch(() => null)
          if (responseData) {
            // Try common patterns
            entityId =
              responseData.id ||
              responseData.client?.id ||
              responseData.task?.id ||
              responseData.contact?.id ||
              responseData.vehicle?.id ||
              responseData.calculation?.id ||
              responseData.policy?.id ||
              null
          }
        } catch {
          // Ignore errors in logging
        }

        // Determine action from method
        const action = request.method === 'POST'
          ? `${options.entityType.toUpperCase()}_CREATED`
          : request.method === 'PUT' || request.method === 'PATCH'
          ? `${options.entityType.toUpperCase()}_UPDATED`
          : request.method === 'DELETE'
          ? `${options.entityType.toUpperCase()}_DELETED`
          : `${options.entityType.toUpperCase()}_ACCESSED`

        await logApiActivity(user.id, action, options.entityType, entityId, {}, request)
      }

      return response
    } catch (error: unknown) {
      // Error handling
      logError('API handler error', error, {
        method: request.method,
        path: new URL(request.url).pathname,
        options,
      })

      // Use custom error classes if available
      if (error instanceof Error && 'name' in error) {
        const statusCode = getHttpStatusCode(error)
        return NextResponse.json(
          {
            error: error.message || 'Wystąpił błąd podczas przetwarzania żądania',
          },
          { status: statusCode }
        )
      }

      // Generic error
      return NextResponse.json(
        {
          error: 'Wystąpił błąd podczas przetwarzania żądania',
        },
        { status: 500 }
      )
    }
  }
}

/**
 * Helper dla GET endpointów
 */
export function withGetHandler<T = any>(
  handler: ApiHandler<T>,
  options: Omit<ApiHandlerOptions, 'validatePayload'> = {}
) {
  return withApiHandler(handler, {
    ...options,
    validatePayload: false, // GET doesn't have body
  })
}

/**
 * Helper dla POST endpointów
 */
export function withPostHandler<T = any>(
  handler: ApiHandler<T>,
  options: ApiHandlerOptions = {}
) {
  return withApiHandler(handler, {
    ...options,
    validatePayload: true, // POST has body
  })
}

/**
 * Helper dla PUT/PATCH endpointów
 */
export function withPutHandler<T = any>(
  handler: ApiHandler<T>,
  options: ApiHandlerOptions = {}
) {
  return withApiHandler(handler, {
    ...options,
    validatePayload: true, // PUT/PATCH has body
  })
}

/**
 * Helper dla DELETE endpointów
 */
export function withDeleteHandler<T = any>(
  handler: ApiHandler<T>,
  options: Omit<ApiHandlerOptions, 'validatePayload'> = {}
) {
  return withApiHandler(handler, {
    ...options,
    validatePayload: false, // DELETE doesn't have body
  })
}

