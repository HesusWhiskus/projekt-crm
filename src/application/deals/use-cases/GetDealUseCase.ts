import { IDealRepository } from '@/domain/deals/repositories/IDealRepository'
import { DealDTO } from '../dto'
import { UserContext } from '@/application/shared/types/UserContext'
import { db } from '@/lib/db'

/**
 * Use case for getting a single deal
 */
export class GetDealUseCase {
  constructor(private readonly dealRepository: IDealRepository) {}

  async execute(dealId: string, user: UserContext): Promise<DealDTO> {
    // Find deal
    const deal = await this.dealRepository.findById(dealId, {
      include: {
        client: true,
        sharedGroups: true,
      },
    })

    if (!deal) {
      throw new Error('Deal nie znaleziony')
    }

    // Check authorization - user must have access to deal's client
    const client = await db.client.findUnique({
      where: { id: deal.getClientId() },
    })

    if (!client) {
      throw new Error('Klient nie znaleziony')
    }

    if (user.role !== 'ADMIN' && client.assignedTo !== user.id) {
      // Check if client is shared with user's groups
      const hasGroupAccess = await db.client.findFirst({
        where: {
          id: deal.getClientId(),
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

    return {
      id: deal.getId(),
      clientId: deal.getClientId(),
      value: deal.getValue().getAmount(),
      currency: deal.getValue().getCurrency(),
      probability: deal.getProbability().getValue(),
      stage: deal.getStage().getValue(),
      expectedCloseDate: deal.getExpectedCloseDate(),
      notes: deal.getNotes(),
      createdAt: deal.getCreatedAt(),
      updatedAt: deal.getUpdatedAt(),
    }
  }
}

