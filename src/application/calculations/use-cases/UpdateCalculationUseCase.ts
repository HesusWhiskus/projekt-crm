import { Calculation } from '@/domain/calculations/entities/Calculation'
import { ICalculationRepository } from '@/domain/calculations/repositories/ICalculationRepository'
import { UpdateCalculationDTO, CalculationDTO } from '../dto'
import { PESEL, PostalCode, InsuranceScope } from '@/domain/calculations/value-objects'
import { UserContext } from '@/application/shared/types/UserContext'
import { db } from '@/lib/db'

/**
 * Use case for updating a calculation
 */
export class UpdateCalculationUseCase {
  constructor(private readonly calculationRepository: ICalculationRepository) {}

  async execute(id: string, dto: UpdateCalculationDTO, user: UserContext): Promise<CalculationDTO> {
    const calculation = await this.calculationRepository.findById(id)

    if (!calculation) {
      throw new Error('Kalkulacja nie znaleziona')
    }

    // Update fields from DTO
    const data = calculation.toPersistence()

    // Update value objects if provided
    // Note: Calculation entity doesn't have updatePESEL/updatePostalCode methods,
    // so we'll update via toPersistence and recreate (handled in updatedData below)
    // if (dto.pesel !== undefined) {
    //   const pesel = dto.pesel ? PESEL.create(dto.pesel) : null
    // }
    // if (dto.postalCode !== undefined) {
    //   const postalCode = dto.postalCode ? PostalCode.create(dto.postalCode) : null
    // }

    if (dto.status !== undefined) {
      calculation.changeStatus(dto.status)
    }

    if (dto.value !== undefined) {
      calculation.updateValue(dto.value)
    }

    if (dto.scopes !== undefined) {
      const scopes = dto.scopes
        .map((s) => InsuranceScope.create(s))
        .filter((s): s is InsuranceScope => s !== null)
      calculation.updateScopes(scopes)
    }

    // For other fields, we need to recreate the entity with updated values
    // This is a limitation - ideally Calculation should have more update methods
    const updatedData = {
      ...data,
      ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
      ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
      ...(dto.previousLastName !== undefined ? { previousLastName: dto.previousLastName } : {}),
      ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
      ...(dto.email !== undefined ? { email: dto.email } : {}),
      ...(dto.city !== undefined ? { city: dto.city } : {}),
      ...(dto.street !== undefined ? { street: dto.street } : {}),
      ...(dto.houseNumber !== undefined ? { houseNumber: dto.houseNumber } : {}),
      ...(dto.apartmentNumber !== undefined ? { apartmentNumber: dto.apartmentNumber } : {}),
      ...(dto.correspondenceAddress !== undefined ? { correspondenceAddress: dto.correspondenceAddress } : {}),
      ...(dto.hasDrivingLicense !== undefined ? { hasDrivingLicense: dto.hasDrivingLicense } : {}),
      ...(dto.drivingLicenseDate !== undefined
        ? { drivingLicenseDate: dto.drivingLicenseDate ? new Date(dto.drivingLicenseDate) : null }
        : {}),
      ...(dto.occupation !== undefined ? { occupation: dto.occupation } : {}),
      ...(dto.maritalStatus !== undefined ? { maritalStatus: dto.maritalStatus } : {}),
      ...(dto.hasChildUnder26 !== undefined ? { hasChildUnder26: dto.hasChildUnder26 } : {}),
      ...(dto.clientId !== undefined ? { clientId: dto.clientId } : {}),
      ...(dto.vehicleId !== undefined ? { vehicleId: dto.vehicleId } : {}),
      ...(dto.agentId !== undefined ? { agentId: dto.agentId } : {}),
      ...(dto.validUntil !== undefined ? { validUntil: dto.validUntil ? new Date(dto.validUntil) : null } : {}),
      ...(dto.variant !== undefined ? { variant: dto.variant } : {}),
      ...(dto.postalCode !== undefined ? { postalCode: dto.postalCode } : {}),
      ...(dto.pesel !== undefined ? { pesel: dto.pesel } : {}),
    }

    // Recreate entity from updated data
    const updatedCalculation = Calculation.fromPersistence({
      ...updatedData,
      status: calculation.getStatus(),
      scopes: calculation.getScopes().map((s) => s.getValue()),
      variant: calculation.getVariant()?.getValue() || null,
      pesel: updatedData.pesel || null,
      postalCode: updatedData.postalCode || null,
    } as any)

    // Save updated calculation
    const saved = await this.calculationRepository.update(updatedCalculation)

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: 'CALCULATION_UPDATED',
        entityType: 'Calculation',
        entityId: saved.getId(),
      },
    })

    return this.toDTO(saved)
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

