/**
 * VehicleMake Value Object
 * Immutable value object representing a vehicle make/manufacturer
 */
export class VehicleMake {
  private readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  /**
   * Creates a VehicleMake value object from a string
   * @throws Error if make is invalid
   */
  static create(make: string | null | undefined): VehicleMake | null {
    if (!make || make.trim() === '') {
      return null
    }

    const trimmed = make.trim()

    if (trimmed.length > 100) {
      throw new Error('Nazwa marki pojazdu jest zbyt długa (max 100 znaków)')
    }

    if (trimmed.length < 1) {
      throw new Error('Nazwa marki pojazdu nie może być pusta')
    }

    return new VehicleMake(trimmed)
  }

  /**
   * Creates a VehicleMake from a validated string (for internal use)
   */
  static fromValidated(value: string): VehicleMake {
    return new VehicleMake(value)
  }

  /**
   * Returns the make value as string
   */
  getValue(): string {
    return this.value
  }

  /**
   * Returns the make value as string (for serialization)
   */
  toString(): string {
    return this.value
  }

  /**
   * Equality comparison
   */
  equals(other: VehicleMake | null): boolean {
    if (!other) return false
    return this.value === other.value
  }
}

