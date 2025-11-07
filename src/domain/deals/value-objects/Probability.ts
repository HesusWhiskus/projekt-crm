/**
 * Probability Value Object
 * Immutable value object representing deal closure probability (0-100%)
 */
export class Probability {
  private readonly value: number

  private constructor(value: number) {
    this.value = value
  }

  /**
   * Creates a Probability value object
   * @param probability Probability value (0-100)
   * @throws Error if probability is invalid
   */
  static create(probability: number | string): Probability {
    const numProbability = typeof probability === 'string' ? parseInt(probability, 10) : probability

    if (isNaN(numProbability) || !isFinite(numProbability)) {
      throw new Error('Prawdopodobieństwo musi być liczbą')
    }

    if (numProbability < 0 || numProbability > 100) {
      throw new Error('Prawdopodobieństwo musi być w zakresie 0-100%')
    }

    return new Probability(Math.round(numProbability))
  }

  /**
   * Creates a Probability from validated value (for internal use)
   */
  static fromValidated(value: number): Probability {
    return new Probability(value)
  }

  /**
   * Returns the probability value (0-100)
   */
  getValue(): number {
    return this.value
  }

  /**
   * Returns the probability as percentage string
   */
  toString(): string {
    return `${this.value}%`
  }

  /**
   * Equality comparison
   */
  equals(other: Probability | null): boolean {
    if (!other) return false
    return this.value === other.value
  }
}

