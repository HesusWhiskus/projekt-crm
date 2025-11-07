import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { UserContext } from '@/application/shared/types/UserContext'

/**
 * Middleware to require authentication
 * Returns user context or throws error response
 */
export async function requireAuth(): Promise<{ user: UserContext; response?: never } | { user?: never; response: NextResponse }> {
  const session = await getCurrentUser()
  
  if (!session) {
    return {
      response: NextResponse.json({ error: 'Nieautoryzowany' }, { status: 401 }),
    }
  }

  const user: UserContext = {
    id: session.id,
    role: session.role as 'ADMIN' | 'USER',
    email: session.email || '',
  }

  return { user }
}

/**
 * Middleware to require specific role
 */
export async function requireRole(
  requiredRole: 'ADMIN' | 'USER'
): Promise<{ user: UserContext; response?: never } | { user?: never; response: NextResponse }> {
  const authResult = await requireAuth()
  
  if ('response' in authResult) {
    return authResult
  }

  if (requiredRole === 'ADMIN' && authResult.user.role !== 'ADMIN') {
    return {
      response: NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 }),
    }
  }

  return authResult
}

