/**
 * PESEL Value Object
 * Immutable value object representing a Polish PESEL number
 */
export class PESEL {
  private readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  /**
   * Creates a PESEL value object from a string
   * Validates PESEL format and checksum
   * @throws Error if PESEL is invalid
   */
  static create(pesel: string | null | undefined): PESEL | null {
    if (!pesel || pesel.trim() === '') {
      return null
    }

    const trimmed = pesel.trim()

    // PESEL must be exactly 11 digits
    if (!/^\d{11}$/.test(trimmed)) {
      throw new Error('PESEL musi składać się z dokładnie 11 cyfr')
    }

    // Validate checksum
    if (!PESEL.validateChecksum(trimmed)) {
      throw new Error('Nieprawidłowa suma kontrolna PESEL')
    }

    return new PESEL(trimmed)
  }

  /**
   * Creates a PESEL from a validated string (for internal use)
   */
  static fromValidated(value: string): PESEL {
    return new PESEL(value)
  }

  /**
   * Validates PESEL checksum
   */
  private static validateChecksum(pesel: string): boolean {
    const weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3]
    let sum = 0

    for (let i = 0; i < 10; i++) {
      sum += parseInt(pesel[i]) * weights[i]
    }

    const checksum = (10 - (sum % 10)) % 10
    return checksum === parseInt(pesel[10])
  }

  /**
   * Extracts birth date from PESEL
   */
  getBirthDate(): Date | null {
    const year = parseInt(this.value.substring(0, 2))
    const month = parseInt(this.value.substring(2, 4))
    const day = parseInt(this.value.substring(4, 6))

    // Determine century based on month
    let fullYear: number
    if (month >= 1 && month <= 12) {
      fullYear = 1900 + year
    } else if (month >= 21 && month <= 32) {
      fullYear = 2000 + year
      // Adjust month
      const adjustedMonth = month - 20
      return new Date(fullYear, adjustedMonth - 1, day)
    } else if (month >= 81 && month <= 92) {
      fullYear = 1800 + year
      const adjustedMonth = month - 80
      return new Date(fullYear, adjustedMonth - 1, day)
    } else {
      return null
    }

    return new Date(fullYear, month - 1, day)
  }

  /**
   * Extracts gender from PESEL (even = female, odd = male)
   */
  getGender(): 'M' | 'F' | null {
    const genderDigit = parseInt(this.value[9])
    return genderDigit % 2 === 0 ? 'F' : 'M'
  }

  /**
   * Returns the PESEL value as string
   */
  getValue(): string {
    return this.value
  }

  /**
   * Returns the PESEL value as string (for serialization)
   */
  toString(): string {
    return this.value
  }

  /**
   * Equality comparison
   */
  equals(other: PESEL | null): boolean {
    if (!other) return false
    return this.value === other.value
  }
}

