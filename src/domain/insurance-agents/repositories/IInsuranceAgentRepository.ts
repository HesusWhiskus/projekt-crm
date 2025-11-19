import { InsuranceAgent } from '../entities/InsuranceAgent'

/**
 * Filter criteria for finding insurance agents
 */
export interface InsuranceAgentFilter {
  userId?: string
  organizationId?: string
  isActive?: boolean
  search?: string
}

/**
 * Options for finding insurance agents
 */
export interface FindInsuranceAgentsOptions {
  include?: {
    user?: boolean
    organization?: boolean
  }
  orderBy?: {
    field: 'updatedAt' | 'createdAt'
    direction: 'asc' | 'desc'
  }
}

/**
 * InsuranceAgent Repository Interface
 * Defines the contract for insurance agent data access
 */
export interface IInsuranceAgentRepository {
  /**
   * Finds an insurance agent by ID
   */
  findById(id: string, options?: FindInsuranceAgentsOptions): Promise<InsuranceAgent | null>

  /**
   * Finds an insurance agent by user ID
   */
  findByUserId(userId: string, options?: FindInsuranceAgentsOptions): Promise<InsuranceAgent | null>

  /**
   * Finds multiple insurance agents based on filter criteria
   */
  findMany(filter: InsuranceAgentFilter, options?: FindInsuranceAgentsOptions): Promise<InsuranceAgent[]>

  /**
   * Finds insurance agents by organization ID
   */
  findByOrganizationId(organizationId: string, options?: FindInsuranceAgentsOptions): Promise<InsuranceAgent[]>

  /**
   * Saves an insurance agent (creates if new, updates if exists)
   */
  save(agent: InsuranceAgent): Promise<InsuranceAgent>

  /**
   * Creates a new insurance agent
   */
  create(agent: InsuranceAgent): Promise<InsuranceAgent>

  /**
   * Updates an existing insurance agent
   */
  update(agent: InsuranceAgent): Promise<InsuranceAgent>

  /**
   * Deletes an insurance agent by ID
   */
  delete(id: string): Promise<void>

  /**
   * Checks if an insurance agent exists
   */
  exists(id: string): Promise<boolean>

  /**
   * Checks if an insurance agent exists for a user ID
   */
  existsForUser(userId: string): Promise<boolean>
}

