/**
 * SECURITY-FIX: [TESTS-11] Testy jednostkowe dla API endpointów policies
 * Data: 2025-12-05
 * 
 * Testy integracyjne - używają rzeczywistej bazy danych i testują rzeczywiste endpointy API
 * Mockują tylko getCurrentUser
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { GET, POST } from '@/app/api/policies/route'
import { createMockRequest } from '../helpers/mocks'
import { createTestUser, deleteTestUser, TestUser } from '../helpers/auth'
import { db } from '@/lib/db'
import * as authModule from '@/lib/auth'

describe('API /api/policies', () => {
  let testUser: TestUser | null = null

  beforeEach(async () => {
    testUser = await createTestUser('policies-test-user@test.com', 'USER')
    
    vi.spyOn(authModule, 'getCurrentUser').mockResolvedValue({
      id: testUser.id,
      email: testUser.email,
      role: testUser.role,
      name: testUser.name,
      organizationId: 'org-123',
    } as any)
  })

  afterEach(async () => {
    if (testUser?.id) await deleteTestUser(testUser.id).catch(() => {})
    
    try {
      await db.policy.deleteMany({
        where: {
          agentId: testUser?.id,
        },
      })
    } catch (error) {
      // Ignore errors if database is not available
    }
  })

  describe('GET /api/policies', () => {
    it('should return 401 if user is not authenticated', async () => {
      vi.spyOn(authModule, 'getCurrentUser').mockResolvedValue(null)
      
      const request = createMockRequest('http://localhost:3000/api/policies')
      const response = await GET(request)
      
      expect(response.status).toBe(401)
      const json = await response.json()
      expect(json.error).toContain('Nieautoryzowany')
    })

    it('should return policies list for authenticated user with default pagination', async () => {
      if (!testUser || testUser.id.startsWith('mock-')) {
        throw new Error('Test requires real database connection')
      }

      // Create insurance company first (required for policy)
      const insuranceCompany = await db.insuranceCompany.create({
        data: {
          name: 'Test Insurance Company',
          code: 'TEST-INS',
        },
      })

      // Create a test policy
      const policy = await db.policy.create({
        data: {
          policyNumber: 'TEST-POL-001',
          issueDate: new Date(),
          validFrom: new Date(),
          validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          status: 'ACTIVE',
          insuranceCompanyId: insuranceCompany.id,
          agentId: testUser.id,
          organizationId: 'org-123',
        },
      })

      const request = createMockRequest('http://localhost:3000/api/policies')
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.data).toBeDefined()
      expect(json.pagination).toBeDefined()
      expect(json.pagination.page).toBe(1)
      expect(json.pagination.limit).toBe(50)
      expect(json.data.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('POST /api/policies', () => {
    it('should return 401 if user is not authenticated', async () => {
      vi.spyOn(authModule, 'getCurrentUser').mockResolvedValue(null)
      
      const request = createMockRequest('http://localhost:3000/api/policies', {
        method: 'POST',
        body: {
          policyNumber: 'TEST-POL-002',
          issueDate: new Date().toISOString(),
          validFrom: new Date().toISOString(),
          validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          insuranceCompanyId: 'test-id',
        },
      })
      const response = await POST(request)
      
      expect(response.status).toBe(401)
      const json = await response.json()
      expect(json.error).toContain('Nieautoryzowany')
    })

    it('should return 400 if validation fails', async () => {
      if (!testUser || testUser.id.startsWith('mock-')) {
        throw new Error('Test requires real database connection')
      }

      const request = createMockRequest('http://localhost:3000/api/policies', {
        method: 'POST',
        body: {
          // Missing required fields
          policyNumber: '',
        },
      })
      const response = await POST(request)
      
      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error).toBeDefined()
    })
  })
})

