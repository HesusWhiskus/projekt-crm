import { SyncDirection, SyncDirectionEnum } from '../value-objects'
import { SyncStatus } from '@prisma/client'

/**
 * External sync data
 */
export interface ExternalSyncData {
  entityType: 'client' | 'vehicle' | 'calculation' | 'policy'
  entityId: string
  externalId?: string | null
  direction: SyncDirectionEnum
  data: Record<string, any>
}

/**
 * External Sync Service
 * Domain service for handling external system synchronization
 */
export class ExternalSyncService {
  /**
   * Validates sync data before sending to external system
   * @param syncData Sync data to validate
   * @returns true if valid, throws error if invalid
   */
  validateSyncData(syncData: ExternalSyncData): boolean {
    if (!syncData.entityType) {
      throw new Error('Typ encji jest wymagany')
    }

    if (!syncData.entityId) {
      throw new Error('ID encji jest wymagany')
    }

    if (!syncData.direction) {
      throw new Error('Kierunek synchronizacji jest wymagany')
    }

    const allowedEntityTypes = ['client', 'vehicle', 'calculation', 'policy']
    if (!allowedEntityTypes.includes(syncData.entityType)) {
      throw new Error(`Nieprawidłowy typ encji. Dozwolone wartości: ${allowedEntityTypes.join(', ')}`)
    }

    return true
  }

  /**
   * Determines if sync should be retried based on error and retry count
   * @param error Error message
   * @param retryCount Current retry count
   * @param maxRetries Maximum number of retries
   * @returns true if should retry
   */
  shouldRetry(error: string | null, retryCount: number, maxRetries: number = 3): boolean {
    if (!error) {
      return false
    }

    if (retryCount >= maxRetries) {
      return false
    }

    // Don't retry on certain errors (e.g., validation errors)
    const nonRetryableErrors = ['VALIDATION_ERROR', 'NOT_FOUND', 'UNAUTHORIZED']
    if (nonRetryableErrors.some(e => error.includes(e))) {
      return false
    }

    return true
  }

  /**
   * Calculates next retry time with exponential backoff
   * @param retryCount Current retry count
   * @param baseDelayMs Base delay in milliseconds (default: 1000ms)
   * @returns Date for next retry
   */
  calculateNextRetryTime(retryCount: number, baseDelayMs: number = 1000): Date {
    const delayMs = baseDelayMs * Math.pow(2, retryCount)
    const maxDelayMs = 60000 // Max 60 seconds
    const actualDelay = Math.min(delayMs, maxDelayMs)

    return new Date(Date.now() + actualDelay)
  }

  /**
   * Maps sync status based on result
   * @param success Whether sync was successful
   * @param error Error message if failed
   * @returns SyncStatus
   */
  mapSyncStatus(success: boolean, error?: string | null): SyncStatus {
    if (success) {
      return 'SUCCESS'
    }
    return 'FAILED'
  }

  /**
   * Validates entity type for sync
   * @param entityType Entity type to validate
   * @returns true if valid, throws error if invalid
   */
  validateEntityType(entityType: string): boolean {
    const allowedTypes = ['client', 'vehicle', 'calculation', 'policy']
    if (!allowedTypes.includes(entityType.toLowerCase())) {
      throw new Error(`Nieprawidłowy typ encji: ${entityType}. Dozwolone wartości: ${allowedTypes.join(', ')}`)
    }
    return true
  }
}

