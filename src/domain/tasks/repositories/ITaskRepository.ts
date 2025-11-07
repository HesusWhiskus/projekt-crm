import { TaskStatus } from '@prisma/client'
import { Task } from '../entities/Task'

/**
 * Filter criteria for finding tasks
 */
export interface TaskFilter {
  status?: TaskStatus
  assignedTo?: string
  clientId?: string
  userId?: string // For access control
  userRole?: 'ADMIN' | 'USER'
}

/**
 * Options for finding tasks
 */
export interface FindTasksOptions {
  include?: {
    assignee?: boolean
    client?: boolean
    sharedGroups?: boolean
  }
  orderBy?: {
    field: 'dueDate' | 'createdAt' | 'updatedAt'
    direction: 'asc' | 'desc'
  }
}

/**
 * Task Repository Interface
 * Defines the contract for task data access
 */
export interface ITaskRepository {
  /**
   * Finds a task by ID
   */
  findById(id: string, options?: FindTasksOptions): Promise<Task | null>

  /**
   * Finds multiple tasks based on filter criteria
   */
  findMany(filter: TaskFilter, options?: FindTasksOptions): Promise<Task[]>

  /**
   * Creates a new task
   */
  create(task: Task): Promise<Task>

  /**
   * Updates an existing task
   */
  update(task: Task): Promise<Task>

  /**
   * Deletes a task by ID
   */
  delete(id: string): Promise<void>

  /**
   * Checks if a task exists
   */
  exists(id: string): Promise<boolean>
}

