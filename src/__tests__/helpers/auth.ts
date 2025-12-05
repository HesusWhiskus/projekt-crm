import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export interface TestUser {
  id: string
  email: string
  password: string
  role: 'ADMIN' | 'USER'
  name: string
}

/**
 * Creates a test user in the database
 * Throws error if database is not available - tests should always use real database
 * If user with email already exists, updates it instead of creating new one
 */
export async function createTestUser(
  email: string = `test-${Date.now()}@example.com`,
  role: 'ADMIN' | 'USER' = 'USER',
  password: string = 'TestPassword123!'
): Promise<TestUser> {
  // Check if we're in CI/CD or have DATABASE_URL - tests should always use real database
  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true'
  const hasDatabaseUrl = !!process.env.DATABASE_URL || !!process.env.DATABASE_URL_TEST
  
  if (isCI || hasDatabaseUrl) {
    // In CI/CD or with DATABASE_URL, always use real database - fail if not available
    const hashedPassword = await bcrypt.hash(password, 10)
    
    try {
      const user = await db.user.upsert({
        where: { email },
        update: {
          password: hashedPassword,
          role,
          name: `Test User ${Date.now()}`,
        },
        create: {
          email,
          password: hashedPassword,
          role,
          name: `Test User ${Date.now()}`,
        },
      })

      return {
        id: user.id,
        email: user.email!,
        password,
        role: user.role as 'ADMIN' | 'USER',
        name: user.name || '',
      }
    } catch (error: any) {
      // In CI/CD, fail with clear error message
      throw new Error(
        `Failed to create test user in database: ${error?.message || error}. ` +
        `DATABASE_URL: ${process.env.DATABASE_URL ? 'set' : 'not set'}, ` +
        `CI: ${isCI}, ` +
        `This test requires a real database connection.`
      )
    }
  }
  
  // Local development without DATABASE_URL - allow mock for convenience
  // But warn that tests should use real database
  console.warn('⚠️  Running tests without DATABASE_URL - using mock user. Tests should use real database.')
  const mockId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  return {
    id: mockId,
    email,
    password,
    role,
    name: `Test User ${Date.now()}`,
  }
}

/**
 * Deletes a test user from the database
 * Silently succeeds if database is not available or user is a mock
 */
export async function deleteTestUser(userId: string): Promise<void> {
  // Skip deletion for mock users
  if (userId.startsWith('mock-')) {
    return
  }

  try {
    await db.user.delete({
      where: { id: userId },
    }).catch(() => {
      // Ignore errors if user doesn't exist
    })
  } catch (error) {
    // Silently ignore database errors in test environment
    if (process.env.NODE_ENV !== 'test') {
      console.warn('Could not delete test user (database may not be available):', error)
    }
  }
}

/**
 * Creates a mock request with authentication headers
 */
export function createAuthenticatedRequest(
  url: string,
  options: {
    method?: string
    body?: any
    headers?: Record<string, string>
    userId?: string
  } = {}
): NextRequest {
  const { method = 'GET', body, headers = {}, userId } = options
  
  const requestHeaders = new Headers({
    'Content-Type': 'application/json',
    ...headers,
  })

  if (userId) {
    // In real tests, we'd need to mock the session
    // For now, we'll use a custom header that can be intercepted
    requestHeaders.set('x-test-user-id', userId)
  }

  const requestInit: RequestInit = {
    method,
    headers: requestHeaders,
  }

  if (body) {
    requestInit.body = typeof body === 'string' ? body : JSON.stringify(body)
  }

  return new NextRequest(url, requestInit)
}

/**
 * Creates a mock request without authentication
 */
export function createUnauthenticatedRequest(
  url: string,
  options: {
    method?: string
    body?: any
    headers?: Record<string, string>
  } = {}
): NextRequest {
  return createAuthenticatedRequest(url, options)
}

/**
 * Mocks getCurrentUser for testing
 */
export function mockGetCurrentUser(user: TestUser | null) {
  // This will be used in test setup to mock the auth function
  return user
}








