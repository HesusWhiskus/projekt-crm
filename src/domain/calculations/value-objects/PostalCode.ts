/**
 * PostalCode Value Object
 * Immutable value object representing a Polish postal code
 */
export class PostalCode {
  private readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  /**
   * Creates a PostalCode value object from a string
   * Validates Polish postal code format (XX-XXX)
   * @throws Error if postal code is invalid
   */
  static create(postalCode: string | null | undefined): PostalCode | null {
    if (!postalCode || postalCode.trim() === '') {
      return null
    }

    const trimmed = postalCode.trim().replace(/\s+/g, '')

    // Polish postal code format: XX-XXX (5 digits with dash)
    const postalCodeRegex = /^\d{2}-\d{3}$/

    if (!postalCodeRegex.test(trimmed)) {
      // Try to format if it's missing dash
      const digitsOnly = trimmed.replace(/-/g, '')
      if (/^\d{5}$/.test(digitsOnly)) {
        const formatted = `${digitsOnly.substring(0, 2)}-${digitsOnly.substring(2)}`
        return new PostalCode(formatted)
      }
      throw new Error('Nieprawidłowy format kodu pocztowego (oczekiwany format: XX-XXX)')
    }

    return new PostalCode(trimmed)
  }

  /**
   * Creates a PostalCode from a validated string (for internal use)
   */
  static fromValidated(value: string): PostalCode {
    return new PostalCode(value)
  }

  /**
   * Returns the postal code value as string
   */
  getValue(): string {
    return this.value
  }

  /**
   * Returns the postal code value as string (for serialization)
   */
  toString(): string {
    return this.value
  }

  /**
   * Returns postal code without dash
   */
  getDigitsOnly(): string {
    return this.value.replace(/-/g, '')
  }

  /**
   * Equality comparison
   */
  equals(other: PostalCode | null): boolean {
    if (!other) return false
    return this.value === other.value
  }
}

