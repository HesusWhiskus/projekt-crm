import { ClientStatus, ClientPriority } from '@prisma/client'
import { Email, Phone, Website, ClientName, AgencyName } from '../value-objects'

/**
 * Client Entity
 * Domain entity representing a client with business logic
 */
export class Client {
  private constructor(
    private readonly id: string,
    private firstName: ClientName,
    private lastName: ClientName,
    private agencyName: AgencyName,
    private email: Email | null,
    private phone: Phone | null,
    private website: Website | null,
    private address: string | null,
    private source: string | null,
    private status: ClientStatus,
    private priority: ClientPriority | null,
    private assignedTo: string | null,
    private lastContactAt: Date | null,
    private nextFollowUpAt: Date | null,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  /**
   * Creates a new Client entity
   */
  static create(params: {
    id: string
    firstName: ClientName
    lastName: ClientName
    agencyName: AgencyName
    email: Email | null
    phone: Phone | null
    website: Website | null
    address: string | null
    source: string | null
    status: ClientStatus
    priority: ClientPriority | null
    assignedTo: string | null
    nextFollowUpAt: Date | null
    createdAt?: Date
    updatedAt?: Date
  }): Client {
    return new Client(
      params.id,
      params.firstName,
      params.lastName,
      params.agencyName,
      params.email,
      params.phone,
      params.website,
      params.address,
      params.source,
      params.status,
      params.priority,
      params.assignedTo,
      null, // lastContactAt starts as null
      params.nextFollowUpAt,
      params.createdAt || new Date(),
      params.updatedAt || new Date()
    )
  }

  /**
   * Reconstructs Client from persistence
   */
  static fromPersistence(data: {
    id: string
    firstName: string
    lastName: string
    agencyName: string | null
    email: string | null
    phone: string | null
    website: string | null
    address: string | null
    source: string | null
    status: ClientStatus
    priority: ClientPriority | null
    assignedTo: string | null
    lastContactAt: Date | null
    nextFollowUpAt: Date | null
    createdAt: Date
    updatedAt: Date
  }): Client {
    return new Client(
      data.id,
      ClientName.fromValidated(data.firstName),
      ClientName.fromValidated(data.lastName),
      AgencyName.fromValidated(data.agencyName),
      data.email ? Email.fromValidated(data.email) : null,
      data.phone ? Phone.fromValidated(data.phone) : null,
      data.website ? Website.fromValidated(data.website) : null,
      data.address,
      data.source,
      data.status,
      data.priority,
      data.assignedTo,
      data.lastContactAt,
      data.nextFollowUpAt,
      data.createdAt,
      data.updatedAt
    )
  }

  // Getters
  getId(): string {
    return this.id
  }

  getFirstName(): ClientName {
    return this.firstName
  }

  getLastName(): ClientName {
    return this.lastName
  }

  getAgencyName(): AgencyName {
    return this.agencyName
  }

  getEmail(): Email | null {
    return this.email
  }

  getPhone(): Phone | null {
    return this.phone
  }

  getWebsite(): Website | null {
    return this.website
  }

  getAddress(): string | null {
    return this.address
  }

  getSource(): string | null {
    return this.source
  }

  getStatus(): ClientStatus {
    return this.status
  }

  getPriority(): ClientPriority | null {
    return this.priority
  }

  getAssignedTo(): string | null {
    return this.assignedTo
  }

  getLastContactAt(): Date | null {
    return this.lastContactAt
  }

  getNextFollowUpAt(): Date | null {
    return this.nextFollowUpAt
  }

  getCreatedAt(): Date {
    return this.createdAt
  }

  getUpdatedAt(): Date {
    return this.updatedAt
  }

  /**
   * Changes client status
   * Business rule: Status change should be tracked
   */
  changeStatus(newStatus: ClientStatus, changedBy: string | null): void {
    if (this.status === newStatus) {
      return // No change needed
    }

    // Business rule: Validate status transition if needed
    // For now, allow any transition, but this could be enhanced
    this.status = newStatus
    this.updatedAt = new Date()
  }

  /**
   * Updates client priority
   */
  updatePriority(priority: ClientPriority | null): void {
    this.priority = priority
    this.updatedAt = new Date()
  }

  /**
   * Assigns client to a user
   */
  assignTo(userId: string | null): void {
    this.assignedTo = userId
    this.updatedAt = new Date()
  }

  /**
   * Updates last contact date
   * Business rule: Only update if the new date is more recent
   */
  updateLastContact(contactDate: Date): void {
    if (!this.lastContactAt || contactDate > this.lastContactAt) {
      this.lastContactAt = contactDate
      this.updatedAt = new Date()
    }
  }

  /**
   * Sets next follow-up date
   */
  setNextFollowUp(date: Date | null): void {
    this.nextFollowUpAt = date
    this.updatedAt = new Date()
  }

  /**
   * Updates client basic information
   */
  updateInfo(params: {
    firstName?: ClientName
    lastName?: ClientName
    agencyName?: AgencyName
    email?: Email | null
    phone?: Phone | null
    website?: Website | null
    address?: string | null
    source?: string | null
  }): void {
    if (params.firstName !== undefined) {
      this.firstName = params.firstName
    }
    if (params.lastName !== undefined) {
      this.lastName = params.lastName
    }
    if (params.agencyName !== undefined) {
      this.agencyName = params.agencyName
    }
    if (params.email !== undefined) {
      this.email = params.email
    }
    if (params.phone !== undefined) {
      this.phone = params.phone
    }
    if (params.website !== undefined) {
      this.website = params.website
    }
    if (params.address !== undefined) {
      this.address = params.address
    }
    if (params.source !== undefined) {
      this.source = params.source
    }
    this.updatedAt = new Date()
  }

  /**
   * Checks if client has no contact for specified days
   */
  hasNoContactForDays(days: number): boolean {
    if (!this.lastContactAt) {
      return true // Never contacted
    }

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    cutoffDate.setHours(0, 0, 0, 0)

    return this.lastContactAt < cutoffDate
  }

  /**
   * Checks if follow-up is due today
   */
  isFollowUpDueToday(): boolean {
    if (!this.nextFollowUpAt) {
      return false
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return (
      this.nextFollowUpAt >= today && this.nextFollowUpAt < tomorrow
    )
  }

  /**
   * Converts entity to plain object for persistence
   */
  toPersistence(): {
    id: string
    firstName: string
    lastName: string
    agencyName: string | null
    email: string | null
    phone: string | null
    website: string | null
    address: string | null
    source: string | null
    status: ClientStatus
    priority: ClientPriority | null
    assignedTo: string | null
    lastContactAt: Date | null
    nextFollowUpAt: Date | null
    createdAt: Date
    updatedAt: Date
  } {
    return {
      id: this.id,
      firstName: this.firstName.getValue(),
      lastName: this.lastName.getValue(),
      agencyName: this.agencyName.getValue(),
      email: this.email?.getValue() || null,
      phone: this.phone?.getValue() || null,
      website: this.website?.getValue() || null,
      address: this.address,
      source: this.source,
      status: this.status,
      priority: this.priority,
      assignedTo: this.assignedTo,
      lastContactAt: this.lastContactAt,
      nextFollowUpAt: this.nextFollowUpAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}

