/**
 * Email Value Object
 * Immutable value object representing an email address
 */
export class Email {
  private readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  /**
   * Creates an Email value object from a string
   * @throws Error if email is invalid
   */
  static create(email: string | null | undefined): Email | null {
    if (!email || email.trim() === '') {
      return null
    }

    const trimmed = email.trim().toLowerCase()

    if (trimmed.length > 255) {
      throw new Error('Email jest zbyt długi (max 255 znaków)')
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmed)) {
      throw new Error('Nieprawidłowy format adresu email')
    }

    return new Email(trimmed)
  }

  /**
   * Creates an Email from a validated string (for internal use)
   */
  static fromValidated(value: string): Email {
    return new Email(value)
  }

  /**
   * Returns the email value as string
   */
  getValue(): string {
    return this.value
  }

  /**
   * Returns the email value as string (for serialization)
   */
  toString(): string {
    return this.value
  }

  /**
   * Equality comparison
   */
  equals(other: Email | null): boolean {
    if (!other) return false
    return this.value === other.value
  }
}

