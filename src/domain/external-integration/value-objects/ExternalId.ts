/**
 * ExternalId Value Object
 * Immutable value object representing an external system identifier
 */
export class ExternalId {
  private readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  /**
   * Creates an ExternalId value object from a string
   * @throws Error if external ID is invalid
   */
  static create(externalId: string | null | undefined): ExternalId | null {
    if (!externalId || externalId.trim() === '') {
      return null
    }

    const trimmed = externalId.trim()

    if (trimmed.length > 255) {
      throw new Error('Zewnętrzny identyfikator jest zbyt długi (max 255 znaków)')
    }

    return new ExternalId(trimmed)
  }

  /**
   * Creates an ExternalId from a validated string (for internal use)
   */
  static fromValidated(value: string): ExternalId {
    return new ExternalId(value)
  }

  /**
   * Returns the external ID value as string
   */
  getValue(): string {
    return this.value
  }

  /**
   * Returns the external ID value as string (for serialization)
   */
  toString(): string {
    return this.value
  }

  /**
   * Equality comparison
   */
  equals(other: ExternalId | null): boolean {
    if (!other) return false
    return this.value === other.value
  }
}

