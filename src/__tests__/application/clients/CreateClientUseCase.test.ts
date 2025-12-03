/**
 * SECURITY-FIX: [TESTS-6] Testy jednostkowe dla CreateClientUseCase
 * Data: 2025-01-27
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CreateClientUseCase } from '@/application/clients/use-cases'
import { CreateClientDTO } from '@/application/clients/dto'
import type { UserContext } from '@/lib/auth'

// Mock repository - użyjemy dynamicznego importu
const mockRepository = {
  create: vi.fn(),
  findById: vi.fn(),
}

vi.mock('@/infrastructure/persistence/prisma', () => ({
  PrismaClientRepository: vi.fn().mockImplementation(() => mockRepository),
}))

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

      const mockClient = {
        id: 'client-123',
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockRepository.create.mockResolvedValue(mockClient)

      const result = await useCase.execute(dto, mockUser)

      expect(result).toEqual(mockClient)
      expect(mockRepository.create).toHaveBeenCalled()
        expect.objectContaining({
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          type: dto.type,
          organizationId: mockUser.organizationId,
        })
      )
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

      const mockClient = {
        id: 'client-123',
        ...dto,
        email: null,
        phone: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockRepository.create.mockResolvedValue(mockClient)

      const result = await useCase.execute(dto, mockUser)

      expect(result).toEqual(mockClient)
      expect(mockRepository.create).toHaveBeenCalled()
    })
  })
})

