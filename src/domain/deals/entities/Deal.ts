import { DealStage as PrismaDealStage } from '@prisma/client'
import { DealValue, Probability, DealStage } from '../value-objects'

/**
 * Deal Entity
 * Domain entity representing a sales deal/opportunity with business logic
 */
export class Deal {
  private constructor(
    private readonly id: string,
    private readonly clientId: string,
    private value: DealValue,
    private probability: Probability,
    private stage: DealStage,
    private expectedCloseDate: Date | null,
    private notes: string | null,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  /**
   * Creates a new Deal entity
   */
  static create(params: {
    id: string
    clientId: string
    value: DealValue
    probability: Probability
    stage: DealStage
    expectedCloseDate: Date | null
    notes: string | null
    createdAt?: Date
    updatedAt?: Date
  }): Deal {
    return new Deal(
      params.id,
      params.clientId,
      params.value,
      params.probability,
      params.stage,
      params.expectedCloseDate,
      params.notes,
      params.createdAt || new Date(),
      params.updatedAt || new Date()
    )
  }

  /**
   * Reconstructs Deal from persistence
   */
  static fromPersistence(data: {
    id: string
    clientId: string
    value: number
    currency: string
    probability: number
    stage: PrismaDealStage
    expectedCloseDate: Date | null
    notes: string | null
    createdAt: Date
    updatedAt: Date
  }): Deal {
    return new Deal(
      data.id,
      data.clientId,
      DealValue.fromValidated(data.value, data.currency),
      Probability.fromValidated(data.probability),
      DealStage.fromValidated(data.stage),
      data.expectedCloseDate,
      data.notes,
      data.createdAt,
      data.updatedAt
    )
  }

  // Getters
  getId(): string {
    return this.id
  }

  getClientId(): string {
    return this.clientId
  }

  getValue(): DealValue {
    return this.value
  }

  getProbability(): Probability {
    return this.probability
  }

  getStage(): DealStage {
    return this.stage
  }

  getExpectedCloseDate(): Date | null {
    return this.expectedCloseDate
  }

  getNotes(): string | null {
    return this.notes
  }

  getCreatedAt(): Date {
    return this.createdAt
  }

  getUpdatedAt(): Date {
    return this.updatedAt
  }

  /**
   * Updates deal value
   */
  updateValue(value: DealValue): void {
    this.value = value
    this.updatedAt = new Date()
  }

  /**
   * Updates deal probability
   */
  updateProbability(probability: Probability): void {
    this.probability = probability
    this.updatedAt = new Date()
  }

  /**
   * Changes deal stage
   * Business rule: Stage changes must be validated by DealPipelineService
   */
  changeStage(newStage: DealStage): void {
    this.stage = newStage
    this.updatedAt = new Date()
  }

  /**
   * Sets expected close date
   */
  setExpectedCloseDate(date: Date | null): void {
    this.expectedCloseDate = date
    this.updatedAt = new Date()
  }

  /**
   * Updates notes
   */
  updateNotes(notes: string | null): void {
    this.notes = notes
    this.updatedAt = new Date()
  }

  /**
   * Checks if deal is closed (WON or LOST)
   */
  isClosed(): boolean {
    return this.stage.isClosed()
  }

  /**
   * Checks if deal is won
   */
  isWon(): boolean {
    return this.stage.isWon()
  }

  /**
   * Checks if deal is lost
   */
  isLost(): boolean {
    return this.stage.isLost()
  }

  /**
   * Checks if expected close date has passed
   */
  isOverdue(): boolean {
    if (!this.expectedCloseDate) {
      return false
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return this.expectedCloseDate < today && !this.isClosed()
  }

  /**
   * Converts entity to plain object for persistence
   */
  toPersistence(): {
    id: string
    clientId: string
    value: number
    currency: string
    probability: number
    stage: PrismaDealStage
    expectedCloseDate: Date | null
    notes: string | null
    createdAt: Date
    updatedAt: Date
  } {
    return {
      id: this.id,
      clientId: this.clientId,
      value: this.value.getAmount(),
      currency: this.value.getCurrency(),
      probability: this.probability.getValue(),
      stage: this.stage.getValue(),
      expectedCloseDate: this.expectedCloseDate,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}

