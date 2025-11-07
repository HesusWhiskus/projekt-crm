import { Client } from '@/domain/clients/entities/Client'
import { IClientRepository } from '@/domain/clients/repositories/IClientRepository'
import { ClientStatusChangeService } from '@/domain/clients/services/ClientStatusChangeService'
import { UpdateClientDTO, ClientDTO } from '../dto'
import { Email, Phone, Website, ClientName, AgencyName } from '@/domain/clients/value-objects'
import { UserContext } from '@/application/shared/types/UserContext'
import { db } from '@/lib/db'

/**
 * Use case for updating a client
 */
export class UpdateClientUseCase {
  constructor(
    private readonly clientRepository: IClientRepository,
    private readonly statusChangeService: ClientStatusChangeService
  ) {}

  async execute(
    clientId: string,
    dto: UpdateClientDTO,
    user: UserContext
  ): Promise<ClientDTO> {
    // Find existing client
    const existingClient = await this.clientRepository.findById(clientId)
    if (!existingClient) {
      throw new Error('Klient nie znaleziony')
    }

    // Check authorization
    if (user.role !== 'ADMIN' && existingClient.getAssignedTo() !== user.id) {
      throw new Error('Brak uprawnień')
    }

    // Update value objects if provided
    if (dto.firstName !== undefined) {
      const firstName = ClientName.create(dto.firstName, 'Imię', 1, 50)
      existingClient.updateInfo({ firstName })
    }
    if (dto.lastName !== undefined) {
      const lastName = ClientName.create(dto.lastName, 'Nazwisko', 1, 50)
      existingClient.updateInfo({ lastName })
    }
    if (dto.agencyName !== undefined) {
      const agencyName = AgencyName.create(dto.agencyName)
      existingClient.updateInfo({ agencyName })
    }
    if (dto.email !== undefined) {
      const email = Email.create(dto.email)
      existingClient.updateInfo({ email })
    }
    if (dto.phone !== undefined) {
      const phone = Phone.create(dto.phone)
      existingClient.updateInfo({ phone })
    }
    if (dto.website !== undefined) {
      const website = Website.create(dto.website)
      existingClient.updateInfo({ website })
    }
    if (dto.address !== undefined) {
      existingClient.updateInfo({ address: dto.address })
    }
    if (dto.source !== undefined) {
      existingClient.updateInfo({ source: dto.source })
    }
    if (dto.priority !== undefined) {
      existingClient.updatePriority(dto.priority)
    }
    if (dto.assignedTo !== undefined) {
      existingClient.assignTo(dto.assignedTo)
    }
    if (dto.nextFollowUpAt !== undefined) {
      existingClient.setNextFollowUp(
        dto.nextFollowUpAt ? new Date(dto.nextFollowUpAt) : null
      )
    }

    // Handle status change with history
    if (dto.status !== undefined && dto.status !== existingClient.getStatus()) {
      const historyEntry = this.statusChangeService.changeStatus(
        existingClient,
        dto.status,
        user.id
      )

      // Save status history
      await db.clientStatusHistory.create({
        data: {
          clientId: historyEntry.clientId,
          status: historyEntry.status,
          changedBy: historyEntry.changedBy,
          notes: historyEntry.notes,
        },
      })
    }

    // Update client
    const updatedClient = await this.clientRepository.update(existingClient)

    // Handle shared groups if provided
    if (dto.sharedGroupIds !== undefined) {
      await db.client.update({
        where: { id: updatedClient.getId() },
        data: {
          sharedGroups: {
            set: dto.sharedGroupIds.map((id) => ({ id })),
          },
        },
      })
    }

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: 'CLIENT_UPDATED',
        entityType: 'Client',
        entityId: updatedClient.getId(),
        details: {
          updatedFields: Object.keys(dto),
        },
      },
    })

    return this.toDTO(updatedClient)
  }

  private toDTO(client: Client): ClientDTO {
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
    }
  }
}

