import { Policy } from '@/domain/policies/entities/Policy'
import { IPolicyRepository } from '@/domain/policies/repositories/IPolicyRepository'
import { PolicyNumber } from '@/domain/policies/value-objects'
import { UpdatePolicyDTO, PolicyDTO } from '../dto'
import { UserContext } from '@/application/shared/types/UserContext'
import { db } from '@/lib/db'

/**
 * Use case for updating a policy
 */
export class UpdatePolicyUseCase {
  constructor(private readonly policyRepository: IPolicyRepository) {}

  async execute(id: string, dto: UpdatePolicyDTO, user: UserContext): Promise<PolicyDTO> {
    const policy = await this.policyRepository.findById(id)

    if (!policy) {
      throw new Error('Polisa nie znaleziona')
    }

    // Update fields
    const data = policy.toPersistence()

    if (dto.policyNumber !== undefined) {
      const policyNumber = PolicyNumber.create(dto.policyNumber)
      if (!policyNumber) {
        throw new Error('Nieprawidłowy numer polisy')
      }
      // Recreate entity with new policy number
      const updatedPolicy = Policy.fromPersistence({
        ...data,
        policyNumber: policyNumber.getValue(),
      })
      const saved = await this.policyRepository.update(updatedPolicy)
      return this.toDTO(saved)
    }

    // For other fields, recreate entity with updated values
    const updatedData = {
      ...data,
      ...(dto.issueDate !== undefined ? { issueDate: new Date(dto.issueDate) } : {}),
      ...(dto.validFrom !== undefined ? { validFrom: new Date(dto.validFrom) } : {}),
      ...(dto.validTo !== undefined ? { validTo: new Date(dto.validTo) } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.calculationId !== undefined ? { calculationId: dto.calculationId } : {}),
      ...(dto.clientId !== undefined ? { clientId: dto.clientId } : {}),
      ...(dto.vehicleId !== undefined ? { vehicleId: dto.vehicleId } : {}),
      ...(dto.insuranceCompanyId !== undefined ? { insuranceCompanyId: dto.insuranceCompanyId } : {}),
      ...(dto.agentId !== undefined ? { agentId: dto.agentId } : {}),
    }

    if (dto.status !== undefined) {
      policy.changeStatus(dto.status)
    }

    const updatedPolicy = Policy.fromPersistence(updatedData)
    const saved = await this.policyRepository.update(updatedPolicy)

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: 'POLICY_UPDATED',
        entityType: 'Policy',
        entityId: saved.getId(),
      },
    })

    return this.toDTO(saved)
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

