import { Client } from '../entities/Client'
import { ClientStatus, ClientPriority } from '@prisma/client'

/**
 * Filter criteria for finding clients
 */
export interface ClientFilter {
  status?: ClientStatus
  assignedTo?: string
  search?: string
  noContactDays?: number
  followUpToday?: boolean
  userId?: string // For access control
  userRole?: 'ADMIN' | 'USER'
}

/**
 * Options for finding clients
 */
export interface FindClientsOptions {
  include?: {
    assignee?: boolean
    sharedGroups?: boolean
    contacts?: boolean
    tasks?: boolean
    statusHistory?: boolean
  }
  orderBy?: {
    field: 'updatedAt' | 'createdAt' | 'lastContactAt' | 'nextFollowUpAt'
    direction: 'asc' | 'desc'
  }
}

/**
 * Client Repository Interface
 * Defines the contract for client data access
 */
export interface IClientRepository {
  /**
   * Finds a client by ID
   */
  findById(id: string, options?: FindClientsOptions): Promise<Client | null>

  /**
   * Finds multiple clients based on filter criteria
   */
  findMany(filter: ClientFilter, options?: FindClientsOptions): Promise<Client[]>

  /**
   * Saves a client (creates if new, updates if exists)
   */
  save(client: Client): Promise<Client>

  /**
   * Creates a new client
   */
  create(client: Client): Promise<Client>

  /**
   * Updates an existing client
   */
  update(client: Client): Promise<Client>

  /**
   * Deletes a client by ID
   */
  delete(id: string): Promise<void>

  /**
   * Checks if a client exists
   */
  exists(id: string): Promise<boolean>

  /**
   * Updates last contact date for a client
   */
  updateLastContact(clientId: string, contactDate: Date): Promise<void>
}

