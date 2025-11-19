import { Vehicle } from '@/domain/vehicles/entities/Vehicle'
import { IVehicleRepository, VehicleFilter } from '@/domain/vehicles/repositories/IVehicleRepository'
import { VehicleDTO, VehicleFilterDTO } from '../dto'

/**
 * Use case for listing vehicles
 */
export class ListVehiclesUseCase {
  constructor(private readonly vehicleRepository: IVehicleRepository) {}

  async execute(filter: VehicleFilterDTO): Promise<VehicleDTO[]> {
    const domainFilter: VehicleFilter = {
      vin: filter.vin,
      registrationNumber: filter.registrationNumber,
      organizationId: filter.organizationId,
      clientId: filter.clientId,
      search: filter.search,
    }

    const vehicles = await this.vehicleRepository.findMany(domainFilter, {
      include: {
        owners: true,
      },
    })

    return vehicles.map((vehicle) => this.toDTO(vehicle))
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

