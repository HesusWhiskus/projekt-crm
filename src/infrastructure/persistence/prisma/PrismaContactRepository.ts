import {
  IContactRepository,
  ContactFilter,
  FindContactsOptions,
} from '@/domain/contacts/repositories/IContactRepository'
import { Contact } from '@/domain/contacts/entities/Contact'
import { db } from '@/lib/db'
import { ContactType } from '@prisma/client'

/**
 * Prisma implementation of IContactRepository
 */
export class PrismaContactRepository implements IContactRepository {
  async findById(id: string, options?: FindContactsOptions): Promise<Contact | null> {
    const contactData = await db.contact.findUnique({
      where: { id },
    })

    if (!contactData) {
      return null
    }

    return this.toDomain(contactData)
  }

  async findMany(filter: ContactFilter, options?: FindContactsOptions): Promise<Contact[]> {
    const where: any = {}

    // Access control
    if (filter.userRole !== 'ADMIN') {
      where.OR = [
        {
          client: {
            OR: [
              { assignedTo: filter.userIdForAccess },
              { sharedGroups: { some: { users: { some: { userId: filter.userIdForAccess } } } } },
            ],
          },
        },
        {
          sharedGroups: {
            some: {
              users: {
                some: {
                  userId: filter.userIdForAccess,
                },
              },
            },
          },
        },
      ]
    }

    // Client filter
    if (filter.clientId) {
      where.clientId = filter.clientId
    }

    // Type filter
    if (filter.type !== undefined) {
      where.type = filter.type
    }

    // User filter
    if (filter.userId) {
      where.userId = filter.userId
    }

    // IsNote filter
    if (filter.isNote !== undefined) {
      where.isNote = filter.isNote
    }

    // Order by
    const orderBy: any = {}
    if (options?.orderBy) {
      const fieldMap: Record<string, string> = {
        date: 'date',
        createdAt: 'createdAt',
      }
      orderBy[fieldMap[options.orderBy.field] || 'date'] = options.orderBy.direction
    } else {
      orderBy.date = 'desc'
    }

    const contactsData = await db.contact.findMany({
      where,
      orderBy,
    })

    return contactsData.map((data) => Contact.fromPersistence(data))
  }

  async create(contact: Contact): Promise<Contact> {
    const data = contact.toPersistence()

    const created = await db.contact.create({
      data: {
        id: data.id,
        clientId: data.clientId,
        type: data.type,
        date: data.date,
        notes: data.notes,
        isNote: data.isNote,
        userId: data.userId,
      },
    })

    return Contact.fromPersistence({
      id: created.id,
      clientId: created.clientId,
      type: created.type,
      date: created.date,
      notes: created.notes,
      isNote: created.isNote,
      userId: created.userId,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    })
  }

  async update(contact: Contact): Promise<Contact> {
    const data = contact.toPersistence()

    const updated = await db.contact.update({
      where: { id: contact.getId() },
      data: {
        type: data.type,
        date: data.date,
        notes: data.notes,
        isNote: data.isNote,
        userId: data.userId,
        clientId: data.clientId,
        updatedAt: data.updatedAt,
      },
    })

    return Contact.fromPersistence({
      id: updated.id,
      clientId: updated.clientId,
      type: updated.type,
      date: updated.date,
      notes: updated.notes,
      isNote: updated.isNote,
      userId: updated.userId,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    })
  }

  async delete(id: string): Promise<void> {
    await db.contact.delete({
      where: { id },
    })
  }

  async exists(id: string): Promise<boolean> {
    const count = await db.contact.count({
      where: { id },
    })
    return count > 0
  }

}

