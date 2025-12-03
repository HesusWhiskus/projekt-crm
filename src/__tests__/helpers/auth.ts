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
 */
export async function createTestUser(
  email: string = `test-${Date.now()}@example.com`,
  role: 'ADMIN' | 'USER' = 'USER',
  password: string = 'TestPassword123!'
): Promise<TestUser> {
  const hashedPassword = await bcrypt.hash(password, 10)
  
  const user = await db.user.create({
    data: {
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
}

/**
 * Deletes a test user from the database
 */
export async function deleteTestUser(userId: string): Promise<void> {
  await db.user.delete({
    where: { id: userId },
  }).catch(() => {
    // Ignore errors if user doesn't exist
  })
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







