/**
 * SECURITY-FIX: [TESTS-6] Testy jednostkowe dla CreateClientUseCase
 * Data: 2025-01-27
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock db before importing CreateClientUseCase - must be inline in factory
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

// Mock repository - użyjemy dynamicznego importu
const mockRepository = {
  create: vi.fn(),
  findById: vi.fn(),
}

vi.mock('@/infrastructure/persistence/prisma', () => ({
  PrismaClientRepository: vi.fn().mockImplementation(() => mockRepository),
}))

import { CreateClientUseCase } from '@/application/clients/use-cases'
import { CreateClientDTO } from '@/application/clients/dto'
import type { UserContext } from '@/lib/auth'
import { Client } from '@/domain/clients/entities/Client'
import { ClientName } from '@/domain/clients/value-objects/ClientName'
import { AgencyName } from '@/domain/clients/value-objects/AgencyName'

describe('CreateClientUseCase', () => {
  let useCase: CreateClientUseCase
  let mockUser: UserContext

  beforeEach(() => {
    vi.clearAllMocks()
    
    useCase = new CreateClientUseCase(mockRepository as any)
    
    mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      role: 'USER',
      organizationId: 'org-123',
    }
  })

  describe('execute', () => {
    it('should create a client successfully', async () => {
      const dto: CreateClientDTO = {
        firstName: 'Jan',
        lastName: 'Kowalski',
        email: 'jan@example.com',
        type: 'PERSON',
      }

      const mockClient = Client.create({
        id: 'client-123',
        firstName: ClientName.fromValidated(dto.firstName),
        lastName: ClientName.fromValidated(dto.lastName),
        agencyName: AgencyName.fromValidated(null),
        email: dto.email ? null : null, // Email is handled separately
        phone: null,
        website: null,
        address: null,
        source: null,
        status: 'NEW' as const,
        priority: null,
        assignedTo: null,
        nextFollowUpAt: null,
      })

      mockRepository.create.mockResolvedValue(mockClient)

      const result = await useCase.execute(dto, mockUser)

      // UseCase returns ClientDTO, not Client entity
      expect(result).toBeDefined()
      expect(result.id).toBe(mockClient.getId())
      expect(mockRepository.create).toHaveBeenCalled()
    })

    it('should throw error if repository fails', async () => {
      const dto: CreateClientDTO = {
        firstName: 'Jan',
        lastName: 'Kowalski',
        type: 'PERSON',
      }

      const error = new Error('Database error')
      mockRepository.create.mockRejectedValue(error)

      await expect(useCase.execute(dto, mockUser)).rejects.toThrow('Database error')
    })

    it('should handle empty optional fields', async () => {
      const dto: CreateClientDTO = {
        firstName: 'Jan',
        lastName: 'Kowalski',
        type: 'PERSON',
        // No email, phone, etc.
      }

      const mockClient = Client.create({
        id: 'client-123',
        firstName: ClientName.fromValidated(dto.firstName),
        lastName: ClientName.fromValidated(dto.lastName),
        agencyName: AgencyName.fromValidated(null),
        email: null,
        phone: null,
        website: null,
        address: null,
        source: null,
        status: 'NEW' as const,
        priority: null,
        assignedTo: null,
        nextFollowUpAt: null,
      })

      mockRepository.create.mockResolvedValue(mockClient)

      const result = await useCase.execute(dto, mockUser)

      // UseCase returns ClientDTO, not Client entity
      expect(result).toBeDefined()
      expect(result.id).toBe(mockClient.getId())
      expect(mockRepository.create).toHaveBeenCalled()
    })
  })
})

