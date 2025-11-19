/**
 * InsuranceVariant Value Object
 * Immutable value object representing insurance variant
 */
export enum InsuranceVariantEnum {
  MINIMAL = 'MINIMAL',
  OPTIMAL = 'OPTIMAL',
  MAXIMAL = 'MAXIMAL',
}

/**
 * InsuranceVariant Value Object
 */
export class InsuranceVariant {
  private readonly value: InsuranceVariantEnum

  private constructor(value: InsuranceVariantEnum) {
    this.value = value
  }

  /**
   * Creates an InsuranceVariant value object
   * @throws Error if variant is invalid
   */
  static create(variant: InsuranceVariantEnum | string | null | undefined): InsuranceVariant | null {
    if (!variant) {
      return null
    }

    const variantStr = typeof variant === 'string' ? variant.toUpperCase() : variant

    if (!Object.values(InsuranceVariantEnum).includes(variantStr as InsuranceVariantEnum)) {
      throw new Error(`Nieprawidłowy wariant ubezpieczenia. Dozwolone wartości: ${Object.values(InsuranceVariantEnum).join(', ')}`)
    }

    return new InsuranceVariant(variantStr as InsuranceVariantEnum)
  }

  /**
   * Creates an InsuranceVariant from a validated value (for internal use)
   */
  static fromValidated(value: InsuranceVariantEnum): InsuranceVariant {
    return new InsuranceVariant(value)
  }

  /**
   * Returns the variant value
   */
  getValue(): InsuranceVariantEnum {
    return this.value
  }

  /**
   * Returns the variant value as string (for serialization)
   */
  toString(): string {
    return this.value
  }

  /**
   * Returns display name in Polish
   */
  getDisplayName(): string {
    const names: Record<InsuranceVariantEnum, string> = {
      [InsuranceVariantEnum.MINIMAL]: 'Minimalny',
      [InsuranceVariantEnum.OPTIMAL]: 'Optymalny',
      [InsuranceVariantEnum.MAXIMAL]: 'Maksymalny',
    }
    return names[this.value]
  }

  /**
   * Equality comparison
   */
  equals(other: InsuranceVariant | null): boolean {
    if (!other) return false
    return this.value === other.value
  }
}

