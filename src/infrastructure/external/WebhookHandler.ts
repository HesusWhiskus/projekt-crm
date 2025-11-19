import { ExternalSystemMapper } from './ExternalSystemMapper'
import { db } from '@/lib/db'
import { SyncDirection } from '@prisma/client'

/**
 * Webhook payload from external system
 */
export interface WebhookPayload {
  event: string
  entityType: 'client' | 'vehicle' | 'calculation' | 'policy'
  entityId: string
  externalId: string
  data: Record<string, any>
  timestamp?: string
}

/**
 * Webhook Handler
 * Handles incoming webhooks from external system
 */
export class WebhookHandler {
  private mapper: ExternalSystemMapper

  constructor() {
    this.mapper = new ExternalSystemMapper()
  }

  /**
   * Processes incoming webhook
   */
  async processWebhook(payload: WebhookPayload): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate payload
      this.validateWebhookPayload(payload)

      // Create sync record
      await db.externalSync.create({
        data: {
          entityType: payload.entityType,
          entityId: payload.entityId,
          externalId: payload.externalId,
          direction: 'IN',
          status: 'PENDING',
          requestPayload: payload.data,
        },
      })

      // Process based on entity type
      switch (payload.entityType) {
        case 'client':
          await this.processClientWebhook(payload)
          break
        case 'vehicle':
          await this.processVehicleWebhook(payload)
          break
        case 'calculation':
          await this.processCalculationWebhook(payload)
          break
        case 'policy':
          await this.processPolicyWebhook(payload)
          break
        default:
          throw new Error(`Nieobsługiwany typ encji: ${payload.entityType}`)
      }

      // Mark sync as successful
      await db.externalSync.updateMany({
        where: {
          entityType: payload.entityType,
          entityId: payload.entityId,
          direction: 'IN',
          status: 'PENDING',
        },
        data: {
          status: 'SUCCESS',
          syncedAt: new Date(),
          responsePayload: payload.data,
        },
      })

      return { success: true }
    } catch (error: any) {
      // Mark sync as failed
      await db.externalSync.updateMany({
        where: {
          entityType: payload.entityType,
          entityId: payload.entityId,
          direction: 'IN',
          status: 'PENDING',
        },
        data: {
          status: 'FAILED',
          error: error.message,
        },
      })

      return { success: false, error: error.message }
    }
  }

  /**
   * Validates webhook payload
   */
  private validateWebhookPayload(payload: WebhookPayload): void {
    if (!payload.event) {
      throw new Error('Brak pola event w webhook')
    }

    if (!payload.entityType) {
      throw new Error('Brak pola entityType w webhook')
    }

    if (!payload.entityId && !payload.externalId) {
      throw new Error('Brak pola entityId lub externalId w webhook')
    }

    if (!payload.data) {
      throw new Error('Brak pola data w webhook')
    }

    const allowedEntityTypes = ['client', 'vehicle', 'calculation', 'policy']
    if (!allowedEntityTypes.includes(payload.entityType)) {
      throw new Error(`Nieprawidłowy typ encji: ${payload.entityType}`)
    }
  }

  /**
   * Processes client webhook
   */
  private async processClientWebhook(payload: WebhookPayload): Promise<void> {
    // Find client by externalId or create/update
    // Implementation depends on external system format
    // This is a placeholder - actual implementation would map and save client data
  }

  /**
   * Processes vehicle webhook
   */
  private async processVehicleWebhook(payload: WebhookPayload): Promise<void> {
    // Find vehicle by externalId or create/update
    // Implementation depends on external system format
  }

  /**
   * Processes calculation webhook
   */
  private async processCalculationWebhook(payload: WebhookPayload): Promise<void> {
    // Find calculation by externalId or create/update
    // Implementation depends on external system format
  }

  /**
   * Processes policy webhook
   */
  private async processPolicyWebhook(payload: WebhookPayload): Promise<void> {
    // Find policy by externalId or create/update
    // Implementation depends on external system format
  }
}

