import { DealStage as PrismaDealStage } from '@prisma/client'

/**
 * DealStage Value Object
 * Immutable value object representing a deal's stage in the pipeline
 */
export class DealStage {
  private readonly value: PrismaDealStage

  private constructor(value: PrismaDealStage) {
    this.value = value
  }

  /**
   * Creates a DealStage value object
   * @param stage Stage value (enum: INITIAL_CONTACT, PROPOSAL, NEGOTIATION, CLOSING, WON, LOST)
   * @throws Error if stage is invalid
   */
  static create(stage: string | PrismaDealStage): DealStage {
    const validStages: PrismaDealStage[] = [
      'INITIAL_CONTACT',
      'PROPOSAL',
      'NEGOTIATION',
      'CLOSING',
      'WON',
      'LOST',
    ]

    if (!validStages.includes(stage as PrismaDealStage)) {
      throw new Error(
        `Nieprawidłowy etap deala. Dozwolone wartości: ${validStages.join(', ')}`
      )
    }

    return new DealStage(stage as PrismaDealStage)
  }

  /**
   * Creates a DealStage from validated value (for internal use)
   */
  static fromValidated(value: PrismaDealStage): DealStage {
    return new DealStage(value)
  }

  /**
   * Returns the stage value
   */
  getValue(): PrismaDealStage {
    return this.value
  }

  /**
   * Returns the stage as string
   */
  toString(): string {
    return this.value
  }

  /**
   * Returns human-readable stage name in Polish
   */
  toDisplayName(): string {
    const displayNames: Record<PrismaDealStage, string> = {
      INITIAL_CONTACT: 'Pierwszy kontakt',
      PROPOSAL: 'Oferta',
      NEGOTIATION: 'Negocjacje',
      CLOSING: 'Zamykanie',
      WON: 'Wygrany',
      LOST: 'Przegrany',
    }

    return displayNames[this.value]
  }

  /**
   * Checks if deal is closed (WON or LOST)
   */
  isClosed(): boolean {
    return this.value === 'WON' || this.value === 'LOST'
  }

  /**
   * Checks if deal is won
   */
  isWon(): boolean {
    return this.value === 'WON'
  }

  /**
   * Checks if deal is lost
   */
  isLost(): boolean {
    return this.value === 'LOST'
  }

  /**
   * Equality comparison
   */
  equals(other: DealStage | null): boolean {
    if (!other) return false
    return this.value === other.value
  }
}

