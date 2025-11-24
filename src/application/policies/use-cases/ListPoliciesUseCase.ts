import { Policy } from '@/domain/policies/entities/Policy'
import { IPolicyRepository, PolicyFilter } from '@/domain/policies/repositories/IPolicyRepository'
import { PolicyDTO, PolicyFilterDTO } from '../dto'
import { PaginatedResponse, PaginationMeta, calculatePagination } from '@/lib/types/pagination'
import { db } from '@/lib/db'

/**
 * Use case for listing policies
 */
export class ListPoliciesUseCase {
  constructor(private readonly policyRepository: IPolicyRepository) {}

  async execute(filter: PolicyFilterDTO): Promise<PolicyDTO[] | PaginatedResponse<PolicyDTO>> {
    const domainFilter: PolicyFilter = {
      status: filter.status,
      clientId: filter.clientId,
      vehicleId: filter.vehicleId,
      insuranceCompanyId: filter.insuranceCompanyId,
      agentId: filter.agentId,
      organizationId: filter.organizationId,
      policyNumber: filter.policyNumber,
      expiresSoon: filter.expiresSoon,
      expired: filter.expired,
      search: filter.search,
    }

    // Build where clause for count
    const where: any = {}
    if (domainFilter.status) where.status = domainFilter.status
    if (domainFilter.clientId) where.clientId = domainFilter.clientId
    if (domainFilter.vehicleId) where.vehicleId = domainFilter.vehicleId
    if (domainFilter.insuranceCompanyId) where.insuranceCompanyId = domainFilter.insuranceCompanyId
    if (domainFilter.agentId) where.agentId = domainFilter.agentId
    if (domainFilter.organizationId) where.organizationId = domainFilter.organizationId
    if (domainFilter.policyNumber) {
      where.policyNumber = { contains: domainFilter.policyNumber, mode: 'insensitive' }
    }
    if (domainFilter.expiresSoon !== undefined) {
      const now = new Date()
      const expiryDate = new Date()
      expiryDate.setDate(now.getDate() + domainFilter.expiresSoon)
      where.validTo = { gte: now, lte: expiryDate }
      where.status = 'ACTIVE'
    }
    if (domainFilter.expired) {
      const now = new Date()
      where.OR = [{ validTo: { lt: now } }, { status: 'EXPIRED' }]
    }
    if (domainFilter.search) {
      where.OR = [{ policyNumber: { contains: domainFilter.search, mode: 'insensitive' } }]
    }

    // Fetch policies and total count in parallel if pagination is used
    const usePagination = filter.pagination !== undefined

    if (usePagination && filter.pagination) {
      const [policies, total] = await Promise.all([
        this.policyRepository.findMany(domainFilter, {
          include: {
            client: true,
            vehicle: true,
            calculation: true,
            insuranceCompany: true,
            agent: true,
            documents: true,
          },
          pagination: filter.pagination,
        }),
        db.policy.count({ where }),
      ])

      const { page: validPage, limit: validLimit } = calculatePagination(
        filter.pagination.page,
        filter.pagination.limit,
        50
      )
      const totalPages = Math.ceil(total / validLimit)
      const pagination: PaginationMeta = {
        page: validPage,
        limit: validLimit,
        total,
        totalPages,
        hasMore: validPage * validLimit < total,
      }

      return {
        data: policies.map((policy) => this.toDTO(policy)),
        pagination,
      }
    }

    const policies = await this.policyRepository.findMany(domainFilter, {
      include: {
        client: true,
        vehicle: true,
        calculation: true,
        insuranceCompany: true,
        agent: true,
        documents: true,
      },
    })

    return policies.map((policy) => this.toDTO(policy))
  }

  private toDTO(policy: Policy): PolicyDTO {
    const data = policy.toPersistence()
    return {
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
      configurationType: data.configurationType,
      leasingCompany: data.leasingCompany,
      creditProvider: data.creditProvider,
      contractNumber: data.contractNumber,
      configurationMetadata: data.configurationMetadata,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    }
  }
}

