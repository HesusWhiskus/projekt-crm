import { Calculation } from '@/domain/calculations/entities/Calculation'
import {
  ICalculationRepository,
  CalculationFilter,
} from '@/domain/calculations/repositories/ICalculationRepository'
import { CalculationDTO, CalculationFilterDTO } from '../dto'

/**
 * Use case for listing calculations
 */
export class ListCalculationsUseCase {
  constructor(private readonly calculationRepository: ICalculationRepository) {}

  async execute(filter: CalculationFilterDTO): Promise<CalculationDTO[]> {
    const domainFilter: CalculationFilter = {
      status: filter.status,
      clientId: filter.clientId,
      vehicleId: filter.vehicleId,
      agentId: filter.agentId,
      organizationId: filter.organizationId,
      search: filter.search,
      validUntil: filter.validUntil
        ? {
            from: filter.validUntil.from ? new Date(filter.validUntil.from) : undefined,
            to: filter.validUntil.to ? new Date(filter.validUntil.to) : undefined,
          }
        : undefined,
    }

    const calculations = await this.calculationRepository.findMany(domainFilter, {
      include: {
        client: true,
        vehicle: true,
        agent: true,
      },
    })

    return calculations.map((calculation) => this.toDTO(calculation))
  }

  private toDTO(calculation: Calculation): CalculationDTO {
    const data = calculation.toPersistence()
    return {
      id: data.id,
      pesel: data.pesel,
      firstName: data.firstName,
      lastName: data.lastName,
      previousLastName: data.previousLastName,
      phone: data.phone,
      email: data.email,
      postalCode: data.postalCode,
      city: data.city,
      street: data.street,
      houseNumber: data.houseNumber,
      apartmentNumber: data.apartmentNumber,
      correspondenceAddress: data.correspondenceAddress,
      hasDrivingLicense: data.hasDrivingLicense,
      drivingLicenseDate: data.drivingLicenseDate,
      occupation: data.occupation,
      maritalStatus: data.maritalStatus,
      hasChildUnder26: data.hasChildUnder26,
      clientId: data.clientId,
      vehicleId: data.vehicleId,
      agentId: data.agentId,
      organizationId: data.organizationId,
      status: data.status,
      value: data.value,
      validUntil: data.validUntil,
      variant: data.variant,
      scopes: data.scopes,
      externalId: data.externalId,
      syncedAt: data.syncedAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    }
  }
}

