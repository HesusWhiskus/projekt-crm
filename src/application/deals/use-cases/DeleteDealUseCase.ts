import { IDealRepository } from '@/domain/deals/repositories/IDealRepository'
import { UserContext } from '@/application/shared/types/UserContext'
import { db } from '@/lib/db'

/**
 * Use case for deleting a deal
 */
export class DeleteDealUseCase {
  constructor(private readonly dealRepository: IDealRepository) {}

  async execute(dealId: string, user: UserContext): Promise<void> {
    // Find existing deal
    const existingDeal = await this.dealRepository.findById(dealId)
    if (!existingDeal) {
      throw new Error('Deal nie znaleziony')
    }

    // Check authorization - user must have access to deal's client
    const client = await db.client.findUnique({
      where: { id: existingDeal.getClientId() },
    })

    if (!client) {
      throw new Error('Klient nie znaleziony')
    }

    if (user.role !== 'ADMIN' && client.assignedTo !== user.id) {
      // Check if client is shared with user's groups
      const hasGroupAccess = await db.client.findFirst({
        where: {
          id: existingDeal.getClientId(),
          sharedGroups: {
            some: {
              users: {
                some: {
                  userId: user.id,
                },
              },
            },
          },
        },
      })

      if (!hasGroupAccess) {
        throw new Error('Brak uprawnień do tego deala')
      }
    }

    // Delete deal
    await this.dealRepository.delete(dealId)

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: 'DEAL_DELETED',
        entityType: 'Deal',
        entityId: dealId,
        details: {
          clientId: existingDeal.getClientId(),
        },
      },
    })
  }
}

