import { ClientStatus, ClientPriority } from '@prisma/client'

/**
 * Data Transfer Object for client response
 */
export interface ClientDTO {
  id: string
  firstName: string
  lastName: string
  agencyName: string | null
  email: string | null
  phone: string | null
  website: string | null
  address: string | null
  source: string | null
  status: ClientStatus
  priority: ClientPriority | null
  assignedTo: string | null
  lastContactAt: Date | null
  nextFollowUpAt: Date | null
  createdAt: Date
  updatedAt: Date
  assignee?: {
    id: string
    name: string | null
    email: string
  } | null
  sharedGroups?: Array<{
    id: string
    name: string
  }>
}

