import { DealStage as PrismaDealStage } from '@prisma/client'

/**
 * Data Transfer Object for deal response
 */
export interface DealDTO {
  id: string
  clientId: string
  value: number
  currency: string
  probability: number
  stage: PrismaDealStage
  expectedCloseDate: Date | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

