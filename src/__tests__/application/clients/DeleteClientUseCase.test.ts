/**
 * SECURITY-FIX: [TESTS-14] Testy jednostkowe dla DeleteClientUseCase
 * Data: 2025-12-05
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock db
vi.mock('@/lib/db', () => ({
  db: {
    activityLog: {
      create: vi.fn().mockResolvedValue({}),
    },
  },
}))

// Mock repository
const mockRepository = {
  findById: vi.fn(),
  delete: vi.fn(),
}

vi.mock('@/infrastructure/persistence/prisma', () => ({
  PrismaClientRepository: vi.fn().mockImplementation(() => mockRepository),
}))

import { DeleteClientUseCase } from '@/application/clients/use-cases'
import type { UserContext } from '@/application/shared/types/UserContext'
import { Client } from '@/domain/clients/entities/Client'
import { ClientName } from '@/domain/clients/value-objects/ClientName'
import { AgencyName } from '@/domain/clients/value-objects/AgencyName'

describe('DeleteClientUseCase', () => {
  let useCase: DeleteClientUseCase
  let mockUser: UserContext
  let mockAdminUser: UserContext

  beforeEach(() => {
    vi.clearAllMocks()
    
    useCase = new DeleteClientUseCase(mockRepository as any)
    
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
    it('should delete client successfully (ADMIN only)', async () => {
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

      mockRepository.findById.mockResolvedValue(existingClient)
      mockRepository.delete.mockResolvedValue(undefined)

      await useCase.execute('client-123', mockAdminUser)

      expect(mockRepository.findById).toHaveBeenCalledWith('client-123')
      expect(mockRepository.delete).toHaveBeenCalledWith('client-123')
    })

    it('should throw error if client not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      // DeleteClientUseCase checks permissions first, so use ADMIN
      await expect(
        useCase.execute('non-existent', mockAdminUser)
      ).rejects.toThrow('Klient nie znaleziony')
    })

    it('should throw error if user is not ADMIN', async () => {
      // DeleteClientUseCase requires ADMIN role, not just assignedTo check
      await expect(
        useCase.execute('client-123', mockUser)
      ).rejects.toThrow('Brak uprawnień')
    })
  })
})

