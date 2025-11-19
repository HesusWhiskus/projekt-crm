import { InsuranceAgent } from '@/domain/insurance-agents/entities/InsuranceAgent'
import { IInsuranceAgentRepository } from '@/domain/insurance-agents/repositories/IInsuranceAgentRepository'
import { InsuranceAgentDTO } from '../dto'

/**
 * Use case for getting an insurance agent by ID
 */
export class GetInsuranceAgentUseCase {
  constructor(private readonly agentRepository: IInsuranceAgentRepository) {}

  async execute(id: string): Promise<InsuranceAgentDTO | null> {
    const agent = await this.agentRepository.findById(id, {
      include: {
        user: true,
        organization: true,
      },
    })

    if (!agent) {
      return null
    }

    return this.toDTO(agent)
  }

  private toDTO(agent: InsuranceAgent): InsuranceAgentDTO {
    const data = agent.toPersistence()
    return {
      id: data.id,
      userId: data.userId,
      licenseNumber: data.licenseNumber,
      settings: agent.getSettings(),
      isActive: data.isActive,
      organizationId: data.organizationId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    }
  }
}

