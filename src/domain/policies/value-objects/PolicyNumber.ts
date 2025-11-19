/**
 * PolicyNumber Value Object
 * Immutable value object representing a policy number
 */
export class PolicyNumber {
  private readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  /**
   * Creates a PolicyNumber value object from a string
   * @throws Error if policy number is invalid
   */
  static create(policyNumber: string | null | undefined): PolicyNumber | null {
    if (!policyNumber || policyNumber.trim() === '') {
      return null
    }

    const trimmed = policyNumber.trim()

    if (trimmed.length > 100) {
      throw new Error('Numer polisy jest zbyt długi (max 100 znaków)')
    }

    if (trimmed.length < 1) {
      throw new Error('Numer polisy nie może być pusty')
    }

    return new PolicyNumber(trimmed)
  }

  /**
   * Creates a PolicyNumber from a validated string (for internal use)
   */
  static fromValidated(value: string): PolicyNumber {
    return new PolicyNumber(value)
  }

  /**
   * Returns the policy number value as string
   */
  getValue(): string {
    return this.value
  }

  /**
   * Returns the policy number value as string (for serialization)
   */
  toString(): string {
    return this.value
  }

  /**
   * Equality comparison
   */
  equals(other: PolicyNumber | null): boolean {
    if (!other) return false
    return this.value === other.value
  }
}

