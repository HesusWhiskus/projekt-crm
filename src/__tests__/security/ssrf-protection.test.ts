import { describe, it, expect } from 'vitest'
import { ExternalSystemClient } from '@/infrastructure/external/ExternalSystemClient'

describe('SSRF Protection', () => {
  const allowedDomains = ['api.example.com', '*.trusted-domain.com']
  
  describe('Private IP detection', () => {
    it('should reject localhost URLs', async () => {
      const client = new ExternalSystemClient({
        baseUrl: 'http://localhost:8080',
      })
      
      const result = await client.request({
        method: 'GET',
        endpoint: '/api/test',
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('SSRF protection')
      expect(result.statusCode).toBe(403)
    })
    
    it('should reject 127.0.0.1 URLs', async () => {
      const client = new ExternalSystemClient({
        baseUrl: 'http://127.0.0.1:8080',
      })
      
      const result = await client.request({
        method: 'GET',
        endpoint: '/api/test',
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('SSRF protection')
    })
    
    it('should reject 192.168.x.x URLs', async () => {
      const client = new ExternalSystemClient({
        baseUrl: 'http://192.168.1.1',
      })
      
      const result = await client.request({
        method: 'GET',
        endpoint: '/api/test',
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('SSRF protection')
    })
    
    it('should reject 10.x.x.x URLs', async () => {
      const client = new ExternalSystemClient({
        baseUrl: 'http://10.0.0.1',
      })
      
      const result = await client.request({
        method: 'GET',
        endpoint: '/api/test',
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('SSRF protection')
    })
    
    it('should reject 172.16-31.x.x URLs', async () => {
      const client = new ExternalSystemClient({
        baseUrl: 'http://172.16.0.1',
      })
      
      const result = await client.request({
        method: 'GET',
        endpoint: '/api/test',
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('SSRF protection')
    })
    
    it('should reject invalid URLs', async () => {
      const client = new ExternalSystemClient({
        baseUrl: 'invalid-url',
      })
      
      const result = await client.request({
        method: 'GET',
        endpoint: '/api/test',
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('SSRF protection')
    })
  })
  
  describe('Domain whitelist', () => {
    it('should allow URLs from whitelisted domains', async () => {
      const client = new ExternalSystemClient({
        baseUrl: 'https://api.example.com',
      }, allowedDomains)
      
      // Mock fetch to avoid actual network call
      global.fetch = async () => {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      
      const result = await client.request({
        method: 'GET',
        endpoint: '/api/test',
      })
      
      // Should not be blocked by SSRF protection
      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })
    
    it('should reject URLs not in whitelist', async () => {
      const client = new ExternalSystemClient({
        baseUrl: 'https://evil.com',
      }, allowedDomains)
      
      const result = await client.request({
        method: 'GET',
        endpoint: '/api/test',
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('nie jest na liście dozwolonych')
      expect(result.statusCode).toBe(403)
    })
    
    it('should allow wildcard domains', async () => {
      const client = new ExternalSystemClient({
        baseUrl: 'https://subdomain.trusted-domain.com',
      }, allowedDomains)
      
      // Mock fetch
      global.fetch = async () => {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      
      const result = await client.request({
        method: 'GET',
        endpoint: '/api/test',
      })
      
      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })
  })
  
  describe('Public URLs without whitelist', () => {
    it('should allow public URLs when no whitelist is provided', async () => {
      const client = new ExternalSystemClient({
        baseUrl: 'https://public-api.com',
      })
      
      // Mock fetch
      global.fetch = async () => {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      
      const result = await client.request({
        method: 'GET',
        endpoint: '/api/test',
      })
      
      // Should not be blocked if it's a public URL
      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })
  })
})

