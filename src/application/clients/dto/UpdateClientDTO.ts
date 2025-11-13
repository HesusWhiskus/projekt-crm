import { ClientStatus, ClientPriority } from '@prisma/client'

/**
 * Data Transfer Object for updating a client
 */
export interface UpdateClientDTO {
  type?: "PERSON" | "COMPANY"
  firstName?: string
  lastName?: string
  pesel?: string | null
  companyName?: string | null
  taxId?: string | null
  regon?: string | null
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

