import { Policy } from '@/domain/policies/entities/Policy'
import { IPolicyRepository } from '@/domain/policies/repositories/IPolicyRepository'
import { PolicyDTO } from '../dto'

/**
 * Use case for getting a policy by ID
 */
export class GetPolicyUseCase {
  constructor(private readonly policyRepository: IPolicyRepository) {}

  async execute(id: string): Promise<PolicyDTO | null> {
    const policy = await this.policyRepository.findById(id, {
      include: {
        client: true,
        vehicle: true,
        calculation: true,
        insuranceCompany: true,
        agent: true,
        documents: true,
      },
    })

    if (!policy) {
      return null
    }

    return this.toDTO(policy)
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

