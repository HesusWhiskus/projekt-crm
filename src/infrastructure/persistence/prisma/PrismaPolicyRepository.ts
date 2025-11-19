import { Policy } from '@/domain/policies/entities/Policy'
import {
  IPolicyRepository,
  PolicyFilter,
  FindPoliciesOptions,
} from '@/domain/policies/repositories/IPolicyRepository'
import { db } from '@/lib/db'

/**
 * Prisma implementation of IPolicyRepository
 */
export class PrismaPolicyRepository implements IPolicyRepository {
  async findById(id: string, options?: FindPoliciesOptions): Promise<Policy | null> {
    const include: any = {}
    if (options?.include?.client) {
      include.client = {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          companyName: true,
        },
      }
    }
    if (options?.include?.vehicle) {
      include.vehicle = {
        select: {
          id: true,
          vin: true,
          registrationNumber: true,
        },
      }
    }
    if (options?.include?.calculation) {
      include.calculation = {
        select: {
          id: true,
          status: true,
        },
      }
    }
    if (options?.include?.insuranceCompany) {
      include.insuranceCompany = {
        select: {
          id: true,
          name: true,
          logoUrl: true,
        },
      }
    }
    if (options?.include?.documents) {
      include.documents = true
    }

    const policyData = await db.policy.findUnique({
      where: { id },
      include: Object.keys(include).length > 0 ? include : undefined,
    })

    if (!policyData) {
      return null
    }

    return Policy.fromPersistence({
      id: policyData.id,
      policyNumber: policyData.policyNumber,
      issueDate: policyData.issueDate,
      validFrom: policyData.validFrom,
      validTo: policyData.validTo,
      status: policyData.status,
      calculationId: policyData.calculationId,
      clientId: policyData.clientId,
      vehicleId: policyData.vehicleId,
      insuranceCompanyId: policyData.insuranceCompanyId,
      agentId: policyData.agentId,
      organizationId: policyData.organizationId,
      externalId: policyData.externalId,
      syncedAt: policyData.syncedAt,
      createdAt: policyData.createdAt,
      updatedAt: policyData.updatedAt,
    })
  }

  async findByPolicyNumber(
    policyNumber: string,
    options?: FindPoliciesOptions
  ): Promise<Policy | null> {
    const policyData = await db.policy.findUnique({
      where: { policyNumber },
    })

    if (!policyData) {
      return null
    }

    return Policy.fromPersistence({
      id: policyData.id,
      policyNumber: policyData.policyNumber,
      issueDate: policyData.issueDate,
      validFrom: policyData.validFrom,
      validTo: policyData.validTo,
      status: policyData.status,
      calculationId: policyData.calculationId,
      clientId: policyData.clientId,
      vehicleId: policyData.vehicleId,
      insuranceCompanyId: policyData.insuranceCompanyId,
      agentId: policyData.agentId,
      organizationId: policyData.organizationId,
      externalId: policyData.externalId,
      syncedAt: policyData.syncedAt,
      createdAt: policyData.createdAt,
      updatedAt: policyData.updatedAt,
    })
  }

  async findMany(filter: PolicyFilter, options?: FindPoliciesOptions): Promise<Policy[]> {
    const where: any = {}

    if (filter.status) {
      where.status = filter.status
    }

    if (filter.clientId) {
      where.clientId = filter.clientId
    }

    if (filter.vehicleId) {
      where.vehicleId = filter.vehicleId
    }

    if (filter.insuranceCompanyId) {
      where.insuranceCompanyId = filter.insuranceCompanyId
    }

    if (filter.agentId) {
      where.agentId = filter.agentId
    }

    if (filter.organizationId) {
      where.organizationId = filter.organizationId
    }

    if (filter.policyNumber) {
      where.policyNumber = { contains: filter.policyNumber, mode: 'insensitive' }
    }

    if (filter.expiresSoon !== undefined) {
      const now = new Date()
      const expiryDate = new Date()
      expiryDate.setDate(now.getDate() + filter.expiresSoon)
      where.validTo = {
        gte: now,
        lte: expiryDate,
      }
      where.status = 'ACTIVE'
    }

    if (filter.expired) {
      const now = new Date()
      where.OR = [
        { validTo: { lt: now } },
        { status: 'EXPIRED' },
      ]
    }

    if (filter.search) {
      where.OR = [
        { policyNumber: { contains: filter.search, mode: 'insensitive' } },
      ]
    }

    const orderBy: any = {}
    if (options?.orderBy) {
      orderBy[options.orderBy.field] = options.orderBy.direction
    } else {
      orderBy.updatedAt = 'desc'
    }

    const policyDataList = await db.policy.findMany({
      where,
      orderBy,
    })

    return policyDataList.map((data) =>
      Policy.fromPersistence({
        id: data.id,
        policyNumber: data.policyNumber,
        issueDate: data.issueDate,
        validFrom: data.validFrom,
        validTo: data.validTo,
        status: data.status,
        calculationId: data.calculationId,
        clientId: data.clientId,
        vehicleId: data.vehicleId,
        insuranceCompanyId: data.insuranceCompanyId,
        agentId: data.agentId,
        organizationId: data.organizationId,
        externalId: data.externalId,
        syncedAt: data.syncedAt,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      })
    )
  }

  async findByClientId(clientId: string, options?: FindPoliciesOptions): Promise<Policy[]> {
    return this.findMany({ clientId }, options)
  }

  async findByVehicleId(vehicleId: string, options?: FindPoliciesOptions): Promise<Policy[]> {
    return this.findMany({ vehicleId }, options)
  }

  async findExpiringSoon(
    days: number,
    organizationId?: string,
    options?: FindPoliciesOptions
  ): Promise<Policy[]> {
    return this.findMany({ expiresSoon: days, organizationId }, options)
  }

  async findExpired(organizationId?: string, options?: FindPoliciesOptions): Promise<Policy[]> {
    return this.findMany({ expired: true, organizationId }, options)
  }

  async save(policy: Policy): Promise<Policy> {
    if (await this.exists(policy.getId())) {
      return this.update(policy)
    } else {
      return this.create(policy)
    }
  }

  async create(policy: Policy): Promise<Policy> {
    const data = policy.toPersistence()

    const created = await db.policy.create({
      data: {
        policyNumber: data.policyNumber,
        issueDate: data.issueDate,
        validFrom: data.validFrom,
        validTo: data.validTo,
        status: data.status,
        calculationId: data.calculationId,
        clientId: data.clientId,
        vehicleId: data.vehicleId,
        insuranceCompanyId: data.insuranceCompanyId,
        agentId: data.agentId,
        organizationId: data.organizationId,
        externalId: data.externalId,
        syncedAt: data.syncedAt,
      },
    })

    return Policy.fromPersistence({
      id: created.id,
      policyNumber: created.policyNumber,
      issueDate: created.issueDate,
      validFrom: created.validFrom,
      validTo: created.validTo,
      status: created.status,
      calculationId: created.calculationId,
      clientId: created.clientId,
      vehicleId: created.vehicleId,
      insuranceCompanyId: created.insuranceCompanyId,
      agentId: created.agentId,
      organizationId: created.organizationId,
      externalId: created.externalId,
      syncedAt: created.syncedAt,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    })
  }

  async update(policy: Policy): Promise<Policy> {
    const data = policy.toPersistence()

    const updated = await db.policy.update({
      where: { id: policy.getId() },
      data: {
        policyNumber: data.policyNumber,
        issueDate: data.issueDate,
        validFrom: data.validFrom,
        validTo: data.validTo,
        status: data.status,
        calculationId: data.calculationId,
        clientId: data.clientId,
        vehicleId: data.vehicleId,
        insuranceCompanyId: data.insuranceCompanyId,
        agentId: data.agentId,
        organizationId: data.organizationId,
        externalId: data.externalId,
        syncedAt: data.syncedAt,
      },
    })

    return Policy.fromPersistence({
      id: updated.id,
      policyNumber: updated.policyNumber,
      issueDate: updated.issueDate,
      validFrom: updated.validFrom,
      validTo: updated.validTo,
      status: updated.status,
      calculationId: updated.calculationId,
      clientId: updated.clientId,
      vehicleId: updated.vehicleId,
      insuranceCompanyId: updated.insuranceCompanyId,
      agentId: updated.agentId,
      organizationId: updated.organizationId,
      externalId: updated.externalId,
      syncedAt: updated.syncedAt,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    })
  }

  async delete(id: string): Promise<void> {
    await db.policy.delete({
      where: { id },
    })
  }

  async exists(id: string): Promise<boolean> {
    const count = await db.policy.count({
      where: { id },
    })
    return count > 0
  }
}

