import { ClientStatus, ClientPriority } from '@prisma/client'

/**
 * Data Transfer Object for creating a client
 */
export interface CreateClientDTO {
  firstName: string
  lastName: string
  agencyName?: string | null
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

