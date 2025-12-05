/**
 * SECURITY-FIX: [TESTS-8] Testy jednostkowe dla API endpointów clients
 * Data: 2025-01-27
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextResponse } from 'next/server'

// Mock dependencies przed importem route handlers
const mockGetCurrentUser = vi.fn()
const mockApplyRateLimit = vi.fn().mockResolvedValue(null)
const mockLogApiActivity = vi.fn().mockResolvedValue(undefined)
const mockValidatePayloadLimits = vi.fn().mockReturnValue(null)
const mockValidateJSONDepth = vi.fn().mockReturnValue({ valid: true })
const mockDbClient = {
  findMany: vi.fn(),
  create: vi.fn(),
  count: vi.fn(),
}

vi.mock('@/lib/auth', () => ({
  getCurrentUser: () => mockGetCurrentUser(),
}))

const mockRequireAuth = vi.fn()
vi.mock('@/presentation/api/middleware/auth', () => ({
  requireAuth: () => mockRequireAuth(),
}))

vi.mock('@/lib/db', () => ({
  db: {
    client: mockDbClient,
  },
}))

vi.mock('@/lib/api-security', () => ({
  applyRateLimit: () => mockApplyRateLimit(),
  logApiActivity: () => mockLogApiActivity(),
  validatePayloadLimits: () => mockValidatePayloadLimits(),
  validateJSONDepth: () => mockValidateJSONDepth(),
}))

// Mock PrismaClientRepository to avoid real database calls
const mockRepository = {
  findManyWithRelations: vi.fn(),
  create: vi.fn(),
}

vi.mock('@/infrastructure/persistence/prisma', () => ({
  PrismaClientRepository: vi.fn().mockImplementation(() => mockRepository),
}))

// Mock ListClientsUseCase to return paginated response
const mockListClientsUseCase = {
  execute: vi.fn(),
}

vi.mock('@/application/clients/use-cases', () => ({
  ListClientsUseCase: vi.fn().mockImplementation(() => mockListClientsUseCase),
  CreateClientUseCase: vi.fn(),
}))

// Import route handlers po mockach - użyjemy dynamicznego importu w testach

describe('API /api/clients', () => {
  let GET: any, POST: any

  beforeEach(async () => {
    vi.clearAllMocks()
    // Dynamiczny import po mockach
    const routeModule = await import('@/presentation/api/clients/route')
    GET = routeModule.GET
    POST = routeModule.POST
  })

  describe('GET', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockRequireAuth.mockResolvedValue({
        response: NextResponse.json(
          { error: 'Nieautoryzowany' },
          { status: 401 }
        ),
      })

      const request = new Request('http://localhost:3000/api/clients')
      const response = await GET(request)

      expect(response.status).toBe(401)
      const json = await response.json()
      expect(json.error).toContain('Nieautoryzowany')
    })

    it('should return clients list for authenticated user', async () => {
      mockRequireAuth.mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          role: 'USER',
          organizationId: 'org-123',
        },
      })

      // Mock use case to return paginated response
      mockListClientsUseCase.execute.mockResolvedValue({
        data: [
          { id: 'client-1', firstName: 'Jan', lastName: 'Kowalski' },
        ],
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          totalPages: 1,
          hasMore: false,
        },
      })

      const request = new Request('http://localhost:3000/api/clients')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const json = await response.json()
      // Nowy format paginowanej odpowiedzi
      expect(json.data).toBeDefined()
      expect(json.pagination).toBeDefined()
      expect(json.pagination.page).toBe(1)
      expect(json.pagination.limit).toBe(50)
    })
  })

  describe('POST', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockRequireAuth.mockResolvedValue({
        response: NextResponse.json(
          { error: 'Nieautoryzowany' },
          { status: 401 }
        ),
      })

      const request = new Request('http://localhost:3000/api/clients', {
        method: 'POST',
        body: JSON.stringify({
          firstName: 'Jan',
          lastName: 'Kowalski',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should return 400 if validation fails', async () => {
      mockRequireAuth.mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          role: 'USER',
          organizationId: 'org-123',
        },
      })

      const request = new Request('http://localhost:3000/api/clients', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required fields
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })
})

