import { vi } from 'vitest'
import { NextRequest } from 'next/server'

/**
 * Creates a mock NextRequest for testing
 */
export function createMockRequest(
  url: string = 'http://localhost:3000/api/test',
  options: {
    method?: string
    headers?: Record<string, string>
    body?: any
    ip?: string
  } = {}
): NextRequest {
  const {
    method = 'GET',
    headers = {},
    body,
    ip = '127.0.0.1',
  } = options

  const requestHeaders = new Headers(headers)
  
  // Add IP address headers
  requestHeaders.set('x-forwarded-for', ip)
  requestHeaders.set('x-real-ip', ip)

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
 * Creates a mock FormData for file upload tests
 */
export function createMockFormData(files: Array<{
  name: string
  content: string | Buffer
  type?: string
}>): FormData {
  const formData = new FormData()
  
  files.forEach((file, index) => {
    const blob = new Blob([file.content], { type: file.type || 'application/octet-stream' })
    formData.append('files', blob, file.name)
  })

  return formData
}

/**
 * Mocks NextAuth session
 */
export function mockSession(user: {
  id: string
  email: string
  role: 'ADMIN' | 'USER'
  name?: string
} | null) {
  return {
    user: user ? {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name || 'Test User',
    } : null,
    expires: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  }
}

/**
 * Creates a mock file for testing
 */
export function createMockFile(
  name: string,
  content: string | Buffer,
  type: string = 'application/octet-stream'
): File {
  const blob = new Blob([content], { type })
  return new File([blob], name, { type })
}

