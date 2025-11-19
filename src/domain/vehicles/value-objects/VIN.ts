/**
 * VIN (Vehicle Identification Number) Value Object
 * Immutable value object representing a VIN number
 */
export class VIN {
  private readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  /**
   * Creates a VIN value object from a string
   * @throws Error if VIN is invalid
   */
  static create(vin: string | null | undefined): VIN | null {
    if (!vin || vin.trim() === '') {
      return null
    }

    const trimmed = vin.trim().toUpperCase()

    // VIN must be exactly 17 characters
    if (trimmed.length !== 17) {
      throw new Error('VIN musi składać się z dokładnie 17 znaków')
    }

    // VIN cannot contain I, O, Q
    if (/[IOQ]/.test(trimmed)) {
      throw new Error('VIN nie może zawierać liter I, O lub Q')
    }

    // VIN must be alphanumeric
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(trimmed)) {
      throw new Error('VIN może zawierać tylko litery (bez I, O, Q) i cyfry')
    }

    return new VIN(trimmed)
  }

  /**
   * Creates a VIN from a validated string (for internal use)
   */
  static fromValidated(value: string): VIN {
    return new VIN(value)
  }

  /**
   * Returns the VIN value as string
   */
  getValue(): string {
    return this.value
  }

  /**
   * Returns the VIN value as string (for serialization)
   */
  toString(): string {
    return this.value
  }

  /**
   * Equality comparison
   */
  equals(other: VIN | null): boolean {
    if (!other) return false
    return this.value === other.value
  }
}

