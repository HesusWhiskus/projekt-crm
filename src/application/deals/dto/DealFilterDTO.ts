import { DealStage as PrismaDealStage } from '@prisma/client'

/**
 * Data Transfer Object for filtering deals
 */
export interface DealFilterDTO {
  clientId?: string
  stage?: PrismaDealStage
  search?: string
}

