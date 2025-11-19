import { Calculation } from '@/domain/calculations/entities/Calculation'
import { ICalculationRepository } from '@/domain/calculations/repositories/ICalculationRepository'
import { ExternalSystemClient } from '@/infrastructure/external/ExternalSystemClient'
import { ExternalSystemMapper } from '@/infrastructure/external/ExternalSystemMapper'
import { IExternalSyncRepository } from '@/domain/external-integration/repositories/IExternalSyncRepository'
import { ExternalSyncService } from '@/domain/external-integration/services/ExternalSyncService'
import { SyncDirection, SyncStatus } from '@prisma/client'
import { SyncDirectionEnum } from '@/domain/external-integration/value-objects'
import { UserContext } from '@/application/shared/types/UserContext'

/**
 * Use case for sending calculation to external system
 */
export class SendCalculationToExternalUseCase {
  private mapper: ExternalSystemMapper
  private syncService: ExternalSyncService

  constructor(
    private readonly calculationRepository: ICalculationRepository,
    private readonly externalClient: ExternalSystemClient,
    private readonly syncRepository: IExternalSyncRepository
  ) {
    this.mapper = new ExternalSystemMapper()
    this.syncService = new ExternalSyncService()
  }

  async execute(id: string, user: UserContext): Promise<{ success: boolean; externalId?: string; error?: string }> {
    const calculation = await this.calculationRepository.findById(id)

    if (!calculation) {
      throw new Error('Kalkulacja nie znaleziona')
    }

    // Map calculation to external format
    const externalData = this.mapper.mapCalculationToExternal(calculation)

    // Validate sync data
    this.syncService.validateSyncData({
      entityType: 'calculation',
      entityId: calculation.getId(),
      direction: SyncDirectionEnum.OUT,
      data: externalData,
    })

    // Create sync record
    const syncRecord = await this.syncRepository.create({
      entityType: 'calculation',
      entityId: calculation.getId(),
      externalId: null,
      direction: SyncDirection.OUT,
      status: SyncStatus.PENDING,
      syncedAt: null,
      error: null,
      requestPayload: externalData,
      responsePayload: null,
      retryCount: 0,
      nextRetryAt: null,
    })

    try {
      // Send to external system
      const response = await this.externalClient.syncCalculation(externalData)

      if (response.success && response.data) {
        // Mark as synced
        const externalId = (response.data as any).id || syncRecord.id
        await this.syncRepository.markAsSuccess(syncRecord.id, externalId, response.data)
        calculation.markAsSynced(externalId)
        await this.calculationRepository.update(calculation)

        return { success: true, externalId }
      } else {
        // Mark as failed
        await this.syncRepository.markAsFailed(syncRecord.id, response.error || 'Unknown error', response.data)
        return { success: false, error: response.error }
      }
    } catch (error: any) {
      // Mark as failed
      await this.syncRepository.markAsFailed(syncRecord.id, error.message)
      return { success: false, error: error.message }
    }
  }
}

