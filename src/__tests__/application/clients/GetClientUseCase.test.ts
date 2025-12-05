/**
 * SECURITY-FIX: [TESTS-15] Testy jednostkowe dla GetClientUseCase
 * Data: 2025-12-05
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock db before importing GetClientUseCase
vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
    group: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    client: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  },
}))

// Mock repository
const mockRepository = {
  findById: vi.fn(),
  findByIdWithRelations: vi.fn(),
}

vi.mock('@/infrastructure/persistence/prisma', () => {
  class MockPrismaClientRepository {
    findById = vi.fn()
    findByIdWithRelations = vi.fn()
  }
  return {
    PrismaClientRepository: MockPrismaClientRepository,
  }
})

import { GetClientUseCase } from '@/application/clients/use-cases'
import type { UserContext } from '@/application/shared/types/UserContext'
import { Client } from '@/domain/clients/entities/Client'
import { ClientName } from '@/domain/clients/value-objects/ClientName'
import { AgencyName } from '@/domain/clients/value-objects/AgencyName'

describe('GetClientUseCase', () => {
  let useCase: GetClientUseCase
  let mockUser: UserContext
  let mockAdminUser: UserContext

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Import PrismaClientRepository after mock is set up
    const { PrismaClientRepository } = await import('@/infrastructure/persistence/prisma')
    const repositoryInstance = new PrismaClientRepository()
    // Assign mock functions
    repositoryInstance.findById = mockRepository.findById
    repositoryInstance.findByIdWithRelations = mockRepository.findByIdWithRelations
    useCase = new GetClientUseCase(repositoryInstance as any)
    
    mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      role: 'USER',
      organizationId: 'org-123',
    }

    mockAdminUser = {
      id: 'admin-123',
      email: 'admin@example.com',
      role: 'ADMIN',
      organizationId: 'org-123',
    }
  })

  describe('execute', () => {
    it('should return client successfully', async () => {
      const existingClient = Client.create({
        id: 'client-123',
        firstName: ClientName.fromValidated('Jan'),
        lastName: ClientName.fromValidated('Kowalski'),
        agencyName: AgencyName.fromValidated(null),
        email: null,
        phone: null,
        website: null,
        address: null,
        source: null,
        status: 'NEW' as const,
        priority: null,
        assignedTo: 'user-123',
        nextFollowUpAt: null,
      })

      // Mock repository to return client with relations (first path - PrismaClientRepository)
      mockRepository.findByIdWithRelations.mockResolvedValue({
        client: existingClient,
        relations: {
          assignee: null,
          sharedGroups: [],
        },
      })

      const result = await useCase.execute('client-123', mockUser)

      expect(result).toBeDefined()
      expect(result.id).toBe('client-123')
      expect(mockRepository.findByIdWithRelations).toHaveBeenCalled()
    })

    it('should throw error if client not found', async () => {
      mockRepository.findByIdWithRelations.mockResolvedValue({
        client: null,
        relations: null,
      })

      await expect(
        useCase.execute('non-existent', mockUser)
      ).rejects.toThrow('Klient nie znaleziony')
    })

    it('should throw error if user lacks permissions', async () => {
      const existingClient = Client.create({
        id: 'client-123',
        firstName: ClientName.fromValidated('Jan'),
        lastName: ClientName.fromValidated('Kowalski'),
        agencyName: AgencyName.fromValidated(null),
        email: null,
        phone: null,
        website: null,
        address: null,
        source: null,
        status: 'NEW' as const,
        priority: null,
        assignedTo: 'other-user-id', // Different user
        nextFollowUpAt: null,
      })

      // Mock repository to return client with relations (PrismaClientRepository path)
      mockRepository.findByIdWithRelations.mockResolvedValue({
        client: existingClient,
        relations: {
          assignee: null,
          sharedGroups: [], // No group access
        },
      })

      await expect(
        useCase.execute('client-123', mockUser)
      ).rejects.toThrow('Brak uprawnień')
    })

    it('should allow ADMIN to get any client', async () => {
      const existingClient = Client.create({
        id: 'client-123',
        firstName: ClientName.fromValidated('Jan'),
        lastName: ClientName.fromValidated('Kowalski'),
        agencyName: AgencyName.fromValidated(null),
        email: null,
        phone: null,
        website: null,
        address: null,
        source: null,
        status: 'NEW' as const,
        priority: null,
        assignedTo: 'other-user-id', // Different user, but ADMIN can access
        nextFollowUpAt: null,
      })

      // Mock repository to return client with relations
      mockRepository.findByIdWithRelations.mockResolvedValue({
        client: existingClient,
        relations: {
          assignee: null,
          sharedGroups: [],
        },
      })

      const result = await useCase.execute('client-123', mockAdminUser)

      expect(result).toBeDefined()
      expect(result.id).toBe('client-123')
    })
  })
})

