/**
 * SECURITY-FIX: [TESTS-10] Testy jednostkowe dla API endpointów calculations
 * Data: 2025-12-05
 * 
 * Testy integracyjne - używają rzeczywistej bazy danych i testują rzeczywiste endpointy API
 * Mockują tylko getCurrentUser
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { GET, POST } from '@/app/api/calculations/route'
import { createMockRequest } from '../helpers/mocks'
import { createTestUser, deleteTestUser, TestUser } from '../helpers/auth'
import { db } from '@/lib/db'
import * as authModule from '@/lib/auth'

describe('API /api/calculations', () => {
  let testUser: TestUser | null = null

  beforeEach(async () => {
    testUser = await createTestUser('calculations-test-user@test.com', 'USER')
    
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
      await db.calculation.deleteMany({
        where: {
          agentId: testUser?.id,
        },
      })
    } catch (error) {
      // Ignore errors if database is not available
    }
  })

  describe('GET /api/calculations', () => {
    it('should return 401 if user is not authenticated', async () => {
      vi.spyOn(authModule, 'getCurrentUser').mockResolvedValue(null)
      
      const request = createMockRequest('http://localhost:3000/api/calculations')
      const response = await GET(request)
      
      expect(response.status).toBe(401)
      const json = await response.json()
      expect(json.error).toContain('Nieautoryzowany')
    })

    it('should return calculations list for authenticated user with default pagination', async () => {
      if (!testUser || testUser.id.startsWith('mock-')) {
        throw new Error('Test requires real database connection')
      }

      // Create a test calculation
      const calculation = await db.calculation.create({
        data: {
          firstName: 'Test',
          lastName: 'Calculation',
          status: 'DRAFT',
          agentId: testUser.id,
        },
      })

      const request = createMockRequest('http://localhost:3000/api/calculations')
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

  describe('POST /api/calculations', () => {
    it('should return 401 if user is not authenticated', async () => {
      vi.spyOn(authModule, 'getCurrentUser').mockResolvedValue(null)
      
      const request = createMockRequest('http://localhost:3000/api/calculations', {
        method: 'POST',
        body: {
          firstName: 'Test',
          lastName: 'Calculation',
        },
      })
      const response = await POST(request)
      
      expect(response.status).toBe(401)
      const json = await response.json()
      expect(json.error).toContain('Nieautoryzowany')
    })

    it('should create a calculation successfully', async () => {
      if (!testUser || testUser.id.startsWith('mock-')) {
        throw new Error('Test requires real database connection')
      }

      const request = createMockRequest('http://localhost:3000/api/calculations', {
        method: 'POST',
        body: {
          firstName: 'Test',
          lastName: 'Calculation',
          status: 'DRAFT',
        },
      })
      const response = await POST(request)
      
      expect(response.status).toBe(201)
      const json = await response.json()
      expect(json.calculation).toBeDefined()
      expect(json.calculation.id).toBeDefined()
      expect(json.calculation.firstName).toBe('Test')
      expect(json.calculation.lastName).toBe('Calculation')
    })
  })
})

