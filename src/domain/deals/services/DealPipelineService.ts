import { Deal } from '../entities/Deal'
import { DealStage } from '../value-objects/DealStage'
import { DealStage as PrismaDealStage } from '@prisma/client'

/**
 * Deal Pipeline Service
 * Domain service for handling deal stage transitions with business rules
 */
export class DealPipelineService {
  /**
   * Validates if stage transition is allowed
   * Business rules:
   * - Can move forward through pipeline: INITIAL_CONTACT -> PROPOSAL -> NEGOTIATION -> CLOSING -> WON/LOST
   * - Can move backward (e.g., from NEGOTIATION to PROPOSAL)
   * - Cannot move from WON/LOST to any other stage (deals are closed)
   * - Can move directly to LOST from any stage
   */
  isStageTransitionAllowed(
    from: PrismaDealStage,
    to: PrismaDealStage
  ): boolean {
    // Cannot change stage if deal is already closed
    if (from === 'WON' || from === 'LOST') {
      return false
    }

    // Can always move to LOST (deal can be lost at any stage)
    if (to === 'LOST') {
      return true
    }

    // Cannot move to WON from INITIAL_CONTACT or PROPOSAL (must go through NEGOTIATION/CLOSING)
    if (to === 'WON' && (from === 'INITIAL_CONTACT' || from === 'PROPOSAL')) {
      return false
    }

    // All other transitions are allowed (forward, backward, or skip stages)
    return true
  }

  /**
   * Changes deal stage with validation
   * @param deal The deal entity
   * @param newStage The new stage to set
   * @throws Error if transition is not allowed
   */
  changeStage(deal: Deal, newStage: DealStage): void {
    const currentStage = deal.getStage().getValue()
    const targetStage = newStage.getValue()

    if (!this.isStageTransitionAllowed(currentStage, targetStage)) {
      throw new Error(
        `Nie można zmienić etapu z ${this.getStageDisplayName(currentStage)} na ${this.getStageDisplayName(targetStage)}`
      )
    }

    deal.changeStage(newStage)
  }

  /**
   * Gets the next logical stage in the pipeline
   * Returns null if already at final stage or closed
   */
  getNextStage(currentStage: PrismaDealStage): PrismaDealStage | null {
    const stageFlow: PrismaDealStage[] = [
      'INITIAL_CONTACT',
      'PROPOSAL',
      'NEGOTIATION',
      'CLOSING',
      'WON',
    ]

    const currentIndex = stageFlow.indexOf(currentStage)
    if (currentIndex === -1 || currentIndex === stageFlow.length - 1) {
      return null // Already at final stage or invalid stage
    }

    return stageFlow[currentIndex + 1]
  }

  /**
   * Gets the previous logical stage in the pipeline
   * Returns null if already at first stage or closed
   */
  getPreviousStage(currentStage: PrismaDealStage): PrismaDealStage | null {
    const stageFlow: PrismaDealStage[] = [
      'INITIAL_CONTACT',
      'PROPOSAL',
      'NEGOTIATION',
      'CLOSING',
    ]

    const currentIndex = stageFlow.indexOf(currentStage)
    if (currentIndex <= 0) {
      return null // Already at first stage or invalid stage
    }

    return stageFlow[currentIndex - 1]
  }

  /**
   * Gets human-readable stage name in Polish
   */
  getStageDisplayName(stage: PrismaDealStage): string {
    const displayNames: Record<PrismaDealStage, string> = {
      INITIAL_CONTACT: 'Pierwszy kontakt',
      PROPOSAL: 'Oferta',
      NEGOTIATION: 'Negocjacje',
      CLOSING: 'Zamykanie',
      WON: 'Wygrany',
      LOST: 'Przegrany',
    }

    return displayNames[stage]
  }

  /**
   * Validates deal can be closed (moved to WON or LOST)
   */
  canCloseDeal(deal: Deal): boolean {
    const currentStage = deal.getStage().getValue()
    return currentStage !== 'WON' && currentStage !== 'LOST'
  }

  /**
   * Validates deal can be won (moved to WON)
   */
  canWinDeal(deal: Deal): boolean {
    const currentStage = deal.getStage().getValue()
    // Can win from NEGOTIATION or CLOSING stages
    return currentStage === 'NEGOTIATION' || currentStage === 'CLOSING'
  }
}

