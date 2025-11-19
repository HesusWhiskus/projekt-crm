import { Vehicle } from '@/domain/vehicles/entities/Vehicle'
import { IVehicleRepository } from '@/domain/vehicles/repositories/IVehicleRepository'
import { VehicleDTO } from '../dto'

/**
 * Use case for getting a vehicle by ID
 */
export class GetVehicleUseCase {
  constructor(private readonly vehicleRepository: IVehicleRepository) {}

  async execute(id: string): Promise<VehicleDTO | null> {
    const vehicle = await this.vehicleRepository.findById(id, {
      include: {
        owners: true,
      },
    })

    if (!vehicle) {
      return null
    }

    return this.toDTO(vehicle)
  }

  private toDTO(vehicle: Vehicle): VehicleDTO {
    return {
      id: vehicle.getId(),
      vin: vehicle.getVIN()?.getValue() || null,
      registrationNumber: vehicle.getRegistrationNumber()?.getValue() || null,
      firstRegistrationDate: vehicle.getFirstRegistrationDate(),
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

