/**
 * SECURITY-FIX: [SECURITY-TESTS-13] Testy nagłówków bezpieczeństwa
 * Data: 2025-01-27
 * 
 * Testy sprawdzające czy nagłówki bezpieczeństwa są ustawiane w odpowiedziach HTTP
 * Nagłówki są konfigurowane w next.config.js i ustawiane przez Next.js middleware
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { GET as tasksGET } from '@/app/api/tasks/route'
import { GET as clientsGET } from '@/presentation/api/clients/route'
import { createMockRequest } from '../helpers/mocks'
import { createTestUser, deleteTestUser, TestUser } from '../helpers/auth'
import * as authModule from '@/lib/auth'

// Import next.config.js - use require for JS files
// eslint-disable-next-line @typescript-eslint/no-var-requires
const nextConfig = require('../../../next.config.js')

describe('Security Headers Tests', () => {
  let testUser: TestUser | null = null

  beforeEach(async () => {
    testUser = await createTestUser('headers-test-user@test.com', 'USER')
  })

  afterEach(async () => {
    if (testUser?.id) {
      await deleteTestUser(testUser.id).catch(() => {})
    }
  })

  describe('next.config.js Configuration', () => {
    it('should have headers function configured', async () => {
      expect(nextConfig.headers).toBeDefined()
      expect(typeof nextConfig.headers).toBe('function')
      
      const headers = await nextConfig.headers()
      expect(headers).toBeDefined()
      expect(Array.isArray(headers)).toBe(true)
    })

    it('should have Content-Security-Policy header configured', async () => {
      const headers = await nextConfig.headers()
      const headerConfig = headers?.[0]
      expect(headerConfig).toBeDefined()
      expect(headerConfig?.source).toBe('/:path*')
      
      const cspHeader = headerConfig?.headers?.find(
        (h: any) => h.key === 'Content-Security-Policy'
      )
      
      expect(cspHeader).toBeDefined()
      expect(cspHeader?.value).toBeDefined()
      expect(typeof cspHeader?.value).toBe('string')
    })

    it('should have restrictive CSP directives', async () => {
      const headers = await nextConfig.headers()
      const headerConfig = headers?.[0]
      const cspHeader = headerConfig?.headers?.find(
        (h: any) => h.key === 'Content-Security-Policy'
      )
      
      const csp = cspHeader?.value as string
      
      // Should have default-src 'self'
      expect(csp).toContain("default-src 'self'")
      
      // Should allow Google APIs for Calendar integration
      expect(csp).toContain('https://www.googleapis.com')
      expect(csp).toContain('https://accounts.google.com')
      
      // Should prevent clickjacking
      expect(csp).toContain("frame-ancestors 'self'")
    })

    it('should have X-Frame-Options header configured', async () => {
      const headers = await nextConfig.headers()
      const headerConfig = headers?.[0]
      const frameOptionsHeader = headerConfig?.headers?.find(
        (h: any) => h.key === 'X-Frame-Options'
      )
      
      expect(frameOptionsHeader).toBeDefined()
      expect(frameOptionsHeader?.value).toBe('SAMEORIGIN')
    })

    it('should have X-Content-Type-Options header configured', async () => {
      const headers = await nextConfig.headers()
      const headerConfig = headers?.[0]
      const contentTypeHeader = headerConfig?.headers?.find(
        (h: any) => h.key === 'X-Content-Type-Options'
      )
      
      expect(contentTypeHeader).toBeDefined()
      expect(contentTypeHeader?.value).toBe('nosniff')
    })

    it('should have X-XSS-Protection header configured', async () => {
      const headers = await nextConfig.headers()
      const headerConfig = headers?.[0]
      const xssHeader = headerConfig?.headers?.find(
        (h: any) => h.key === 'X-XSS-Protection'
      )
      
      expect(xssHeader).toBeDefined()
      expect(xssHeader?.value).toBe('1; mode=block')
    })

    it('should have Strict-Transport-Security header configured', async () => {
      const headers = await nextConfig.headers()
      const headerConfig = headers?.[0]
      const hstsHeader = headerConfig?.headers?.find(
        (h: any) => h.key === 'Strict-Transport-Security'
      )
      
      expect(hstsHeader).toBeDefined()
      expect(hstsHeader?.value).toContain('max-age=63072000')
      expect(hstsHeader?.value).toContain('includeSubDomains')
      expect(hstsHeader?.value).toContain('preload')
    })

    it('should have Referrer-Policy header configured', async () => {
      const headers = await nextConfig.headers()
      const headerConfig = headers?.[0]
      const referrerHeader = headerConfig?.headers?.find(
        (h: any) => h.key === 'Referrer-Policy'
      )
      
      expect(referrerHeader).toBeDefined()
      expect(referrerHeader?.value).toBe('origin-when-cross-origin')
    })

    it('should have Permissions-Policy header configured', async () => {
      const headers = await nextConfig.headers()
      const headerConfig = headers?.[0]
      const permissionsHeader = headerConfig?.headers?.find(
        (h: any) => h.key === 'Permissions-Policy'
      )
      
      expect(permissionsHeader).toBeDefined()
      expect(permissionsHeader?.value).toBe('camera=(), microphone=(), geolocation=()')
    })

    it('should have X-DNS-Prefetch-Control header configured', async () => {
      const headers = await nextConfig.headers()
      const headerConfig = headers?.[0]
      const dnsHeader = headerConfig?.headers?.find(
        (h: any) => h.key === 'X-DNS-Prefetch-Control'
      )
      
      expect(dnsHeader).toBeDefined()
      expect(dnsHeader?.value).toBe('on')
    })
  })

  describe('HTTP Response Headers (Integration)', () => {
    it('should return response from API endpoint', async () => {
      if (!testUser || testUser.id.startsWith('mock-')) {
        throw new Error('Test requires real database connection - testUser is a mock')
      }

      vi.spyOn(authModule, 'getCurrentUser').mockResolvedValue({
        id: testUser.id,
        email: testUser.email,
        role: testUser.role,
        name: testUser.name,
      } as any)

      const request = createMockRequest('http://localhost:3000/api/tasks?page=1&limit=50', {
        method: 'GET',
      })

      const response = await tasksGET(request)
      
      // Response should be returned (status may vary, but headers should be accessible)
      expect(response).toBeDefined()
      expect(response.headers).toBeDefined()
      
      // Note: In unit tests, Next.js may not apply headers from next.config.js
      // Headers are applied by Next.js middleware during actual HTTP requests
      // This test verifies that the endpoint returns a response with headers object
      // Actual header values are verified in next.config.js configuration tests above
    })

    it('should return response from clients API endpoint', async () => {
      if (!testUser || testUser.id.startsWith('mock-')) {
        throw new Error('Test requires real database connection - testUser is a mock')
      }

      vi.spyOn(authModule, 'getCurrentUser').mockResolvedValue({
        id: testUser.id,
        email: testUser.email,
        role: testUser.role,
        name: testUser.name,
      } as any)

      const request = createMockRequest('http://localhost:3000/api/clients?page=1&limit=50', {
        method: 'GET',
      })

      const response = await clientsGET(request)
      
      // Response should be returned (status may vary, but headers should be accessible)
      expect(response).toBeDefined()
      expect(response.headers).toBeDefined()
      
      // Note: In unit tests, Next.js may not apply headers from next.config.js
      // Headers are applied by Next.js middleware during actual HTTP requests
      // This test verifies that the endpoint returns a response with headers object
      // Actual header values are verified in next.config.js configuration tests above
    })
  })

  describe('Header Configuration Validation', () => {
    it('should have all required security headers configured', async () => {
      const headers = await nextConfig.headers()
      const headerConfig = headers?.[0]
      const headerKeys = headerConfig?.headers?.map((h: any) => h.key) || []
      
      const requiredHeaders = [
        'Content-Security-Policy',
        'X-Frame-Options',
        'X-Content-Type-Options',
        'X-XSS-Protection',
        'Strict-Transport-Security',
        'Referrer-Policy',
        'Permissions-Policy',
        'X-DNS-Prefetch-Control',
      ]
      
      requiredHeaders.forEach(headerKey => {
        expect(headerKeys).toContain(headerKey)
      })
    })

    it('should have headers applied to all paths', async () => {
      const headers = await nextConfig.headers()
      const headerConfig = headers?.[0]
      
      // Headers should be applied to all paths
      expect(headerConfig?.source).toBe('/:path*')
    })
  })
})
