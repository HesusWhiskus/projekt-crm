/**
 * Visibility settings for insurance agent UI elements
 */
export interface AgentVisibilitySettings {
  showVehicles?: boolean
  showCalculations?: boolean
  showPolicies?: boolean
  showClients?: boolean
  showReports?: boolean
  [key: string]: boolean | undefined
}

/**
 * InsuranceAgent Entity
 * Domain entity representing an insurance agent
 */
export class InsuranceAgent {
  private constructor(
    private readonly id: string,
    private readonly userId: string,
    private licenseNumber: string | null,
    private settings: AgentVisibilitySettings,
    private isActive: boolean,
    private organizationId: string | null,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  /**
   * Creates a new InsuranceAgent entity
   */
  static create(params: {
    id: string
    userId: string
    licenseNumber?: string | null
    settings?: AgentVisibilitySettings
    isActive?: boolean
    organizationId?: string | null
    createdAt?: Date
    updatedAt?: Date
  }): InsuranceAgent {
    return new InsuranceAgent(
      params.id,
      params.userId,
      params.licenseNumber || null,
      params.settings || {},
      params.isActive ?? true,
      params.organizationId || null,
      params.createdAt || new Date(),
      params.updatedAt || new Date()
    )
  }

  /**
   * Reconstructs InsuranceAgent from persistence
   */
  static fromPersistence(data: {
    id: string
    userId: string
    licenseNumber: string | null
    settings: Record<string, any> | null
    isActive: boolean
    organizationId: string | null
    createdAt: Date
    updatedAt: Date
  }): InsuranceAgent {
    return new InsuranceAgent(
      data.id,
      data.userId,
      data.licenseNumber,
      (data.settings as AgentVisibilitySettings) || {},
      data.isActive,
      data.organizationId,
      data.createdAt,
      data.updatedAt
    )
  }

  // Getters
  getId(): string {
    return this.id
  }

  getUserId(): string {
    return this.userId
  }

  getLicenseNumber(): string | null {
    return this.licenseNumber
  }

  getSettings(): AgentVisibilitySettings {
    return this.settings
  }

  getIsActive(): boolean {
    return this.isActive
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

  // Business logic methods
  updateLicenseNumber(licenseNumber: string | null): void {
    this.licenseNumber = licenseNumber
    this.updatedAt = new Date()
  }

  updateSettings(settings: AgentVisibilitySettings): void {
    this.settings = { ...this.settings, ...settings }
    this.updatedAt = new Date()
  }

  updateVisibilitySetting(key: string, value: boolean): void {
    this.settings[key] = value
    this.updatedAt = new Date()
  }

  activate(): void {
    this.isActive = true
    this.updatedAt = new Date()
  }

  deactivate(): void {
    this.isActive = false
    this.updatedAt = new Date()
  }

  /**
   * Checks if a specific UI element should be visible
   */
  isElementVisible(elementKey: string): boolean {
    return this.settings[elementKey] ?? true // Default to visible if not specified
  }

  /**
   * Converts entity to persistence format
   */
  toPersistence(): {
    id: string
    userId: string
    licenseNumber: string | null
    settings: Record<string, any> | null
    isActive: boolean
    organizationId: string | null
    createdAt: Date
    updatedAt: Date
  } {
    return {
      id: this.id,
      userId: this.userId,
      licenseNumber: this.licenseNumber,
      settings: Object.keys(this.settings).length > 0 ? this.settings : null,
      isActive: this.isActive,
      organizationId: this.organizationId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}

