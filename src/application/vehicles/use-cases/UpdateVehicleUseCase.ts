import { Vehicle } from '@/domain/vehicles/entities/Vehicle'
import { IVehicleRepository } from '@/domain/vehicles/repositories/IVehicleRepository'
import { UpdateVehicleDTO, VehicleDTO } from '../dto'
import { VIN, RegistrationNumber } from '@/domain/vehicles/value-objects'
import { UserContext } from '@/application/shared/types/UserContext'
import { db } from '@/lib/db'

/**
 * Use case for updating a vehicle
 */
export class UpdateVehicleUseCase {
  constructor(private readonly vehicleRepository: IVehicleRepository) {}

  async execute(id: string, dto: UpdateVehicleDTO, user: UserContext): Promise<VehicleDTO> {
    const vehicle = await this.vehicleRepository.findById(id)

    if (!vehicle) {
      throw new Error('Pojazd nie znaleziony')
    }

    // Update VIN if provided
    if (dto.vin !== undefined) {
      const vin = dto.vin ? VIN.create(dto.vin) : null
      if (vin) {
        // Check for duplicates (excluding current vehicle)
        const existing = await this.vehicleRepository.findByVIN(vin.getValue())
        if (existing && existing.getId() !== id) {
          throw new Error('Pojazd o podanym numerze VIN już istnieje')
        }
      }
      vehicle.updateVIN(vin)
    }

    // Update registration number if provided
    if (dto.registrationNumber !== undefined) {
      const registrationNumber = dto.registrationNumber
        ? RegistrationNumber.create(dto.registrationNumber)
        : null
      if (registrationNumber) {
        // Check for duplicates (excluding current vehicle)
        const existing = await this.vehicleRepository.findByRegistrationNumber(
          registrationNumber.getValue()
        )
        if (existing && existing.getId() !== id) {
          throw new Error('Pojazd o podanym numerze rejestracyjnym już istnieje')
        }
      }
      vehicle.updateRegistrationNumber(registrationNumber)
    }

    // Update other fields
    if (dto.firstRegistrationDate !== undefined) {
      vehicle.updateFirstRegistrationDate(
        dto.firstRegistrationDate ? new Date(dto.firstRegistrationDate) : null
      )
    }

    if (dto.eurotaxData !== undefined) {
      vehicle.updateEurotaxData(dto.eurotaxData)
    }

    if (dto.infoEkspertData !== undefined) {
      vehicle.updateInfoEkspertData(dto.infoEkspertData)
    }

    if (dto.hasValidInspection !== undefined) {
      vehicle.updateInspectionStatus(dto.hasValidInspection)
    }

    if (dto.hasLpgInstallation !== undefined) {
      vehicle.updateLpgInstallation(dto.hasLpgInstallation)
    }

    if (dto.currentMileage !== undefined) {
      vehicle.updateMileage(dto.currentMileage)
    }

    if (dto.purchaseYear !== undefined) {
      vehicle.updatePurchaseYear(dto.purchaseYear)
    }

    if (dto.brand !== undefined) {
      vehicle.updateBrand(dto.brand)
    }

    if (dto.model !== undefined) {
      vehicle.updateModel(dto.model)
    }

    if (dto.productionYear !== undefined) {
      vehicle.updateProductionYear(dto.productionYear)
    }

    if (dto.infoEkspertId !== undefined) {
      vehicle.updateInfoEkspertId(dto.infoEkspertId)
    }

    if (dto.eurotaxId !== undefined) {
      vehicle.updateEurotaxId(dto.eurotaxId)
    }

    // Save updated vehicle
    const updatedVehicle = await this.vehicleRepository.update(vehicle)

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: 'VEHICLE_UPDATED',
        entityType: 'Vehicle',
        entityId: updatedVehicle.getId(),
      },
    })

    return this.toDTO(updatedVehicle)
  }

  private toDTO(vehicle: Vehicle): VehicleDTO {
    return {
      id: vehicle.getId(),
      vin: vehicle.getVIN()?.getValue() || null,
      registrationNumber: vehicle.getRegistrationNumber()?.getValue() || null,
      firstRegistrationDate: vehicle.getFirstRegistrationDate(),
      brand: vehicle.getBrand(),
      model: vehicle.getModel(),
      productionYear: vehicle.getProductionYear(),
      infoEkspertId: vehicle.getInfoEkspertId(),
      eurotaxId: vehicle.getEurotaxId(),
      eurotaxData: vehicle.getEurotaxData(),
      infoEkspertData: vehicle.getInfoEkspertData(),
      importedFromAbroad: vehicle.getImportedFromAbroad(),
      hasValidInspection: vehicle.getHasValidInspection(),
      hasLpgInstallation: vehicle.getHasLpgInstallation(),
      purchaseYear: vehicle.getPurchaseYear(),
      currentMileage: vehicle.getCurrentMileage(),
      organizationId: vehicle.getOrganizationId(),
      createdAt: vehicle.getCreatedAt(),
      updatedAt: vehicle.getUpdatedAt(),
    }
  }
}

