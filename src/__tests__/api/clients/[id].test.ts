/**
 * SECURITY-FIX: [TESTS-9] Testy jednostkowe dla API endpointów clients/[id]
 * Data: 2025-12-05
 * 
 * Testy integracyjne - używają rzeczywistej bazy danych i testują rzeczywiste endpointy API
 * Mockują tylko getCurrentUser
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { GET, PATCH, DELETE } from '@/presentation/api/clients/[id]/route'
import { createMockRequest } from '../../helpers/mocks'
import { createTestUser, deleteTestUser, TestUser } from '../../helpers/auth'
import { db } from '@/lib/db'
import * as authModule from '@/lib/auth'

describe('API /api/clients/[id]', () => {
  let testUser: TestUser | null = null
  let adminUser: TestUser | null = null

  beforeEach(async () => {
    testUser = await createTestUser('clients-id-test-user@test.com', 'USER')
    adminUser = await createTestUser('clients-id-test-admin@test.com', 'ADMIN')
    
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
    if (adminUser?.id) await deleteTestUser(adminUser.id).catch(() => {})
    
    try {
      await db.client.deleteMany({
        where: {
          OR: [
            { email: { contains: '@clients-id-test.com' } },
            { firstName: { contains: 'Test Client ID' } },
          ],
        },
      })
    } catch (error) {
      // Ignore errors if database is not available
    }
  })

  describe('GET /api/clients/[id]', () => {
    it('should return 401 if user is not authenticated', async () => {
      vi.spyOn(authModule, 'getCurrentUser').mockResolvedValue(null)
      
      const request = createMockRequest('http://localhost:3000/api/clients/test-id')
      const response = await GET(request, { params: { id: 'test-id' } })
      
      expect(response.status).toBe(401)
      const json = await response.json()
      expect(json.error).toContain('Nieautoryzowany')
    })

    it('should return 400 if id is invalid', async () => {
      const request = createMockRequest('http://localhost:3000/api/clients/')
      const response = await GET(request, { params: { id: '' } })
      
      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error).toContain('Nieprawidłowy format ID')
    })

    it('should return 404 if client does not exist', async () => {
      const request = createMockRequest('http://localhost:3000/api/clients/non-existent-id')
      const response = await GET(request, { params: { id: 'non-existent-id' } })
      
      expect(response.status).toBe(404)
      const json = await response.json()
      expect(json.error).toBeDefined()
    })

    it('should return client details for authenticated user', async () => {
      if (!testUser || testUser.id.startsWith('mock-')) {
        throw new Error('Test requires real database connection')
      }

      // Create a test client
      const client = await db.client.create({
        data: {
          firstName: 'Test Client ID',
          lastName: 'User',
          email: 'test-client-id@clients-id-test.com',
          type: 'PERSON',
          assignedTo: testUser.id,
          organizationId: 'org-123',
        },
      })

      const request = createMockRequest(`http://localhost:3000/api/clients/${client.id}`)
      const response = await GET(request, { params: { id: client.id } })
      
      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.client).toBeDefined()
      expect(json.client.id).toBe(client.id)
      expect(json.client.firstName).toBe('Test Client ID')
    })
  })

  describe('PATCH /api/clients/[id]', () => {
    it('should return 401 if user is not authenticated', async () => {
      vi.spyOn(authModule, 'getCurrentUser').mockResolvedValue(null)
      
      const request = createMockRequest('http://localhost:3000/api/clients/test-id', {
        method: 'PATCH',
        body: { firstName: 'Updated' },
      })
      const response = await PATCH(request, { params: { id: 'test-id' } })
      
      expect(response.status).toBe(401)
    })

    it('should return 400 if id is invalid', async () => {
      const request = createMockRequest('http://localhost:3000/api/clients/', {
        method: 'PATCH',
        body: { firstName: 'Updated' },
      })
      const response = await PATCH(request, { params: { id: '' } })
      
      expect(response.status).toBe(400)
    })

    it('should update client successfully', async () => {
      if (!testUser || testUser.id.startsWith('mock-')) {
        throw new Error('Test requires real database connection')
      }

      // Create a test client
      const client = await db.client.create({
        data: {
          firstName: 'Test Client ID',
          lastName: 'User',
          email: 'test-client-id-update@clients-id-test.com',
          type: 'PERSON',
          assignedTo: testUser.id,
          organizationId: 'org-123',
        },
      })

      const request = createMockRequest(`http://localhost:3000/api/clients/${client.id}`, {
        method: 'PATCH',
        body: {
          firstName: 'Updated Name',
        },
      })
      const response = await PATCH(request, { params: { id: client.id } })
      
      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.client).toBeDefined()
      expect(json.client.firstName).toBe('Updated Name')
    })
  })

  describe('DELETE /api/clients/[id]', () => {
    it('should return 401 if user is not authenticated', async () => {
      vi.spyOn(authModule, 'getCurrentUser').mockResolvedValue(null)
      
      const request = createMockRequest('http://localhost:3000/api/clients/test-id', {
        method: 'DELETE',
      })
      const response = await DELETE(request, { params: { id: 'test-id' } })
      
      expect(response.status).toBe(401)
    })

    it('should return 400 if id is invalid', async () => {
      const request = createMockRequest('http://localhost:3000/api/clients/', {
        method: 'DELETE',
      })
      const response = await DELETE(request, { params: { id: '' } })
      
      expect(response.status).toBe(400)
    })

    it('should delete client successfully', async () => {
      if (!testUser || testUser.id.startsWith('mock-')) {
        throw new Error('Test requires real database connection')
      }

      // Create a test client
      const client = await db.client.create({
        data: {
          firstName: 'Test Client ID',
          lastName: 'User',
          email: 'test-client-id-delete@clients-id-test.com',
          type: 'PERSON',
          assignedTo: testUser.id,
          organizationId: 'org-123',
        },
      })

      const request = createMockRequest(`http://localhost:3000/api/clients/${client.id}`, {
        method: 'DELETE',
      })
      const response = await DELETE(request, { params: { id: client.id } })
      
      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.message).toBeDefined()

      // Verify client was deleted
      const deletedClient = await db.client.findUnique({
        where: { id: client.id },
      })
      expect(deletedClient).toBeNull()
    })
  })
})

