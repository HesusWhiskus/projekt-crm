import { IInsuranceAgentRepository } from '@/domain/insurance-agents/repositories/IInsuranceAgentRepository'
import { AgentVisibilityService } from '@/domain/insurance-agents/services/AgentVisibilityService'
import { UpdateVisibilitySettingsDTO } from '../dto'
import { UserContext } from '@/application/shared/types/UserContext'
import { db } from '@/lib/db'

/**
 * Use case for updating agent visibility settings
 */
export class UpdateAgentVisibilitySettingsUseCase {
  private visibilityService: AgentVisibilityService

  constructor(private readonly agentRepository: IInsuranceAgentRepository) {
    this.visibilityService = new AgentVisibilityService()
  }

  async execute(id: string, dto: UpdateVisibilitySettingsDTO, user: UserContext): Promise<void> {
    const agent = await this.agentRepository.findById(id)

    if (!agent) {
      throw new Error('Agent ubezpieczeniowy nie znaleziony')
    }

    // Update visibility settings using domain service
    this.visibilityService.updateVisibilitySettings(agent, dto.settings)

    // Save updated agent
    await this.agentRepository.update(agent)

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: 'AGENT_VISIBILITY_SETTINGS_UPDATED',
        entityType: 'InsuranceAgent',
        entityId: agent.getId(),
        details: {
          settings: dto.settings,
        },
      },
    })
  }
}

