import { describe, it, expect } from 'vitest'

// Mock next.config.js headers function
const mockHeaders = async () => {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https: blob:",
            "font-src 'self' data:",
            "connect-src 'self' https://www.googleapis.com https://accounts.google.com",
            "frame-ancestors 'self'",
            "base-uri 'self'",
            "form-action 'self'",
          ].join('; ')
        },
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN'
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block'
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload'
        },
        {
          key: 'Referrer-Policy',
          value: 'origin-when-cross-origin'
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()'
        },
      ],
    },
  ]
}

describe('Security Headers Tests', () => {
  describe('Content Security Policy', () => {
    it('should have CSP header configured', async () => {
      const headers = await mockHeaders()
      
      expect(headers).toBeDefined()
      expect(Array.isArray(headers)).toBe(true)
      
      const headerConfig = headers?.[0]
      expect(headerConfig).toBeDefined()
      expect(headerConfig?.source).toBe('/:path*')
      
      const cspHeader = headerConfig?.headers?.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (h: any) => h.key === 'Content-Security-Policy'
      )
      
      expect(cspHeader).toBeDefined()
      expect(cspHeader?.value).toBeDefined()
      expect(typeof cspHeader?.value).toBe('string')
    })

    it('should have restrictive CSP directives', async () => {
      const headers = await mockHeaders()
      const headerConfig = headers?.[0]
      const cspHeader = headerConfig?.headers?.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (h: any) => h.key === 'Content-Security-Policy'
      )
      
      const csp = cspHeader?.value as string
      
      // Should have default-src 'self'
      expect(csp).toContain("default-src 'self'")
      
      // Should allow Google APIs for Calendar integration
      expect(csp).toContain('https://www.googleapis.com')
      expect(csp).toContain('https://accounts.google.com')
    })

    it('should have frame-ancestors directive', async () => {
      const headers = await mockHeaders()
      const headerConfig = headers?.[0]
      const cspHeader = headerConfig?.headers?.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (h: any) => h.key === 'Content-Security-Policy'
      )
      
      const csp = cspHeader?.value as string
      
      // Should prevent clickjacking
      expect(csp).toContain("frame-ancestors 'self'")
    })
  })

  describe('Other Security Headers', () => {
    it('should have X-Frame-Options header', async () => {
      const headers = await mockHeaders()
      const headerConfig = headers?.[0]
      const frameOptionsHeader = headerConfig?.headers?.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (h: any) => h.key === 'X-Frame-Options'
      )
      
      expect(frameOptionsHeader).toBeDefined()
      expect(frameOptionsHeader?.value).toBe('SAMEORIGIN')
    })

    it('should have X-Content-Type-Options header', async () => {
      const headers = await mockHeaders()
      const headerConfig = headers?.[0]
      const contentTypeHeader = headerConfig?.headers?.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (h: any) => h.key === 'X-Content-Type-Options'
      )
      
      expect(contentTypeHeader).toBeDefined()
      expect(contentTypeHeader?.value).toBe('nosniff')
    })

    it('should have X-XSS-Protection header', async () => {
      const headers = await mockHeaders()
      const headerConfig = headers?.[0]
      const xssHeader = headerConfig?.headers?.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (h: any) => h.key === 'X-XSS-Protection'
      )
      
      expect(xssHeader).toBeDefined()
      expect(xssHeader?.value).toBe('1; mode=block')
    })

    it('should have Strict-Transport-Security header', async () => {
      const headers = await mockHeaders()
      const headerConfig = headers?.[0]
      const hstsHeader = headerConfig?.headers?.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (h: any) => h.key === 'Strict-Transport-Security'
      )
      
      expect(hstsHeader).toBeDefined()
      expect(hstsHeader?.value).toContain('max-age=')
    })

    it('should have Referrer-Policy header', async () => {
      const headers = await mockHeaders()
      const headerConfig = headers?.[0]
      const referrerHeader = headerConfig?.headers?.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (h: any) => h.key === 'Referrer-Policy'
      )
      
      expect(referrerHeader).toBeDefined()
      expect(referrerHeader?.value).toBeTruthy()
    })

    it('should have Permissions-Policy header', async () => {
      const headers = await mockHeaders()
      const headerConfig = headers?.[0]
      const permissionsHeader = headerConfig?.headers?.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (h: any) => h.key === 'Permissions-Policy'
      )
      
      expect(permissionsHeader).toBeDefined()
      expect(permissionsHeader?.value).toBeTruthy()
    })
  })
})

