import { IExternalSyncRepository } from '@/domain/external-integration/repositories/IExternalSyncRepository'
import { db } from '@/lib/db'

export interface SyncStatusDTO {
  id: string
  entityType: string
  entityId: string
  externalId: string | null
  direction: 'IN' | 'OUT'
  status: 'PENDING' | 'SUCCESS' | 'FAILED'
  syncedAt: Date | null
  error: string | null
  retryCount: number
  nextRetryAt: Date | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Use case for getting sync status
 */
export class GetSyncStatusUseCase {
  constructor(private readonly syncRepository: IExternalSyncRepository) {}

  async execute(entityType: string, entityId: string, direction?: 'IN' | 'OUT'): Promise<SyncStatusDTO[]> {
    const syncs = await db.externalSync.findMany({
      where: {
        entityType,
        entityId,
        ...(direction ? { direction } : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return syncs.map((sync) => ({
      id: sync.id,
      entityType: sync.entityType,
      entityId: sync.entityId,
      externalId: sync.externalId,
      direction: sync.direction,
      status: sync.status,
      syncedAt: sync.syncedAt,
      error: sync.error,
      retryCount: sync.retryCount,
      nextRetryAt: sync.nextRetryAt,
      createdAt: sync.createdAt,
      updatedAt: sync.updatedAt,
    }))
  }
}

