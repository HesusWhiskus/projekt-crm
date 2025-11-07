import { ClientStatus } from '@prisma/client'

/**
 * Data Transfer Object for client filtering
 */
export interface ClientFilterDTO {
  status?: ClientStatus
  search?: string
  assignedTo?: string
  noContactDays?: string // Number as string from query params
  followUpToday?: string // "true" or "false" as string from query params
}

