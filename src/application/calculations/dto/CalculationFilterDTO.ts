import { PaginationParams } from '@/lib/types/pagination'

export interface CalculationFilterDTO {
  status?: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED'
  clientId?: string
  vehicleId?: string
  agentId?: string
  organizationId?: string
  search?: string
  validUntil?: {
    from?: string // ISO date string
    to?: string // ISO date string
  }
  pagination?: PaginationParams
}

