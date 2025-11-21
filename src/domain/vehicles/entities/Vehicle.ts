import { VIN, RegistrationNumber } from '../value-objects'

/**
 * Vehicle Entity
 * Domain entity representing a vehicle with business logic
 */
export class Vehicle {
  private constructor(
    private readonly id: string,
    private vin: VIN | null,
    private registrationNumber: RegistrationNumber | null,
    private firstRegistrationDate: Date | null,
    private brand: string | null,
    private model: string | null,
    private productionYear: number | null,
    private infoEkspertId: string | null,
    private eurotaxId: string | null,
    private eurotaxData: Record<string, any> | null,
    private infoEkspertData: Record<string, any> | null,
    private importedFromAbroad: boolean,
    private hasValidInspection: boolean | null,
    private hasLpgInstallation: boolean | null,
    private purchaseYear: number | null,
    private currentMileage: number | null,
    private organizationId: string | null,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  /**
   * Creates a new Vehicle entity
   */
  static create(params: {
    id: string
    vin: VIN | null
    registrationNumber: RegistrationNumber | null
    firstRegistrationDate: Date | null
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
    organizationId?: string | null
    createdAt?: Date
    updatedAt?: Date
  }): Vehicle {
    return new Vehicle(
      params.id,
      params.vin,
      params.registrationNumber,
      params.firstRegistrationDate,
      params.brand || null,
      params.model || null,
      params.productionYear || null,
      params.infoEkspertId || null,
      params.eurotaxId || null,
      params.eurotaxData || null,
      params.infoEkspertData || null,
      params.importedFromAbroad ?? false,
      params.hasValidInspection ?? null,
      params.hasLpgInstallation ?? null,
      params.purchaseYear || null,
      params.currentMileage || null,
      params.organizationId || null,
      params.createdAt || new Date(),
      params.updatedAt || new Date()
    )
  }

  /**
   * Reconstructs Vehicle from persistence
   */
  static fromPersistence(data: {
    id: string
    vin: string | null
    registrationNumber: string | null
    firstRegistrationDate: Date | null
    brand: string | null
    model: string | null
    productionYear: number | null
    infoEkspertId: string | null
    eurotaxId: string | null
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
  }): Vehicle {
    return new Vehicle(
      data.id,
      data.vin ? VIN.fromValidated(data.vin) : null,
      data.registrationNumber ? RegistrationNumber.fromValidated(data.registrationNumber) : null,
      data.firstRegistrationDate,
      data.brand,
      data.model,
      data.productionYear,
      data.infoEkspertId,
      data.eurotaxId,
      data.eurotaxData,
      data.infoEkspertData,
      data.importedFromAbroad,
      data.hasValidInspection,
      data.hasLpgInstallation,
      data.purchaseYear,
      data.currentMileage,
      data.organizationId,
      data.createdAt,
      data.updatedAt
    )
  }

  // Getters
  getId(): string {
    return this.id
  }

  getVIN(): VIN | null {
    return this.vin
  }

  getRegistrationNumber(): RegistrationNumber | null {
    return this.registrationNumber
  }

  getFirstRegistrationDate(): Date | null {
    return this.firstRegistrationDate
  }

  getEurotaxData(): Record<string, any> | null {
    return this.eurotaxData
  }

  getInfoEkspertData(): Record<string, any> | null {
    return this.infoEkspertData
  }

  getImportedFromAbroad(): boolean {
    return this.importedFromAbroad
  }

  getHasValidInspection(): boolean | null {
    return this.hasValidInspection
  }

  getHasLpgInstallation(): boolean | null {
    return this.hasLpgInstallation
  }

  getPurchaseYear(): number | null {
    return this.purchaseYear
  }

  getCurrentMileage(): number | null {
    return this.currentMileage
  }

  getBrand(): string | null {
    return this.brand
  }

  getModel(): string | null {
    return this.model
  }

  getProductionYear(): number | null {
    return this.productionYear
  }

  getInfoEkspertId(): string | null {
    return this.infoEkspertId
  }

  getEurotaxId(): string | null {
    return this.eurotaxId
  }

  getOrganizationId(): string | null {
    return this.organizationId
  }

  getCreatedAt(): Date {
    return this.createdAt
  }

  getUpdatedAt(): Date {
    return this.updatedAt
  }

  // Setters / Business logic methods
  updateVIN(vin: VIN | null): void {
    this.vin = vin
    this.updatedAt = new Date()
  }

  updateRegistrationNumber(registrationNumber: RegistrationNumber | null): void {
    this.registrationNumber = registrationNumber
    this.updatedAt = new Date()
  }

  updateFirstRegistrationDate(date: Date | null): void {
    this.firstRegistrationDate = date
    this.updatedAt = new Date()
  }

  updateEurotaxData(data: Record<string, any> | null): void {
    this.eurotaxData = data
    this.updatedAt = new Date()
  }

  updateInfoEkspertData(data: Record<string, any> | null): void {
    this.infoEkspertData = data
    this.updatedAt = new Date()
  }

  updateInspectionStatus(hasValidInspection: boolean | null): void {
    this.hasValidInspection = hasValidInspection
    this.updatedAt = new Date()
  }

  updateLpgInstallation(hasLpgInstallation: boolean | null): void {
    this.hasLpgInstallation = hasLpgInstallation
    this.updatedAt = new Date()
  }

  updateMileage(mileage: number | null): void {
    if (mileage !== null && mileage < 0) {
      throw new Error('Przebieg nie może być ujemny')
    }
    this.currentMileage = mileage
    this.updatedAt = new Date()
  }

  updatePurchaseYear(year: number | null): void {
    if (year !== null) {
      const currentYear = new Date().getFullYear()
      if (year < 1900 || year > currentYear + 1) {
        throw new Error(`Rok nabycia musi być między 1900 a ${currentYear + 1}`)
      }
    }
    this.purchaseYear = year
    this.updatedAt = new Date()
  }

  updateBrand(brand: string | null): void {
    this.brand = brand
    this.updatedAt = new Date()
  }

  updateModel(model: string | null): void {
    this.model = model
    this.updatedAt = new Date()
  }

  updateProductionYear(year: number | null): void {
    if (year !== null) {
      const currentYear = new Date().getFullYear()
      if (year < 1900 || year > currentYear + 1) {
        throw new Error(`Rok produkcji musi być między 1900 a ${currentYear + 1}`)
      }
    }
    this.productionYear = year
    this.updatedAt = new Date()
  }

  updateInfoEkspertId(id: string | null): void {
    this.infoEkspertId = id
    this.updatedAt = new Date()
  }

  updateEurotaxId(id: string | null): void {
    this.eurotaxId = id
    this.updatedAt = new Date()
  }

  /**
   * Converts entity to persistence format
   */
  toPersistence(): {
    id: string
    vin: string | null
    registrationNumber: string | null
    firstRegistrationDate: Date | null
    brand: string | null
    model: string | null
    productionYear: number | null
    infoEkspertId: string | null
    eurotaxId: string | null
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
  } {
    return {
      id: this.id,
      vin: this.vin?.getValue() || null,
      registrationNumber: this.registrationNumber?.getValue() || null,
      firstRegistrationDate: this.firstRegistrationDate,
      brand: this.brand,
      model: this.model,
      productionYear: this.productionYear,
      infoEkspertId: this.infoEkspertId,
      eurotaxId: this.eurotaxId,
      eurotaxData: this.eurotaxData,
      infoEkspertData: this.infoEkspertData,
      importedFromAbroad: this.importedFromAbroad,
      hasValidInspection: this.hasValidInspection,
      hasLpgInstallation: this.hasLpgInstallation,
      purchaseYear: this.purchaseYear,
      currentMileage: this.currentMileage,
      organizationId: this.organizationId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}

