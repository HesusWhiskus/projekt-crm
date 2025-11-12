import { ClientStatus, ClientPriority, ClientType } from '@prisma/client'

/**
 * Data Transfer Object for updating a client
 */
export interface UpdateClientDTO {
  type?: ClientType
  firstName?: string
  lastName?: string
  companyName?: string | null
  taxId?: string | null
  agencyName?: string | null // Deprecated - use companyName instead
  email?: string | null
  phone?: string | null
  website?: string | null
  address?: string | null
  source?: string | null
  status?: ClientStatus
  priority?: ClientPriority | null
  nextFollowUpAt?: string | null // ISO date string
  assignedTo?: string | null
  sharedGroupIds?: string[]
}

