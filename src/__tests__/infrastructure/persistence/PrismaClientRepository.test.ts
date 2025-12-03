/**
 * SECURITY-FIX: [TESTS-7] Testy jednostkowe dla PrismaClientRepository
 * Data: 2025-01-27
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PrismaClientRepository } from '@/infrastructure/persistence/prisma'

// Mock Prisma Client
const mockDb = {
  client: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}

vi.mock('@/lib/db', () => ({
  db: mockDb,
}))

describe('PrismaClientRepository', () => {
  let repository: PrismaClientRepository

  beforeEach(() => {
    repository = new PrismaClientRepository()
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should create a client', async () => {
      const clientData = {
        firstName: 'Jan',
        lastName: 'Kowalski',
        email: 'jan@example.com',
        type: 'PERSON' as const,
        organizationId: 'org-123',
      }

      const mockClient = {
        id: 'client-123',
        ...clientData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDb.client.create.mockResolvedValue(mockClient as any)

      const result = await repository.create(clientData as any)

      expect(result).toEqual(mockClient)
      expect(mockDb.client.create).toHaveBeenCalled()
    })
  })

  describe('findById', () => {
    it('should find a client by id', async () => {
      const mockClient = {
        id: 'client-123',
        firstName: 'Jan',
        lastName: 'Kowalski',
      }

      mockDb.client.findUnique.mockResolvedValue(mockClient as any)

      const result = await repository.findById('client-123')

      expect(result).toEqual(mockClient)
      expect(mockDb.client.findUnique).toHaveBeenCalled()
    })

    it('should return null if client not found', async () => {
      mockDb.client.findUnique.mockResolvedValue(null)

      const result = await repository.findById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('findMany', () => {
    it('should find multiple clients', async () => {
      const mockClients = [
        { id: 'client-1', firstName: 'Jan', lastName: 'Kowalski' },
        { id: 'client-2', firstName: 'Anna', lastName: 'Nowak' },
      ]

      mockDb.client.findMany.mockResolvedValue(mockClients as any)

      const result = await repository.findMany({})

      expect(result).toEqual(mockClients)
      expect(mockDb.client.findMany).toHaveBeenCalled()
    })
  })
})

