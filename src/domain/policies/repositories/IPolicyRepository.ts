import { Policy } from '../entities/Policy'
import { PolicyStatus } from '@prisma/client'
import { PaginationParams } from '@/lib/types/pagination'

/**
 * Filter criteria for finding policies
 */
export interface PolicyFilter {
  status?: PolicyStatus
  clientId?: string
  vehicleId?: string
  insuranceCompanyId?: string
  agentId?: string
  organizationId?: string
  policyNumber?: string
  expiresSoon?: number // Days until expiry
  expired?: boolean
  search?: string
}

/**
 * Options for finding policies
 */
export interface FindPoliciesOptions {
  include?: {
    client?: boolean
    vehicle?: boolean
    calculation?: boolean
    insuranceCompany?: boolean
    agent?: boolean
    documents?: boolean
  }
  orderBy?: {
    field: 'updatedAt' | 'createdAt' | 'validTo' | 'issueDate'
    direction: 'asc' | 'desc'
  }
  pagination?: PaginationParams
}

/**
 * Policy Repository Interface
 * Defines the contract for policy data access
 */
export interface IPolicyRepository {
  /**
   * Finds a policy by ID
   */
  findById(id: string, options?: FindPoliciesOptions): Promise<Policy | null>

  /**
   * Finds a policy by policy number
   */
  findByPolicyNumber(policyNumber: string, options?: FindPoliciesOptions): Promise<Policy | null>

  /**
   * Finds multiple policies based on filter criteria
   */
  findMany(filter: PolicyFilter, options?: FindPoliciesOptions): Promise<Policy[]>

  /**
   * Finds policies by client ID
   */
  findByClientId(clientId: string, options?: FindPoliciesOptions): Promise<Policy[]>

  /**
   * Finds policies by vehicle ID
   */
  findByVehicleId(vehicleId: string, options?: FindPoliciesOptions): Promise<Policy[]>

  /**
   * Finds policies expiring soon (within specified days)
   */
  findExpiringSoon(days: number, organizationId?: string, options?: FindPoliciesOptions): Promise<Policy[]>

  /**
   * Finds expired policies
   */
  findExpired(organizationId?: string, options?: FindPoliciesOptions): Promise<Policy[]>

  /**
   * Saves a policy (creates if new, updates if exists)
   */
  save(policy: Policy): Promise<Policy>

  /**
   * Creates a new policy
   */
  create(policy: Policy): Promise<Policy>

  /**
   * Updates an existing policy
   */
  update(policy: Policy): Promise<Policy>

  /**
   * Deletes a policy by ID
   */
  delete(id: string): Promise<void>

  /**
   * Checks if a policy exists
   */
  exists(id: string): Promise<boolean>
}

