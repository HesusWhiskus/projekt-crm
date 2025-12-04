/**
 * SECURITY-FIX: [TESTS-7] Testy jednostkowe dla PrismaClientRepository
 * Data: 2025-01-27
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PrismaClientRepository } from '@/infrastructure/persistence/prisma'
import { db } from '@/lib/db'
import { Client } from '@/domain/clients/entities/Client'
import { ClientName } from '@/domain/clients/value-objects/ClientName'
import { AgencyName } from '@/domain/clients/value-objects/AgencyName'

// Mock Prisma Client
vi.mock('@/lib/db', () => ({
  db: {
    client: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

describe('PrismaClientRepository', () => {
  let repository: PrismaClientRepository

  beforeEach(() => {
    repository = new PrismaClientRepository()
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should create a client', async () => {
      const mockClient = Client.create({
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
        assignedTo: null,
        nextFollowUpAt: null,
      })

      const mockPrismaClient = {
        id: 'client-123',
        firstName: 'Jan',
        lastName: 'Kowalski',
        companyName: null,
        email: null,
        phone: null,
        website: null,
        address: null,
        source: null,
        status: 'NEW' as const,
        priority: null,
        assignedTo: null,
        lastContactAt: null,
        nextFollowUpAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(db.client.create).mockResolvedValue(mockPrismaClient as any)

      const result = await repository.create(mockClient)

      expect(result).toBeInstanceOf(Client)
      expect(db.client.create).toHaveBeenCalled()
    })
  })

  describe('findById', () => {
    it('should find a client by id', async () => {
      const mockPrismaClient = {
        id: 'client-123',
        firstName: 'Jan',
        lastName: 'Kowalski',
        companyName: null,
        email: null,
        phone: null,
        website: null,
        address: null,
        source: null,
        status: 'NEW' as const,
        priority: null,
        assignedTo: null,
        lastContactAt: null,
        nextFollowUpAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(db.client.findUnique).mockResolvedValue(mockPrismaClient as any)

      const result = await repository.findById('client-123')

      expect(result).toBeInstanceOf(Client)
      expect(db.client.findUnique).toHaveBeenCalled()
    })

    it('should return null if client not found', async () => {
      vi.mocked(db.client.findUnique).mockResolvedValue(null)

      const result = await repository.findById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('findMany', () => {
    it('should find multiple clients', async () => {
      const mockPrismaClients = [
        {
          id: 'client-1',
          firstName: 'Jan',
          lastName: 'Kowalski',
          companyName: null,
          email: null,
          phone: null,
          website: null,
          address: null,
          source: null,
          status: 'NEW' as const,
          priority: null,
          assignedTo: null,
          lastContactAt: null,
          nextFollowUpAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'client-2',
          firstName: 'Anna',
          lastName: 'Nowak',
          companyName: null,
          email: null,
          phone: null,
          website: null,
          address: null,
          source: null,
          status: 'NEW' as const,
          priority: null,
          assignedTo: null,
          lastContactAt: null,
          nextFollowUpAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      vi.mocked(db.client.findMany).mockResolvedValue(mockPrismaClients as any)

      const result = await repository.findMany({ userId: 'user-1', userRole: 'ADMIN' })

      expect(result).toHaveLength(2)
      expect(result[0]).toBeInstanceOf(Client)
      expect(result[1]).toBeInstanceOf(Client)
      expect(db.client.findMany).toHaveBeenCalled()
    })
  })
})

