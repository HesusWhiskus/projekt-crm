import { Client } from '@/domain/clients/entities/Client'
import {
  IClientRepository,
  ClientFilter,
  FindClientsOptions,
} from '@/domain/clients/repositories/IClientRepository'
import { db } from '@/lib/db'
import { ClientStatus } from '@prisma/client'

/**
 * Prisma implementation of IClientRepository
 */
export class PrismaClientRepository implements IClientRepository {
  async findById(id: string, options?: FindClientsOptions): Promise<Client | null> {
    // Build include based on options
    const include: any = {}
    if (options?.include?.assignee) {
      include.assignee = {
        select: {
          id: true,
          name: true,
          email: true,
        },
      }
    }
    if (options?.include?.sharedGroups) {
      include.sharedGroups = {
        select: {
          id: true,
          name: true,
        },
      }
    }

    const clientData = await db.client.findUnique({
      where: { id },
      include: Object.keys(include).length > 0 ? include : undefined,
    })

    if (!clientData) {
      return null
    }

    return Client.fromPersistence({
      id: clientData.id,
      firstName: clientData.firstName ?? "",
      lastName: clientData.lastName ?? "",
      agencyName: null,
      email: clientData.email,
      phone: clientData.phone,
      website: clientData.website,
      address: clientData.address,
      source: clientData.source,
      status: clientData.status,
      priority: clientData.priority,
      assignedTo: clientData.assignedTo,
      lastContactAt: clientData.lastContactAt,
      nextFollowUpAt: clientData.nextFollowUpAt,
      createdAt: clientData.createdAt,
      updatedAt: clientData.updatedAt,
    })
  }

  /**
   * Helper method to find client by ID with relations in a single query
   * Returns both Client entity and relation data
   */
  async findByIdWithRelations(
    id: string,
    options?: FindClientsOptions
  ): Promise<{
    client: Client | null
    relations: { assignee: any; sharedGroups: any[] }
  }> {
    // Build include based on options
    const include: any = {}
    if (options?.include?.assignee) {
      include.assignee = {
        select: {
          id: true,
          name: true,
          email: true,
        },
      }
    }
    if (options?.include?.sharedGroups) {
      include.sharedGroups = {
        select: {
          id: true,
          name: true,
        },
      }
    }

    const clientData = await db.client.findUnique({
      where: { id },
      include: Object.keys(include).length > 0 ? include : undefined,
    })

    if (!clientData) {
      return { client: null, relations: { assignee: null, sharedGroups: [] } }
    }

    const client = Client.fromPersistence({
      id: clientData.id,
      firstName: clientData.firstName ?? "",
      lastName: clientData.lastName ?? "",
      agencyName: null,
      email: clientData.email,
      phone: clientData.phone,
      website: clientData.website,
      address: clientData.address,
      source: clientData.source,
      status: clientData.status,
      priority: clientData.priority,
      assignedTo: clientData.assignedTo,
      lastContactAt: clientData.lastContactAt,
      nextFollowUpAt: clientData.nextFollowUpAt,
      createdAt: clientData.createdAt,
      updatedAt: clientData.updatedAt,
    })

    return {
      client,
      relations: {
        assignee: (clientData as any).assignee || null,
        sharedGroups: (clientData as any).sharedGroups || [],
      },
    }
  }

  async findMany(filter: ClientFilter, options?: FindClientsOptions): Promise<Client[]> {
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

    // Search filter
    if (filter.search) {
      where.OR = [
        ...(where.OR || []),
        { firstName: { contains: filter.search, mode: 'insensitive' } },
        { lastName: { contains: filter.search, mode: 'insensitive' } },
        { email: { contains: filter.search, mode: 'insensitive' } },
      ]
    }

    // AssignedTo filter
    if (filter.assignedTo) {
      where.assignedTo = filter.assignedTo
    }

    // No contact days filter
    if (filter.noContactDays) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - filter.noContactDays)
      cutoffDate.setHours(0, 0, 0, 0)

      where.OR = [
        ...(where.OR || []),
        { lastContactAt: { lt: cutoffDate } },
        { lastContactAt: null },
      ]
    }

    // Follow-up today filter
    if (filter.followUpToday) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      where.nextFollowUpAt = {
        gte: today,
        lt: tomorrow,
      }
    }

    // Order by
    const orderBy: any = {}
    if (options?.orderBy) {
      const fieldMap: Record<string, string> = {
        updatedAt: 'updatedAt',
        createdAt: 'createdAt',
        lastContactAt: 'lastContactAt',
        nextFollowUpAt: 'nextFollowUpAt',
      }
      orderBy[fieldMap[options.orderBy.field] || 'updatedAt'] = options.orderBy.direction
    } else {
      orderBy.updatedAt = 'desc'
    }

    // Build include based on options
    const include: any = {}
    if (options?.include?.assignee) {
      include.assignee = {
        select: {
          id: true,
          name: true,
          email: true,
        },
      }
    }
    if (options?.include?.sharedGroups) {
      include.sharedGroups = {
        select: {
          id: true,
          name: true,
        },
      }
    }

    const clientsData = await db.client.findMany({
      where,
      orderBy,
      include: Object.keys(include).length > 0 ? include : undefined,
    })

      return clientsData.map((data) =>
      Client.fromPersistence({
        id: data.id,
        firstName: data.firstName ?? "",
        lastName: data.lastName ?? "",
        agencyName: null,
        email: data.email,
        phone: data.phone,
        website: data.website,
        address: data.address,
        source: data.source,
        status: data.status,
        priority: data.priority,
        assignedTo: data.assignedTo,
        lastContactAt: data.lastContactAt,
        nextFollowUpAt: data.nextFollowUpAt,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      })
    )
  }

  async save(client: Client): Promise<Client> {
    const exists = await this.exists(client.getId())
    if (exists) {
      return this.update(client)
    } else {
      return this.create(client)
    }
  }

  async create(client: Client): Promise<Client> {
    const data = client.toPersistence()

    // Prisma will auto-generate CUID if ID is not provided
    // Don't include ID in createData - let Prisma generate it
    const createData: any = {
      firstName: data.firstName,
      lastName: data.lastName,
      type: data.agencyName ? "COMPANY" : "PERSON",
      email: data.email,
      phone: data.phone,
      website: data.website,
      address: data.address,
      source: data.source,
      status: data.status,
      priority: data.priority,
      assignedTo: data.assignedTo,
      lastContactAt: data.lastContactAt,
      nextFollowUpAt: data.nextFollowUpAt,
    }

    const created = await db.client.create({
      data: createData,
    })

    return Client.fromPersistence({
      id: created.id,
      firstName: created.firstName ?? "",
      lastName: created.lastName ?? "",
      agencyName: null,
      email: created.email,
      phone: created.phone,
      website: created.website,
      address: created.address,
      source: created.source,
      status: created.status,
      priority: created.priority,
      assignedTo: created.assignedTo,
      lastContactAt: created.lastContactAt,
      nextFollowUpAt: created.nextFollowUpAt,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    })
  }

  async update(client: Client): Promise<Client> {
    const data = client.toPersistence()

    const updated = await db.client.update({
      where: { id: client.getId() },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        type: (data.agencyName ? "COMPANY" : "PERSON") as any,
        email: data.email,
        phone: data.phone,
        website: data.website,
        address: data.address,
        source: data.source,
        status: data.status,
        priority: data.priority,
        assignedTo: data.assignedTo,
        lastContactAt: data.lastContactAt,
        nextFollowUpAt: data.nextFollowUpAt,
        updatedAt: data.updatedAt,
      },
    })

    return Client.fromPersistence({
      id: updated.id,
      firstName: updated.firstName ?? "",
      lastName: updated.lastName ?? "",
      agencyName: null,
      email: updated.email,
      phone: updated.phone,
      website: updated.website,
      address: updated.address,
      source: updated.source,
      status: updated.status,
      priority: updated.priority,
      assignedTo: updated.assignedTo,
      lastContactAt: updated.lastContactAt,
      nextFollowUpAt: updated.nextFollowUpAt,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    })
  }

  async delete(id: string): Promise<void> {
    await db.client.delete({
      where: { id },
    })
  }

  async exists(id: string): Promise<boolean> {
    const count = await db.client.count({
      where: { id },
    })
    return count > 0
  }

  async updateLastContact(clientId: string, contactDate: Date): Promise<void> {
    await db.client.update({
      where: { id: clientId },
      data: { lastContactAt: contactDate },
    })
  }

  /**
   * Helper method to find clients with relations in a single query
   * Returns both Client entities and relation data
   */
  async findManyWithRelations(
    filter: ClientFilter,
    options?: FindClientsOptions
  ): Promise<{
    clients: Client[]
    relations: Map<string, { assignee: any; sharedGroups: any[] }>
  }> {
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

    // Search filter
    if (filter.search) {
      where.OR = [
        ...(where.OR || []),
        { firstName: { contains: filter.search, mode: 'insensitive' } },
        { lastName: { contains: filter.search, mode: 'insensitive' } },
        { email: { contains: filter.search, mode: 'insensitive' } },
      ]
    }

    // AssignedTo filter
    if (filter.assignedTo) {
      where.assignedTo = filter.assignedTo
    }

    // No contact days filter
    if (filter.noContactDays) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - filter.noContactDays)
      cutoffDate.setHours(0, 0, 0, 0)

      where.OR = [
        ...(where.OR || []),
        { lastContactAt: { lt: cutoffDate } },
        { lastContactAt: null },
      ]
    }

    // Follow-up today filter
    if (filter.followUpToday) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      where.nextFollowUpAt = {
        gte: today,
        lt: tomorrow,
      }
    }

    // Order by
    const orderBy: any = {}
    if (options?.orderBy) {
      const fieldMap: Record<string, string> = {
        updatedAt: 'updatedAt',
        createdAt: 'createdAt',
        lastContactAt: 'lastContactAt',
        nextFollowUpAt: 'nextFollowUpAt',
      }
      orderBy[fieldMap[options.orderBy.field] || 'updatedAt'] = options.orderBy.direction
    } else {
      orderBy.updatedAt = 'desc'
    }

    // Build include based on options
    const include: any = {}
    if (options?.include?.assignee) {
      include.assignee = {
        select: {
          id: true,
          name: true,
          email: true,
        },
      }
    }
    if (options?.include?.sharedGroups) {
      include.sharedGroups = {
        select: {
          id: true,
          name: true,
        },
      }
    }

    const clientsData = await db.client.findMany({
      where,
      orderBy,
      include: Object.keys(include).length > 0 ? include : undefined,
    })

    const clients = clientsData.map((data) =>
      Client.fromPersistence({
        id: data.id,
        firstName: data.firstName ?? "",
        lastName: data.lastName ?? "",
        agencyName: null,
        email: data.email,
        phone: data.phone,
        website: data.website,
        address: data.address,
        source: data.source,
        status: data.status,
        priority: data.priority,
        assignedTo: data.assignedTo,
        lastContactAt: data.lastContactAt,
        nextFollowUpAt: data.nextFollowUpAt,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      })
    )

    // Extract relations
    const relations = new Map<string, { assignee: any; sharedGroups: any[] }>()
    clientsData.forEach((data) => {
      relations.set(data.id, {
        assignee: (data as any).assignee || null,
        sharedGroups: (data as any).sharedGroups || [],
      })
    })

    return { clients, relations }
  }
}

