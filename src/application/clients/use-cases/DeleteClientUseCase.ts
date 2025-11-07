import { IClientRepository } from '@/domain/clients/repositories/IClientRepository'
import { UserContext } from '@/application/shared/types/UserContext'
import { db } from '@/lib/db'

/**
 * Use case for deleting a client
 */
export class DeleteClientUseCase {
  constructor(private readonly clientRepository: IClientRepository) {}

  async execute(clientId: string, user: UserContext): Promise<void> {
    // Check authorization - only ADMIN can delete
    if (user.role !== 'ADMIN') {
      throw new Error('Brak uprawnień')
    }

    // Find client
    const client = await this.clientRepository.findById(clientId)
    if (!client) {
      throw new Error('Klient nie znaleziony')
    }

    // Log activity before deletion
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: 'CLIENT_DELETED',
        entityType: 'Client',
        entityId: clientId,
        details: {
          agencyName: client.getAgencyName().getValue(),
        },
      },
    })

    // Delete client
    await this.clientRepository.delete(clientId)
  }
}

