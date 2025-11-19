import { Policy } from '@/domain/policies/entities/Policy'
import { IPolicyRepository, PolicyFilter } from '@/domain/policies/repositories/IPolicyRepository'
import { PolicyDTO, PolicyFilterDTO } from '../dto'

/**
 * Use case for listing policies
 */
export class ListPoliciesUseCase {
  constructor(private readonly policyRepository: IPolicyRepository) {}

  async execute(filter: PolicyFilterDTO): Promise<PolicyDTO[]> {
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
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    }
  }
}

