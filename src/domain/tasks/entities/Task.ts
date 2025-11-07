import { TaskStatus } from '@prisma/client'

/**
 * Task Entity
 * Domain entity representing a task with business logic
 */
export class Task {
  private constructor(
    private readonly id: string,
    private title: string,
    private description: string | null,
    private dueDate: Date | null,
    private status: TaskStatus,
    private assignedTo: string | null,
    private clientId: string | null,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  /**
   * Creates a new Task entity
   */
  static create(params: {
    id: string
    title: string
    description: string | null
    dueDate: Date | null
    status: TaskStatus
    assignedTo: string | null
    clientId: string | null
    createdAt?: Date
    updatedAt?: Date
  }): Task {
    return new Task(
      params.id,
      params.title,
      params.description,
      params.dueDate,
      params.status,
      params.assignedTo,
      params.clientId,
      params.createdAt || new Date(),
      params.updatedAt || new Date()
    )
  }

  /**
   * Reconstructs Task from persistence
   */
  static fromPersistence(data: {
    id: string
    title: string
    description: string | null
    dueDate: Date | null
    status: TaskStatus
    assignedTo: string | null
    clientId: string | null
    createdAt: Date
    updatedAt: Date
  }): Task {
    return new Task(
      data.id,
      data.title,
      data.description,
      data.dueDate,
      data.status,
      data.assignedTo,
      data.clientId,
      data.createdAt,
      data.updatedAt
    )
  }

  // Getters
  getId(): string {
    return this.id
  }

  getTitle(): string {
    return this.title
  }

  getDescription(): string | null {
    return this.description
  }

  getDueDate(): Date | null {
    return this.dueDate
  }

  getStatus(): TaskStatus {
    return this.status
  }

  getAssignedTo(): string | null {
    return this.assignedTo
  }

  getClientId(): string | null {
    return this.clientId
  }

  getCreatedAt(): Date {
    return this.createdAt
  }

  getUpdatedAt(): Date {
    return this.updatedAt
  }

  /**
   * Changes task status
   */
  changeStatus(newStatus: TaskStatus): void {
    if (this.status === newStatus) {
      return // No change needed
    }

    this.status = newStatus
    this.updatedAt = new Date()
  }

  /**
   * Assigns task to a user
   */
  assignTo(userId: string | null): void {
    this.assignedTo = userId
    this.updatedAt = new Date()
  }

  /**
   * Updates task information
   */
  updateInfo(params: {
    title?: string
    description?: string | null
    dueDate?: Date | null
    clientId?: string | null
  }): void {
    if (params.title !== undefined) {
      this.title = params.title
    }
    if (params.description !== undefined) {
      this.description = params.description
    }
    if (params.dueDate !== undefined) {
      this.dueDate = params.dueDate
    }
    if (params.clientId !== undefined) {
      this.clientId = params.clientId
    }
    this.updatedAt = new Date()
  }

  /**
   * Checks if task is overdue
   */
  isOverdue(): boolean {
    if (!this.dueDate || this.status === 'COMPLETED') {
      return false
    }

    return this.dueDate < new Date()
  }

  /**
   * Checks if task is due today
   */
  isDueToday(): boolean {
    if (!this.dueDate) {
      return false
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return this.dueDate >= today && this.dueDate < tomorrow
  }

  /**
   * Converts entity to plain object for persistence
   */
  toPersistence(): {
    id: string
    title: string
    description: string | null
    dueDate: Date | null
    status: TaskStatus
    assignedTo: string | null
    clientId: string | null
    createdAt: Date
    updatedAt: Date
  } {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      dueDate: this.dueDate,
      status: this.status,
      assignedTo: this.assignedTo,
      clientId: this.clientId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}

