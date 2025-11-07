import { Deal } from '../entities/Deal'
import { DealStage as PrismaDealStage } from '@prisma/client'

/**
 * Filter criteria for finding deals
 */
export interface DealFilter {
  clientId?: string
  stage?: PrismaDealStage
  search?: string
  userId?: string // For access control
  userRole?: 'ADMIN' | 'USER'
}

/**
 * Options for finding deals
 */
export interface FindDealsOptions {
  include?: {
    client?: boolean
    sharedGroups?: boolean
  }
  orderBy?: {
    field: 'updatedAt' | 'createdAt' | 'expectedCloseDate' | 'value'
    direction: 'asc' | 'desc'
  }
}

/**
 * Deal Repository Interface
 * Defines the contract for deal data access
 */
export interface IDealRepository {
  /**
   * Finds a deal by ID
   */
  findById(id: string, options?: FindDealsOptions): Promise<Deal | null>

  /**
   * Finds multiple deals based on filter criteria
   */
  findMany(filter: DealFilter, options?: FindDealsOptions): Promise<Deal[]>

  /**
   * Saves a deal (creates if new, updates if exists)
   */
  save(deal: Deal): Promise<Deal>

  /**
   * Creates a new deal
   */
  create(deal: Deal): Promise<Deal>

  /**
   * Updates an existing deal
   */
  update(deal: Deal): Promise<Deal>

  /**
   * Deletes a deal by ID
   */
  delete(id: string): Promise<void>

  /**
   * Checks if a deal exists
   */
  exists(id: string): Promise<boolean>

  /**
   * Finds deals by client ID
   */
  findByClientId(clientId: string): Promise<Deal[]>
}

