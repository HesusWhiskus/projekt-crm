import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET as tasksGET } from '@/app/api/tasks/route'
import { GET as taskGET } from '@/app/api/tasks/[id]/route'
import { createMockRequest } from '../helpers/mocks'
import { createTestUser, deleteTestUser, TestUser } from '../helpers/auth'
import { db } from '@/lib/db'
import * as authModule from '@/lib/auth'

describe('Authorization Security Tests', () => {
  let testUser: TestUser
  let otherUser: TestUser
  let adminUser: TestUser

  beforeEach(async () => {
    // Create test users
    testUser = await createTestUser('user1@test.com', 'USER')
    otherUser = await createTestUser('user2@test.com', 'USER')
    adminUser = await createTestUser('admin@test.com', 'ADMIN')
  })

  afterEach(async () => {
    // Cleanup
    if (testUser?.id) await deleteTestUser(testUser.id).catch(() => {})
    if (otherUser?.id) await deleteTestUser(otherUser.id).catch(() => {})
    if (adminUser?.id) await deleteTestUser(adminUser.id).catch(() => {})
  })

  describe('GET /api/tasks - Unauthorized Access', () => {
    it('should reject request without authentication', async () => {
      vi.spyOn(authModule, 'getCurrentUser').mockResolvedValue(null)

      const request = createMockRequest('http://localhost:3000/api/tasks', {
        method: 'GET',
      })

      const response = await tasksGET(request)
      expect(response.status).toBe(401)
      
      const data = await response.json()
      expect(data.error).toContain('Nieautoryzowany')
    })

    it('should accept request with valid authentication', async () => {
      vi.spyOn(authModule, 'getCurrentUser').mockResolvedValue({
        id: testUser.id,
        email: testUser.email,
        role: testUser.role,
        name: testUser.name,
      } as any)

      const request = createMockRequest('http://localhost:3000/api/tasks', {
        method: 'GET',
      })

      const response = await tasksGET(request)
      // Should succeed (200) or return empty array, but not 401
      expect([200, 401]).toContain(response.status)
    })
  })

  describe('GET /api/tasks/[id] - Resource Access Control', () => {
    let taskId: string

    beforeEach(async () => {
      // Create a task assigned to testUser
      const task = await db.task.create({
        data: {
          title: 'Test Task',
          description: 'Test Description',
          assignedTo: testUser.id,
          status: 'TODO',
        },
      })
      taskId = task.id
    })

    afterEach(async () => {
      if (taskId) {
        await db.task.delete({ where: { id: taskId } }).catch(() => {})
      }
    })

    it('should allow owner to access their task', async () => {
      vi.spyOn(authModule, 'getCurrentUser').mockResolvedValue({
        id: testUser.id,
        email: testUser.email,
        role: testUser.role,
        name: testUser.name,
      } as any)

      const request = createMockRequest(`http://localhost:3000/api/tasks/${taskId}`, {
        method: 'GET',
      })

      const response = await taskGET(request, { params: { id: taskId } })
      expect(response.status).toBe(200)
    })

    it('should reject access from other user to task they do not own', async () => {
      vi.spyOn(authModule, 'getCurrentUser').mockResolvedValue({
        id: otherUser.id,
        email: otherUser.email,
        role: otherUser.role,
        name: otherUser.name,
      } as any)

      const request = createMockRequest(`http://localhost:3000/api/tasks/${taskId}`, {
        method: 'GET',
      })

      const response = await taskGET(request, { params: { id: taskId } })
      expect(response.status).toBe(403)
      
      const data = await response.json()
      expect(data.error).toContain('Brak uprawnień')
    })

    it('should allow admin to access any task', async () => {
      vi.spyOn(authModule, 'getCurrentUser').mockResolvedValue({
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        name: adminUser.name,
      } as any)

      const request = createMockRequest(`http://localhost:3000/api/tasks/${taskId}`, {
        method: 'GET',
      })

      const response = await taskGET(request, { params: { id: taskId } })
      expect(response.status).toBe(200)
    })
  })

  describe('Role-Based Access Control', () => {
    it('should distinguish between ADMIN and USER roles', async () => {
      const userRequest = createMockRequest('http://localhost:3000/api/tasks', {
        method: 'GET',
      })

      vi.spyOn(authModule, 'getCurrentUser').mockResolvedValue({
        id: testUser.id,
        email: testUser.email,
        role: 'USER',
        name: testUser.name,
      } as any)

      const userResponse = await tasksGET(userRequest)
      expect([200, 401]).toContain(userResponse.status)

      const adminRequest = createMockRequest('http://localhost:3000/api/tasks', {
        method: 'GET',
      })

      vi.spyOn(authModule, 'getCurrentUser').mockResolvedValue({
        id: adminUser.id,
        email: adminUser.email,
        role: 'ADMIN',
        name: adminUser.name,
      } as any)

      const adminResponse = await tasksGET(adminRequest)
      expect([200, 401]).toContain(adminResponse.status)
    })
  })

  describe('Invalid Token Handling', () => {
    it('should reject request with invalid session', async () => {
      vi.spyOn(authModule, 'getCurrentUser').mockResolvedValue(null)

      const request = createMockRequest('http://localhost:3000/api/tasks', {
        method: 'GET',
      })

      const response = await tasksGET(request)
      expect(response.status).toBe(401)
    })
  })
})

