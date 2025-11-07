import { IDealRepository, DealFilter } from '@/domain/deals/repositories/IDealRepository'
import { DealFilterDTO, DealDTO } from '../dto'
import { UserContext } from '@/application/shared/types/UserContext'
import { Deal } from '@/domain/deals/entities/Deal'

/**
 * Use case for listing deals
 */
export class ListDealsUseCase {
  constructor(private readonly dealRepository: IDealRepository) {}

  async execute(filter: DealFilterDTO, user: UserContext): Promise<DealDTO[]> {
    // Build repository filter
    const repositoryFilter: DealFilter = {
      clientId: filter.clientId,
      stage: filter.stage,
      search: filter.search,
      userId: user.id,
      userRole: user.role,
    }

    // Find deals
    const deals = await this.dealRepository.findMany(repositoryFilter, {
      include: {
        client: true,
        sharedGroups: true,
      },
      orderBy: {
        field: 'updatedAt',
        direction: 'desc',
      },
    })

    return deals.map((deal) => this.toDTO(deal))
  }

  private toDTO(deal: Deal): DealDTO {
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

