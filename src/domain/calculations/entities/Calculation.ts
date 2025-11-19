import { CalculationStatus, InsuranceVariant, InsuranceScope } from '@prisma/client'
import { PESEL, PostalCode, InsuranceVariant as InsuranceVariantVO, InsuranceScope as InsuranceScopeVO } from '../value-objects'

/**
 * Calculation Entity
 * Domain entity representing an insurance calculation/opportunity
 */
export class Calculation {
  private constructor(
    private readonly id: string,
    // Personal data
    private pesel: PESEL | null,
    private firstName: string | null,
    private lastName: string | null,
    private previousLastName: string | null,
    private phone: string | null,
    private email: string | null,
    // Address
    private postalCode: PostalCode | null,
    private city: string | null,
    private street: string | null,
    private houseNumber: string | null,
    private apartmentNumber: string | null,
    // Correspondence address
    private correspondenceAddress: Record<string, any> | null,
    // Additional data
    private hasDrivingLicense: boolean | null,
    private drivingLicenseDate: Date | null,
    private occupation: string | null,
    private maritalStatus: string | null,
    private hasChildUnder26: boolean | null,
    // Relations
    private clientId: string | null,
    private vehicleId: string | null,
    private agentId: string | null,
    private organizationId: string | null,
    // Business fields
    private status: CalculationStatus,
    private value: number | null,
    private validUntil: Date | null,
    // Insurance form data
    private variant: InsuranceVariantVO | null,
    private scopes: InsuranceScopeVO[],
    // External system data
    private externalId: string | null,
    private syncedAt: Date | null,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  /**
   * Creates a new Calculation entity
   */
  static create(params: {
    id: string
    pesel?: PESEL | null
    firstName?: string | null
    lastName?: string | null
    previousLastName?: string | null
    phone?: string | null
    email?: string | null
    postalCode?: PostalCode | null
    city?: string | null
    street?: string | null
    houseNumber?: string | null
    apartmentNumber?: string | null
    correspondenceAddress?: Record<string, any> | null
    hasDrivingLicense?: boolean | null
    drivingLicenseDate?: Date | null
    occupation?: string | null
    maritalStatus?: string | null
    hasChildUnder26?: boolean | null
    clientId?: string | null
    vehicleId?: string | null
    agentId?: string | null
    organizationId?: string | null
    status?: CalculationStatus
    value?: number | null
    validUntil?: Date | null
    variant?: InsuranceVariantVO | null
    scopes?: InsuranceScopeVO[]
    externalId?: string | null
    syncedAt?: Date | null
    createdAt?: Date
    updatedAt?: Date
  }): Calculation {
    return new Calculation(
      params.id,
      params.pesel || null,
      params.firstName || null,
      params.lastName || null,
      params.previousLastName || null,
      params.phone || null,
      params.email || null,
      params.postalCode || null,
      params.city || null,
      params.street || null,
      params.houseNumber || null,
      params.apartmentNumber || null,
      params.correspondenceAddress || null,
      params.hasDrivingLicense ?? null,
      params.drivingLicenseDate || null,
      params.occupation || null,
      params.maritalStatus || null,
      params.hasChildUnder26 ?? null,
      params.clientId || null,
      params.vehicleId || null,
      params.agentId || null,
      params.organizationId || null,
      params.status || 'DRAFT',
      params.value || null,
      params.validUntil || null,
      params.variant || null,
      params.scopes || [],
      params.externalId || null,
      params.syncedAt || null,
      params.createdAt || new Date(),
      params.updatedAt || new Date()
    )
  }

  /**
   * Reconstructs Calculation from persistence
   */
  static fromPersistence(data: {
    id: string
    pesel: string | null
    firstName: string | null
    lastName: string | null
    previousLastName: string | null
    phone: string | null
    email: string | null
    postalCode: string | null
    city: string | null
    street: string | null
    houseNumber: string | null
    apartmentNumber: string | null
    correspondenceAddress: Record<string, any> | null
    hasDrivingLicense: boolean | null
    drivingLicenseDate: Date | null
    occupation: string | null
    maritalStatus: string | null
    hasChildUnder26: boolean | null
    clientId: string | null
    vehicleId: string | null
    agentId: string | null
    organizationId: string | null
    status: CalculationStatus
    value: number | null
    validUntil: Date | null
    variant: InsuranceVariant | null
    scopes: InsuranceScope[]
    externalId: string | null
    syncedAt: Date | null
    createdAt: Date
    updatedAt: Date
  }): Calculation {
    return new Calculation(
      data.id,
      data.pesel ? PESEL.fromValidated(data.pesel) : null,
      data.firstName,
      data.lastName,
      data.previousLastName,
      data.phone,
      data.email,
      data.postalCode ? PostalCode.fromValidated(data.postalCode) : null,
      data.city,
      data.street,
      data.houseNumber,
      data.apartmentNumber,
      data.correspondenceAddress,
      data.hasDrivingLicense,
      data.drivingLicenseDate,
      data.occupation,
      data.maritalStatus,
      data.hasChildUnder26,
      data.clientId,
      data.vehicleId,
      data.agentId,
      data.organizationId,
      data.status,
      data.value ? Number(data.value) : null,
      data.validUntil,
      data.variant ? InsuranceVariantVO.create(data.variant) : null,
      data.scopes.map(s => InsuranceScopeVO.create(s)).filter((s): s is InsuranceScopeVO => s !== null),
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

  getPESEL(): PESEL | null {
    return this.pesel
  }

  getFirstName(): string | null {
    return this.firstName
  }

  getLastName(): string | null {
    return this.lastName
  }

  getStatus(): CalculationStatus {
    return this.status
  }

  getValue(): number | null {
    return this.value
  }

  getVariant(): InsuranceVariantVO | null {
    return this.variant
  }

  getScopes(): InsuranceScopeVO[] {
    return this.scopes
  }

  getClientId(): string | null {
    return this.clientId
  }

  getVehicleId(): string | null {
    return this.vehicleId
  }

  getAgentId(): string | null {
    return this.agentId
  }

  getOrganizationId(): string | null {
    return this.organizationId
  }

  getCreatedAt(): Date {
    return this.createdAt
  }

  getUpdatedAt(): Date {
    return this.updatedAt
  }

  // Business logic methods
  changeStatus(newStatus: CalculationStatus): void {
    this.status = newStatus
    this.updatedAt = new Date()
  }

  updateValue(value: number | null): void {
    if (value !== null && value < 0) {
      throw new Error('Wartość kalkulacji nie może być ujemna')
    }
    this.value = value
    this.updatedAt = new Date()
  }

  updateScopes(scopes: InsuranceScopeVO[]): void {
    this.scopes = scopes
    this.updatedAt = new Date()
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
    pesel: string | null
    firstName: string | null
    lastName: string | null
    previousLastName: string | null
    phone: string | null
    email: string | null
    postalCode: string | null
    city: string | null
    street: string | null
    houseNumber: string | null
    apartmentNumber: string | null
    correspondenceAddress: Record<string, any> | null
    hasDrivingLicense: boolean | null
    drivingLicenseDate: Date | null
    occupation: string | null
    maritalStatus: string | null
    hasChildUnder26: boolean | null
    clientId: string | null
    vehicleId: string | null
    agentId: string | null
    organizationId: string | null
    status: CalculationStatus
    value: number | null
    validUntil: Date | null
    variant: InsuranceVariant | null
    scopes: InsuranceScope[]
    externalId: string | null
    syncedAt: Date | null
    createdAt: Date
    updatedAt: Date
  } {
    return {
      id: this.id,
      pesel: this.pesel?.getValue() || null,
      firstName: this.firstName,
      lastName: this.lastName,
      previousLastName: this.previousLastName,
      phone: this.phone,
      email: this.email,
      postalCode: this.postalCode?.getValue() || null,
      city: this.city,
      street: this.street,
      houseNumber: this.houseNumber,
      apartmentNumber: this.apartmentNumber,
      correspondenceAddress: this.correspondenceAddress,
      hasDrivingLicense: this.hasDrivingLicense,
      drivingLicenseDate: this.drivingLicenseDate,
      occupation: this.occupation,
      maritalStatus: this.maritalStatus,
      hasChildUnder26: this.hasChildUnder26,
      clientId: this.clientId,
      vehicleId: this.vehicleId,
      agentId: this.agentId,
      organizationId: this.organizationId,
      status: this.status,
      value: this.value,
      validUntil: this.validUntil,
      variant: (this.variant?.getValue() as InsuranceVariant) || null,
      scopes: this.scopes.map(s => s.getValue() as InsuranceScope),
      externalId: this.externalId,
      syncedAt: this.syncedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}

