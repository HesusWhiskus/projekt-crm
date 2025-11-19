/**
 * SyncDirection Value Object
 * Represents synchronization direction
 */
export enum SyncDirectionEnum {
  IN = 'IN',   // Data coming from external system to CRM
  OUT = 'OUT', // Data going from CRM to external system
}

/**
 * SyncDirection Value Object
 * Immutable value object representing synchronization direction
 */
export class SyncDirection {
  private readonly value: SyncDirectionEnum

  private constructor(value: SyncDirectionEnum) {
    this.value = value
  }

  /**
   * Creates a SyncDirection value object
   * @throws Error if direction is invalid
   */
  static create(direction: SyncDirectionEnum | string | null | undefined): SyncDirection | null {
    if (!direction) {
      return null
    }

    const directionStr = typeof direction === 'string' ? direction.toUpperCase() : direction

    if (!Object.values(SyncDirectionEnum).includes(directionStr as SyncDirectionEnum)) {
      throw new Error(`Nieprawidłowy kierunek synchronizacji. Dozwolone wartości: ${Object.values(SyncDirectionEnum).join(', ')}`)
    }

    return new SyncDirection(directionStr as SyncDirectionEnum)
  }

  /**
   * Creates a SyncDirection from a validated value (for internal use)
   */
  static fromValidated(value: SyncDirectionEnum): SyncDirection {
    return new SyncDirection(value)
  }

  /**
   * Returns the direction value
   */
  getValue(): SyncDirectionEnum {
    return this.value
  }

  /**
   * Returns the direction value as string (for serialization)
   */
  toString(): string {
    return this.value
  }

  /**
   * Checks if direction is IN (from external to CRM)
   */
  isIn(): boolean {
    return this.value === SyncDirectionEnum.IN
  }

  /**
   * Checks if direction is OUT (from CRM to external)
   */
  isOut(): boolean {
    return this.value === SyncDirectionEnum.OUT
  }

  /**
   * Equality comparison
   */
  equals(other: SyncDirection | null): boolean {
    if (!other) return false
    return this.value === other.value
  }
}

