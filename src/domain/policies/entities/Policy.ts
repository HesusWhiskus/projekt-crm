import { PolicyStatus } from '@prisma/client'
import { PolicyNumber, PolicyStatus as PolicyStatusVO } from '../value-objects'

/**
 * Policy Entity
 * Domain entity representing an insurance policy
 */
export class Policy {
  private constructor(
    private readonly id: string,
    private policyNumber: PolicyNumber,
    private issueDate: Date,
    private validFrom: Date,
    private validTo: Date,
    private status: PolicyStatus,
    // Relations
    private calculationId: string | null,
    private clientId: string | null,
    private vehicleId: string | null,
    private insuranceCompanyId: string,
    private agentId: string | null,
    private organizationId: string | null,
    // External system data
    private externalId: string | null,
    private syncedAt: Date | null,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  /**
   * Creates a new Policy entity
   */
  static create(params: {
    id: string
    policyNumber: PolicyNumber
    issueDate: Date
    validFrom: Date
    validTo: Date
    status?: PolicyStatus
    calculationId?: string | null
    clientId?: string | null
    vehicleId?: string | null
    insuranceCompanyId: string
    agentId?: string | null
    organizationId?: string | null
    externalId?: string | null
    syncedAt?: Date | null
    createdAt?: Date
    updatedAt?: Date
  }): Policy {
    // Validate dates
    if (params.validFrom >= params.validTo) {
      throw new Error('Data rozpoczęcia ważności musi być wcześniejsza niż data zakończenia')
    }

    if (params.issueDate > params.validFrom) {
      throw new Error('Data wystawienia nie może być późniejsza niż data rozpoczęcia ważności')
    }

    return new Policy(
      params.id,
      params.policyNumber,
      params.issueDate,
      params.validFrom,
      params.validTo,
      params.status || 'ACTIVE',
      params.calculationId || null,
      params.clientId || null,
      params.vehicleId || null,
      params.insuranceCompanyId,
      params.agentId || null,
      params.organizationId || null,
      params.externalId || null,
      params.syncedAt || null,
      params.createdAt || new Date(),
      params.updatedAt || new Date()
    )
  }

  /**
   * Reconstructs Policy from persistence
   */
  static fromPersistence(data: {
    id: string
    policyNumber: string
    issueDate: Date
    validFrom: Date
    validTo: Date
    status: PolicyStatus
    calculationId: string | null
    clientId: string | null
    vehicleId: string | null
    insuranceCompanyId: string
    agentId: string | null
    organizationId: string | null
    externalId: string | null
    syncedAt: Date | null
    createdAt: Date
    updatedAt: Date
  }): Policy {
    return new Policy(
      data.id,
      PolicyNumber.fromValidated(data.policyNumber),
      data.issueDate,
      data.validFrom,
      data.validTo,
      data.status,
      data.calculationId,
      data.clientId,
      data.vehicleId,
      data.insuranceCompanyId,
      data.agentId,
      data.organizationId,
      data.externalId,
      data.syncedAt,
      data.createdAt,
      data.updatedAt
    )
  }

  // Getters
  getId(): string {
    return this.id
  }

  getPolicyNumber(): PolicyNumber {
    return this.policyNumber
  }

  getIssueDate(): Date {
    return this.issueDate
  }

  getValidFrom(): Date {
    return this.validFrom
  }

  getValidTo(): Date {
    return this.validTo
  }

  getStatus(): PolicyStatus {
    return this.status
  }

  getCalculationId(): string | null {
    return this.calculationId
  }

  getClientId(): string | null {
    return this.clientId
  }

  getVehicleId(): string | null {
    return this.vehicleId
  }

  getInsuranceCompanyId(): string {
    return this.insuranceCompanyId
  }

  getAgentId(): string | null {
    return this.agentId
  }

  getOrganizationId(): string | null {
    return this.organizationId
  }

  getExternalId(): string | null {
    return this.externalId
  }

  getSyncedAt(): Date | null {
    return this.syncedAt
  }

  getCreatedAt(): Date {
    return this.createdAt
  }

  getUpdatedAt(): Date {
    return this.updatedAt
  }

  // Business logic methods
  changeStatus(newStatus: PolicyStatus): void {
    this.status = newStatus
    this.updatedAt = new Date()
  }

  /**
   * Checks if policy is currently valid (active and within validity period)
   */
  isValid(): boolean {
    if (this.status !== 'ACTIVE') {
      return false
    }

    const now = new Date()
    return now >= this.validFrom && now <= this.validTo
  }

  /**
   * Checks if policy is expired
   */
  isExpired(): boolean {
    const now = new Date()
    return now > this.validTo || this.status === 'EXPIRED'
  }

  /**
   * Checks if policy expires soon (within specified days)
   */
  expiresSoon(days: number = 30): boolean {
    if (this.status !== 'ACTIVE') {
      return false
    }

    const now = new Date()
    const expiryDate = new Date(this.validTo)
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    return daysUntilExpiry <= days && daysUntilExpiry > 0
  }

  markAsSynced(externalId: string): void {
    this.externalId = externalId
    this.syncedAt = new Date()
    this.updatedAt = new Date()
  }

  /**
   * Converts entity to persistence format
   */
  toPersistence(): {
    id: string
    policyNumber: string
    issueDate: Date
    validFrom: Date
    validTo: Date
    status: PolicyStatus
    calculationId: string | null
    clientId: string | null
    vehicleId: string | null
    insuranceCompanyId: string
    agentId: string | null
    organizationId: string | null
    externalId: string | null
    syncedAt: Date | null
    createdAt: Date
    updatedAt: Date
  } {
    return {
      id: this.id,
      policyNumber: this.policyNumber.getValue(),
      issueDate: this.issueDate,
      validFrom: this.validFrom,
      validTo: this.validTo,
      status: this.status,
      calculationId: this.calculationId,
      clientId: this.clientId,
      vehicleId: this.vehicleId,
      insuranceCompanyId: this.insuranceCompanyId,
      agentId: this.agentId,
      organizationId: this.organizationId,
      externalId: this.externalId,
      syncedAt: this.syncedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}

