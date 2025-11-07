/**
 * Phone Value Object
 * Immutable value object representing a phone number
 */
export class Phone {
  private readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  /**
   * Creates a Phone value object from a string
   * @throws Error if phone is invalid
   */
  static create(phone: string | null | undefined): Phone | null {
    if (!phone || phone.trim() === '') {
      return null
    }

    const trimmed = phone.trim()

    if (trimmed.length > 30) {
      throw new Error('Numer telefonu jest zbyt długi (max 30 znaków)')
    }

    // Remove common phone formatting characters
    const digitsOnly = trimmed.replace(/[\s\-\(\)\+]/g, '')

    // Check if contains only digits (after removing formatting)
    if (!/^\d{7,15}$/.test(digitsOnly)) {
      throw new Error('Nieprawidłowy format numeru telefonu. Użyj cyfr, spacji, myślników lub nawiasów.')
    }

    return new Phone(trimmed)
  }

  /**
   * Creates a Phone from a validated string (for internal use)
   */
  static fromValidated(value: string): Phone {
    return new Phone(value)
  }

  /**
   * Returns the phone value as string
   */
  getValue(): string {
    return this.value
  }

  /**
   * Returns the phone value as string (for serialization)
   */
  toString(): string {
    return this.value
  }

  /**
   * Equality comparison
   */
  equals(other: Phone | null): boolean {
    if (!other) return false
    return this.value === other.value
  }
}

