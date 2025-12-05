/**
 * SECURITY-FIX: [TESTS-8] Testy jednostkowe dla API endpointów clients
 * Data: 2025-01-27
 * 
 * Testy integracyjne - używają rzeczywistej bazy danych i testują rzeczywiste endpointy API
 * Mockują tylko getCurrentUser (jak authorization.test.ts)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { GET, POST } from '@/presentation/api/clients/route'
import { createMockRequest } from '../helpers/mocks'
import { createTestUser, deleteTestUser, TestUser } from '../helpers/auth'
import { db } from '@/lib/db'
import * as authModule from '@/lib/auth'

describe('API /api/clients', () => {
  let testUser: TestUser | null = null
  let adminUser: TestUser | null = null

  beforeEach(async () => {
    // Create test users - always use real database in CI/CD
    // Tests should fail if database is not available, not use mocks
    testUser = await createTestUser('clients-test-user@test.com', 'USER')
    adminUser = await createTestUser('clients-test-admin@test.com', 'ADMIN')
  })

  afterEach(async () => {
    // Cleanup test users
    if (testUser?.id) await deleteTestUser(testUser.id).catch(() => {})
    if (adminUser?.id) await deleteTestUser(adminUser.id).catch(() => {})
    
    // Cleanup test clients created during tests
    try {
      await db.client.deleteMany({
        where: {
          OR: [
            { email: { contains: '@clients-test.com' } },
            { firstName: { contains: 'Test Client' } },
          ],
        },
      })
    } catch (error) {
      // Ignore errors if database is not available
    }
  })

  describe('GET /api/clients', () => {
    it('should return 401 if user is not authenticated', async () => {
      vi.spyOn(authModule, 'getCurrentUser').mockResolvedValue(null)

      const request = createMockRequest('http://localhost:3000/api/clients', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(401)
      
      const data = await response.json()
      expect(data.error).toContain('Nieautoryzowany')
    })

    it('should return clients list for authenticated user with pagination', async () => {
      if (!testUser || testUser.id.startsWith('mock-')) {
        throw new Error('Test requires real database connection - testUser is a mock')
      }

      // Create test clients
      const client1 = await db.client.create({
        data: {
          firstName: 'Jan',
          lastName: 'Kowalski',
          email: 'jan@clients-test.com',
          type: 'PERSON',
          assignedTo: testUser.id,
        },
      })

      const client2 = await db.client.create({
        data: {
          firstName: 'Anna',
          lastName: 'Nowak',
          email: 'anna@clients-test.com',
          type: 'PERSON',
          assignedTo: testUser.id,
        },
      })

      vi.spyOn(authModule, 'getCurrentUser').mockResolvedValue({
        id: testUser.id,
        email: testUser.email,
        role: testUser.role,
        name: testUser.name,
      } as any)

      const request = createMockRequest('http://localhost:3000/api/clients?page=1&limit=50', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(200)
      
      const json = await response.json()
      
      // Sprawdź rzeczywiste dane w odpowiedzi
      expect(json.data).toBeDefined()
      expect(Array.isArray(json.data)).toBe(true)
      expect(json.pagination).toBeDefined()
      expect(json.pagination.page).toBe(1)
      expect(json.pagination.limit).toBe(50)
      expect(json.pagination.total).toBeGreaterThanOrEqual(2)
      expect(json.pagination.totalPages).toBeGreaterThanOrEqual(1)
      
      // Sprawdź czy klienci są w odpowiedzi
      const clientIds = json.data.map((c: any) => c.id)
      expect(clientIds).toContain(client1.id)
      expect(clientIds).toContain(client2.id)
      
      // Sprawdź strukturę danych klienta
      const firstClient = json.data.find((c: any) => c.id === client1.id)
      expect(firstClient).toBeDefined()
      expect(firstClient.firstName).toBe('Jan')
      expect(firstClient.lastName).toBe('Kowalski')
      expect(firstClient.email).toBe('jan@clients-test.com')
    })

    it('should enforce pagination with default values', async () => {
      if (!testUser || testUser.id.startsWith('mock-')) {
        throw new Error('Test requires real database connection - testUser is a mock')
      }

      vi.spyOn(authModule, 'getCurrentUser').mockResolvedValue({
        id: testUser.id,
        email: testUser.email,
        role: testUser.role,
        name: testUser.name,
      } as any)

      // Request without pagination params - should use defaults (page=1, limit=50)
      const request = createMockRequest('http://localhost:3000/api/clients', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(200)
      
      const json = await response.json()
      
      // Should always return paginated response
      expect(json.data).toBeDefined()
      expect(json.pagination).toBeDefined()
      expect(json.pagination.page).toBe(1)
      expect(json.pagination.limit).toBe(50)
    })

    it('should filter clients by status', async () => {
      if (!testUser || testUser.id.startsWith('mock-')) {
        throw new Error('Test requires real database connection - testUser is a mock')
      }

      // Create clients with different statuses
      const activeClient = await db.client.create({
        data: {
          firstName: 'Active',
          lastName: 'Client',
          email: 'active@clients-test.com',
          type: 'PERSON',
          status: 'ACTIVE_CLIENT',
          assignedTo: testUser.id,
        },
      })

      const newLeadClient = await db.client.create({
        data: {
          firstName: 'New',
          lastName: 'Lead',
          email: 'newlead@clients-test.com',
          type: 'PERSON',
          status: 'NEW_LEAD',
          assignedTo: testUser.id,
        },
      })

      vi.spyOn(authModule, 'getCurrentUser').mockResolvedValue({
        id: testUser.id,
        email: testUser.email,
        role: testUser.role,
        name: testUser.name,
      } as any)

      // Filter by ACTIVE_CLIENT status
      const request = createMockRequest('http://localhost:3000/api/clients?status=ACTIVE_CLIENT&page=1&limit=50', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(200)
      
      const json = await response.json()
      
      // Should only return ACTIVE_CLIENT clients
      const clientIds = json.data.map((c: any) => c.id)
      expect(clientIds).toContain(activeClient.id)
      expect(clientIds).not.toContain(newLeadClient.id)
      
      // All returned clients should have ACTIVE_CLIENT status
      json.data.forEach((client: any) => {
        expect(client.status).toBe('ACTIVE_CLIENT')
      })
    })

    it('should filter clients by search query', async () => {
      if (!testUser || testUser.id.startsWith('mock-')) {
        throw new Error('Test requires real database connection - testUser is a mock')
      }

      // Create clients with different names
      const matchingClient = await db.client.create({
        data: {
          firstName: 'Searchable',
          lastName: 'Client',
          email: 'searchable@clients-test.com',
          type: 'PERSON',
          assignedTo: testUser.id,
        },
      })

      const nonMatchingClient = await db.client.create({
        data: {
          firstName: 'Other',
          lastName: 'Person',
          email: 'other@clients-test.com',
          type: 'PERSON',
          assignedTo: testUser.id,
        },
      })

      vi.spyOn(authModule, 'getCurrentUser').mockResolvedValue({
        id: testUser.id,
        email: testUser.email,
        role: testUser.role,
        name: testUser.name,
      } as any)

      // Search for "Searchable"
      const request = createMockRequest('http://localhost:3000/api/clients?search=Searchable&page=1&limit=50', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(200)
      
      const json = await response.json()
      
      // Should return matching client
      const clientIds = json.data.map((c: any) => c.id)
      expect(clientIds).toContain(matchingClient.id)
    })

    it('should validate query parameters and return 400 for invalid status', async () => {
      if (!testUser || testUser.id.startsWith('mock-')) {
        throw new Error('Test requires real database connection - testUser is a mock')
      }

      vi.spyOn(authModule, 'getCurrentUser').mockResolvedValue({
        id: testUser.id,
        email: testUser.email,
        role: testUser.role,
        name: testUser.name,
      } as any)

      // Invalid status value
      const request = createMockRequest('http://localhost:3000/api/clients?status=INVALID_STATUS', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.error).toBeDefined()
    })

    it('should return 400 for invalid pagination parameters', async () => {
      if (!testUser || testUser.id.startsWith('mock-')) {
        throw new Error('Test requires real database connection - testUser is a mock')
      }

      vi.spyOn(authModule, 'getCurrentUser').mockResolvedValue({
        id: testUser.id,
        email: testUser.email,
        role: testUser.role,
        name: testUser.name,
      } as any)

      // Invalid page value (not a number)
      const request = createMockRequest('http://localhost:3000/api/clients?page=not-a-number', {
        method: 'GET',
      })

      const response = await GET(request)
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.error).toBeDefined()
    })
  })

  describe('POST /api/clients', () => {
    it('should return 401 if user is not authenticated', async () => {
      vi.spyOn(authModule, 'getCurrentUser').mockResolvedValue(null)

      const request = createMockRequest('http://localhost:3000/api/clients', {
        method: 'POST',
        body: {
          firstName: 'Jan',
          lastName: 'Kowalski',
        },
      })

      const response = await POST(request)
      expect(response.status).toBe(401)
      
      const data = await response.json()
      expect(data.error).toContain('Nieautoryzowany')
    })

    it('should create a client successfully', async () => {
      if (!testUser || testUser.id.startsWith('mock-')) {
        throw new Error('Test requires real database connection - testUser is a mock')
      }

      vi.spyOn(authModule, 'getCurrentUser').mockResolvedValue({
        id: testUser.id,
        email: testUser.email,
        role: testUser.role,
        name: testUser.name,
      } as any)

      const request = createMockRequest('http://localhost:3000/api/clients', {
        method: 'POST',
        body: {
          firstName: 'Test Client',
          lastName: 'Created',
          email: 'test-created@clients-test.com',
          type: 'PERSON',
        },
      })

      const response = await POST(request)
      expect(response.status).toBe(201)
      
      const json = await response.json()
      
      // Sprawdź rzeczywiste dane w odpowiedzi
      expect(json.client).toBeDefined()
      expect(json.client.id).toBeDefined()
      expect(json.client.firstName).toBe('Test Client')
      expect(json.client.lastName).toBe('Created')
      expect(json.client.email).toBe('test-created@clients-test.com')
      expect(json.client.type).toBe('PERSON')
      
      // Sprawdź czy klient został rzeczywiście utworzony w bazie
      const createdClient = await db.client.findUnique({
        where: { id: json.client.id },
      })
      expect(createdClient).toBeDefined()
      expect(createdClient?.firstName).toBe('Test Client')
      expect(createdClient?.lastName).toBe('Created')
    })

    it('should return 400 if validation fails - missing required fields', async () => {
      if (!testUser || testUser.id.startsWith('mock-')) {
        throw new Error('Test requires real database connection - testUser is a mock')
      }

      vi.spyOn(authModule, 'getCurrentUser').mockResolvedValue({
        id: testUser.id,
        email: testUser.email,
        role: testUser.role,
        name: testUser.name,
      } as any)

      const request = createMockRequest('http://localhost:3000/api/clients', {
        method: 'POST',
        body: {
          // Missing required fields: firstName, lastName
        },
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.error).toBeDefined()
    })

    it('should return 400 if validation fails - invalid email format', async () => {
      if (!testUser || testUser.id.startsWith('mock-')) {
        throw new Error('Test requires real database connection - testUser is a mock')
      }

      vi.spyOn(authModule, 'getCurrentUser').mockResolvedValue({
        id: testUser.id,
        email: testUser.email,
        role: testUser.role,
        name: testUser.name,
      } as any)

      const request = createMockRequest('http://localhost:3000/api/clients', {
        method: 'POST',
        body: {
          firstName: 'Test',
          lastName: 'Client',
          email: 'invalid-email-format', // Invalid email
          type: 'PERSON',
        },
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.error).toBeDefined()
    })

    it('should return 400 if validation fails - invalid status', async () => {
      if (!testUser || testUser.id.startsWith('mock-')) {
        throw new Error('Test requires real database connection - testUser is a mock')
      }

      vi.spyOn(authModule, 'getCurrentUser').mockResolvedValue({
        id: testUser.id,
        email: testUser.email,
        role: testUser.role,
        name: testUser.name,
      } as any)

      const request = createMockRequest('http://localhost:3000/api/clients', {
        method: 'POST',
        body: {
          firstName: 'Test',
          lastName: 'Client',
          status: 'INVALID_STATUS', // Invalid status
          type: 'PERSON',
        },
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.error).toBeDefined()
    })
  })
})
