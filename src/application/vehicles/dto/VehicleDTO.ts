export interface VehicleDTO {
  id: string
  vin: string | null
  registrationNumber: string | null
  firstRegistrationDate: Date | null
  eurotaxData: Record<string, any> | null
  infoEkspertData: Record<string, any> | null
  importedFromAbroad: boolean
  hasValidInspection: boolean | null
  hasLpgInstallation: boolean | null
  purchaseYear: number | null
  currentMileage: number | null
  organizationId: string | null
  createdAt: Date
  updatedAt: Date
}

