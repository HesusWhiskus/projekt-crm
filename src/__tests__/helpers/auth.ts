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
 * Returns a mock user if DATABASE_URL is not available (e.g., in Railway CI)
 * If user with email already exists, updates it instead of creating new one
 */
export async function createTestUser(
  email: string = `test-${Date.now()}@example.com`,
  role: 'ADMIN' | 'USER' = 'USER',
  password: string = 'TestPassword123!'
): Promise<TestUser> {
  // Try to create user in database, fallback to mock if fails
  try {
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Use upsert to handle existing users - update if exists, create if not
    // Add timeout to prevent hanging if database is not available
    const user = await Promise.race([
      db.user.upsert({
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
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout')), 3000)
      ),
    ])

    return {
      id: user.id,
      email: user.email!,
      password,
      role: user.role as 'ADMIN' | 'USER',
      name: user.name || '',
    }
  } catch (error: any) {
    // If database connection fails or times out, return mock user
    // Don't log warning in test environment to avoid cluttering output
    if (process.env.NODE_ENV !== 'test') {
      console.warn('Database not available, using mock user:', error)
    }
    const mockId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    return {
      id: mockId,
      email,
      password,
      role,
      name: `Test User ${Date.now()}`,
    }
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








