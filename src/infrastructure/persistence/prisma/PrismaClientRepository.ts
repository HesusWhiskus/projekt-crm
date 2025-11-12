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
    // Build select based on options
    // NOTE: companyName and taxId temporarily removed from select until migration is applied
    const select: any = {
      id: true,
      firstName: true,
      lastName: true,
      type: true,
      // companyName: true, // Temporarily disabled - column doesn't exist in DB yet
      // taxId: true, // Temporarily disabled - column doesn't exist in DB yet
      email: true,
      phone: true,
      website: true,
      address: true,
      source: true,
      status: true,
      priority: true,
      assignedTo: true,
      lastContactAt: true,
      nextFollowUpAt: true,
      createdAt: true,
      updatedAt: true,
    }
    
    if (options?.include?.assignee) {
      select.assignee = {
        select: {
          id: true,
          name: true,
          email: true,
        },
      }
    }
    if (options?.include?.sharedGroups) {
      select.sharedGroups = {
        select: {
          id: true,
          name: true,
        },
      }
    }

    const clientData = await db.client.findUnique({
      where: { id },
      select,
    })

    if (!clientData) {
      return null
    }

    const data = clientData as any
    return Client.fromPersistence({
      id: data.id,
      firstName: data.firstName ?? "",
      lastName: data.lastName ?? "",
      agencyName: (data.companyName ?? null) as string | null, // Will be null until migration
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
    // Build select based on options
    // NOTE: companyName and taxId temporarily removed from select until migration is applied
    const select: any = {
      id: true,
      firstName: true,
      lastName: true,
      type: true,
      // companyName: true, // Temporarily disabled - column doesn't exist in DB yet
      // taxId: true, // Temporarily disabled - column doesn't exist in DB yet
      email: true,
      phone: true,
      website: true,
      address: true,
      source: true,
      status: true,
      priority: true,
      assignedTo: true,
      lastContactAt: true,
      nextFollowUpAt: true,
      createdAt: true,
      updatedAt: true,
    }
    
    if (options?.include?.assignee) {
      select.assignee = {
        select: {
          id: true,
          name: true,
          email: true,
        },
      }
    }
    if (options?.include?.sharedGroups) {
      select.sharedGroups = {
        select: {
          id: true,
          name: true,
        },
      }
    }

    const clientData = await db.client.findUnique({
      where: { id },
      select,
    })

    if (!clientData) {
      return { client: null, relations: { assignee: null, sharedGroups: [] } }
    }

    const data = clientData as any
    const client = Client.fromPersistence({
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

    return {
      client,
      relations: {
        assignee: data.assignee || null,
        sharedGroups: data.sharedGroups || [],
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
        // { companyName: { contains: filter.search, mode: 'insensitive' } }, // Temporarily disabled - column doesn't exist in DB yet
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

    // Build select based on options
    // NOTE: companyName and taxId temporarily removed from select until migration is applied
    const select: any = {
      id: true,
      firstName: true,
      lastName: true,
      type: true,
      // companyName: true, // Temporarily disabled - column doesn't exist in DB yet
      // taxId: true, // Temporarily disabled - column doesn't exist in DB yet
      email: true,
      phone: true,
      website: true,
      address: true,
      source: true,
      status: true,
      priority: true,
      assignedTo: true,
      lastContactAt: true,
      nextFollowUpAt: true,
      createdAt: true,
      updatedAt: true,
    }
    
    if (options?.include?.assignee) {
      select.assignee = {
        select: {
          id: true,
          name: true,
          email: true,
        },
      }
    }
    if (options?.include?.sharedGroups) {
      select.sharedGroups = {
        select: {
          id: true,
          name: true,
        },
      }
    }

    const clientsData = await db.client.findMany({
      where,
      orderBy,
      select,
    })

      return clientsData.map((item: any) =>
      Client.fromPersistence({
        id: item.id,
        firstName: item.firstName ?? "",
        lastName: item.lastName ?? "",
        agencyName: item.companyName ?? null,
        email: item.email,
        phone: item.phone,
        website: item.website,
        address: item.address,
        source: item.source,
        status: item.status,
        priority: item.priority,
        assignedTo: item.assignedTo,
        lastContactAt: item.lastContactAt,
        nextFollowUpAt: item.nextFollowUpAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
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
      // companyName: data.agencyName || null, // Temporarily disabled - will be enabled after migration
      // taxId: null, // Temporarily disabled - will be enabled after migration
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
      agencyName: created.companyName ?? null,
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
        // companyName: data.agencyName || null, // Temporarily disabled - will be enabled after migration
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
      agencyName: updated.companyName ?? null,
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
        // { companyName: { contains: filter.search, mode: 'insensitive' } }, // Temporarily disabled - column doesn't exist in DB yet
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

    // Build select based on options
    // NOTE: companyName and taxId temporarily removed from select until migration is applied
    const select: any = {
      id: true,
      firstName: true,
      lastName: true,
      type: true,
      // companyName: true, // Temporarily disabled - column doesn't exist in DB yet
      // taxId: true, // Temporarily disabled - column doesn't exist in DB yet
      email: true,
      phone: true,
      website: true,
      address: true,
      source: true,
      status: true,
      priority: true,
      assignedTo: true,
      lastContactAt: true,
      nextFollowUpAt: true,
      createdAt: true,
      updatedAt: true,
    }
    
    if (options?.include?.assignee) {
      select.assignee = {
        select: {
          id: true,
          name: true,
          email: true,
        },
      }
    }
    if (options?.include?.sharedGroups) {
      select.sharedGroups = {
        select: {
          id: true,
          name: true,
        },
      }
    }

    const clientsData = await db.client.findMany({
      where,
      orderBy,
      select,
    })

    const clients = clientsData.map((item: any) =>
      Client.fromPersistence({
        id: item.id,
        firstName: item.firstName ?? "",
        lastName: item.lastName ?? "",
        agencyName: item.companyName ?? null,
        email: item.email,
        phone: item.phone,
        website: item.website,
        address: item.address,
        source: item.source,
        status: item.status,
        priority: item.priority,
        assignedTo: item.assignedTo,
        lastContactAt: item.lastContactAt,
        nextFollowUpAt: item.nextFollowUpAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })
    )

    // Extract relations
    const relations = new Map<string, { assignee: any; sharedGroups: any[] }>()
    clientsData.forEach((item: any) => {
      relations.set(item.id, {
        assignee: item.assignee || null,
        sharedGroups: item.sharedGroups || [],
      })
    })

    return { clients, relations }
  }
}

