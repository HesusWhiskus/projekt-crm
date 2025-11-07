import { IClientRepository, ClientFilter } from '@/domain/clients/repositories/IClientRepository'
import { ClientDTO, ClientFilterDTO } from '../dto'
import { UserContext } from '@/application/shared/types/UserContext'
import { db } from '@/lib/db'

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

    // Find clients
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

    // Get related data for each client
    const clientsWithRelations = await Promise.all(
      clients.map(async (client) => {
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
                some: { id: client.getId() },
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
        } as ClientDTO
      })
    )

    return clientsWithRelations
  }
}

