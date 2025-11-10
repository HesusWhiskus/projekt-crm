import { IClientRepository, ClientFilter } from '@/domain/clients/repositories/IClientRepository'
import { ClientDTO, ClientFilterDTO } from '../dto'
import { UserContext } from '@/application/shared/types/UserContext'
import { PrismaClientRepository } from '@/infrastructure/persistence/prisma'

/**
 * Use case for listing clients with filters
 */
export class ListClientsUseCase {
  constructor(private readonly clientRepository: IClientRepository) {}

  async execute(filter: ClientFilterDTO, user: UserContext): Promise<ClientDTO[]> {
    // Convert DTO filter to domain filter
    const domainFilter: ClientFilter = {
      status: filter.status,
      assignedTo: filter.assignedTo,
      search: filter.search,
      userId: user.id,
      userRole: user.role,
    }

    // Handle noContactDays filter
    if (filter.noContactDays) {
      const days = parseInt(filter.noContactDays)
      if (!isNaN(days) && days > 0) {
        domainFilter.noContactDays = days
      }
    }

    // Handle followUpToday filter
    if (filter.followUpToday === 'true') {
      domainFilter.followUpToday = true
    }

    // Check if repository supports findManyWithRelations (PrismaClientRepository)
    if (this.clientRepository instanceof PrismaClientRepository) {
      // Use optimized method that fetches relations in a single query
      const { clients, relations } = await this.clientRepository.findManyWithRelations(domainFilter, {
        include: {
          assignee: true,
          sharedGroups: true,
        },
        orderBy: {
          field: 'updatedAt',
          direction: 'desc',
        },
      })

      // Map clients to DTOs using pre-fetched relations
      return clients.map((client) => {
        const relationData = relations.get(client.getId()) || { assignee: null, sharedGroups: [] }
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
          assignee: relationData.assignee,
          sharedGroups: relationData.sharedGroups,
        } as ClientDTO
      })
    }

    // Fallback for other repository implementations
    const clients = await this.clientRepository.findMany(domainFilter, {
      include: {
        assignee: true,
        sharedGroups: true,
      },
      orderBy: {
        field: 'updatedAt',
        direction: 'desc',
      },
    })

    // Map clients to DTOs (without relations for fallback)
    return clients.map((client) => ({
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
      assignee: null,
      sharedGroups: [],
    } as ClientDTO))
  }
}

