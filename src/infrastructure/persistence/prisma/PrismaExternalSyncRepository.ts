import {
  IExternalSyncRepository,
  ExternalSyncRecord,
  ExternalSyncFilter,
  FindExternalSyncOptions,
} from '@/domain/external-integration/repositories/IExternalSyncRepository'
import { db } from '@/lib/db'
import { SyncDirection, SyncStatus, Prisma } from '@prisma/client'

/**
 * Prisma implementation of IExternalSyncRepository
 */
export class PrismaExternalSyncRepository implements IExternalSyncRepository {
  async findById(id: string): Promise<ExternalSyncRecord | null> {
    const syncData = await db.externalSync.findUnique({
      where: { id },
    })

    if (!syncData) {
      return null
    }

    return this.mapToRecord(syncData)
  }

  async findByEntity(
    entityType: string,
    entityId: string,
    direction?: SyncDirection
  ): Promise<ExternalSyncRecord[]> {
    const where: any = {
      entityType,
      entityId,
    }

    if (direction) {
      where.direction = direction
    }

    const syncDataList = await db.externalSync.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return syncDataList.map((data) => this.mapToRecord(data))
  }

  async findByExternalId(externalId: string, entityType: string): Promise<ExternalSyncRecord | null> {
    const syncData = await db.externalSync.findFirst({
      where: {
        externalId,
        entityType,
      },
    })

    if (!syncData) {
      return null
    }

    return this.mapToRecord(syncData)
  }

  async findMany(
    filter: ExternalSyncFilter,
    options?: FindExternalSyncOptions
  ): Promise<ExternalSyncRecord[]> {
    const where: any = {}

    if (filter.entityType) {
      where.entityType = filter.entityType
    }

    if (filter.entityId) {
      where.entityId = filter.entityId
    }

    if (filter.externalId) {
      where.externalId = filter.externalId
    }

    if (filter.direction) {
      where.direction = filter.direction
    }

    if (filter.status) {
      where.status = filter.status
    }

    const orderBy: any = {}
    if (options?.orderBy) {
      orderBy[options.orderBy.field] = options.orderBy.direction
    } else {
      orderBy.createdAt = 'desc'
    }

    const take = options?.limit

    const syncDataList = await db.externalSync.findMany({
      where,
      orderBy,
      take,
    })

    return syncDataList.map((data) => this.mapToRecord(data))
  }

  async create(record: Omit<ExternalSyncRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<ExternalSyncRecord> {
    const created = await db.externalSync.create({
      data: {
        entityType: record.entityType,
        entityId: record.entityId,
        externalId: record.externalId,
        direction: record.direction,
        status: record.status,
        syncedAt: record.syncedAt,
        error: record.error,
        requestPayload: record.requestPayload ?? Prisma.JsonNull,
        responsePayload: record.responsePayload ?? Prisma.JsonNull,
        retryCount: record.retryCount,
        nextRetryAt: record.nextRetryAt,
      },
    })

    return this.mapToRecord(created)
  }

  async update(id: string, updates: Partial<ExternalSyncRecord>): Promise<ExternalSyncRecord> {
    const updateData: any = {}

    if (updates.status !== undefined) updateData.status = updates.status
    if (updates.externalId !== undefined) updateData.externalId = updates.externalId
    if (updates.syncedAt !== undefined) updateData.syncedAt = updates.syncedAt
    if (updates.error !== undefined) updateData.error = updates.error
    if (updates.requestPayload !== undefined) updateData.requestPayload = updates.requestPayload ?? Prisma.JsonNull
    if (updates.responsePayload !== undefined) updateData.responsePayload = updates.responsePayload ?? Prisma.JsonNull
    if (updates.retryCount !== undefined) updateData.retryCount = updates.retryCount
    if (updates.nextRetryAt !== undefined) updateData.nextRetryAt = updates.nextRetryAt

    const updated = await db.externalSync.update({
      where: { id },
      data: updateData,
    })

    return this.mapToRecord(updated)
  }

  async markAsSuccess(
    id: string,
    externalId: string,
    responsePayload?: Record<string, any>
  ): Promise<void> {
    await db.externalSync.update({
      where: { id },
      data: {
        status: 'SUCCESS',
        externalId,
        syncedAt: new Date(),
        responsePayload: responsePayload ?? Prisma.JsonNull,
        error: null,
      },
    })
  }

  async markAsFailed(id: string, error: string, responsePayload?: Record<string, any>): Promise<void> {
    await db.externalSync.update({
      where: { id },
      data: {
        status: 'FAILED',
        error,
        responsePayload: responsePayload ?? Prisma.JsonNull,
      },
    })
  }

  async incrementRetry(id: string, nextRetryAt: Date): Promise<void> {
    const sync = await db.externalSync.findUnique({
      where: { id },
      select: { retryCount: true },
    })

    if (!sync) {
      throw new Error('Sync record not found')
    }

    await db.externalSync.update({
      where: { id },
      data: {
        retryCount: sync.retryCount + 1,
        nextRetryAt,
      },
    })
  }

  async findPendingRetries(maxRetries: number): Promise<ExternalSyncRecord[]> {
    const now = new Date()

    const syncDataList = await db.externalSync.findMany({
      where: {
        status: 'FAILED',
        retryCount: { lt: maxRetries },
        OR: [
          { nextRetryAt: { lte: now } },
          { nextRetryAt: null },
        ],
      },
      orderBy: { createdAt: 'asc' },
    })

    return syncDataList.map((data) => this.mapToRecord(data))
  }

  private mapToRecord(data: any): ExternalSyncRecord {
    return {
      id: data.id,
      entityType: data.entityType,
      entityId: data.entityId,
      externalId: data.externalId,
      direction: data.direction,
      status: data.status,
      syncedAt: data.syncedAt,
      error: data.error,
      requestPayload: data.requestPayload as Record<string, any> | null,
      responsePayload: data.responsePayload as Record<string, any> | null,
      retryCount: data.retryCount,
      nextRetryAt: data.nextRetryAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    }
  }
}

