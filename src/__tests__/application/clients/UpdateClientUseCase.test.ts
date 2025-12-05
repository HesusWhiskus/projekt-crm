/**
 * SECURITY-FIX: [TESTS-13] Testy jednostkowe dla UpdateClientUseCase
 * Data: 2025-12-05
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock db before importing UpdateClientUseCase
vi.mock('@/lib/db', () => ({
  db: {
    clientStatusHistory: {
      create: vi.fn().mockResolvedValue({}),
    },
    activityLog: {
      create: vi.fn().mockResolvedValue({}),
    },
    client: {
      update: vi.fn().mockResolvedValue({}),
    },
  },
}))

// Mock repository
const mockRepository = {
  findById: vi.fn(),
  update: vi.fn(),
}

vi.mock('@/infrastructure/persistence/prisma', () => ({
  PrismaClientRepository: vi.fn().mockImplementation(() => mockRepository),
}))

import { UpdateClientUseCase } from '@/application/clients/use-cases'
import { UpdateClientDTO } from '@/application/clients/dto'
import type { UserContext } from '@/application/shared/types/UserContext'
import { Client } from '@/domain/clients/entities/Client'
import { ClientName } from '@/domain/clients/value-objects/ClientName'
import { AgencyName } from '@/domain/clients/value-objects/AgencyName'
import { Email } from '@/domain/clients/value-objects/Email'

describe('UpdateClientUseCase', () => {
  let useCase: UpdateClientUseCase
  let mockUser: UserContext
  let mockAdminUser: UserContext

  beforeEach(async () => {
    vi.clearAllMocks()
    
    const { ClientStatusChangeService } = await import('@/domain/clients/services')
    const statusChangeService = new ClientStatusChangeService()
    useCase = new UpdateClientUseCase(mockRepository as any, statusChangeService)
    
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
    it('should update client successfully', async () => {
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
      mockRepository.update.mockResolvedValue(existingClient)

      const dto: UpdateClientDTO = {
        firstName: 'Janusz',
        lastName: 'Nowak',
      }

      const result = await useCase.execute('client-123', dto, mockUser)

      expect(result).toBeDefined()
      expect(mockRepository.findById).toHaveBeenCalledWith('client-123')
      expect(mockRepository.update).toHaveBeenCalled()
    })

    it('should throw error if client not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      const dto: UpdateClientDTO = {
        firstName: 'Janusz',
      }

      await expect(
        useCase.execute('non-existent', dto, mockUser)
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

      mockRepository.findById.mockResolvedValue(existingClient)

      const dto: UpdateClientDTO = {
        firstName: 'Janusz',
      }

      await expect(
        useCase.execute('client-123', dto, mockUser)
      ).rejects.toThrow('Brak uprawnień')
    })

    it('should allow ADMIN to update any client', async () => {
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
        assignedTo: 'other-user-id', // Different user, but ADMIN can update
        nextFollowUpAt: null,
      })

      mockRepository.findById.mockResolvedValue(existingClient)
      mockRepository.update.mockResolvedValue(existingClient)

      const dto: UpdateClientDTO = {
        firstName: 'Janusz',
      }

      const result = await useCase.execute('client-123', dto, mockAdminUser)

      expect(result).toBeDefined()
      expect(mockRepository.update).toHaveBeenCalled()
    })
  })
})

