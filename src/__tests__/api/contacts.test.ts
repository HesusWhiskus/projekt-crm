/**
 * SECURITY-FIX: [TESTS-12] Testy jednostkowe dla API endpointów contacts
 * Data: 2025-12-05
 * 
 * Testy integracyjne - używają rzeczywistej bazy danych i testują rzeczywiste endpointy API
 * Mockują tylko getCurrentUser
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { GET, POST } from '@/app/api/contacts/route'
import { createMockRequest } from '../helpers/mocks'
import { createTestUser, deleteTestUser, TestUser } from '../helpers/auth'
import { db } from '@/lib/db'
import * as authModule from '@/lib/auth'

describe('API /api/contacts', () => {
  let testUser: TestUser | null = null
  let testClient: any = null

  beforeEach(async () => {
    testUser = await createTestUser('contacts-test-user@test.com', 'USER')
    
    vi.spyOn(authModule, 'getCurrentUser').mockResolvedValue({
      id: testUser.id,
      email: testUser.email,
      role: testUser.role,
      name: testUser.name,
      organizationId: 'org-123',
    } as any)

    // Create a test client for contacts
    if (!testUser.id.startsWith('mock-')) {
      testClient = await db.client.create({
        data: {
          firstName: 'Test Client',
          lastName: 'For Contacts',
          email: 'test-client-contacts@test.com',
          type: 'PERSON',
          assignedTo: testUser.id,
        },
      })
    }
  })

  afterEach(async () => {
    if (testUser?.id) await deleteTestUser(testUser.id).catch(() => {})
    
    try {
      if (testClient?.id) {
        await db.contact.deleteMany({
          where: { clientId: testClient.id },
        })
        await db.client.delete({
          where: { id: testClient.id },
        })
      }
    } catch (error) {
      // Ignore errors if database is not available
    }
  })

  describe('GET /api/contacts', () => {
    it('should return 401 if user is not authenticated', async () => {
      vi.spyOn(authModule, 'getCurrentUser').mockResolvedValue(null)
      
      const request = createMockRequest('http://localhost:3000/api/contacts')
      const response = await GET(request)
      
      expect(response.status).toBe(401)
      const json = await response.json()
      expect(json.error).toContain('Nieautoryzowany')
    })

    it('should return contacts list for authenticated user with default pagination', async () => {
      if (!testUser || testUser.id.startsWith('mock-') || !testClient) {
        throw new Error('Test requires real database connection')
      }

      // Create a test contact
      const contact = await db.contact.create({
        data: {
          type: 'PHONE_CALL',
          date: new Date(),
          notes: 'Test contact notes',
          userId: testUser.id,
          clientId: testClient.id,
        },
      })

      const request = createMockRequest('http://localhost:3000/api/contacts')
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.data).toBeDefined()
      expect(json.pagination).toBeDefined()
      expect(json.pagination.page).toBe(1)
      expect(json.pagination.limit).toBe(50)
      expect(json.data.length).toBeGreaterThanOrEqual(1)
    })

    it('should filter contacts by clientId', async () => {
      if (!testUser || testUser.id.startsWith('mock-') || !testClient) {
        throw new Error('Test requires real database connection')
      }

      const request = createMockRequest(`http://localhost:3000/api/contacts?clientId=${testClient.id}`)
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.data).toBeDefined()
      // All returned contacts should belong to the specified client
      json.data.forEach((contact: any) => {
        expect(contact.clientId).toBe(testClient.id)
      })
    })
  })

  describe('POST /api/contacts', () => {
    it('should return 401 if user is not authenticated', async () => {
      vi.spyOn(authModule, 'getCurrentUser').mockResolvedValue(null)
      
      const formData = new FormData()
      formData.append('date', new Date().toISOString())
      formData.append('notes', 'Test notes')
      formData.append('userId', 'test-user-id')
      formData.append('clientId', 'test-client-id')
      
      const request = createMockRequest('http://localhost:3000/api/contacts', {
        method: 'POST',
        formData,
      })
      const response = await POST(request)
      
      expect(response.status).toBe(401)
      const json = await response.json()
      expect(json.error).toContain('Nieautoryzowany')
    })

    it('should return 400 if validation fails', async () => {
      if (!testUser || testUser.id.startsWith('mock-') || !testClient) {
        throw new Error('Test requires real database connection')
      }

      const formData = new FormData()
      // Missing required fields
      formData.append('notes', '')
      
      const request = createMockRequest('http://localhost:3000/api/contacts', {
        method: 'POST',
        formData,
      })
      const response = await POST(request)
      
      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error).toBeDefined()
    })

    it('should create a contact successfully', async () => {
      if (!testUser || testUser.id.startsWith('mock-') || !testClient) {
        throw new Error('Test requires real database connection')
      }

      const formData = new FormData()
      formData.append('type', 'PHONE_CALL')
      formData.append('date', new Date().toISOString())
      formData.append('notes', 'Test contact notes')
      formData.append('userId', testUser.id)
      formData.append('clientId', testClient.id)
      formData.append('isNote', 'false')
      
      const request = createMockRequest('http://localhost:3000/api/contacts', {
        method: 'POST',
        formData,
      })
      const response = await POST(request)
      
      expect(response.status).toBe(201)
      const json = await response.json()
      expect(json.contact).toBeDefined()
      expect(json.contact.id).toBeDefined()
      expect(json.contact.notes).toBe('Test contact notes')
      expect(json.contact.type).toBe('PHONE_CALL')
    })
  })
})

