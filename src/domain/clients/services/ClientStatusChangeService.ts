import { Client } from '../entities/Client'
import { ClientStatus } from '@prisma/client'

/**
 * Client Status History Entry
 */
export interface ClientStatusHistoryEntry {
  clientId: string
  status: ClientStatus
  changedBy: string | null
  notes?: string
}

/**
 * Client Status Change Service
 * Domain service for handling client status changes with history tracking
 */
export class ClientStatusChangeService {
  /**
   * Changes client status and creates history entry
   * @param client The client entity
   * @param newStatus The new status to set
   * @param changedBy User ID who made the change
   * @param notes Optional notes about the change
   * @returns Status history entry to be persisted
   */
  changeStatus(
    client: Client,
    newStatus: ClientStatus,
    changedBy: string | null,
    notes?: string
  ): ClientStatusHistoryEntry {
    const oldStatus = client.getStatus()

    // Business rule: Only create history if status actually changed
    if (oldStatus === newStatus) {
      throw new Error('Status nie uległ zmianie')
    }

    // Business rule: Validate status transition if needed
    // For now, allow any transition, but this could be enhanced with state machine

    // Update client status
    client.changeStatus(newStatus, changedBy)

    // Create history entry
    const historyEntry: ClientStatusHistoryEntry = {
      clientId: client.getId(),
      status: newStatus,
      changedBy,
      notes: notes || `Zmiana statusu z ${oldStatus} na ${newStatus}`,
    }

    return historyEntry
  }

  /**
   * Validates if status transition is allowed
   * Can be enhanced with state machine rules
   */
  isStatusTransitionAllowed(from: ClientStatus, to: ClientStatus): boolean {
    // For now, allow all transitions
    // This can be enhanced with business rules
    // Example: LOST clients cannot transition back to ACTIVE_CLIENT
    if (from === 'LOST' && to === 'ACTIVE_CLIENT') {
      return false
    }

    return true
  }
}

