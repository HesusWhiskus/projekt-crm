import { InsuranceAgent } from '@/domain/insurance-agents/entities/InsuranceAgent'
import {
  IInsuranceAgentRepository,
  InsuranceAgentFilter,
  FindInsuranceAgentsOptions,
} from '@/domain/insurance-agents/repositories/IInsuranceAgentRepository'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

/**
 * Prisma implementation of IInsuranceAgentRepository
 */
export class PrismaInsuranceAgentRepository implements IInsuranceAgentRepository {
  async findById(id: string, options?: FindInsuranceAgentsOptions): Promise<InsuranceAgent | null> {
    const include: any = {}
    if (options?.include?.user) {
      include.user = {
        select: {
          id: true,
          name: true,
          email: true,
        },
      }
    }
    if (options?.include?.organization) {
      include.organization = {
        select: {
          id: true,
          name: true,
        },
      }
    }

    const agentData = await db.insuranceAgent.findUnique({
      where: { id },
      include: Object.keys(include).length > 0 ? include : undefined,
    })

    if (!agentData) {
      return null
    }

    return InsuranceAgent.fromPersistence({
      id: agentData.id,
      userId: agentData.userId,
      licenseNumber: agentData.licenseNumber,
      settings: agentData.settings as Record<string, any> | null,
      isActive: agentData.isActive,
      organizationId: agentData.organizationId,
      createdAt: agentData.createdAt,
      updatedAt: agentData.updatedAt,
    })
  }

  async findByUserId(userId: string, options?: FindInsuranceAgentsOptions): Promise<InsuranceAgent | null> {
    const agentData = await db.insuranceAgent.findUnique({
      where: { userId },
    })

    if (!agentData) {
      return null
    }

    return InsuranceAgent.fromPersistence({
      id: agentData.id,
      userId: agentData.userId,
      licenseNumber: agentData.licenseNumber,
      settings: agentData.settings as Record<string, any> | null,
      isActive: agentData.isActive,
      organizationId: agentData.organizationId,
      createdAt: agentData.createdAt,
      updatedAt: agentData.updatedAt,
    })
  }

  async findMany(
    filter: InsuranceAgentFilter,
    options?: FindInsuranceAgentsOptions
  ): Promise<InsuranceAgent[]> {
    const where: any = {}

    if (filter.userId) {
      where.userId = filter.userId
    }

    if (filter.organizationId) {
      where.organizationId = filter.organizationId
    }

    if (filter.isActive !== undefined) {
      where.isActive = filter.isActive
    }

    if (filter.search) {
      where.OR = [
        { licenseNumber: { contains: filter.search, mode: 'insensitive' } },
        { user: { name: { contains: filter.search, mode: 'insensitive' } } },
        { user: { email: { contains: filter.search, mode: 'insensitive' } } },
      ]
    }

    const orderBy: any = {}
    if (options?.orderBy) {
      orderBy[options.orderBy.field] = options.orderBy.direction
    } else {
      orderBy.updatedAt = 'desc'
    }

    const agentDataList = await db.insuranceAgent.findMany({
      where,
      orderBy,
    })

    return agentDataList.map((data) =>
      InsuranceAgent.fromPersistence({
        id: data.id,
        userId: data.userId,
        licenseNumber: data.licenseNumber,
        settings: data.settings as Record<string, any> | null,
        isActive: data.isActive,
        organizationId: data.organizationId || null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      })
    )
  }

  async findByOrganizationId(
    organizationId: string,
    options?: FindInsuranceAgentsOptions
  ): Promise<InsuranceAgent[]> {
    return this.findMany({ organizationId }, options)
  }

  async save(agent: InsuranceAgent): Promise<InsuranceAgent> {
    if (await this.exists(agent.getId())) {
      return this.update(agent)
    } else {
      return this.create(agent)
    }
  }

  async create(agent: InsuranceAgent): Promise<InsuranceAgent> {
    const data = agent.toPersistence()

    const created = await db.insuranceAgent.create({
      data: {
        userId: data.userId,
        licenseNumber: data.licenseNumber,
        settings: data.settings ?? Prisma.JsonNull,
        isActive: data.isActive,
        organizationId: data.organizationId || null,
      },
    })

    return InsuranceAgent.fromPersistence({
      id: created.id,
      userId: created.userId,
      licenseNumber: created.licenseNumber,
      settings: created.settings as Record<string, any> | null,
      isActive: created.isActive,
      organizationId: created.organizationId,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    })
  }

  async update(agent: InsuranceAgent): Promise<InsuranceAgent> {
    const data = agent.toPersistence()

    const updated = await db.insuranceAgent.update({
      where: { id: agent.getId() },
      data: {
        licenseNumber: data.licenseNumber,
        settings: data.settings ?? Prisma.JsonNull,
        isActive: data.isActive,
        organizationId: data.organizationId || null,
      },
    })

    return InsuranceAgent.fromPersistence({
      id: updated.id,
      userId: updated.userId,
      licenseNumber: updated.licenseNumber,
      settings: updated.settings as Record<string, any> | null,
      isActive: updated.isActive,
      organizationId: updated.organizationId,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    })
  }

  async delete(id: string): Promise<void> {
    await db.insuranceAgent.delete({
      where: { id },
    })
  }

  async exists(id: string): Promise<boolean> {
    const count = await db.insuranceAgent.count({
      where: { id },
    })
    return count > 0
  }

  async existsForUser(userId: string): Promise<boolean> {
    const count = await db.insuranceAgent.count({
      where: { userId },
    })
    return count > 0
  }
}

