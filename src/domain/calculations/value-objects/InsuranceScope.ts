/**
 * InsuranceScope Value Object
 * Represents insurance scope types
 */
export enum InsuranceScopeEnum {
  OC = 'OC', // Odpowiedzialność cywilna
  AC = 'AC', // Autocasco
  NNW = 'NNW', // Następstwa nieszczęśliwych wypadków
  ASS = 'ASS', // Assistance
}

/**
 * InsuranceScope Value Object
 * Immutable value object representing insurance scope
 */
export class InsuranceScope {
  private readonly value: InsuranceScopeEnum

  private constructor(value: InsuranceScopeEnum) {
    this.value = value
  }

  /**
   * Creates an InsuranceScope value object
   * @throws Error if scope is invalid
   */
  static create(scope: InsuranceScopeEnum | string | null | undefined): InsuranceScope | null {
    if (!scope) {
      return null
    }

    const scopeStr = typeof scope === 'string' ? scope.toUpperCase() : scope

    if (!Object.values(InsuranceScopeEnum).includes(scopeStr as InsuranceScopeEnum)) {
      throw new Error(`Nieprawidłowy zakres ubezpieczenia. Dozwolone wartości: ${Object.values(InsuranceScopeEnum).join(', ')}`)
    }

    return new InsuranceScope(scopeStr as InsuranceScopeEnum)
  }

  /**
   * Creates an InsuranceScope from a validated value (for internal use)
   */
  static fromValidated(value: InsuranceScopeEnum): InsuranceScope {
    return new InsuranceScope(value)
  }

  /**
   * Returns the scope value
   */
  getValue(): InsuranceScopeEnum {
    return this.value
  }

  /**
   * Returns the scope value as string (for serialization)
   */
  toString(): string {
    return this.value
  }

  /**
   * Returns display name in Polish
   */
  getDisplayName(): string {
    const names: Record<InsuranceScopeEnum, string> = {
      [InsuranceScopeEnum.OC]: 'Odpowiedzialność cywilna',
      [InsuranceScopeEnum.AC]: 'Autocasco',
      [InsuranceScopeEnum.NNW]: 'Następstwa nieszczęśliwych wypadków',
      [InsuranceScopeEnum.ASS]: 'Assistance',
    }
    return names[this.value]
  }

  /**
   * Equality comparison
   */
  equals(other: InsuranceScope | null): boolean {
    if (!other) return false
    return this.value === other.value
  }
}

