import { IClientRepository } from '@/domain/clients/repositories/IClientRepository'
import { ClientDTO } from '../dto'
import { UserContext } from '@/application/shared/types/UserContext'
import { PrismaClientRepository } from '@/infrastructure/persistence/prisma'
import { db } from '@/lib/db'

/**
 * Use case for getting a single client
 */
export class GetClientUseCase {
  constructor(private readonly clientRepository: IClientRepository) {}

  async execute(clientId: string, user: UserContext): Promise<ClientDTO> {
    // Check if repository supports findByIdWithRelations (PrismaClientRepository)
    if (this.clientRepository instanceof PrismaClientRepository) {
      // Use optimized method that fetches relations in a single query
      const { client, relations } = await this.clientRepository.findByIdWithRelations(clientId, {
        include: {
          assignee: true,
          sharedGroups: true,
          // Removed contacts, tasks, statusHistory - not used in DTO
        },
      })

      if (!client) {
        throw new Error('Klient nie znaleziony')
      }

      // Check authorization
      if (
        user.role !== 'ADMIN' &&
        client.getAssignedTo() !== user.id &&
        !(await this.hasGroupAccess(clientId, user.id))
      ) {
        throw new Error('Brak uprawnień')
      }

      return {
        id: client.getId(),
        firstName: client.getFirstName().getValue(),
        lastName: client.getLastName().getValue(),
        agencyName: client.getAgencyName().getValue(),
        email: client.getEmail()?.getValue() || null,
        phone: client.getPhone()?.getValue() || null,
        website: client.getWebsite()?.getValue() || null,
        address: client.getAddress(),
        source: client.getSource(),
        status: client.getStatus(),
        priority: client.getPriority(),
        assignedTo: client.getAssignedTo(),
        lastContactAt: client.getLastContactAt(),
        nextFollowUpAt: client.getNextFollowUpAt(),
        createdAt: client.getCreatedAt(),
        updatedAt: client.getUpdatedAt(),
        assignee: relations.assignee,
        sharedGroups: relations.sharedGroups,
      }
    }

    // Fallback for other repository implementations
    const client = await this.clientRepository.findById(clientId, {
      include: {
        assignee: true,
        sharedGroups: true,
      },
    })

    if (!client) {
      throw new Error('Klient nie znaleziony')
    }

    // Check authorization
    if (
      user.role !== 'ADMIN' &&
      client.getAssignedTo() !== user.id &&
      !(await this.hasGroupAccess(clientId, user.id))
    ) {
      throw new Error('Brak uprawnień')
    }

    // Get related data from database (fallback)
    const [assignee, sharedGroups] = await Promise.all([
      client.getAssignedTo()
        ? db.user.findUnique({
            where: { id: client.getAssignedTo()! },
            select: { id: true, name: true, email: true },
          })
        : null,
      db.group.findMany({
        where: {
          sharedClients: {
            some: { id: clientId },
          },
        },
        select: { id: true, name: true },
      }),
    ])

    return {
      id: client.getId(),
      firstName: client.getFirstName().getValue(),
      lastName: client.getLastName().getValue(),
      agencyName: client.getAgencyName().getValue(),
      email: client.getEmail()?.getValue() || null,
      phone: client.getPhone()?.getValue() || null,
      website: client.getWebsite()?.getValue() || null,
      address: client.getAddress(),
      source: client.getSource(),
      status: client.getStatus(),
      priority: client.getPriority(),
      assignedTo: client.getAssignedTo(),
      lastContactAt: client.getLastContactAt(),
      nextFollowUpAt: client.getNextFollowUpAt(),
      createdAt: client.getCreatedAt(),
      updatedAt: client.getUpdatedAt(),
      assignee,
      sharedGroups,
    }
  }

  private async hasGroupAccess(clientId: string, userId: string): Promise<boolean> {
    const client = await db.client.findUnique({
      where: { id: clientId },
      include: {
        sharedGroups: {
          include: {
            users: {
              where: { userId },
            },
          },
        },
      },
    })

    return client?.sharedGroups.some((g) => g.users.length > 0) || false
  }
}

