import { Vehicle } from '../entities/Vehicle'

/**
 * Vehicle data from external sources (Eurotax/Info-Ekspert)
 */
export interface VehicleEnrichmentData {
  eurotax?: {
    make?: string
    model?: string
    year?: number
    fuel?: string
    capacity?: number
    power?: number
    doors?: number
    seats?: number
    [key: string]: any
  }
  infoEkspert?: {
    make?: string
    model?: string
    year?: number
    fuel?: string
    capacity?: number
    power?: number
    doors?: number
    seats?: number
    [key: string]: any
  }
}

/**
 * Vehicle Data Enrichment Service
 * Domain service for enriching vehicle data from external sources
 */
export class VehicleDataEnrichmentService {
  /**
   * Enriches vehicle data with information from external sources
   * @param vehicle The vehicle entity to enrich
   * @param enrichmentData Data from external sources
   * @returns Updated vehicle entity
   */
  enrichVehicleData(
    vehicle: Vehicle,
    enrichmentData: VehicleEnrichmentData
  ): Vehicle {
    // Update Eurotax data if provided
    if (enrichmentData.eurotax) {
      vehicle.updateEurotaxData(enrichmentData.eurotax)
    }

    // Update Info-Ekspert data if provided
    if (enrichmentData.infoEkspert) {
      vehicle.updateInfoEkspertData(enrichmentData.infoEkspert)
    }

    return vehicle
  }

  /**
   * Merges data from multiple sources, prioritizing Info-Ekspert over Eurotax
   * @param eurotaxData Data from Eurotax
   * @param infoEkspertData Data from Info-Ekspert
   * @returns Merged data
   */
  mergeEnrichmentData(
    eurotaxData?: Record<string, any>,
    infoEkspertData?: Record<string, any>
  ): Record<string, any> {
    const merged: Record<string, any> = {}

    // Start with Eurotax data
    if (eurotaxData) {
      Object.assign(merged, eurotaxData)
    }

    // Override with Info-Ekspert data (higher priority)
    if (infoEkspertData) {
      Object.assign(merged, infoEkspertData)
    }

    return merged
  }

  /**
   * Validates enrichment data structure
   * @param data Data to validate
   * @returns true if valid, throws error if invalid
   */
  validateEnrichmentData(data: VehicleEnrichmentData): boolean {
    if (!data.eurotax && !data.infoEkspert) {
      throw new Error('Brak danych do wzbogacenia pojazdu')
    }

    return true
  }
}

