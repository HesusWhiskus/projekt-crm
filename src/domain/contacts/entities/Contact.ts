import { ContactType } from '@prisma/client'

/**
 * Contact Entity
 * Domain entity representing a contact or note with business logic
 */
export class Contact {
  private constructor(
    private readonly id: string,
    private clientId: string,
    private type: ContactType | null,
    private date: Date,
    private notes: string,
    private isNote: boolean,
    private userId: string,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  /**
   * Creates a new Contact entity
   */
  static create(params: {
    id: string
    clientId: string
    type: ContactType | null
    date: Date
    notes: string
    isNote: boolean
    userId: string
    createdAt?: Date
    updatedAt?: Date
  }): Contact {
    return new Contact(
      params.id,
      params.clientId,
      params.type,
      params.date,
      params.notes,
      params.isNote,
      params.userId,
      params.createdAt || new Date(),
      params.updatedAt || new Date()
    )
  }

  /**
   * Reconstructs Contact from persistence
   */
  static fromPersistence(data: {
    id: string
    clientId: string
    type: ContactType | null
    date: Date
    notes: string
    isNote: boolean
    userId: string
    createdAt: Date
    updatedAt: Date
  }): Contact {
    return new Contact(
      data.id,
      data.clientId,
      data.type,
      data.date,
      data.notes,
      data.isNote,
      data.userId,
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

  getType(): ContactType | null {
    return this.type
  }

  getDate(): Date {
    return this.date
  }

  getNotes(): string {
    return this.notes
  }

  getIsNote(): boolean {
    return this.isNote
  }

  getUserId(): string {
    return this.userId
  }

  getCreatedAt(): Date {
    return this.createdAt
  }

  getUpdatedAt(): Date {
    return this.updatedAt
  }

  /**
   * Updates contact information
   */
  updateInfo(params: {
    type?: ContactType | null
    date?: Date
    notes?: string
    isNote?: boolean
  }): void {
    if (params.type !== undefined) {
      this.type = params.type
    }
    if (params.date !== undefined) {
      this.date = params.date
    }
    if (params.notes !== undefined) {
      this.notes = params.notes
    }
    if (params.isNote !== undefined) {
      this.isNote = params.isNote
    }
    this.updatedAt = new Date()
  }

  /**
   * Checks if this is a note (not a contact)
   */
  isNoteType(): boolean {
    return this.isNote
  }

  /**
   * Checks if this is an actual contact (not a note)
   */
  isContactType(): boolean {
    return !this.isNote
  }

  /**
   * Converts entity to plain object for persistence
   */
  toPersistence(): {
    id: string
    clientId: string
    type: ContactType | null
    date: Date
    notes: string
    isNote: boolean
    userId: string
    createdAt: Date
    updatedAt: Date
  } {
    return {
      id: this.id,
      clientId: this.clientId,
      type: this.type,
      date: this.date,
      notes: this.notes,
      isNote: this.isNote,
      userId: this.userId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}

