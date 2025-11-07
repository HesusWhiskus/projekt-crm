import {
  ITaskRepository,
  TaskFilter,
  FindTasksOptions,
} from '@/domain/tasks/repositories/ITaskRepository'
import { Task } from '@/domain/tasks/entities/Task'
import { db } from '@/lib/db'
import { TaskStatus } from '@prisma/client'

/**
 * Prisma implementation of ITaskRepository
 */
export class PrismaTaskRepository implements ITaskRepository {
  async findById(id: string, options?: FindTasksOptions): Promise<Task | null> {
    const taskData = await db.task.findUnique({
      where: { id },
    })

    if (!taskData) {
      return null
    }

    return Task.fromPersistence({
      id: taskData.id,
      title: taskData.title,
      description: taskData.description,
      dueDate: taskData.dueDate,
      status: taskData.status,
      assignedTo: taskData.assignedTo,
      clientId: taskData.clientId,
      createdAt: taskData.createdAt,
      updatedAt: taskData.updatedAt,
    })
  }

  async findMany(filter: TaskFilter, options?: FindTasksOptions): Promise<Task[]> {
    const where: any = {}

    // Access control
    if (filter.userRole !== 'ADMIN') {
      where.OR = [
        { assignedTo: filter.userId },
        { sharedGroups: { some: { users: { some: { userId: filter.userId } } } } },
      ]
    }

    // Status filter
    if (filter.status) {
      where.status = filter.status
    }

    // AssignedTo filter
    if (filter.assignedTo) {
      where.assignedTo = filter.assignedTo
    }

    // Client filter
    if (filter.clientId) {
      where.clientId = filter.clientId
    }

    // Order by
    const orderBy: any = {}
    if (options?.orderBy) {
      const fieldMap: Record<string, string> = {
        dueDate: 'dueDate',
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
      }
      orderBy[fieldMap[options.orderBy.field] || 'dueDate'] = options.orderBy.direction
    } else {
      orderBy.dueDate = 'asc'
    }

    const tasksData = await db.task.findMany({
      where,
      orderBy,
    })

    return tasksData.map((data) => Task.fromPersistence(data))
  }

  async create(task: Task): Promise<Task> {
    const data = task.toPersistence()

    const created = await db.task.create({
      data: {
        id: data.id,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
        status: data.status,
        assignedTo: data.assignedTo,
        clientId: data.clientId,
      },
    })

    return Task.fromPersistence({
      id: created.id,
      title: created.title,
      description: created.description,
      dueDate: created.dueDate,
      status: created.status,
      assignedTo: created.assignedTo,
      clientId: created.clientId,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    })
  }

  async update(task: Task): Promise<Task> {
    const data = task.toPersistence()

    const updated = await db.task.update({
      where: { id: task.getId() },
      data: {
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
        status: data.status,
        assignedTo: data.assignedTo,
        clientId: data.clientId,
        updatedAt: data.updatedAt,
      },
    })

    return Task.fromPersistence({
      id: updated.id,
      title: updated.title,
      description: updated.description,
      dueDate: updated.dueDate,
      status: updated.status,
      assignedTo: updated.assignedTo,
      clientId: updated.clientId,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    })
  }

  async delete(id: string): Promise<void> {
    await db.task.delete({
      where: { id },
    })
  }

  async exists(id: string): Promise<boolean> {
    const count = await db.task.count({
      where: { id },
    })
    return count > 0
  }

}

