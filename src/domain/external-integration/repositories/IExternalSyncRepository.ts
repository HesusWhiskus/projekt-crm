import { SyncDirection, SyncStatus } from '@prisma/client'

/**
 * External sync record
 */
export interface ExternalSyncRecord {
  id: string
  entityType: string
  entityId: string
  externalId: string | null
  direction: SyncDirection
  status: SyncStatus
  syncedAt: Date | null
  error: string | null
  requestPayload: Record<string, any> | null
  responsePayload: Record<string, any> | null
  retryCount: number
  nextRetryAt: Date | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Filter criteria for finding external sync records
 */
export interface ExternalSyncFilter {
  entityType?: string
  entityId?: string
  externalId?: string
  direction?: SyncDirection
  status?: SyncStatus
  organizationId?: string
}

/**
 * Options for finding external sync records
 */
export interface FindExternalSyncOptions {
  orderBy?: {
    field: 'updatedAt' | 'createdAt' | 'syncedAt'
    direction: 'asc' | 'desc'
  }
  limit?: number
}

/**
 * ExternalSync Repository Interface
 * Defines the contract for external sync data access
 */
export interface IExternalSyncRepository {
  /**
   * Finds an external sync record by ID
   */
  findById(id: string): Promise<ExternalSyncRecord | null>

  /**
   * Finds external sync records by entity
   */
  findByEntity(entityType: string, entityId: string, direction?: SyncDirection): Promise<ExternalSyncRecord[]>

  /**
   * Finds external sync record by external ID
   */
  findByExternalId(externalId: string, entityType: string): Promise<ExternalSyncRecord | null>

  /**
   * Finds multiple external sync records based on filter criteria
   */
  findMany(filter: ExternalSyncFilter, options?: FindExternalSyncOptions): Promise<ExternalSyncRecord[]>

  /**
   * Creates a new external sync record
   */
  create(record: Omit<ExternalSyncRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<ExternalSyncRecord>

  /**
   * Updates an existing external sync record
   */
  update(id: string, updates: Partial<ExternalSyncRecord>): Promise<ExternalSyncRecord>

  /**
   * Marks sync as successful
   */
  markAsSuccess(id: string, externalId: string, responsePayload?: Record<string, any>): Promise<void>

  /**
   * Marks sync as failed
   */
  markAsFailed(id: string, error: string, responsePayload?: Record<string, any>): Promise<void>

  /**
   * Increments retry count and sets next retry time
   */
  incrementRetry(id: string, nextRetryAt: Date): Promise<void>

  /**
   * Finds sync records that need retry
   */
  findPendingRetries(maxRetries: number): Promise<ExternalSyncRecord[]>
}

