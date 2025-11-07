/**
 * DealValue Value Object
 * Immutable value object representing a deal's monetary value with currency
 */
export class DealValue {
  private readonly amount: number
  private readonly currency: string

  private constructor(amount: number, currency: string) {
    this.amount = amount
    this.currency = currency
  }

  /**
   * Creates a DealValue value object
   * @param amount The monetary amount (must be >= 0)
   * @param currency Currency code (default: "PLN")
   * @throws Error if amount is invalid
   */
  static create(amount: number | string, currency: string = 'PLN'): DealValue {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount

    if (isNaN(numAmount) || !isFinite(numAmount)) {
      throw new Error('Wartość deala musi być liczbą')
    }

    if (numAmount < 0) {
      throw new Error('Wartość deala nie może być ujemna')
    }

    if (numAmount > 999999999999.99) {
      throw new Error('Wartość deala jest zbyt duża (max 999,999,999,999.99)')
    }

    const trimmedCurrency = currency.trim().toUpperCase()
    if (trimmedCurrency.length !== 3) {
      throw new Error('Kod waluty musi składać się z 3 znaków (np. PLN, EUR, USD)')
    }

    // Validate currency code format (ISO 4217)
    const currencyRegex = /^[A-Z]{3}$/
    if (!currencyRegex.test(trimmedCurrency)) {
      throw new Error('Nieprawidłowy format kodu waluty')
    }

    return new DealValue(numAmount, trimmedCurrency)
  }

  /**
   * Creates a DealValue from validated values (for internal use)
   */
  static fromValidated(amount: number, currency: string): DealValue {
    return new DealValue(amount, currency)
  }

  /**
   * Returns the amount value
   */
  getAmount(): number {
    return this.amount
  }

  /**
   * Returns the currency code
   */
  getCurrency(): string {
    return this.currency
  }

  /**
   * Returns formatted value string
   */
  toString(): string {
    return `${this.amount.toFixed(2)} ${this.currency}`
  }

  /**
   * Equality comparison
   */
  equals(other: DealValue | null): boolean {
    if (!other) return false
    return this.amount === other.amount && this.currency === other.currency
  }
}

