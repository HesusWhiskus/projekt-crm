import { Deal } from '@/domain/deals/entities/Deal'
import { IDealRepository } from '@/domain/deals/repositories/IDealRepository'
import { DealPipelineService } from '@/domain/deals/services/DealPipelineService'
import { UpdateDealDTO, DealDTO } from '../dto'
import { DealValue, Probability, DealStage } from '@/domain/deals/value-objects'
import { UserContext } from '@/application/shared/types/UserContext'
import { db } from '@/lib/db'

/**
 * Use case for updating a deal
 */
export class UpdateDealUseCase {
  constructor(
    private readonly dealRepository: IDealRepository,
    private readonly pipelineService: DealPipelineService
  ) {}

  async execute(dealId: string, dto: UpdateDealDTO, user: UserContext): Promise<DealDTO> {
    // Find existing deal
    const existingDeal = await this.dealRepository.findById(dealId)
    if (!existingDeal) {
      throw new Error('Deal nie znaleziony')
    }

    // Check authorization - user must have access to deal's client
    const client = await db.client.findUnique({
      where: { id: existingDeal.getClientId() },
    })

    if (!client) {
      throw new Error('Klient nie znaleziony')
    }

    if (user.role !== 'ADMIN' && client.assignedTo !== user.id) {
      // Check if client is shared with user's groups
      const hasGroupAccess = await db.client.findFirst({
        where: {
          id: existingDeal.getClientId(),
          sharedGroups: {
            some: {
              users: {
                some: {
                  userId: user.id,
                },
              },
            },
          },
        },
      })

      if (!hasGroupAccess) {
        throw new Error('Brak uprawnień do tego deala')
      }
    }

    // Update value objects if provided
    if (dto.value !== undefined) {
      const dealValue = DealValue.create(
        dto.value,
        dto.currency || existingDeal.getValue().getCurrency()
      )
      existingDeal.updateValue(dealValue)
    }

    if (dto.probability !== undefined) {
      const probability = Probability.create(dto.probability)
      existingDeal.updateProbability(probability)
    }

    if (dto.stage !== undefined) {
      const newStage = DealStage.create(dto.stage)
      // Use pipeline service to validate stage transition
      this.pipelineService.changeStage(existingDeal, newStage)
    }

    if (dto.expectedCloseDate !== undefined) {
      existingDeal.setExpectedCloseDate(
        dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : null
      )
    }

    if (dto.notes !== undefined) {
      existingDeal.updateNotes(dto.notes)
    }

    // Update deal
    const updatedDeal = await this.dealRepository.update(existingDeal)

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: 'DEAL_UPDATED',
        entityType: 'Deal',
        entityId: updatedDeal.getId(),
        details: {
          updatedFields: Object.keys(dto),
        },
      },
    })

    // Handle shared groups if provided
    if (dto.sharedGroupIds !== undefined) {
      await db.deal.update({
        where: { id: updatedDeal.getId() },
        data: {
          sharedGroups: {
            set: dto.sharedGroupIds.map((id) => ({ id })),
          },
        },
      })
    }

    return this.toDTO(updatedDeal)
  }

  private toDTO(deal: Deal): DealDTO {
    return {
      id: deal.getId(),
      clientId: deal.getClientId(),
      value: deal.getValue().getAmount(),
      currency: deal.getValue().getCurrency(),
      probability: deal.getProbability().getValue(),
      stage: deal.getStage().getValue(),
      expectedCloseDate: deal.getExpectedCloseDate(),
      notes: deal.getNotes(),
      createdAt: deal.getCreatedAt(),
      updatedAt: deal.getUpdatedAt(),
    }
  }
}

