import { Calculation } from '@/domain/calculations/entities/Calculation'
import { ICalculationRepository } from '@/domain/calculations/repositories/ICalculationRepository'
import { CalculationDTO } from '../dto'

/**
 * Use case for getting a calculation by ID
 */
export class GetCalculationUseCase {
  constructor(private readonly calculationRepository: ICalculationRepository) {}

  async execute(id: string): Promise<CalculationDTO | null> {
    const calculation = await this.calculationRepository.findById(id, {
      include: {
        client: true,
        vehicle: true,
        agent: true,
      },
    })

    if (!calculation) {
      return null
    }

    return this.toDTO(calculation)
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

