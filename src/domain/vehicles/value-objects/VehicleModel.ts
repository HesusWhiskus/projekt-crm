/**
 * VehicleModel Value Object
 * Immutable value object representing a vehicle model
 */
export class VehicleModel {
  private readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  /**
   * Creates a VehicleModel value object from a string
   * @throws Error if model is invalid
   */
  static create(model: string | null | undefined): VehicleModel | null {
    if (!model || model.trim() === '') {
      return null
    }

    const trimmed = model.trim()

    if (trimmed.length > 200) {
      throw new Error('Nazwa modelu pojazdu jest zbyt długa (max 200 znaków)')
    }

    if (trimmed.length < 1) {
      throw new Error('Nazwa modelu pojazdu nie może być pusta')
    }

    return new VehicleModel(trimmed)
  }

  /**
   * Creates a VehicleModel from a validated string (for internal use)
   */
  static fromValidated(value: string): VehicleModel {
    return new VehicleModel(value)
  }

  /**
   * Returns the model value as string
   */
  getValue(): string {
    return this.value
  }

  /**
   * Returns the model value as string (for serialization)
   */
  toString(): string {
    return this.value
  }

  /**
   * Equality comparison
   */
  equals(other: VehicleModel | null): boolean {
    if (!other) return false
    return this.value === other.value
  }
}

