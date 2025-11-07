import { Deal } from '@/domain/deals/entities/Deal'
import {
  IDealRepository,
  DealFilter,
  FindDealsOptions,
} from '@/domain/deals/repositories/IDealRepository'
import { db } from '@/lib/db'
import { DealStage as PrismaDealStage } from '@prisma/client'

/**
 * Prisma implementation of IDealRepository
 */
export class PrismaDealRepository implements IDealRepository {
  async findById(id: string, options?: FindDealsOptions): Promise<Deal | null> {
    const dealData = await db.deal.findUnique({
      where: { id },
      include: {
        client: options?.include?.client || false,
        sharedGroups: options?.include?.sharedGroups || false,
      },
    })

    if (!dealData) {
      return null
    }

    return Deal.fromPersistence({
      id: dealData.id,
      clientId: dealData.clientId,
      value: Number(dealData.value),
      currency: dealData.currency,
      probability: dealData.probability,
      stage: dealData.stage,
      expectedCloseDate: dealData.expectedCloseDate,
      notes: dealData.notes,
      createdAt: dealData.createdAt,
      updatedAt: dealData.updatedAt,
    })
  }

  async findMany(filter: DealFilter, options?: FindDealsOptions): Promise<Deal[]> {
    const where: any = {}

    // Access control - deals are accessible through client assignment or shared groups
    if (filter.userRole !== 'ADMIN') {
      where.OR = [
        // Deal is accessible if client is assigned to user
        {
          client: {
            assignedTo: filter.userId,
          },
        },
        // Deal is accessible if shared with user's groups
        {
          sharedGroups: {
            some: {
              users: {
                some: {
                  userId: filter.userId,
                },
              },
            },
          },
        },
      ]
    }

    // Client filter
    if (filter.clientId) {
      where.clientId = filter.clientId
    }

    // Stage filter
    if (filter.stage) {
      where.stage = filter.stage
    }

    // Search filter (search in notes or client name)
    if (filter.search) {
      where.OR = [
        ...(where.OR || []),
        { notes: { contains: filter.search, mode: 'insensitive' } },
        {
          client: {
            OR: [
              { agencyName: { contains: filter.search, mode: 'insensitive' } },
              { firstName: { contains: filter.search, mode: 'insensitive' } },
              { lastName: { contains: filter.search, mode: 'insensitive' } },
            ],
          },
        },
      ]
    }

    // Order by
    const orderBy: any = {}
    if (options?.orderBy) {
      const fieldMap: Record<string, string> = {
        updatedAt: 'updatedAt',
        createdAt: 'createdAt',
        expectedCloseDate: 'expectedCloseDate',
        value: 'value',
      }
      orderBy[fieldMap[options.orderBy.field] || 'updatedAt'] = options.orderBy.direction
    } else {
      orderBy.updatedAt = 'desc'
    }

    const dealsData = await db.deal.findMany({
      where,
      orderBy,
      include: {
        client: options?.include?.client || false,
        sharedGroups: options?.include?.sharedGroups || false,
      },
    })

    return dealsData.map((data) =>
      Deal.fromPersistence({
        id: data.id,
        clientId: data.clientId,
        value: Number(data.value),
        currency: data.currency,
        probability: data.probability,
        stage: data.stage,
        expectedCloseDate: data.expectedCloseDate,
        notes: data.notes,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      })
    )
  }

  async save(deal: Deal): Promise<Deal> {
    const exists = await this.exists(deal.getId())
    if (exists) {
      return this.update(deal)
    } else {
      return this.create(deal)
    }
  }

  async create(deal: Deal): Promise<Deal> {
    const data = deal.toPersistence()

    const created = await db.deal.create({
      data: {
        id: data.id,
        clientId: data.clientId,
        value: data.value,
        currency: data.currency,
        probability: data.probability,
        stage: data.stage,
        expectedCloseDate: data.expectedCloseDate,
        notes: data.notes,
      },
    })

    return Deal.fromPersistence({
      id: created.id,
      clientId: created.clientId,
      value: Number(created.value),
      currency: created.currency,
      probability: created.probability,
      stage: created.stage,
      expectedCloseDate: created.expectedCloseDate,
      notes: created.notes,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    })
  }

  async update(deal: Deal): Promise<Deal> {
    const data = deal.toPersistence()

    const updated = await db.deal.update({
      where: { id: deal.getId() },
      data: {
        value: data.value,
        currency: data.currency,
        probability: data.probability,
        stage: data.stage,
        expectedCloseDate: data.expectedCloseDate,
        notes: data.notes,
        updatedAt: data.updatedAt,
      },
    })

    return Deal.fromPersistence({
      id: updated.id,
      clientId: updated.clientId,
      value: Number(updated.value),
      currency: updated.currency,
      probability: updated.probability,
      stage: updated.stage,
      expectedCloseDate: updated.expectedCloseDate,
      notes: updated.notes,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    })
  }

  async delete(id: string): Promise<void> {
    await db.deal.delete({
      where: { id },
    })
  }

  async exists(id: string): Promise<boolean> {
    const count = await db.deal.count({
      where: { id },
    })
    return count > 0
  }

  async findByClientId(clientId: string): Promise<Deal[]> {
    const dealsData = await db.deal.findMany({
      where: { clientId },
      orderBy: { updatedAt: 'desc' },
    })

    return dealsData.map((data) =>
      Deal.fromPersistence({
        id: data.id,
        clientId: data.clientId,
        value: Number(data.value),
        currency: data.currency,
        probability: data.probability,
        stage: data.stage,
        expectedCloseDate: data.expectedCloseDate,
        notes: data.notes,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      })
    )
  }
}

