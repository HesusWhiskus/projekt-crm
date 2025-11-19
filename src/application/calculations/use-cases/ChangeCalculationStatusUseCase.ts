import { Calculation } from '@/domain/calculations/entities/Calculation'
import { ICalculationRepository } from '@/domain/calculations/repositories/ICalculationRepository'
import { CalculationStatusService } from '@/domain/calculations/services/CalculationStatusService'
// CalculationStatus is defined in schema.prisma enum, will be available after Prisma generate
type CalculationStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED'
import { UserContext } from '@/application/shared/types/UserContext'
import { db } from '@/lib/db'

/**
 * Use case for changing calculation status
 */
export class ChangeCalculationStatusUseCase {
  private statusService: CalculationStatusService

  constructor(private readonly calculationRepository: ICalculationRepository) {
    this.statusService = new CalculationStatusService()
  }

  async execute(
    id: string,
    newStatus: CalculationStatus,
    reason: string | undefined,
    user: UserContext
  ): Promise<void> {
    const calculation = await this.calculationRepository.findById(id)

    if (!calculation) {
      throw new Error('Kalkulacja nie znaleziona')
    }

    // Change status using domain service
    const historyEntry = this.statusService.changeStatus(calculation, newStatus, user.id, reason)

    // Save updated calculation
    await this.calculationRepository.update(calculation)

    // Create history entry
    await db.calculationHistory.create({
      data: {
        calculationId: historyEntry.calculationId,
        field: historyEntry.field,
        oldValue: historyEntry.oldValue,
        newValue: historyEntry.newValue,
        changedBy: historyEntry.changedBy,
        reason: historyEntry.reason,
      },
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: 'CALCULATION_STATUS_CHANGED',
        entityType: 'Calculation',
        entityId: calculation.getId(),
        details: {
          oldStatus: historyEntry.oldValue,
          newStatus: historyEntry.newValue,
        },
      },
    })
  }
}

