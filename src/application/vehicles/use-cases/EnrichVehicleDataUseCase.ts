import { Vehicle } from '@/domain/vehicles/entities/Vehicle'
import { IVehicleRepository } from '@/domain/vehicles/repositories/IVehicleRepository'
import { VehicleDataEnrichmentService } from '@/domain/vehicles/services/VehicleDataEnrichmentService'
import { VehicleDTO } from '../dto'

/**
 * Use case for enriching vehicle data from external sources
 */
export class EnrichVehicleDataUseCase {
  private enrichmentService: VehicleDataEnrichmentService

  constructor(private readonly vehicleRepository: IVehicleRepository) {
    this.enrichmentService = new VehicleDataEnrichmentService()
  }

  async execute(
    vehicleId: string,
    eurotaxData?: Record<string, any>,
    infoEkspertData?: Record<string, any>
  ): Promise<VehicleDTO> {
    const vehicle = await this.vehicleRepository.findById(vehicleId)

    if (!vehicle) {
      throw new Error('Pojazd nie znaleziony')
    }

    // Enrich vehicle data
    const enrichmentData = {
      eurotax: eurotaxData,
      infoEkspert: infoEkspertData,
    }

    this.enrichmentService.validateEnrichmentData(enrichmentData)
    this.enrichmentService.enrichVehicleData(vehicle, enrichmentData)

    // Save enriched vehicle
    const updatedVehicle = await this.vehicleRepository.update(vehicle)

    return {
      id: updatedVehicle.getId(),
      vin: updatedVehicle.getVIN()?.getValue() || null,
      registrationNumber: updatedVehicle.getRegistrationNumber()?.getValue() || null,
      firstRegistrationDate: updatedVehicle.getFirstRegistrationDate(),
      eurotaxData: updatedVehicle.getEurotaxData(),
      infoEkspertData: updatedVehicle.getInfoEkspertData(),
      importedFromAbroad: updatedVehicle.getImportedFromAbroad(),
      hasValidInspection: updatedVehicle.getHasValidInspection(),
      hasLpgInstallation: updatedVehicle.getHasLpgInstallation(),
      purchaseYear: updatedVehicle.getPurchaseYear(),
      currentMileage: updatedVehicle.getCurrentMileage(),
      organizationId: updatedVehicle.getOrganizationId(),
      createdAt: updatedVehicle.getCreatedAt(),
      updatedAt: updatedVehicle.getUpdatedAt(),
    }
  }
}

