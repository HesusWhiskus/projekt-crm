import { Deal } from '@/domain/deals/entities/Deal'
import { IDealRepository } from '@/domain/deals/repositories/IDealRepository'
import { DealPipelineService } from '@/domain/deals/services/DealPipelineService'
import { DealDTO } from '../dto'
import { DealStage } from '@/domain/deals/value-objects'
import { DealStage as PrismaDealStage } from '@prisma/client'
import { UserContext } from '@/application/shared/types/UserContext'
import { db } from '@/lib/db'
import { ClientStatus } from '@prisma/client'

/**
 * Use case for closing a deal (WON or LOST)
 * Uses transaction to update deal and client status if WON
 */
export class CloseDealUseCase {
  constructor(
    private readonly dealRepository: IDealRepository,
    private readonly pipelineService: DealPipelineService
  ) {}

  async execute(
    dealId: string,
    won: boolean,
    user: UserContext
  ): Promise<DealDTO> {
    // Find existing deal
    const existingDeal = await this.dealRepository.findById(dealId)
    if (!existingDeal) {
      throw new Error('Deal nie znaleziony')
    }

    // Check if deal can be closed
    if (!this.pipelineService.canCloseDeal(existingDeal)) {
      throw new Error('Deal jest już zamknięty')
    }

    if (won && !this.pipelineService.canWinDeal(existingDeal)) {
      throw new Error('Deal nie może być wygrany z obecnego etapu')
    }

    // Use transaction to update deal and client status
    const result = await db.$transaction(async (tx) => {
      // Update deal stage
      const newStage = won ? PrismaDealStage.WON : PrismaDealStage.LOST
      const stage = DealStage.create(newStage)
      this.pipelineService.changeStage(existingDeal, stage)

      const updatedDeal = await this.dealRepository.update(existingDeal)

      // If deal is WON, update client status to ACTIVE_CLIENT
      if (won) {
        const client = await tx.client.findUnique({
          where: { id: updatedDeal.getClientId() },
        })

        if (client && client.status !== ClientStatus.ACTIVE_CLIENT) {
          await tx.client.update({
            where: { id: client.id },
            data: { status: ClientStatus.ACTIVE_CLIENT },
          })

          // Create status history entry
          await tx.clientStatusHistory.create({
            data: {
              clientId: client.id,
              status: ClientStatus.ACTIVE_CLIENT,
              changedBy: user.id,
              notes: `Deal wygrany (${updatedDeal.getId()})`,
            },
          })
        }
      }

      return updatedDeal
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: won ? 'DEAL_WON' : 'DEAL_LOST',
        entityType: 'Deal',
        entityId: result.getId(),
        details: {
          clientId: result.getClientId(),
          value: result.getValue().getAmount(),
          currency: result.getValue().getCurrency(),
        },
      },
    })

    return this.toDTO(result)
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

