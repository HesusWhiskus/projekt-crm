/**
 * PolicyStatus Value Object
 * Represents policy status types
 */
export enum PolicyStatusEnum {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  RENEWED = 'RENEWED',
}

/**
 * PolicyStatus Value Object
 * Immutable value object representing policy status
 */
export class PolicyStatus {
  private readonly value: PolicyStatusEnum

  private constructor(value: PolicyStatusEnum) {
    this.value = value
  }

  /**
   * Creates a PolicyStatus value object
   * @throws Error if status is invalid
   */
  static create(status: PolicyStatusEnum | string | null | undefined): PolicyStatus | null {
    if (!status) {
      return null
    }

    const statusStr = typeof status === 'string' ? status.toUpperCase() : status

    if (!Object.values(PolicyStatusEnum).includes(statusStr as PolicyStatusEnum)) {
      throw new Error(`Nieprawidłowy status polisy. Dozwolone wartości: ${Object.values(PolicyStatusEnum).join(', ')}`)
    }

    return new PolicyStatus(statusStr as PolicyStatusEnum)
  }

  /**
   * Creates a PolicyStatus from a validated value (for internal use)
   */
  static fromValidated(value: PolicyStatusEnum): PolicyStatus {
    return new PolicyStatus(value)
  }

  /**
   * Returns the status value
   */
  getValue(): PolicyStatusEnum {
    return this.value
  }

  /**
   * Returns the status value as string (for serialization)
   */
  toString(): string {
    return this.value
  }

  /**
   * Returns display name in Polish
   */
  getDisplayName(): string {
    const names: Record<PolicyStatusEnum, string> = {
      [PolicyStatusEnum.ACTIVE]: 'Aktywna',
      [PolicyStatusEnum.EXPIRED]: 'Wygasła',
      [PolicyStatusEnum.CANCELLED]: 'Anulowana',
      [PolicyStatusEnum.RENEWED]: 'Odnowiona',
    }
    return names[this.value]
  }

  /**
   * Checks if policy is active
   */
  isActive(): boolean {
    return this.value === PolicyStatusEnum.ACTIVE
  }

  /**
   * Checks if policy is expired
   */
  isExpired(): boolean {
    return this.value === PolicyStatusEnum.EXPIRED
  }

  /**
   * Equality comparison
   */
  equals(other: PolicyStatus | null): boolean {
    if (!other) return false
    return this.value === other.value
  }
}

