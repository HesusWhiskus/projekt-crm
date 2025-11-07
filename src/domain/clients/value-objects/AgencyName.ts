/**
 * AgencyName Value Object
 * Immutable value object representing an agency name
 */
export class AgencyName {
  private readonly value: string | null

  private constructor(value: string | null) {
    this.value = value
  }

  /**
   * Creates an AgencyName value object from a string
   * @throws Error if agency name is invalid
   */
  static create(agencyName: string | null | undefined): AgencyName {
    if (!agencyName || agencyName.trim() === '') {
      return new AgencyName(null)
    }

    const trimmed = agencyName.trim()

    if (trimmed.length > 150) {
      throw new Error('Nazwa agencji jest zbyt długa (max 150 znaków)')
    }

    return new AgencyName(trimmed)
  }

  /**
   * Creates an AgencyName from a validated string (for internal use)
   */
  static fromValidated(value: string | null): AgencyName {
    return new AgencyName(value)
  }

  /**
   * Returns the agency name value as string or null
   */
  getValue(): string | null {
    return this.value
  }

  /**
   * Returns the agency name value as string (for serialization)
   */
  toString(): string {
    return this.value || ''
  }

  /**
   * Checks if agency name is set
   */
  hasValue(): boolean {
    return this.value !== null && this.value !== ''
  }

  /**
   * Equality comparison
   */
  equals(other: AgencyName): boolean {
    return this.value === other.value
  }
}

