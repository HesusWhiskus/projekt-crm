export interface UpdateVehicleDTO {
  vin?: string | null
  registrationNumber?: string | null
  firstRegistrationDate?: string | null // ISO date string
  eurotaxData?: Record<string, any> | null
  infoEkspertData?: Record<string, any> | null
  importedFromAbroad?: boolean
  hasValidInspection?: boolean | null
  hasLpgInstallation?: boolean | null
  purchaseYear?: number | null
  currentMileage?: number | null
}

