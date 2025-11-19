/**
 * RegistrationNumber Value Object
 * Immutable value object representing a vehicle registration number
 */
export class RegistrationNumber {
  private readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  /**
   * Creates a RegistrationNumber value object from a string
   * Validates Polish registration number format (old and new)
   * @throws Error if registration number is invalid
   */
  static create(registrationNumber: string | null | undefined): RegistrationNumber | null {
    if (!registrationNumber || registrationNumber.trim() === '') {
      return null
    }

    const trimmed = registrationNumber.trim().toUpperCase().replace(/\s+/g, '')

    // Old format: ABC1234 or ABC 1234 (3 letters, 4 digits)
    // New format: ABC 12AB or ABC12AB (3 letters, 2 digits, 2 letters)
    const oldFormatRegex = /^[A-Z]{3}[0-9]{4}$/
    const newFormatRegex = /^[A-Z]{3}[0-9]{2}[A-Z]{2}$/

    if (!oldFormatRegex.test(trimmed) && !newFormatRegex.test(trimmed)) {
      throw new Error('Nieprawidłowy format numeru rejestracyjnego (oczekiwany format: ABC1234 lub ABC12AB)')
    }

    return new RegistrationNumber(trimmed)
  }

  /**
   * Creates a RegistrationNumber from a validated string (for internal use)
   */
  static fromValidated(value: string): RegistrationNumber {
    return new RegistrationNumber(value)
  }

  /**
   * Returns the registration number value as string
   */
  getValue(): string {
    return this.value
  }

  /**
   * Returns the registration number value as string (for serialization)
   */
  toString(): string {
    return this.value
  }

  /**
   * Returns formatted registration number (with space)
   */
  getFormatted(): string {
    if (this.value.length === 7) {
      // Check if it's old format (ends with digit) or new format (ends with letter)
      const lastChar = this.value[6]
      if (/[0-9]/.test(lastChar)) {
        // Old format: ABC1234 -> ABC 1234
        return `${this.value.substring(0, 3)} ${this.value.substring(3)}`
      } else {
        // New format: ABC12AB -> ABC 12AB
        return `${this.value.substring(0, 3)} ${this.value.substring(3, 5)} ${this.value.substring(5)}`
      }
    }
    return this.value
  }

  /**
   * Equality comparison
   */
  equals(other: RegistrationNumber | null): boolean {
    if (!other) return false
    return this.value === other.value
  }
}

