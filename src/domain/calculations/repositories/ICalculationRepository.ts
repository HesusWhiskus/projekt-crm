import { Calculation } from '../entities/Calculation'
import { CalculationStatus } from '@prisma/client'
import { PaginationParams } from '@/lib/types/pagination'

/**
 * Filter criteria for finding calculations
 */
export interface CalculationFilter {
  status?: CalculationStatus
  clientId?: string
  vehicleId?: string
  agentId?: string
  organizationId?: string
  search?: string
  validUntil?: {
    from?: Date
    to?: Date
  }
}

/**
 * Options for finding calculations
 */
export interface FindCalculationsOptions {
  include?: {
    client?: boolean
    vehicle?: boolean
    agent?: boolean
    organization?: boolean
  }
  orderBy?: {
    field: 'updatedAt' | 'createdAt' | 'validUntil' | 'value'
    direction: 'asc' | 'desc'
  }
  pagination?: PaginationParams
}

/**
 * Calculation Repository Interface
 * Defines the contract for calculation data access
 */
export interface ICalculationRepository {
  /**
   * Finds a calculation by ID
   */
  findById(id: string, options?: FindCalculationsOptions): Promise<Calculation | null>

  /**
   * Finds multiple calculations based on filter criteria
   */
  findMany(filter: CalculationFilter, options?: FindCalculationsOptions): Promise<Calculation[]>

  /**
   * Finds calculations by client ID
   */
  findByClientId(clientId: string, options?: FindCalculationsOptions): Promise<Calculation[]>

  /**
   * Finds calculations by vehicle ID
   */
  findByVehicleId(vehicleId: string, options?: FindCalculationsOptions): Promise<Calculation[]>

  /**
   * Finds calculations by agent ID
   */
  findByAgentId(agentId: string, options?: FindCalculationsOptions): Promise<Calculation[]>

  /**
   * Saves a calculation (creates if new, updates if exists)
   */
  save(calculation: Calculation): Promise<Calculation>

  /**
   * Creates a new calculation
   */
  create(calculation: Calculation): Promise<Calculation>

  /**
   * Updates an existing calculation
   */
  update(calculation: Calculation): Promise<Calculation>

  /**
   * Deletes a calculation by ID
   */
  delete(id: string): Promise<void>

  /**
   * Checks if a calculation exists
   */
  exists(id: string): Promise<boolean>
}

