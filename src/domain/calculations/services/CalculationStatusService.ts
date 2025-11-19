import { Calculation } from '../entities/Calculation'
import { CalculationStatus } from '@prisma/client'

/**
 * Calculation Status History Entry
 */
export interface CalculationStatusHistoryEntry {
  calculationId: string
  field: string
  oldValue: string | null
  newValue: string | null
  changedBy: string | null
  reason?: string
}

/**
 * Calculation Status Service
 * Domain service for handling calculation status changes with history tracking
 */
export class CalculationStatusService {
  /**
   * Changes calculation status and creates history entry
   * @param calculation The calculation entity
   * @param newStatus The new status to set
   * @param changedBy User ID who made the change
   * @param reason Optional reason for the change
   * @returns Status history entry to be persisted
   */
  changeStatus(
    calculation: Calculation,
    newStatus: CalculationStatus,
    changedBy: string | null,
    reason?: string
  ): CalculationStatusHistoryEntry {
    const oldStatus = calculation.getStatus()

    // Business rule: Only create history if status actually changed
    if (oldStatus === newStatus) {
      throw new Error('Status nie uległ zmianie')
    }

    // Business rule: Validate status transition if needed
    if (!this.isStatusTransitionAllowed(oldStatus, newStatus)) {
      throw new Error(`Przejście ze statusu ${oldStatus} do ${newStatus} nie jest dozwolone`)
    }

    // Update calculation status
    calculation.changeStatus(newStatus)

    // Create history entry
    const historyEntry: CalculationStatusHistoryEntry = {
      calculationId: calculation.getId(),
      field: 'status',
      oldValue: oldStatus,
      newValue: newStatus,
      changedBy,
      reason: reason || `Zmiana statusu z ${oldStatus} na ${newStatus}`,
    }

    return historyEntry
  }

  /**
   * Validates if status transition is allowed
   */
  isStatusTransitionAllowed(from: CalculationStatus, to: CalculationStatus): boolean {
    // DRAFT can transition to any status
    if (from === 'DRAFT') {
      return true
    }

    // SENT can transition to ACCEPTED or REJECTED
    if (from === 'SENT') {
      return to === 'ACCEPTED' || to === 'REJECTED'
    }

    // ACCEPTED and REJECTED are terminal states (cannot change)
    if (from === 'ACCEPTED' || from === 'REJECTED') {
      return false
    }

    // Default: allow transition
    return true
  }

  /**
   * Checks if calculation can be edited
   */
  canEdit(calculation: Calculation): boolean {
    const status = calculation.getStatus()
    // Only DRAFT and SENT can be edited
    return status === 'DRAFT' || status === 'SENT'
  }

  /**
   * Checks if calculation can be sent to external system
   */
  canSendToExternal(calculation: Calculation): boolean {
    const status = calculation.getStatus()
    // Only DRAFT and SENT can be sent
    return status === 'DRAFT' || status === 'SENT'
  }
}

