import { InsuranceAgent } from '@/domain/insurance-agents/entities/InsuranceAgent'
import { IInsuranceAgentRepository } from '@/domain/insurance-agents/repositories/IInsuranceAgentRepository'
import { UpdateInsuranceAgentDTO, InsuranceAgentDTO } from '../dto'
import { UserContext } from '@/application/shared/types/UserContext'
import { db } from '@/lib/db'

/**
 * Use case for updating an insurance agent
 */
export class UpdateInsuranceAgentUseCase {
  constructor(private readonly agentRepository: IInsuranceAgentRepository) {}

  async execute(id: string, dto: UpdateInsuranceAgentDTO, user: UserContext): Promise<InsuranceAgentDTO> {
    const agent = await this.agentRepository.findById(id)

    if (!agent) {
      throw new Error('Agent ubezpieczeniowy nie znaleziony')
    }

    // Update fields
    if (dto.licenseNumber !== undefined) {
      agent.updateLicenseNumber(dto.licenseNumber)
    }

    if (dto.settings !== undefined) {
      agent.updateSettings(dto.settings)
    }

    if (dto.isActive !== undefined) {
      if (dto.isActive) {
        agent.activate()
      } else {
        agent.deactivate()
      }
    }

    // Save updated agent
    const saved = await this.agentRepository.update(agent)

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: 'INSURANCE_AGENT_UPDATED',
        entityType: 'InsuranceAgent',
        entityId: saved.getId(),
      },
    })

    return this.toDTO(saved)
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

