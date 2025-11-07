import { DealStage as PrismaDealStage } from '@prisma/client'

/**
 * Data Transfer Object for creating a deal
 */
export interface CreateDealDTO {
  clientId: string
  value: number | string
  currency?: string
  probability?: number | string
  stage?: PrismaDealStage
  expectedCloseDate?: string | null // ISO date string
  notes?: string | null
  sharedGroupIds?: string[]
}

