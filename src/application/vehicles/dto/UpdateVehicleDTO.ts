export interface UpdateVehicleDTO {
  vin?: string | null
  registrationNumber?: string | null
  firstRegistrationDate?: string | null // ISO date string
  brand?: string | null
  model?: string | null
  productionYear?: number | null
  infoEkspertId?: string | null
  eurotaxId?: string | null
  eurotaxData?: Record<string, any> | null
  infoEkspertData?: Record<string, any> | null
  importedFromAbroad?: boolean
  hasValidInspection?: boolean | null
  hasLpgInstallation?: boolean | null
  purchaseYear?: number | null
  currentMileage?: number | null
}

